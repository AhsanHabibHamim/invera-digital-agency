import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { env } from '../config/env';

// ─── Brand system ────────────────────────────────────────────────────────────
const BRAND_NAME = process.env.BRAND_NAME || 'Invera Digital Agency';
const BRAND_TAGLINE = 'Turning ambitious ideas into shipped products.';
const BRAND_URL = env.frontendUrl;

// Obsidian / violet / cyan / amber palette
const C = {
  obsidian: '#0D0D14',
  obsidianSoft: '#17171F',
  violet: '#7C3AED',
  violetDark: '#6D28D9',
  cyan: '#22D3EE',
  amber: '#F59E0B',
  ink: '#1A1A24',
  body: '#3F3F50',
  muted: '#8B8B9E',
  surface: '#FFFFFF',
  subtle: '#F4F2FB',
  line: '#E7E5F0',
  success: '#16A34A',
  danger: '#DC2626',
};

const FONT_STACK = `'Clash Display','Satoshi','Segoe UI',Helvetica,Arial,sans-serif`;
const BODY_FONT = `'Satoshi','Inter','Segoe UI',Helvetica,Arial,sans-serif`;

let resend: Resend | null = null;
function getResend(): Resend | null {
  if (!env.resendApiKey) return null;
  if (!resend) resend = new Resend(env.resendApiKey);
  return resend;
}

