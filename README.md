# SKULLVI Candidatures

Application web de recrutement : réception des candidatures, qualification automatique par un
score transparent, classement et suivi du statut. Mini-projet d'évaluation pour SKULLVI – GevConsulting.

- Application : _lien à ajouter après le déploiement_
- API : _lien à ajouter après le déploiement_

## Fonctionnalités

**Candidat**
- Formulaire de candidature (compétences à cocher + autres compétences, option « Autre » pour les études)
- Identifiant unique aléatoire (ex. `SKU2026-483920`) affiché après l'inscription (copier, télécharger, imprimer)
- Page de suivi `/suivi` : identifiant + email pour voir l'état (en cours d'évaluation, accepté, rejeté)

**Administrateur**
- Connexion sécurisée, dashboard (compteurs, meilleurs profils prioritaires)
- Liste des candidats : filtres (catégorie, statut, disponibilité, score minimum, recherche par nom, email ou identifiant), tri, pagination, rang global
- Détail d'un candidat avec décomposition du score et changement de statut
- Le super administrateur crée et supprime d'autres administrateurs

## Technologies

- Frontend : React, Vite, react-router-dom, axios, CSS
- Backend : Python, Django, Django REST Framework, django-cors-headers
- Base de données : SQLite
- Hébergement : Vercel (frontend), PythonAnywhere (backend)

## Structure

```
backend/    API Django REST (app « applications » : modèles, scoring, API, tests)
frontend/   Application React (pages, composants, appels API)
```

## Prérequis

Python 3.12+, Node.js 20+ et npm.

## Lancer le backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows : .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # Windows : copy .env.example .env
python manage.py migrate
python manage.py createsuperuser   # compte super administrateur
python manage.py seed_demo         # (optionnel) 5 candidatures de démonstration
python manage.py runserver         # http://127.0.0.1:8000
```

Variables d'environnement (`backend/.env`) :

| Variable | Rôle |
| --- | --- |
| `DJANGO_SECRET_KEY` | Clé secrète (obligatoire en production) |
| `DJANGO_DEBUG` | `True` en développement, `False` en production |
| `DJANGO_ALLOWED_HOSTS` | Hôtes autorisés, séparés par des virgules |
| `CORS_ALLOWED_ORIGINS` | Origine du frontend (ex. `http://localhost:5173`) |
| `CSRF_TRUSTED_ORIGINS` | Origines de confiance en HTTPS pour l'admin Django (optionnel) |

## Lancer le frontend

```bash
cd frontend
npm install
cp .env.example .env               # Windows : copy .env.example .env
npm run dev                        # http://localhost:5173
```

Variable (`frontend/.env`) : `VITE_API_URL=http://127.0.0.1:8000/api`

## Tests

```bash
cd backend && python manage.py test
cd frontend && npm run test
```

## Le scoring en bref

Score sur 100, calculé uniquement côté serveur et jamais montré au candidat :

| Critère | Points max |
| --- | --- |
| Compétences clés (5 points par compétence reconnue, plafonné) | 30 |
| Expérience (0 / 8 / 12 / 16 / 20 selon les années) | 20 |
| Études (Bac 4, Bac+2 8, Bac+3 11, Bac+5 15, Autre 4) | 15 |
| Preuves de travail (GitHub 5, portfolio 4, projets décrits 6) | 15 |
| Disponibilité | 10 |
| Motivation (selon la longueur) | 10 |

- **Profil prioritaire** : score de 70 ou plus et au moins 3 compétences clés reconnues
- **À examiner** : de 40 à 69, ou 70 et plus sans les 3 compétences clés
- **Faible priorité** : moins de 40
- À score égal, la candidature la plus ancienne passe devant.
- Le barème est dans `backend/applications/scoring_config.py`. Après modification :
  `python manage.py rescore`

## API (résumé)

## Choix techniques

- Scoring = fonction pure + configuration : déterministe, testable, explicable.
- Score et statut jamais saisis par le candidat ; le suivi public exige identifiant **et** email,
  avec une réponse identique si l'un des deux est faux.
- Identifiants aléatoires (module `secrets`) pour qu'ils ne se devinent pas.
- SQLite : zéro configuration ; passage à PostgreSQL possible via `DATABASES`.
- JavaScript plutôt que TypeScript : projet court, validation faite côté API.

## Limites actuelles

- Le barème des compétences clés est orienté profils techniques ; la gestion de postes avec leurs
  propres compétences est prévue.
- Token d'authentification sans expiration, stocké dans le navigateur.
- Pas d'envoi d'email, pas de dépôt de CV.
- Pas de filtre par compétence (limite de SQLite sur le JSON).

## Améliorations prévues

Gestion des postes, notes internes, export CSV, email de confirmation, JWT à durée courte,
PostgreSQL et Docker, tests de bout en bout.