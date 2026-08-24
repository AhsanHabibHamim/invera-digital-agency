'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Minus, Zap } from 'lucide-react';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  { icon: '🎨', text: 'What services do you offer?' },
  { icon: '💰', text: 'How much does a website cost?' },
  { icon: '⚡', text: 'How fast can you deliver?' },
];

const GREETING: ChatMsg = {
  role: 'assistant',
  content:
    "Hi there! 👋 I'm Invy — Invera's AI assistant. Ask me anything about our services, pricing, or process… or tell me what you're building!",
};

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Show the teaser bubble a few seconds after load (once per session).
  useEffect(() => {
    if (sessionStorage.getItem('invy-teaser-seen')) return;
    const t = setTimeout(() => setTeaser(true), 3500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open) sessionStorage.setItem('invy-teaser-seen', '1');
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const nextMessages: ChatMsg[] = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || ''}/api/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.slice(-12).map(({ role, content }) => ({ role, content })),
          page: window.location.pathname,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            data?.data?.reply ??
            data?.message ??
            "Sorry, I couldn't answer right now — please try again in a moment.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "I'm having trouble connecting. Please use the contact form and our team will get back to you quickly!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Teaser bubble */}
      <AnimatePresence>
        {teaser && !open && (
          <motion.button
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.92 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => { setOpen(true); setTeaser(false); }}
            className="fixed bottom-[104px] right-5 z-[70] max-w-[240px] rounded-2xl rounded-br-md border border-primary/25 bg-surface/95 px-sm py-2xs text-left shadow-card-hover backdrop-blur-xl"
          >
            <span className="flex items-center gap-3xs text-caption font-semibold text-foreground">
              <Sparkles size={13} className="text-accent" />
              Meet Invy
              <span
                role="button"
                tabIndex={0}
                aria-label="Dismiss"
                onClick={(e) => { e.stopPropagation(); setTeaser(false); sessionStorage.setItem('invy-teaser-seen', '1'); }}
                onKeyDown={(e) => e.key === 'Enter' && setTeaser(false)}
                className="ml-auto text-foreground/40 hover:text-foreground"
              >
                <X size={12} />
              </span>
            </span>
            <span className="mt-4xs block text-caption leading-relaxed text-foreground/60">
              Ask me about services, pricing — or get an instant project estimate ✨
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating launcher */}
      <motion.button
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => { setOpen((o) => !o); setTeaser(false); }}
        className="group fixed bottom-5 right-5 z-[70] flex h-14 w-14 items-center justify-center"
        aria-label={open ? 'Close chat' : 'Chat with Invy'}
      >
        {/* glow rings */}
        {!open && (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-gradient-to-br from-violet-600 to-cyan-400 opacity-20" />
            <span className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-violet-600/30 to-cyan-400/30 blur-md transition-opacity group-hover:opacity-100" />
          </>
        )}
        <span
          className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 via-primary to-cyan-400 text-white shadow-xl shadow-primary/30 ring-2 ring-background transition-transform duration-300 ${
            open ? 'rotate-90' : ''
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
                <X size={22} />
              </motion.span>
            ) : (
              <motion.span key="s" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
                <Sparkles size={22} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'bottom right' }}
            className="fixed bottom-[96px] right-5 z-[70] flex h-[min(600px,calc(100dvh-120px))] w-[min(94vw,400px)] flex-col overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-2xl shadow-black/40"
          >
            {/* Header */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-violet-700 via-primary to-cyan-500 px-sm py-xs">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_-20%,rgba(255,255,255,0.25),transparent_55%)]" />
              <div className="relative flex items-center gap-xs">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/30 backdrop-blur">
                  <Zap size={18} className="text-cyan-200" fill="currentColor" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-small font-bold tracking-tight text-white">Invy</span>
                  <span className="flex items-center gap-3xs text-caption text-white/85">
                    <span className="relative flex h-3xs w-3xs">
                      <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                      <span className="h-3xs w-3xs rounded-full bg-emerald-200" />
                    </span>
                    AI Assistant · replies instantly
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/15 hover:text-white"
                  aria-label="Minimize chat"
                >
                  <Minus size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="chat-scroll flex flex-1 flex-col gap-2xs overflow-y-auto px-sm py-sm">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className={`flex items-end gap-3xs ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <span className="mb-3xs flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-cyan-400 text-white">
                      <Zap size={11} fill="currentColor" />
                    </span>
                  )}
                  <div
                    className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-xs py-2xs text-body-small leading-relaxed ${
                      m.role === 'user'
                        ? 'rounded-br-md bg-gradient-to-br from-violet-600 to-primary text-white shadow-md shadow-primary/20'
                        : 'rounded-bl-md border border-border bg-surface text-foreground'
                    }`}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-3xs">
                  <span className="mb-3xs flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-cyan-400 text-white">
                    <Zap size={11} fill="currentColor" />
                  </span>
                  <div className="flex items-center gap-4xs rounded-2xl rounded-bl-md border border-border bg-surface px-xs py-3xs">
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className="h-3xs w-3xs animate-bounce rounded-full bg-primary/60"
                        style={{ animationDelay: `${dot * 140}ms`, animationDuration: '900ms' }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Suggestion chips */}
              {messages.length <= 1 && !loading && (
                <div className="mt-2xs flex flex-wrap gap-2xs pl-8">
                  {SUGGESTIONS.map((s, idx) => (
                    <motion.button
                      key={s.text}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + idx * 0.09 }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      className="rounded-full border border-primary/25 bg-primary/5 px-2xs py-3xs text-caption font-medium text-foreground/75 transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-foreground"
                      onClick={() => send(s.text)}
                    >
                      <span className="mr-3xs">{s.icon}</span>
                      {s.text}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <form
              className="shrink-0 border-t border-border bg-surface/60 p-2xs backdrop-blur"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <div className="flex items-center gap-2xs rounded-full border border-border bg-card py-3xs pl-sm pr-3xs focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
                <input
                  className="min-w-0 flex-1 bg-transparent text-body-small text-foreground outline-none placeholder:text-foreground/35"
                  placeholder="Ask me anything…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={500}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-cyan-400 text-white shadow-md shadow-primary/25 disabled:opacity-40"
                  disabled={loading || !input.trim()}
                  aria-label="Send message"
                >
                  <Send size={15} />
                </motion.button>
              </div>
              <p className="mt-3xs text-center text-4xs text-foreground/30">Powered by AI · Invera Digital Agency</p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
