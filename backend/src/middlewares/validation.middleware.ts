import { body } from 'express-validator';

const strongPassword = (field: string) =>
  body(field)
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/[A-Z]/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule')
    .matches(/[a-z]/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule')
    .matches(/[0-9]/)
    .withMessage('Le mot de passe doit contenir au moins un chiffre')
    .matches(/[^A-Za-z0-9]/)
    .withMessage('Le mot de passe doit contenir au moins un caractère spécial');

export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  strongPassword('password'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('Le prénom est requis'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis'),
];

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis'),
];

export const applicationValidation = [
  body('companyName')
    .trim()
    .notEmpty()
    .withMessage('Le nom de l\'entreprise est requis'),
  body('position')
    .trim()
    .notEmpty()
    .withMessage('Le poste est requis'),
  body('jobType')
    .isIn(['STAGE', 'ALTERNANCE', 'CDI', 'JOB_ETUDIANT'])
    .withMessage('Type de poste invalide'),
  body('location')
    .optional({ checkFalsy: true })
    .trim(),
];

export const updateStatusValidation = [
  body('status')
    .isIn(['DRAFT', 'SENT', 'VIEWED', 'INTERVIEW_SCHEDULED', 'AWAITING_RESPONSE', 'REJECTED', 'ACCEPTED', 'GHOSTED'])
    .withMessage('Statut invalide'),
];

export const documentValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom du document est requis'),
  body('type')
    .isIn(['CV', 'LETTRE_MOTIVATION', 'COVER_LETTER', 'PORTFOLIO', 'OTHER'])
    .withMessage('Type de document invalide'),
];

export const reminderValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Le titre est requis'),
  body('type')
    .isIn(['RELANCE', 'INTERVIEW_PREP', 'THANK_YOU_EMAIL', 'FOLLOW_UP', 'CUSTOM', 'INTERVIEW', 'DEADLINE', 'OTHER'])
    .withMessage('Type de rappel invalide'),
  body('dueDate')
    .isISO8601()
    .withMessage('Date de rappel invalide'),
  body('description')
    .optional()
    .trim(),
  body('applicationId')
    .optional({ checkFalsy: true })
    .isUUID()
    .withMessage('ID de candidature invalide'),
];

export const companyReviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('La note doit être entre 1 et 5'),
  body('position')
    .trim()
    .notEmpty()
    .withMessage('Le poste est requis'),
  body('wasHired')
    .isBoolean()
    .withMessage('Indiquez si vous avez été embauché'),
];

// Same email normalization as register/login so the lookup matches the stored address
export const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
];

export const resetPasswordValidation = [
  body('token')
    .isString()
    .notEmpty()
    .withMessage('Lien de réinitialisation invalide'),
  strongPassword('password'),
];

// A non-string token (e.g. {"not": ""}) would turn into a Prisma filter matching any user
export const verifyEmailValidation = [
  body('token')
    .isString()
    .notEmpty()
    .withMessage('Token requis'),
];

// Bounded inputs: everything sent to the simulator ends up in a (billed) Gemini prompt
export const interviewStartValidation = [
  body('interviewerType').isIn(['HR', 'MANAGER', 'TECHNICAL', 'CTO']).withMessage("Type d'interlocuteur invalide"),
  body('difficulty').isIn(['EASY', 'MEDIUM', 'HARD']).withMessage('Difficulté invalide'),
  body(['applicationId', 'cvId', 'lmId']).optional({ values: 'falsy' }).isUUID().withMessage('ID invalide'),
  body(['targetRole', 'contractType']).optional({ values: 'null' }).isString().isLength({ max: 200 })
    .withMessage('Champ trop long (200 caractères max)'),
  body('jobDescription').optional({ values: 'null' }).isString().isLength({ max: 10000 })
    .withMessage('Description du poste trop longue (10 000 caractères max)'),
];

// Google API keys are ~39 URL-safe characters ("AIza...")
export const geminiKeyValidation = [
  body('apiKey').isString().trim().matches(/^[A-Za-z0-9_-]{20,200}$/)
    .withMessage('Format de clé API invalide'),
];

export const interviewMessageValidation = [
  body('message').isString().trim().notEmpty().isLength({ max: 4000 })
    .withMessage('Message invalide (4 000 caractères max)'),
];
