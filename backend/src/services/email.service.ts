import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    // Necessary for some local environments (antivirus, etc.)
    rejectUnauthorized: false
  }
});

export const emailService = {
  async sendEmail(to: string, subject: string, html: string) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email credentials not set. Skipping email sending.');
      return;
    }

    try {
      // Verify connection configuration
      await transporter.verify();
      
      const info = await transporter.sendMail({
        from: `"TrackMyApps" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });
      console.log('Email sent: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      // Don't throw error to prevent crashing the cron job
    }
  },

  async sendReminderEmail(to: string, userName: string, reminderTitle: string, dueDate: Date, description?: string | null) {
    const subject = `Rappel : ${reminderTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Bonjour ${userName},</h2>
        <p>Vous avez un rappel prévu pour aujourd'hui :</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${reminderTitle}</h3>
          <p><strong>Date :</strong> ${new Date(dueDate).toLocaleDateString('fr-FR')}</p>
          ${description ? `<p><strong>Note :</strong> ${description}</p>` : ''}
        </div>
        <p>Connectez-vous à <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">TrackMyApps</a> pour voir les détails.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 40px;">
          Vous recevez cet email car vous avez activé les notifications pour TrackMyApps.
        </p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }
};
