import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { storageService } from './storage.service.js';
import { logInfo } from '../utils/logger.js';

/**
 * Shared demo account (DEMO_USER_EMAIL): anyone can log in with it, so it is
 * read-only for its credentials and settings, and its data is reset every day.
 */
export const getDemoEmail = (): string | undefined =>
  process.env.DEMO_USER_EMAIL?.trim().toLowerCase() || undefined;

export const isDemoEmail = (email: string): boolean => {
  const demoEmail = getDemoEmail();
  return Boolean(demoEmail) && email.trim().toLowerCase() === demoEmail;
};

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY);

/**
 * Replace the user's data with the sample dataset. Dates are relative to today
 * so the dashboard, calendar and reminders always look current.
 */
export async function seedDemoData(userId: string) {
  const db = prisma;
  const documents = await db.document.findMany({ where: { userId }, select: { fileUrl: true } });

  await db.$transaction([
    db.reminder.deleteMany({ where: { userId } }),
    db.interviewSession.deleteMany({ where: { userId } }),
    db.interviewPrep.deleteMany({ where: { userId } }),
    db.companyReview.deleteMany({ where: { userId } }),
    db.application.deleteMany({ where: { userId } }),
    db.company.deleteMany({ where: { userId } }),
    db.document.deleteMany({ where: { userId } }),
  ]);
  await storageService.deleteFiles(documents.map((doc) => doc.fileUrl));

  const company = (data: { name: string; industry: string; size: string; website: string; location: string; description?: string }) =>
    db.company.create({ data: { userId, ...data } });

  const doctolib = await company({ name: 'Doctolib', industry: 'HealthTech', size: '1000-5000', website: 'https://careers.doctolib.fr', location: 'Paris', description: 'Plateforme de prise de rendez-vous médicaux' });
  const datadog = await company({ name: 'Datadog', industry: 'Tech', size: '1000-5000', website: 'https://www.datadoghq.com', location: 'Paris, Remote' });
  const bnp = await company({ name: 'BNP Paribas', industry: 'Finance', size: '10000+', website: 'https://group.bnpparibas', location: 'Paris La Défense' });
  const capgemini = await company({ name: 'Capgemini', industry: 'Consulting', size: '10000+', website: 'https://www.capgemini.com', location: 'Bordeaux' });

  const interview = await db.application.create({
    data: {
      userId, companyId: doctolib.id, companyName: 'Doctolib',
      position: 'Développeur Full Stack - Alternance', jobType: 'ALTERNANCE', location: 'Paris',
      status: 'INTERVIEW_SCHEDULED', applicationDate: daysFromNow(-12), interviewDate: daysFromNow(3),
      jobUrl: 'https://careers.doctolib.fr', salary: '1 400 €/mois',
      notes: 'Stack : Ruby on Rails + React. Préparer un exemple de projet full stack.',
      contactName: 'Marie Martin', contactEmail: 'recrutement@example.com',
    },
  });
  const awaiting = await db.application.create({
    data: {
      userId, companyId: datadog.id, companyName: 'Datadog',
      position: 'Backend Engineer Intern', jobType: 'STAGE', location: 'Paris',
      status: 'AWAITING_RESPONSE', applicationDate: daysFromNow(-8),
      jobUrl: 'https://www.datadoghq.com/careers/', notes: 'Relance prévue dans une semaine.',
    },
  });
  const rejected = await db.application.create({
    data: {
      userId, companyId: bnp.id, companyName: 'BNP Paribas',
      position: 'Développeur Java - Stage', jobType: 'STAGE', location: 'Paris La Défense',
      status: 'REJECTED', applicationDate: daysFromNow(-40), decisionDate: daysFromNow(-20),
      notes: "Refus : pas assez d'expérience Java. Retour utile pour la suite.",
    },
  });
  await db.application.createMany({
    data: [
      { userId, companyId: capgemini.id, companyName: 'Capgemini', position: 'Consultant IT Junior', jobType: 'CDI', location: 'Bordeaux', status: 'VIEWED', applicationDate: daysFromNow(-5), salary: '38 k€/an' },
      { userId, companyName: 'Leboncoin', position: 'DevOps Engineer - Alternance', jobType: 'ALTERNANCE', location: 'Paris', status: 'DRAFT', notes: 'Finaliser le CV avant envoi.' },
      { userId, companyName: 'Société Générale', position: 'Data Analyst Intern', jobType: 'STAGE', location: 'Paris', status: 'GHOSTED', applicationDate: daysFromNow(-60), notes: 'Aucune réponse après deux relances.' },
      { userId, companyName: 'Startup XYZ', position: 'Frontend Developer', jobType: 'CDI', location: 'Remote', status: 'ACCEPTED', applicationDate: daysFromNow(-70), decisionDate: daysFromNow(-45), salary: '42 k€/an', notes: 'Offre acceptée !' },
      { userId, companyName: 'Librairie du Centre', position: 'Vendeur - Job étudiant', jobType: 'JOB_ETUDIANT', location: 'Lyon', status: 'SENT', applicationDate: daysFromNow(-2) },
    ],
  });

  await db.applicationEvent.createMany({
    data: [
      { applicationId: interview.id, type: 'STATUS_CHANGE', description: 'Candidature envoyée', createdAt: daysFromNow(-12) },
      { applicationId: interview.id, type: 'STATUS_CHANGE', description: 'Entretien planifié', createdAt: daysFromNow(-4) },
      { applicationId: awaiting.id, type: 'STATUS_CHANGE', description: 'Candidature envoyée via le site carrières', createdAt: daysFromNow(-8) },
      { applicationId: rejected.id, type: 'STATUS_CHANGE', description: 'Réponse négative reçue', createdAt: daysFromNow(-20) },
    ],
  });

  await db.reminder.createMany({
    data: [
      { userId, applicationId: interview.id, title: 'Préparer l’entretien Doctolib', description: 'Revoir le projet full stack et la méthode STAR', type: 'INTERVIEW', dueDate: daysFromNow(2) },
      { userId, applicationId: awaiting.id, title: 'Relancer Datadog', type: 'FOLLOW_UP', dueDate: daysFromNow(-1) },
      { userId, title: 'Mettre à jour le CV', description: 'Ajouter le dernier projet', type: 'OTHER', dueDate: daysFromNow(5) },
    ],
  });

  await db.interviewPrep.createMany({
    data: [
      { userId, question: 'Parlez-moi de vous', answer: "Je suis étudiant en dernière année d'école d'ingénieur, passionné par le développement logiciel...", category: 'BEHAVIORAL', notes: 'Trois parties : parcours, compétences, motivation', isFavorite: true },
      { userId, question: 'Pourquoi voulez-vous rejoindre notre entreprise ?', category: 'BEHAVIORAL', isFavorite: true },
      { userId, question: 'Expliquez la différence entre une API REST et GraphQL', category: 'TECHNICAL', notes: 'REST : ressources et verbes HTTP. GraphQL : un endpoint, requêtes flexibles' },
      { userId, question: 'Racontez une situation où vous avez résolu un conflit', category: 'SITUATIONAL', notes: 'Utiliser la méthode STAR' },
    ],
  });

  await db.companyReview.create({
    data: { userId, companyId: doctolib.id, rating: 4, comment: 'Process rapide et équipe bienveillante' },
  });
}

/**
 * Create the demo account if needed and reset its data and profile
 */
export async function resetDemoAccount(email: string, password: string) {
  const db = prisma;
  const profile = {
    firstName: 'Camille',
    lastName: 'Martin',
    school: 'Université Paris-Saclay',
    graduationYear: new Date().getFullYear() + 1,
    fieldOfStudy: 'Informatique',
    emailVerified: true,
    emailNotifications: false,
    relanceFrequency: 7,
  };
  const user = await db.user.upsert({
    where: { email },
    create: { email, password: await bcrypt.hash(password, 10), ...profile },
    update: profile,
  });
  await seedDemoData(user.id);
  return user;
}

export const demoService = {
  async isDemoUser(userId: string): Promise<boolean> {
    const demoEmail = getDemoEmail();
    if (!demoEmail) return false;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    return user?.email.toLowerCase() === demoEmail;
  },

  /**
   * Daily reset, run by the cron job. The password is left untouched.
   */
  async reset() {
    const demoEmail = getDemoEmail();
    if (!demoEmail) return;
    const user = await prisma.user.findUnique({ where: { email: demoEmail }, select: { id: true } });
    if (!user) return;
    await seedDemoData(user.id);
    logInfo('Demo account data reset', { context: 'Demo' });
  },
};
