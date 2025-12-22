import { body, param, query } from 'express-validator';

export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
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
    .trim()
    .notEmpty()
    .withMessage('La localisation est requise'),
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
    .isIn(['CV', 'LETTRE_MOTIVATION'])
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

export const uuidValidation = [
  param('id')
    .isUUID()
    .withMessage('ID invalide'),
];