let transporter: nodemailer.Transporter | null = null;
function getTransporter(): nodemailer.Transporter | null {
  if (!env.smtpHost || !env.smtpUser) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: { user: env.smtpUser, pass: env.smtpPass },
    });
  }
  return transporter;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}) {
  const resendClient = getResend();
  try {
    if (resendClient) {
      const payload: Record<string, unknown> = {
        from: options.subject.includes('OTP') ? BRAND_NAME : env.emailFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };
      if (options.attachments?.length) {
        payload.attachments = options.attachments.map((a) => ({
          filename: a.filename,
          content: a.content.toString('base64'),
        }));
      }
      await resendClient.emails.send(payload as any);
      return;
    }

    const smtp = getTransporter();
    if (smtp) {
      await smtp.sendMail({
        from: `${BRAND_NAME} <${env.smtpUser}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        ...(options.attachments?.length
          ? { attachments: options.attachments.map((a) => ({ filename: a.filename, content: a.content })) }
          : {}),
      });
      return;
    }

    console.warn(`[email] No provider configured. Skipped "${options.subject}" -> ${options.to}`);
  } catch (error) {
    console.error('[email] Failed to send email:', error);
  }
}

// ─── Layout primitives ───────────────────────────────────────────────────────
function logoMark(): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:26px 36px;">
          <span style="font-family:${FONT_STACK};font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:0.5px;">
            INVERA<span style="color:${C.cyan};">.</span>
          </span>
          <span style="font-family:${FONT_STACK};font-size:11px;font-weight:600;color:#B8B8CC;letter-spacing:2.5px;text-transform:uppercase;margin-left:10px;">
            Digital Agency
          </span>
        </td>
      </tr>
    </table>`;
}

function button(label: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 4px;">
      <tr>
        <td style="border-radius:10px;background:linear-gradient(135deg,${C.violet},${C.violetDark});">
          <a href="${url}" style="display:inline-block;padding:13px 30px;font-family:${FONT_STACK};font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:10px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

function infoCard(rows: Array<[string, string]>, accent = C.violet): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;background:${C.subtle};border-radius:12px;border-left:4px solid ${accent};">
      ${rows
        .map(
          ([k, v]) => `
        <tr>
          <td style="padding:10px 20px;font-family:${BODY_FONT};font-size:13px;color:${C.muted};white-space:nowrap;vertical-align:top;width:130px;">${k}</td>
          <td style="padding:10px 20px 10px 0;font-family:${BODY_FONT};font-size:14px;font-weight:600;color:${C.ink};">${v}</td>
        </tr>`,
        )
        .join('')}
    </table>`;
}

type CardRow = [string, string];

function codeBox(code: string): string {
  return `
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:${C.subtle};border:1px dashed ${C.violet};border-radius:14px;padding:20px 42px;">
        <span style="font-family:${FONT_STACK};font-size:36px;font-weight:800;letter-spacing:12px;color:${C.violet};">${code}</span>
      </div>
    </div>`;
}

function layout(title: string, bodyHtml: string, opts?: { accent?: string }): string {
  const accent = opts?.accent ?? C.violet;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#EDEBF5;font-family:${BODY_FONT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDEBF5;">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.surface};border-radius:18px;overflow:hidden;box-shadow:0 6px 32px rgba(13,13,20,0.08);">
        <tr><td style="background:${C.obsidian};">
          ${logoMark()}
          <div style="height:4px;background:linear-gradient(90deg,${accent},${C.cyan} 55%,${C.amber});"></div>
        </td></tr>
        <tr><td style="padding:34px 38px 10px;">
          <h1 style="margin:0 0 14px;font-family:${FONT_STACK};font-size:23px;line-height:1.25;color:${C.ink};">${title}</h1>
          <div style="font-family:${BODY_FONT};font-size:15px;line-height:1.65;color:${C.body};">${bodyHtml}</div>
        </td></tr>
        <tr><td style="padding:26px 38px 30px;">
          <div style="height:1px;background:${C.line};margin-bottom:18px;"></div>
          <p style="margin:0;font-family:${BODY_FONT};font-size:12px;color:${C.muted};line-height:1.6;">
            &copy; ${new Date().getFullYear()} ${BRAND_NAME} — ${BRAND_TAGLINE}<br/>
            <a href="${BRAND_URL}" style="color:${C.violet};text-decoration:none;">${BRAND_URL.replace(/^https?:\/\//, '')}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 14px;">${text}</p>`;
}
function muted(text: string): string {
  return `<p style="margin:0;font-size:13px;color:${C.muted};">${text}</p>`;
}

// ─── Auth emails ─────────────────────────────────────────────────────────────
export async function sendVerificationOTPEmail(email: string, name: string, otp: string) {
  await sendEmail({
    to: email,
    subject: `Verify your email — ${BRAND_NAME}`,
    html: layout(
      `Hi ${name.split(' ')[0]}, welcome to Invera!`,
      p(`Thanks for creating an account with ${BRAND_NAME}. Confirm your email address with this one-time code:`) +
        codeBox(otp) +
        muted(`This code expires in ${env.otpExpiresInMinutes} minutes. Didn't sign up? Just ignore this email.`),
    ),
  });
}

export async function sendPasswordResetOTPEmail(email: string, otp: string) {
  await sendEmail({
    to: email,
    subject: `Reset your password — ${BRAND_NAME}`,
    html: layout(
      'Password reset request',
      p('We received a request to reset your password. Use this one-time code to continue:') +
        codeBox(otp) +
        muted(`This code expires in ${env.otpExpiresInMinutes} minutes. Didn't request a reset? Ignore this email.`),
      { accent: C.amber },
    ),
  });
}

export async function sendWelcomeEmail(email: string, name: string, plainPassword?: string) {
  await sendEmail({
    to: email,
    subject: `Your account is ready — ${BRAND_NAME}`,
    html: layout(
      `Welcome aboard, ${name.split(' ')[0]}!`,
      p(`Your client portal account has been created. Sign in to track projects, milestones, invoices and messages in real time.`) +
        infoCard([
          ['Login URL', `<a href="${BRAND_URL}/login" style="color:${C.violet};text-decoration:none;font-weight:700;">${BRAND_URL}/login</a>`],
          ['Your email', email],
          ...(plainPassword ? [['Temp password', `<span style="font-family:monospace;font-size:16px;letter-spacing:1px;">${plainPassword}</span>`] as CardRow] : []),
        ]) +
        button('Sign in to portal', `${BRAND_URL}/login`) +
        muted('Please change your temporary password after first sign-in.'),
    ),
  });
}

// ─── Project emails ──────────────────────────────────────────────────────────
export async function sendProjectCreatedEmail(email: string, name: string, projectTitle: string, projectUrl: string) {
  await sendEmail({
    to: email,
    subject: `Project started: ${projectTitle}`,
    html: layout(
      `Your project has been kicked off 🚀`,
      p(`Hi ${name.split(' ')[0]}, <strong>"${projectTitle}"</strong> is now in the works. Milestones, tasks and progress will appear in your portal as we go.`) +
        button('Track your project', projectUrl),
    ),
  });
}

export async function sendProjectStatusEmail(email: string, name: string, projectTitle: string, statusLabel: string, projectUrl: string) {
  await sendEmail({
    to: email,
    subject: `Update on "${projectTitle}"`,
    html: layout(
      `Status update: ${statusLabel}`,
      p(`Hi ${name.split(' ')[0]}, your project <strong>"${projectTitle}"</strong> moved to <strong>${statusLabel}</strong>.`) +
        button('View details', projectUrl),
      { accent: C.cyan },
    ),
  });
}

export async function sendProjectProgressEmail(email: string, name: string, projectTitle: string, progressPercent: number, projectUrl: string) {
  const pct = Math.min(Math.max(progressPercent, 0), 100);
  await sendEmail({
    to: email,
    subject: `Progress update: ${projectTitle} is ${pct}% complete`,
    html: layout(
      `Progress update 🎉`,
      p(`Hi ${name.split(' ')[0]}, good news — <strong>"${projectTitle}"</strong> is now <strong>${pct}% complete</strong>.`) +
        `<div style="height:12px;background:${C.line};border-radius:99px;overflow:hidden;margin:18px 0;"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,${C.violet},${C.cyan});"></div></div>` +
        button('See full progress', projectUrl),
    ),
  });
}

export async function sendMilestoneUpdateEmail(email: string, name: string, projectTitle: string, milestoneTitle: string, milestoneDone: boolean, projectUrl: string) {
  await sendEmail({
    to: email,
    subject: `Milestone ${milestoneDone ? 'completed' : 'updated'}: ${milestoneTitle}`,
    html: layout(
      milestoneDone ? `Milestone completed ✅` : `Milestone update`,
      p(`Hi ${name.split(' ')[0]}, the milestone <strong>"${milestoneTitle}"</strong> on <strong>"${projectTitle}"</strong> has been marked <strong>${milestoneDone ? 'complete' : 'updated'}</strong>.`) +
        button('Review milestone', projectUrl),
      { accent: C.amber },
    ),
  });
}

export async function sendTaskAssignedEmail(email: string, assigneeName: string, taskTitle: string, projectTitle: string, dashboardUrl: string) {
  await sendEmail({
    to: email,
    subject: `New task assigned: ${taskTitle}`,
    html: layout(
      `You have a new task`,
      p(`Hi ${assigneeName.split(' ')[0]}, you've been assigned <strong>"${taskTitle}"</strong> on <strong>"${projectTitle}"</strong>.`) +
        button('Open task board', dashboardUrl),
      { accent: C.cyan },
    ),
  });
}

export async function sendReviewRequestEmail(email: string, name: string, projectTitle: string, reviewUrl: string) {
  await sendEmail({
    to: email,
    subject: `How did we do? Review "${projectTitle}"`,
    html: layout(
      `It's a wrap on "${projectTitle}" 🎉`,
      p(`Hi ${name.split(' ')[0]}, your project is complete! We'd love a quick review — it means the world to a growing agency like ours.`) +
        button('Leave a review', reviewUrl),
      { accent: C.amber },
    ),
  });
}

// ─── Invoice & payment emails ────────────────────────────────────────────────
export async function sendInvoiceEmail(email: string, invoiceNumber: string, pdfBuffer?: Buffer) {
  await sendEmail({
    to: email,
    subject: `Invoice ${invoiceNumber} — ${BRAND_NAME}`,
    html: layout(
      `Invoice ${invoiceNumber}`,
      p('Please find your invoice attached. You can also view and pay it online from your client dashboard.') +
        button('Open client portal', `${BRAND_URL}/client/invoices`),
      { accent: C.obsidianSoft as any },
    ),
    attachments: pdfBuffer ? [{ filename: `Invoice-${invoiceNumber}.pdf`, content: pdfBuffer }] : undefined,
  });
}

export async function sendInvoiceCreatedEmail(email: string, name: string, invoiceNumber: string, amount: number, invoiceUrl: string) {
  await sendEmail({
    to: email,
    subject: `New invoice ${invoiceNumber} — ${BRAND_NAME}`,
    html: layout(
      `New invoice: ${invoiceNumber}`,
      p(`Hi ${name.split(' ')[0]}, a new invoice is available in your portal.`) +
        infoCard([['Invoice', invoiceNumber], ['Amount due', `$${amount.toFixed(2)}`]]) +
        button('View & pay invoice', invoiceUrl),
      { accent: C.amber },
    ),
  });
}

export async function sendPaymentConfirmedEmail(email: string, name: string, invoiceNumber: string, amount: number, method: string, confirmedBy: string) {
  const methodLabel = method === 'bank_transfer' ? 'Bank Transfer' : method === 'bkash' ? 'bKash' : method === 'nagad' ? 'Nagad' : 'Manual';
  await sendEmail({
    to: email,
    subject: `Payment confirmed — Invoice ${invoiceNumber}`,
    html: layout(
      `Payment received ✅`,
      p(`Hi ${name.split(' ')[0]}, your payment for invoice <strong>${invoiceNumber}</strong> has been verified. Thank you!`) +
        infoCard(
          [
            ['Amount', `$${amount.toFixed(2)}`],
            ['Method', methodLabel],
            ['Confirmed by', confirmedBy],
          ],
          C.success,
        ) +
        button('View receipt in portal', `${BRAND_URL}/client/invoices`),
      { accent: C.success },
    ),
  });
}

export async function sendPaymentRejectedEmail(email: string, name: string, invoiceNumber: string, transactionRef: string, reason: string) {
  await sendEmail({
    to: email,
    subject: `Action needed — Payment for ${invoiceNumber} was rejected`,
    html: layout(
      `We couldn't verify your payment`,
      p(`Hi ${name.split(' ')[0]}, the payment submission for invoice <strong>${invoiceNumber}</strong> (ref <strong>${transactionRef}</strong>) could not be verified.`) +
        infoCard([['Reason', reason]], C.danger) +
        p('Please double-check the details and submit again from your client portal — or contact us if you believe this is a mistake.') +
        button('Resubmit payment', `${BRAND_URL}/client/invoices`),
      { accent: C.danger },
    ),
  });
}

export async function sendPaymentSubmittedAdminEmail(invoiceNumber: string, method: string, amount: number, clientName: string, adminEmail: string) {
  await sendEmail({
    to: adminEmail,
    subject: `[Review needed] Manual payment for ${invoiceNumber}`,
    html: layout(
      `Manual payment submitted`,
      p(`<strong>${clientName}</strong> submitted a payment that needs verification.`) +
        infoCard([
          ['Invoice', invoiceNumber],
          ['Amount', `$${amount.toFixed(2)}`],
          ['Method', method],
        ], C.amber) +
        button('Open payments queue', `${BRAND_URL}/dashboard/payments`),
      { accent: C.amber },
    ),
  });
}

// ─── Lead & sales emails ─────────────────────────────────────────────────────
export async function sendNewLeadAdminEmail(adminEmail: string, contactName: string, contactEmail: string, serviceInterest: string) {
  await sendEmail({
    to: adminEmail,
    subject: `🔔 New lead: ${contactName}${serviceInterest ? ` — ${serviceInterest}` : ''}`,
    html: layout(
      `New inbound lead 🔔`,
      p(`A new lead just came through the website.`) +
        infoCard([
          ['Contact', contactName],
          ['Email', contactEmail],
          ['Interest', serviceInterest || '—'],
        ], C.cyan) +
        button('Open leads pipeline', `${BRAND_URL}/dashboard/leads`),
      { accent: C.cyan },
    ),
  });
}

export async function sendLeadAssignedEmail(assigneeEmail: string, assigneeName: string, leadName: string, leadEmail: string, serviceInterest: string) {
  await sendEmail({
    to: assigneeEmail,
    subject: `Lead assigned to you: ${leadName}`,
    html: layout(
      `A lead was assigned to you`,
      p(`Hi ${assigneeName.split(' ')[0]}, <strong>${leadName}</strong> (${leadEmail}) was routed to you${serviceInterest ? ` — interested in <strong>${serviceInterest}</strong>` : ''}.`) +
        button('View lead', `${BRAND_URL}/dashboard/leads`),
      { accent: C.cyan },
    ),
  });
}

// ─── Proposal emails ─────────────────────────────────────────────────────────
export async function sendProposalSentEmail(email: string, name: string, proposalTitle: string, proposalUrl: string) {
  await sendEmail({
    to: email,
    subject: `New proposal for you: ${proposalTitle}`,
    html: layout(
      `A proposal awaits your review`,
      p(`Hi ${name.split(' ')[0]}, we've prepared a proposal — <strong>"${proposalTitle}"</strong>. Review it at your convenience.`) +
        button('View proposal', proposalUrl),
    ),
  });
}

export async function sendProposalAcceptedEmail(email: string, name: string, proposalTitle: string) {
  await sendEmail({
    to: email,
    subject: `Proposal accepted: ${proposalTitle} 🎉`,
    html: layout(
      `Proposal accepted 🎉`,
      p(`Hi ${name.split(' ')[0]}, your acceptance of <strong>"${proposalTitle}"</strong> is recorded. Your project workspace is being set up — we'll be in touch shortly!`),
      { accent: C.success },
    ),
  });
}

export async function sendProposalDeclinedEmail(email: string, name: string, proposalTitle: string, reason: string) {
  await sendEmail({
    to: email,
    subject: `Proposal status: ${proposalTitle}`,
    html: layout(
      `About your proposal`,
      p(`Hi ${name.split(' ')[0]}, unfortunately we can't move forward with <strong>"${proposalTitle}"</strong> right now.`) +
        (reason ? infoCard([['Note from our team', reason]], C.danger) : '') +
        p("We'd love to find another way to work together — reply to this email any time."),
      { accent: C.danger },
    ),
  });
}

// ─── Support emails ──────────────────────────────────────────────────────────
export async function sendTicketCreatedEmail(email: string, name: string, ticketSubject: string, ticketUrl: string) {
  await sendEmail({
    to: email,
    subject: `Support ticket received — ${ticketSubject}`,
    html: layout(
      `We've got your request`,
      p(`Hi ${name.split(' ')[0]}, your support ticket <strong>"${ticketSubject}"</strong> has been received. Our team typically responds within one business day.`) +
        button('View ticket', ticketUrl),
    ),
  });
}

export async function sendTicketReplyEmail(email: string, name: string, ticketSubject: string, ticketUrl: string) {
  await sendEmail({
    to: email,
    subject: `New reply on your ticket — ${ticketSubject}`,
    html: layout(
      `New reply on your ticket`,
      p(`Hi ${name.split(' ')[0]}, there's a new reply on <strong>"${ticketSubject}"</strong>.`) +
        button('Read the reply', ticketUrl),
      { accent: C.cyan },
    ),
  });
}

// ─── Admin compose tool ──────────────────────────────────────────────────────
export async function sendDirectEmail(to: string, subject: string, htmlBody: string) {
  await sendEmail({
    to,
    subject,
    html: layout(subject, htmlBody),
  });
}
