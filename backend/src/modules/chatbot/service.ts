import Service from '../services/model';
import Lead from '../leads/model';
import { settingsService } from '../settings/service';
import { env } from '../../config/env';

const SYSTEM_PROMPT = `You are "Invy", the friendly AI assistant for Invera Digital Agency — a full-service digital agency.
Your job:
1. Answer visitor questions about our services, pricing approach, process, and timelines — accurately and briefly (2-4 sentences max).
2. Be warm, professional, and concise. Use plain language. Never invent prices that aren't listed below; instead invite the visitor to book a free consultation.
3. When a visitor shows buying intent (wants to start a project, asks for a quote, wants to talk to the team), gently guide them to share their name and email so the team can reach out, or point them to the contact/lead form on the website.

Services & pricing (from our live catalog):
{{SERVICES}}

Always stay in character as Invera's assistant. Do not discuss competitors negatively. Reply in the same language the visitor uses.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function buildSystemPrompt(): Promise<string> {
  try {
    const services = await Service.find({ isActive: true })
      .select('title category description pricingTiers')
      .lean();
    const catalog = services
      .map(
        (s: any) =>
          `- ${s.title} (${s.category}): ${s.description?.slice(0, 160)}${
            s.pricingTiers?.length
              ? ` | Tiers: ${s.pricingTiers.map((t: any) => `${t.name} $${t.price}`).join(', ')}`
              : ''
          }`,
      )
      .join('\n');
    return SYSTEM_PROMPT.replace('{{SERVICES}}', catalog || 'General web/app development and digital marketing services.');
  } catch {
    return SYSTEM_PROMPT.replace('{{SERVICES}}', 'General web/app development and digital marketing services.');
  }
}

async function callGemini(systemPrompt: string, history: ChatMessage[]): Promise<string> {
  const contents = [
    ...history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  ];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
        safetySettings: [],
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data: any = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
  if (!text) throw new Error('Gemini empty response');
  return text;
}

async function callGroq(systemPrompt: string, history: ChatMessage[]): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.groqApiKey}`,
    },
    body: JSON.stringify({
      // gpt-oss-120b replaced the retired llama-3.3-70b-versatile.
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'system', content: systemPrompt }, ...history.slice(-12)],
      temperature: 0.6,
      max_tokens: 600,
      reasoning_effort: 'low',
    }),
  });
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
  const data: any = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('Groq empty response');
  return text;
}

export async function chat(messages: ChatMessage[]): Promise<{ reply: string }> {
  const systemPrompt = await buildSystemPrompt();

  if (env.geminiApiKey) {
    try {
      return { reply: await callGemini(systemPrompt, messages) };
    } catch (err) {
      console.warn('[chatbot] Gemini failed, trying Groq:', err);
    }
  }
  if (env.groqApiKey) {
    try {
      return { reply: await callGroq(systemPrompt, messages) };
    } catch (err) {
      console.warn('[chatbot] Groq failed:', err);
    }
  }

  // No AI configured — helpful static fallback so the widget never looks dead.
  return {
    reply:
      "Thanks for reaching out! Our team will get back to you shortly. Meanwhile, you can explore our services or drop your contact in the lead form and we'll reach out within one business day.",
  };
}

/** Detect buying intent from the latest user message and persist a soft lead. */
export async function captureLeadIfIntent(messages: ChatMessage[], meta?: { page?: string }): Promise<void> {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) return;

  const text = lastUser.content.toLowerCase();
  const intent =
    /(start a project|hire|quote|pricing for|get started|i want|i need|build me|contact|email me|call me|reach out)/.test(
      text,
    );
  if (!intent) return;

  const emailMatch = lastUser.content.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  const nameMatch = lastUser.content.match(/(?:my name is|i am|i'm)\s+([a-zA-Z .'-]{2,40})/i);

  if (!emailMatch) return; // Only capture when we can actually follow up

  const email = emailMatch[0].toLowerCase();

  // Avoid duplicate chat-captured leads
  const existing = await Lead.findOne({ email, source: 'AI Chatbot' });
  if (existing) return;

  await Lead.create({
    contactName: nameMatch?.[1]?.trim() || email.split('@')[0],
    email,
    message: lastUser.content,
    source: 'AI Chatbot',
    status: 'new',
    priority: 'medium',
    tags: ['chatbot'],
    requirements: `Captured from chatbot conversation${meta?.page ? ` on ${meta.page}` : ''}:\n\n` +
      messages.map((m) => `${m.role}: ${m.content}`).join('\n').slice(0, 2000),
    notes: 'Auto-created by the website AI chatbot.',
  });
}
