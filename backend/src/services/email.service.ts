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
  },

  async sendVerificationEmail(to: string, userName: string, verificationToken: string) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    const subject = 'Vérifiez votre adresse email - TrackMyApps';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Bienvenue sur TrackMyApps, ${userName} ! 🎉</h2>
        <p>Merci de vous être inscrit. Pour activer votre compte et accéder à toutes les fonctionnalités, veuillez vérifier votre adresse email.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Vérifier mon email
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
        </p>
        <p style="color: #2563eb; font-size: 12px; word-break: break-all;">
          ${verificationUrl}
        </p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 40px;">
          Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
        </p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }
};
