import 'dotenv/config';
import { emailService } from '../services/email.service.js';

async function main() {
  console.log('Testing email sending to a2lecluse@gmail.com...');
  try {
    const info = await emailService.sendEmail(
      'a2lecluse@gmail.com',
      'Test TrackMyApps',
      '<h1>Ceci est un test</h1><p>Si vous recevez ce mail, la configuration fonctionne !</p>'
    );
    if (info) {
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } else {
        console.log('⚠️ Email sending function returned undefined (check logs for warnings).');
    }
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
}

main();
