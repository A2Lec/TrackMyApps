import nodemailer from 'nodemailer';
import { getFrontendUrls } from '../config/cors.js';
import { logError, logInfo, logWarn } from '../utils/logger.js';

// Gmail by default (EMAIL_PASSWORD is then an app password); any SMTP server works
const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// FRONTEND_URL may hold a comma-separated list (see CORS config): links use the first entry
function getFrontendUrl(): string {
  return getFrontendUrls()[0] || 'http://localhost:5173';
}

// Sillage email palette (light theme): emails cannot read the app's CSS variables
const C = {
  ink: '#10201F',
  muted: '#4E5B58',
  page: '#F5F7F6',
  card: '#FFFFFF',
  rule: '#DDE3E1',
  brand: '#0F6E66',
};
const SANS = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = 'ui-monospace,Menlo,Consolas,monospace';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const DAYS = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];

/** "MER 21.10" */
function shortDay(date: Date): string {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${DAYS[d.getDay()]} ${dd}.${mm}`;
}

interface EmailLayout {
  eyebrow: string;
  title: string;
  /** Already-escaped HTML */
  body: string;
  action: { label: string; url: string };
  footer: string;
}

// Sillage transactional template: tables + inline styles, system fonts, 600px max,
// one button (44px high, 6px radius) with the plain link repeated below it.
// PNG logo (not SVG): most email clients do not render SVG images.
function renderEmail({ eyebrow, title, body, action, footer }: EmailLayout): string {
  const frontendUrl = getFrontendUrl();
  return `<!doctype html>
<html lang="fr">
<body style="margin:0;padding:0;background:${C.page};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
      <tr><td style="padding:0 0 20px;">
        <img src="${frontendUrl}/icon-192.png" width="40" height="40" alt="TrackMyApps" style="display:block;border:0;border-radius:9px;">
      </td></tr>
      <tr><td style="background:${C.card};border:1px solid ${C.rule};border-radius:8px;padding:32px;font-family:${SANS};color:${C.ink};">
        <p style="margin:0 0 8px;font-family:${MONO};font-size:12px;letter-spacing:.04em;color:${C.muted};">${eyebrow}</p>
        <h1 style="margin:0 0 12px;font-size:22px;line-height:28px;font-weight:600;">${title}</h1>
        ${body}
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${C.brand};border-radius:6px;">
          <a href="${action.url}" style="display:inline-block;padding:12px 20px;font-size:15px;line-height:20px;font-weight:600;color:#FFFFFF;text-decoration:none;">${action.label}</a>
        </td></tr></table>
        <p style="margin:24px 0 0;font-size:13px;line-height:20px;color:${C.muted};">Le bouton ne fonctionne pas ? Copiez ce lien :<br><a href="${action.url}" style="color:${C.brand};word-break:break-all;">${action.url}</a></p>
      </td></tr>
      <tr><td style="padding:20px 8px 0;font-family:${SANS};font-size:12px;line-height:18px;color:${C.muted};">
        ${footer}
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 24px;font-size:15px;line-height:24px;color:${C.ink};">${text}</p>`;
}

export const emailService = {
  async sendEmail(to: string, subject: string, html: string) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      // Without SMTP, local setups can still verify accounts and reset passwords from the logs
      const link = html.match(/href="([^"]+)"/)?.[1];
      logWarn(`Email not sent (EMAIL_USER/EMAIL_PASSWORD not set): "${subject}" to ${to}`, { context: 'Email' });
      if (link && process.env.NODE_ENV !== 'production') {
        logInfo(`Link: ${link}`, { context: 'Email' });
      }
      return;
    }

    try {
      const info = await transporter.sendMail({
        from: `"TrackMyApps" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });
      return info;
    } catch (error) {
      logError('Error sending email', error, { context: 'Email' });
      // Don't throw error to prevent crashing the cron job
    }
  },

  async sendReminderEmail(to: string, userName: string, reminderTitle: string, dueDate: Date, description?: string | null) {
    const title = escapeHtml(reminderTitle);
    const subject = `Rappel : ${reminderTitle}`;
    const intro = `Bonjour ${escapeHtml(userName)}, vous avez un rappel prévu pour aujourd'hui.`;
    const note = description
      ? `<p style="margin:-12px 0 24px;font-size:15px;line-height:24px;color:${C.muted};">${escapeHtml(description)}</p>`
      : '';
    const html = renderEmail({
      eyebrow: `RAPPEL · ${shortDay(dueDate)}`,
      title,
      body: paragraph(intro) + note,
      action: { label: 'Voir mes rappels', url: `${getFrontendUrl()}/reminders` },
      footer: `Vous recevez cet email car vous avez activé les notifications pour TrackMyApps. <a href="${getFrontendUrl()}/settings" style="color:${C.muted};">Gérer les notifications</a>`,
    });
    return this.sendEmail(to, subject, html);
  },

  async sendVerificationEmail(to: string, userName: string, verificationToken: string) {
    const verificationUrl = `${getFrontendUrl()}/verify-email?token=${verificationToken}`;
    const subject = 'Confirmez votre adresse email';
    const html = renderEmail({
      eyebrow: 'BIENVENUE',
      title: 'Confirmez votre adresse email',
      body: paragraph(
        `Bonjour ${escapeHtml(userName)}, un clic pour activer votre compte et commencer à suivre vos candidatures. Le lien expire dans 24 h.`
      ),
      action: { label: 'Confirmer mon adresse', url: verificationUrl },
      footer: "Vous recevez cet email car un compte TrackMyApps a été créé avec cette adresse. Si ce n'est pas vous, ignorez-le.",
    });
    return this.sendEmail(to, subject, html);
  },

  async sendPasswordResetEmail(to: string, userName: string, resetToken: string) {
    const resetUrl = `${getFrontendUrl()}/reset-password?token=${resetToken}`;
    const subject = 'Réinitialisation de votre mot de passe';
    const html = renderEmail({
      eyebrow: 'SÉCURITÉ',
      title: 'Réinitialisez votre mot de passe',
      body: paragraph(
        `Bonjour ${escapeHtml(userName)}, vous avez demandé un nouveau mot de passe. Si ce n'est pas vous, ignorez cet email : votre mot de passe reste inchangé. Le lien expire dans 1 h.`
      ),
      action: { label: 'Choisir un mot de passe', url: resetUrl },
      footer: 'Vous recevez cet email car vous avez un compte TrackMyApps.',
    });
    return this.sendEmail(to, subject, html);
  },
};
