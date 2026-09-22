# 🚀 Roadmap Produit & Tickets de Sprint — TrackMyApps
> **Vision :** Transformer TrackMyApps en un SaaS fluide, ultra-rapide et centré sur l'action quotidienne de l'étudiant/candidat, en éliminant les frictions inutiles et en magnifiant les fonctionnalités à forte valeur ajoutée (Simulateur IA, Relances intelligentes).

---

## 🧭 Vue d'ensemble des Sprints

```
┌────────────────────────────────────────────────────────────────────────┐
│ SPRINT 1 : Nettoyage ergonomique & Allègement du Kanban (P0)          │
│ • Simplification navigation (9 ➔ 5 onglets)                            │
│ • Kanban condensé (8 ➔ 5 colonnes max, fin du scroll horizontal)      │
│ • Suppression de l'onglet "Entreprises" et des modales anxiogènes      │
│ • Formulaire d'ajout rapide (3 champs essentiels)                      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ SPRINT 2 : Décloisonnement des Rappels & Workflow Candidature 360°     │
│ • Création de rappels directement liés aux candidatures                │
│ • Suggéreur automatique de relance à J+7                               │
│ • Journal de debriefing post-entretien dans la Fiche 360°              │
│ • Fusion Calendrier & Rappels                                          │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ SPRINT 3 : Simulateur IA "Killer Feature" & Traçabilité Documents      │
│ • Débriefing & Scoring IA après chaque simulation d'entretien          │
│ • Entraînement libre (sans candidature obligatoire)                    │
│ • Export d'une question de simulation vers la Banque de questions      │
│ • Traçabilité inverse des CV et Lettres envoyés                        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ SPRINT 4 : Cockpit Dashboard, Analytics Utiles & Finitions UX          │
│ • Dashboard orienté "Plan d'action du jour"                            │
│ • Analytics réalistes pour petits volumes de candidatures              │
│ • Export / Synchronisation calendrier iCal (.ics)                      │
│ • Polish mobile, onboarding & micro-interactions                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

# 📦 SPRINT 1 : Nettoyage ergonomique, allègement du Kanban & suppression des frictions

> **Objectif du sprint :** Éliminer la surcharge mentale, stopper le défilement horizontal pénible et rendre la saisie d'une candidature 3 fois plus rapide.

---

### [TICK-101] Simplification de la navigation principale (Sidebar & Mobile)
* **Type :** Refactoring UX / Navigation
* **Priorité :** P0 (Critique)
* **Estimation :** 2 jours
* **Écrans impactés :** `Sidebar.tsx`, `BottomNav.tsx`, `App.tsx`

#### User Story
> En tant qu'utilisateur, je veux un menu épuré avec uniquement les rubriques essentielles pour ne pas me disperser entre des onglets secondaires.

#### Spécifications fonctionnelles & Critères d'acceptation (DoD)
- [x] Réduire la navigation principale de 9 onglets à 5 onglets prioritaires :
  1. **Tableau de bord** (`/`)
  2. **Candidatures** (`/applications`)
  3. **Relances & Agenda** (`/reminders`) *(fusionné avec Calendrier)*
  4. **Entraînement IA** (`/interview-prep`)
  5. **Documents** (`/documents`)
- [x] Retirer l'onglet **Entreprises** (`/companies`) de la barre latérale.
- [x] Conserver l'accès aux **Paramètres** (`/settings`) dans le pied de barre latérale (profil utilisateur).
- [x] La navigation mobile (`BottomNav.tsx`) doit refléter exactement ces 4-5 onglets clés sans sous-menus cachés.

---

### [TICK-102] Refonte du pipeline Kanban de 8 à 5 colonnes max
* **Type :** Refactoring UX / Core Product
* **Priorité :** P0 (Critique)
* **Estimation :** 3 jours
* **Écrans impactés :** `Applications.tsx`, `labels.ts`, schéma de données

#### User Story
> En tant que candidat, je veux visualiser toutes mes candidatures sur un seul écran sans scroller horizontalement sur 2500 pixels, et sans hésiter entre des statuts redondants.

#### Spécifications fonctionnelles & Critères d'acceptation (DoD)
- [x] Remplacer les 8 colonnes actuelles par 5 colonnes claires et réalistes :
  1. **Brouillon** (`DRAFT`) : offres repérées mais pas encore postulées.
  2. **Envoyée** (`SENT`) : candidature transmise, regroupe `SENT` et `VIEWED`.
  3. **Entretien** (`INTERVIEW_SCHEDULED`) : processus en cours (regroupe `INTERVIEW_SCHEDULED` et `AWAITING_RESPONSE`).
  4. **Acceptée** (`ACCEPTED`) : proposition ou offre reçue/acceptée.
  5. **Refusée / Sans réponse** (`REJECTED`) : regroupement des refus et des absences de réponse (`GHOSTED`).
- [x] **Regrouper le statut `VIEWED` (Vue) dans "Envoyée" :** affichage sous forme d'étiquette discrète "Vue" sur la carte sans colonne dédiée inutile.
- [x] Fusionner `REJECTED`, `GHOSTED` et `AWAITING_RESPONSE` dans les colonnes cibles avec sous-motifs discrets ("Sans réponse", "En attente").
- [x] Adapter la largeur des colonnes sur desktop pour qu'elles tiennent sur un écran standard 13-15 pouces sans scroll horizontal forcé (`xl:w-auto xl:flex-1 min-w-[210px]`).
- [x] Mapper les statuts vers les 5 colonnes canoniques sans perte d'information (`groupApplicationsForKanban`, `resolveDropStatus`).

---

### [TICK-103] Formulaire de saisie express de candidature (Quick Add)
* **Type :** Amélioration UX / Conversion
* **Priorité :** P1 (Important)
* **Estimation :** 1.5 jour
* **Écrans impactés :** `ApplicationForm.tsx`, `Dashboard.tsx`, `Applications.tsx`

#### User Story
> En tant qu'étudiant qui postule à 10 offres d'affilée, je veux ajouter une candidature en moins de 15 secondes sans devoir renseigner 8 champs obligatoires.

#### Spécifications fonctionnelles & Critères d'acceptation (DoD)
- [x] Réduire les champs obligatoires à **2 seuls champs** :
  - **Entreprise** (avec auto-complétion `<datalist>` sur les entreprises déjà enregistrées).
  - **Poste**.
- [x] Type de contrat & Statut accessibles directement en 2 sélecteurs rapides.
- [x] Rendre la localisation optionnelle (avec valeur par défaut `'Non précisée'` si omise).
- [x] Tous les autres champs (*Localisation*, *URL*, *Rémunération*, *Description*, *Notes*) deviennent optionnels et repliés sous le volet "Détails complémentaires (optionnel)".
- [x] Dépliage automatique en cas d'erreur de validation dans un champ replié.

---

### [TICK-104] Suppression de la modale anxiogène "Supprimer l'entreprise"
* **Type :** Nettoyage UX
* **Priorité :** P1 (Important)
* **Estimation :** 0.5 jour
* **Écrans impactés :** `Applications.tsx`, `ApplicationDetail.tsx`

#### User Story
> En tant qu'utilisateur, quand je supprime une candidature, je veux que seule la candidature soit supprimée, sans qu'on me pose de questions complexes sur la suppression de l'entreprise associée.

#### Spécifications fonctionnelles & Critères d'acceptation (DoD)
- [x] Supprimer le choix double *"Supprimer la candidature et l'entreprise"* vs *"Supprimer uniquement la candidature"*.
- [x] Remplacer par une confirmation simple et directe : *"Supprimer cette candidature chez [Entreprise] (poste : ...) ?"*.
- [x] Conserver l'entreprise en base en arrière-plan sans avertissement technique.

---

# 📦 SPRINT 2 : Décloisonnement des Rappels & Workflow Candidature 360°

> **Objectif du sprint :** Créer un pont naturel entre candidatures et rappels, automatiser les relances à J+7 et offrir un vrai espace de travail post-entretien.

---

### [TICK-201] Association obligatoire / intuitive d'une candidature aux rappels
* **Type :** Correction UX / Feature
* **Priorité :** P0 (Bloquant)
* **Estimation :** 2 jours
* **Écrans impactés :** `Reminders.tsx`, `reminders.service.ts`

#### User Story
> En tant que candidat, je veux pouvoir lier un rappel à une entreprise/candidature précise depuis la page Rappels pour savoir immédiatement qui relancer.

#### Spécifications fonctionnelles & Critères d'acceptation (DoD)
- [x] Ajouter un sélecteur de candidature dans la modale de création d'un rappel (`Reminders.tsx`).
- [x] Champ de recherche rapide dans la liste déroulante des candidatures actives.
- [x] Si le rappel est rattaché à une candidature :
  - Afficher le logo/initiale, le nom de l'entreprise et le poste sur la carte du rappel.
  - Ajouter un bouton d'accès rapide direct vers la fiche de la candidature.
- [x] Conserver la possibilité d'ajouter un rappel "général" (non rattaché) pour les démarches globales (ex. "Mettre à jour mon profil LinkedIn").

---

### [TICK-202] Suggéreur automatique de relance à J+7 (Smart Follow-up)
* **Type :** Feature à forte valeur ajoutée
* **Priorité :** P0 (Différenciateur SaaS)
* **Estimation :** 2.5 jours
* **Écrans impactés :** `Applications.tsx`, `ApplicationDetail.tsx`, `Dashboard.tsx`

#### User Story
> En tant qu'étudiant souvent débordé, je veux que l'application me propose automatiquement de relancer un recruteur au bout de 7 à 10 jours ouvrés sans que j'aie à y penser.

#### Spécifications fonctionnelles & Critères d'acceptation (DoD)
- [x] Lors du passage d'une candidature au statut **Envoyée** :
  - Afficher un toast/notification discrète : *"Planifier une relance pour le [Date J+7] ? [Oui, planifier] [Non merci]"*.
- [x] Si l'utilisateur clique sur "Oui", le rappel est créé automatiquement avec le titre *"Relancer [Nom Entreprise]"* et la date d'échéance calculée.
- [x] Sur le Dashboard et dans l'onglet Rappels, mettre en avant une pastille *"3 relances suggérées cette semaine"*.
- [x] Fournir un bouton *"Copier un email type de relance"* avec des modèles professionnels et polis adaptés aux stages et alternances.

---

### [TICK-203] Refonte de la Fiche Candidature 360° : Journal d'échanges & debriefings
* **Type :** Refactoring UX / Amélioration
* **Priorité :** P1 (Important)
* **Estimation :** 2 jours
* **Écrans impactés :** `ApplicationDetail.tsx`

#### User Story
> En tant que candidat en processus d'entretien, je veux noter mes comptes-rendus d'échanges étape par étape (RH, tech, manager) plutôt que dans un seul champ texte fourre-tout.

#### Spécifications fonctionnelles & Critères d'acceptation (DoD)
- [x] Supprimer ou réduire drastiquement l'onglet "Timeline / Historique technique" au profit d'un **Journal de bord**.
- [x] Remplacer le bloc "Notes personnelles" unique par un système de notes horodatées ou d'étapes d'entretiens :
  - Date de l'échange.
  - Type (Call téléphonique, Entretien Visio, Test technique, Rencontre physique).
  - Nom / LinkedIn de l'interlocuteur.
  - Points abordés & questions posées.
  - Ressenti / Prochaine étape promise.
- [x] Bouton d'action directe : **"+ Ajouter un rappel pour cette offre"** directement depuis le widget Rappels de la fiche.

---

### [TICK-204] Fusion de l'onglet Calendrier dans l'espace "Rappels & Agenda"
* **Type :** Refactoring UX / Fusion d'écrans
* **Priorité :** P1 (Important)
* **Estimation :** 2 jours
* **Écrans impactés :** `Reminders.tsx`, `Calendar.tsx`, `Sidebar.tsx`

#### User Story
> En tant qu'utilisateur, je veux retrouver mon calendrier et mes rappels au même endroit via un sélecteur de vue (Liste / Calendrier) plutôt que de basculer entre deux onglets différents.

#### Spécifications fonctionnelles & Critères d'acceptation (DoD)
- [x] Regrouper les routes `/reminders` et `/calendar` sous un onglet unifié : **Relances & Agenda**.
- [x] Sélecteur de vue en haut de page : **[Vue Liste] [Vue Calendrier]**.
- [x] Dans la vue calendrier, afficher **uniquement les échéances futures utiles** (entretiens fixés, relances programmées), et ne plus afficher l'historique des envois de candidatures qui surchargeait les cases.

---

# 📦 SPRINT 3 : Simulateur IA "Killer Feature" & Traçabilité Documents

> **Objectif du sprint :** Transformer le simulateur d'entretien en coach d'élite avec débriefing complet et connecter les documents aux opportunités.

---

### [TICK-301] Rapport de débriefing & scoring post-simulation IA
* **Type :** Killer Feature / Rétention & Valeur
* **Priorité :** P0 (Argument de conversion payant)
* **Estimation :** 3 jours
* **Écrans impactés :** `InterviewSimulation.tsx`, Backend AI service

#### User Story
> En tant que candidat qui vient de simuler un entretien vocal ou écrit, je veux recevoir une analyse constructive de mes réponses avec mes points forts et mes axes d'amélioration.

#### Spécifications fonctionnelles & Critères d'acceptation (DoD)
- [x] Ajouter un bouton explicite **"Terminer l'entretien & Obtenir mon bilan"**.
- [x] À la clôture, l'IA génère un rapport structuré :
  - **Score global** (/10 ou /100) basé sur la pertinence, la clarté et l'adéquation au poste.
  - **3 Points forts relevés** (ex. "Bonne structuration STAR sur le projet technique").
  - **3 Axes d'amélioration concrets** (ex. "Réponse trop vague sur la gestion des conflits").
  - **Une reformulation idéale** pour la question où le candidat a le plus hésité.
- [x] Sauvegarder ce bilan dans l'historique de la session pour pouvoir mesurer sa progression.

---

### [TICK-302] Mode "Entraînement Libre" sans candidature pré-existante
* **Type :** Feature UX
* **Priorité :** P1 (Important)
* **Estimation :** 1.5 jour
* **Écrans impactés :** `InterviewPrep.tsx`, `InterviewSimulation.tsx`

#### User Story
> En tant qu'étudiant qui veut juste s'échauffer, je veux lancer une simulation d'entretien pour un métier cible sans devoir créer au préalable une fausse candidature dans mon tableau.

#### Spécifications fonctionnelles & Critères d'acceptation (DoD)
- [x] Dans l'onglet **Entraînement IA**, ajouter l'option *"Entraînement libre"* à côté de *"Lier à une candidature"*.
- [x] En mode libre, l'utilisateur saisit simplement :
  - L'intitulé du poste visé (ex. "Développeur Full-Stack Junior").
  - Le type de contrat (Stage / Alternance / CDI).
  - Facultatif : coller un extrait de fiche de poste ou choisir un secteur.
- [x] L'entretien démarre instantanément sans pré-requis.

---

### [TICK-303] Passerelle en 1 clic entre Simulation IA et Banque de questions
* **Type :** Feature UX / Décloisonnement
* **Priorité :** P1 (Important)
* **Estimation :** 1 jour
* **Écrans impactés :** `InterviewSimulation.tsx`, `InterviewPrep.tsx`

#### User Story
> En tant que candidat, quand l'IA me pose une excellente question d'entretien, je veux pouvoir l'ajouter à ma banque de questions en 1 clic pour réviser ma réponse plus tard.

#### Spécifications fonctionnelles & Critères d'acceptation (DoD)
- [x] Sur chaque message de question posée par l'IA, ajouter un bouton discret : **"⭐ Sauvegarder dans ma banque"**.
- [x] Au clic, la question est pré-remplie dans la banque de questions avec la catégorie suggérée (Technique, Comportemental, etc.).
- [x] Si le candidat a déjà répondu dans le chat, sa réponse est également pré-remplie pour qu'il puisse la peaufiner.

---

### [TICK-304] Traçabilité inverse des CV et Lettres de motivation
* **Type :** Feature UX / Valeur ajoutée
* **Priorité :** P1 (Important)
* **Écrans impactés :** `Documents.tsx`

#### User Story
> En tant que candidat ayant plusieurs versions de CV, je veux voir en un coup d'œil quelles candidatures utilisent chaque CV pour mesurer quelle version génère le plus d'entretiens.

#### Spécifications fonctionnelles & Critères d'acceptation (DoD)
- [x] Sur chaque carte de document dans l'onglet **Documents**, afficher :
  - Le compteur d'utilisation : *"Utilisé dans X candidatures"*.
  - Un badge cliquable affichant la liste des entreprises concernées (ex. *Airbus, Qonto, Doctolib*).
- [x] Nettoyage des libellés internes : unifier définitivement `COVER_LETTER` et `LETTRE_MOTIVATION`.

---

# 📦 SPRINT 4 : Cockpit Dashboard, Analytics Utiles & Finitions UX

> **Objectif du sprint :** Rendre le Dashboard ultra-opérationnel, adapter les analytics à la réalité étudiante et peaufiner les finitions SaaS.

---

### [TICK-401] Refonte du Dashboard orienté "Plan d'action du jour"
* **Type :** Refactoring UX
* **Priorité :** P1 (Important)
* **Estimation :** 2 jours
* **Écrans impactés :** `Dashboard.tsx`

#### User Story
> En tant qu'étudiant ouvrant l'application le matin, je veux savoir immédiatement ce que je dois faire aujourd'hui et ne pas être distrait par des graphiques superflus.

#### Spécifications fonctionnelles & Critères d'acceptation (DoD)
- [x] Supprimer la grille des 8 statuts en bas de page.
- [x] Réorganiser les 4 compteurs clés du haut :
  1. **Candidatures actives** (en cours).
  2. **Relances à effectuer aujourd'hui** (alerte si > 0).
  3. **Prochain entretien** (Jours restants / Date).
  4. **Offres / Réponses positives**.
- [x] Supprimer le "taux de réponse" basé sur le statut "Vue".
- [x] Mettre en avant le CTA rapide : *"Nouvelle opportunité"* et *"Lancer un entraînement rapide"*.

---

### [TICK-402] Révision bienveillante des Statistiques & petits volumes
* **Type :** Amélioration UX / Psychologie
* **Priorité :** P2 (Confort)
* **Estimation :** 1.5 jour
* **Écrans impactés :** `Analytics.tsx`

#### User Story
> En tant que candidat ayant envoyé 5 ou 10 candidatures, je veux un écran de statistiques encourageant plutôt que des graphiques vides ou des alertes négatives.

#### Spécifications fonctionnelles & Critères d'acceptation (DoD)
- [x] Gérer un **état initial valorisant** si le nombre de candidatures est < 10 :
  - Remplacer les courbes temporelles plates par un message d'encouragement dynamique : *"Vous débutez votre recherche. Continuez à cibler vos offres clés pour voir vos tendances se dessiner !"*.
- [x] Supprimer les alertes automatisées moralisatrices (du type *"Votre taux est bas, adaptez votre CV"*).
- [x] Conserver l'entonnoir de conversion simple : *Envoyées ➔ Entretiens ➔ Offres*.

---

### [TICK-403] Export & Synchronisation calendrier iCal (.ics)
* **Type :** Feature de confort
* **Priorité :** P2 (Confort)
* **Estimation :** 1.5 jour
* **Écrans impactés :** `Settings.tsx`, `Reminders.tsx`, Backend Calendar API

#### User Story
> En tant qu'étudiant gérant son emploi du temps sur son smartphone, je veux pouvoir synchroniser mes entretiens TrackMyApps dans Google Agenda ou Apple Calendar.

#### Spécifications fonctionnelles & Critères d'acceptation (DoD)
- [x] Générer un lien de flux iCal privé (`.ics`) ou un bouton de téléchargement d'événement pour chaque entretien/rappel.
- [x] Permettre d'ajouter en 1 clic un entretien à Google Calendar / Outlook via un lien d'URL formaté.

---

## 📊 Matrice d'effort et priorisation (Backlog Overview)

| Ticket | Titre synthétique | Sprint | Priorité | Effort estimé |
| :--- | :--- | :---: | :---: | :---: |
| **TICK-101** | Réduction navigation (9 ➔ 5 onglets) & retrait Entreprises | **Sprint 1** | **P0** | 2 j |
| **TICK-102** | Refonte Kanban (8 ➔ 5 colonnes max sans scroll) | **Sprint 1** | **P0** | 3 j |
| **TICK-103** | Formulaire d'ajout express (Quick Add) | **Sprint 1** | **P1** | 1.5 j |
| **TICK-104** | Suppression modale anxiogène suppression entreprise | **Sprint 1** | **P1** | 0.5 j |
| **TICK-201** | Liaison obligatoire / claire Candidature ➔ Rappel | **Sprint 2** | **P0** | 2 j |
| **TICK-202** | Suggéreur automatique de relance J+7 | **Sprint 2** | **P0** | 2.5 j |
| **TICK-203** | Fiche 360° : Journal d'échanges & debriefings post-entretien | **Sprint 2** | **P1** | 2 j |
| **TICK-204** | Fusion Calendrier & Rappels sous un onglet unique | **Sprint 2** | **P1** | 2 j |
| **TICK-301** | Débriefing & Scoring IA post-simulation d'entretien | **Sprint 3** | **P0** | 3 j |
| **TICK-302** | Mode Entraînement Libre IA sans offre requise | **Sprint 3** | **P1** | 1.5 j |
| **TICK-303** | Passerelle 1-clic Simulation IA ➔ Banque de questions | **Sprint 3** | **P1** | 1 j |
| **TICK-304** | Traçabilité inverse CV/Lettres ➔ Candidatures | **Sprint 3** | **P1** | 1 j |
| **TICK-401** | Dashboard orienté Plan d'action du jour | **Sprint 4** | **P1** | 2 j |
| **TICK-402** | Statistiques bienveillantes & gestion petits volumes | **Sprint 4** | **P2** | 1.5 j |
| **TICK-403** | Export / Synchronisation calendrier iCal (.ics) | **Sprint 4** | **P2** | 1.5 j |

---
*Document généré par un Product Engineer Senior pour TrackMyApps. Prêt à être déployé et découpé dans votre gestionnaire de tickets (GitHub Projects, Linear ou Jira).*
