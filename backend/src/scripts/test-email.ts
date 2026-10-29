/**
 * Send a test email to check the SMTP configuration.
 * Usage (from backend/): npm run email:test -- you@example.com
 */
import 'dotenv/config';
import { emailService } from '../services/email.service.js';

async function main() {
  const recipient = process.argv[2];
  if (!recipient) {
    console.error('Usage: npm run email:test -- <recipient@example.com>');
    process.exitCode = 1;
    return;
  }

  console.log(`Sending a test email to ${recipient}...`);
  const info = await emailService.sendEmail(
    recipient,
    'Test TrackMyApps',
    '<h1>Ceci est un test</h1><p>Si vous recevez ce mail, la configuration fonctionne !</p>'
  );

  if (info) {
    console.log(`✅ Email sent (message ID: ${info.messageId})`);
  } else {
    console.log('⚠️ No email sent: check EMAIL_USER and EMAIL_PASSWORD.');
  }
}

main().catch((error) => {
  console.error('❌ Failed to send email:', error);
  process.exitCode = 1;
});
