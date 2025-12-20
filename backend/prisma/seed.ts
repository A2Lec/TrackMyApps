import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.applicationEvent.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.companyReview.deleteMany();
  await prisma.interviewPrep.deleteMany();
  await prisma.application.deleteMany();
  await prisma.document.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@trackmyapps.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      school: 'École Polytechnique',
      graduationYear: 2025,
      fieldOfStudy: 'Informatique',
      emailNotifications: true,
      relanceFrequency: 7,
    },
  });

  const user = await prisma.user.create({
    data: {
      email: 'user@trackmyapps.com',
      password: hashedPassword,
      firstName: 'Jean',
      lastName: 'Dupont',
      school: 'Université Paris-Saclay',
      graduationYear: 2025,
      fieldOfStudy: 'Développement Web',
      emailNotifications: true,
      relanceFrequency: 7,
    },
  });

  console.log('✅ Users created');

  // Create companies
  const google = await prisma.company.create({
    data: {
      userId: admin.id,
      name: 'Google France',
      industry: 'Tech',
      size: '10000+',
      website: 'https://careers.google.com',
      location: 'Paris',
      description: 'Leader mondial de la tech',
    },
  });

  const doctolib = await prisma.company.create({
    data: {
      userId: admin.id,
      name: 'Doctolib',
      industry: 'HealthTech',
      size: '1000-5000',
      website: 'https://careers.doctolib.fr',
      location: 'Paris',
      description: 'Plateforme de prise de RDV médicaux',
    },
  });

  const bnp = await prisma.company.create({
    data: {
      userId: admin.id,
      name: 'BNP Paribas',
      industry: 'Finance',
      size: '10000+',
      website: 'https://group.bnpparibas',
      location: 'Paris',
    },
  });

  const datadog = await prisma.company.create({
    data: {
      userId: user.id,
      name: 'Datadog',
      industry: 'Tech',
      size: '1000-5000',
      website: 'https://www.datadoghq.com',
      location: 'Paris, Remote',
    },
  });

  const capgemini = await prisma.company.create({
    data: {
      userId: user.id,
      name: 'Capgemini',
      industry: 'Consulting',
      size: '10000+',
      website: 'https://www.capgemini.com',
      location: 'France',
    },
  });

  console.log('✅ Companies created');

  // Create applications for admin
  const app1 = await prisma.application.create({
    data: {
      userId: admin.id,
      companyId: google.id,
      companyName: 'Google France',
      position: 'Software Engineer Intern',
      jobType: 'STAGE',
      location: 'Paris',
      status: 'INTERVIEW_SCHEDULED',
      applicationDate: new Date('2024-11-15'),
      jobUrl: 'https://careers.google.com/jobs/123',
      salary: '2000€/mois',
      notes: 'Super opportunité, préparer les coding interviews',
      contactName: 'Marie Martin',
      contactEmail: 'marie.martin@google.com',
      interviewDate: new Date('2024-12-28'),
    },
  });

  const app2 = await prisma.application.create({
    data: {
      userId: admin.id,
      companyId: doctolib.id,
      companyName: 'Doctolib',
      position: 'Full Stack Developer - Alternance',
      jobType: 'ALTERNANCE',
      location: 'Paris',
      status: 'SENT',
      applicationDate: new Date('2024-12-01'),
      jobUrl: 'https://careers.doctolib.fr/jobs/456',
      salary: '1400€/mois',
      notes: 'Stack: Ruby on Rails + React',
    },
  });

  const app3 = await prisma.application.create({
    data: {
      userId: admin.id,
      companyId: bnp.id,
      companyName: 'BNP Paribas',
      position: 'Développeur Java - Stage',
      jobType: 'STAGE',
      location: 'Paris La Défense',
      status: 'REJECTED',
      applicationDate: new Date('2024-10-20'),
      decisionDate: new Date('2024-11-15'),
      notes: 'Refus car pas assez d\'expérience Java',
    },
  });

  const app4 = await prisma.application.create({
    data: {
      userId: admin.id,
      companyName: 'Startup XYZ',
      position: 'Frontend Developer',
      jobType: 'CDI',
      location: 'Remote',
      status: 'ACCEPTED',
      applicationDate: new Date('2024-09-01'),
      decisionDate: new Date('2024-10-15'),
      salary: '42k€/an',
      notes: 'Offre acceptée !',
    },
  });

  // Create applications for user
  const app5 = await prisma.application.create({
    data: {
      userId: user.id,
      companyId: datadog.id,
      companyName: 'Datadog',
      position: 'Backend Engineer Intern',
      jobType: 'STAGE',
      location: 'Paris',
      status: 'AWAITING_RESPONSE',
      applicationDate: new Date('2024-12-05'),
      jobUrl: 'https://datadoghq.com/careers/789',
      notes: 'Relance prévue dans 1 semaine',
    },
  });

  const app6 = await prisma.application.create({
    data: {
      userId: user.id,
      companyId: capgemini.id,
      companyName: 'Capgemini',
      position: 'Consultant IT Junior',
      jobType: 'CDI',
      location: 'Bordeaux',
      status: 'VIEWED',
      applicationDate: new Date('2024-12-10'),
      salary: '38k€/an',
    },
  });

  const app7 = await prisma.application.create({
    data: {
      userId: user.id,
      companyName: 'Leboncoin',
      position: 'DevOps Engineer - Alternance',
      jobType: 'ALTERNANCE',
      location: 'Paris',
      status: 'DRAFT',
      notes: 'Finaliser le CV avant envoi',
    },
  });

  const app8 = await prisma.application.create({
    data: {
      userId: user.id,
      companyName: 'Société Générale',
      position: 'Data Analyst Intern',
      jobType: 'STAGE',
      location: 'Paris',
      status: 'GHOSTED',
      applicationDate: new Date('2024-10-01'),
      notes: 'Aucune réponse après 2 mois et 2 relances',
    },
  });

  console.log('✅ Applications created');

  // Create events for applications
  await prisma.applicationEvent.createMany({
    data: [
      {
        applicationId: app1.id,
        type: 'STATUS_CHANGE',
        description: 'Candidature envoyée',
        createdAt: new Date('2024-11-15'),
      },
      {
        applicationId: app1.id,
        type: 'STATUS_CHANGE',
        description: 'Entretien planifié pour le 28/12',
        createdAt: new Date('2024-12-10'),
      },
      {
        applicationId: app2.id,
        type: 'STATUS_CHANGE',
        description: 'Candidature envoyée via le site carrières',
        createdAt: new Date('2024-12-01'),
      },
      {
        applicationId: app3.id,
        type: 'STATUS_CHANGE',
        description: 'Réponse négative reçue',
        createdAt: new Date('2024-11-15'),
      },
    ],
  });

  console.log('✅ Application events created');

  // Create reminders
  await prisma.reminder.createMany({
    data: [
      {
        userId: admin.id,
        applicationId: app1.id,
        title: 'Préparer entretien Google',
        description: 'Réviser les algorithmes et structures de données',
        type: 'INTERVIEW',
        dueDate: new Date('2024-12-27'),
        isCompleted: false,
      },
      {
        userId: admin.id,
        applicationId: app2.id,
        title: 'Relancer Doctolib',
        description: 'Envoyer un email de relance si pas de réponse',
        type: 'FOLLOW_UP',
        dueDate: new Date('2024-12-15'),
        isCompleted: false,
      },
      {
        userId: user.id,
        applicationId: app5.id,
        title: 'Relancer Datadog',
        type: 'FOLLOW_UP',
        dueDate: new Date('2024-12-20'),
        isCompleted: false,
      },
      {
        userId: user.id,
        title: 'Mettre à jour CV',
        description: 'Ajouter le projet récent',
        type: 'OTHER',
        dueDate: new Date('2024-12-22'),
        isCompleted: false,
      },
    ],
  });

  console.log('✅ Reminders created');

  // Create interview prep questions
  await prisma.interviewPrep.createMany({
    data: [
      {
        userId: admin.id,
        question: 'Parlez-moi de vous',
        answer: 'Je suis étudiant en dernière année d\'école d\'ingénieur, passionné par le développement logiciel...',
        category: 'BEHAVIORAL',
        notes: 'Structurer en 3 parties: parcours, compétences, motivation',
        isFavorite: true,
      },
      {
        userId: admin.id,
        question: 'Pourquoi voulez-vous rejoindre notre entreprise ?',
        answer: 'Votre entreprise m\'attire pour plusieurs raisons...',
        category: 'BEHAVIORAL',
        isFavorite: true,
      },
      {
        userId: admin.id,
        question: 'Décrivez un projet technique dont vous êtes fier',
        answer: 'J\'ai développé une application de gestion de candidatures...',
        category: 'TECHNICAL',
        isFavorite: false,
      },
      {
        userId: admin.id,
        question: 'Expliquez la différence entre une API REST et GraphQL',
        category: 'TECHNICAL',
        notes: 'REST: ressources, verbes HTTP. GraphQL: un endpoint, queries flexibles',
        isFavorite: false,
      },
      {
        userId: user.id,
        question: 'Comment gérez-vous le stress ?',
        answer: 'Je priorise mes tâches et je communique avec mon équipe...',
        category: 'BEHAVIORAL',
        isFavorite: true,
      },
      {
        userId: user.id,
        question: 'Racontez une situation où vous avez résolu un conflit',
        category: 'SITUATIONAL',
        notes: 'Utiliser la méthode STAR',
        isFavorite: false,
      },
    ],
  });

  console.log('✅ Interview prep questions created');

  // Create company reviews
  await prisma.companyReview.createMany({
    data: [
      {
        companyId: google.id,
        userId: admin.id,
        rating: 5,
        comment: 'Processus de recrutement très professionnel, équipes bienveillantes',
      },
      {
        companyId: doctolib.id,
        userId: admin.id,
        rating: 4,
        comment: 'Bonne ambiance startup, réponse rapide',
      },
    ],
  });

  console.log('✅ Company reviews created');

  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📧 Test accounts:');
  console.log('   admin@trackmyapps.com / password123');
  console.log('   user@trackmyapps.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
