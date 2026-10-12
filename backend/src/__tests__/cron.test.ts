import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';

vi.mock('../config/database.js', () => ({
  default: {
    reminder: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../services/email.service.js', () => ({
  emailService: { sendReminderEmail: vi.fn() },
}));

import prisma from '../config/database.js';
import { cronController } from '../controllers/cron.controller.js';

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('Cron reminders auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.CRON_SECRET = 'cron-secret';
    vi.mocked(prisma.reminder.findMany).mockResolvedValue([]);
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it('accepts a logged-in user token and only processes that user (no 401 that would log the user out)', async () => {
    const token = jwt.sign({ userId: 'user-a' }, 'test-secret');
    const res = mockRes();

    await cronController.processReminders({ headers: { authorization: `Bearer ${token}` } } as any, res);

    expect(res.status).not.toHaveBeenCalledWith(401);
    expect(vi.mocked(prisma.reminder.findMany).mock.calls[0][0]?.where).toMatchObject({ userId: 'user-a' });
  });

  it('processes every user for the scheduler secret', async () => {
    const res = mockRes();

    await cronController.processReminders({ headers: { authorization: 'Bearer cron-secret' } } as any, res);

    expect(vi.mocked(prisma.reminder.findMany).mock.calls[0][0]?.where).not.toHaveProperty('userId');
  });

  it('rejects anonymous calls when CRON_SECRET is set', async () => {
    const res = mockRes();

    await cronController.processReminders({ headers: {} } as any, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(prisma.reminder.findMany).not.toHaveBeenCalled();
  });
});
