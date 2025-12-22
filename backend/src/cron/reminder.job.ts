import cron from 'node-cron';
import prisma from '../config/database.js';
import { emailService } from '../services/email.service.js';

export const startReminderCron = () => {
  // Vérifie les rappels toutes les minutes
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const nowMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0, 0);
    const nextMinute = new Date(nowMinute.getTime() + 60 * 1000);

    console.log(`[CRON] Checking reminders between ${nowMinute.toISOString()} and ${nextMinute.toISOString()}`);

    try {
      const reminders = await prisma.reminder.findMany({
        where: {
          dueDate: {
            gte: nowMinute,
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

      if (reminders.length > 0) {
        console.log(`[CRON] Found ${reminders.length} reminders to send.`);
      }

      for (const reminder of reminders) {
        if (reminder.user.email) {
          try {
            await emailService.sendReminderEmail(
              reminder.user.email,
              reminder.user.firstName,
              reminder.title,
              reminder.dueDate,
              reminder.description
            );

            // Mark as sent
            await prisma.reminder.update({
              where: { id: reminder.id },
              data: { emailSent: true },
            });
            console.log(`[CRON] Email sent for reminder ${reminder.id}`);
          } catch (emailError) {
            console.error(`[CRON] Failed to send email for reminder ${reminder.id}:`, emailError);
          }
        }
      }
    } catch (error) {
      console.error('[CRON] Error in reminder cron job:', error);
    }
  });
  
  console.log('[CRON] Reminder job scheduled (Every minute)');
};
