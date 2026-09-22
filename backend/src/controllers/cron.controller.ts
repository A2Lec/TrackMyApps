import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { emailService } from '../services/email.service.js';

export const cronController = {
  async processReminders(req: Request, res: Response) {
    // Security check: Verify Vercel Cron signature or a secret key if needed
    // For simplicity, we'll assume the route is protected or public for now
    // Ideally, check req.headers['authorization'] === `Bearer ${process.env.CRON_SECRET}`

    console.log('[CRON] Starting reminder check...');

    try {
      const now = new Date();
      // Check for reminders due in the next minute or past due within 24h that haven't been sent yet
      // Looking back up to 24h prevents reminders from being permanently lost if cron was delayed or paused
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const nextMinute = new Date(now.getTime() + 60 * 1000);

      const reminders = await prisma.reminder.findMany({
        where: {
          dueDate: {
            gte: oneDayAgo,
            lt: nextMinute,
          },
          isCompleted: false,
          emailSent: false,
          user: {
            emailNotifications: true,
          },
        },
        include: {
          user: true,
        },
      });

      console.log(`[CRON] Found ${reminders.length} reminders to process.`);

      const results = {
        processed: 0,
        sent: 0,
        errors: 0,
      };

      for (const reminder of reminders) {
        results.processed++;
        if (reminder.user.email) {
          try {
            const emailResult = await emailService.sendReminderEmail(
              reminder.user.email,
              reminder.user.firstName,
              reminder.title,
              reminder.dueDate,
              reminder.description
            );

            if (emailResult) {
              // Mark as sent only if email was actually sent
              await prisma.reminder.update({
                where: { id: reminder.id },
                data: { emailSent: true },
              });
              
              results.sent++;
              console.log(`[CRON] Email sent for reminder ${reminder.id}`);
            } else {
              results.errors++;
              console.error(`[CRON] Failed to send email for reminder ${reminder.id}: Email service returned failure`);
            }
          } catch (emailError) {
            results.errors++;
            console.error(`[CRON] Failed to send email for reminder ${reminder.id}:`, emailError);
          }
        }
      }

      res.json({
        success: true,
        message: 'Reminders processed successfully',
        results,
      });
    } catch (error) {
      console.error('[CRON] Error processing reminders:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
};
