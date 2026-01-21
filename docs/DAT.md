# Dossier d'Architecture Technique (DAT) — CyberQuiz

Version: draft
Date: 2026-01-21
Auteur: Audit automatique / à compléter

---

## 1. Objectif
Ce document présente l'architecture technique cible (dev/prod), les flux réseau, les contrôles de sécurité attendus et les hypothèses à valider par l'équipe GODAGA. Il sert de base pour l'atelier EBIOS RM et pour l'intégration opérationnelle.

## 2. Périmètre
- Application : CyberQuiz (Next.js front + API)
- Services inclus : `nextjs-app`, `postgres`, `qdrant`, `ollama`, `pgadmin`
- Environnements : développement (fichiers `docker-compose.dev.yml`, `.env.dev`) et production (fichiers `docker-compose.yml`, `.env`)

Remarque : les valeurs observées dans le repo sont des configurations de développement — toute exposition réseau en production doit être validée.

## 3. Vue d'ensemble de l'architecture
- Frontend / API : Next.js (container `nextjs-app`)
- Base de données relationnelle : PostgreSQL (container `postgres`)
- Vector DB : Qdrant (container `qdrant`)
- Moteur LLM local : Ollama (container `ollama`)
- Administration DB : PgAdmin (container `pgadmin`)
- Réseau docker : `cyberquiz-network` (bridge)
- Volumes persistants : Postgres, Qdrant, Ollama, PgAdmin

Diagramme logique: (à dessiner / importer dans DAT final)
- Utilisateurs → Reverse-proxy → `nextjs-app`
- `nextjs-app` → `postgres`, `qdrant`, `ollama`
- Ops → PgAdmin → `postgres`

> Hypothèse principale (À VALIDER): en production, les services ne sont pas directement exposés à l'hôte ; un reverse-proxy (ou ingress) et règles ACL contrôlent l'accès.

## 4. Matrice de flux réseau (extrait et hypothèses)
Voir le fichier de référence [docs/matrice_flux.md](docs/matrice_flux.md).

Ci-dessous les flux essentiels avec statut "À VALIDER" lorsqu'une donnée prod manque.

- F01 — `nextjs-app` → `postgres`
  - Port: 5432 (Postgres)
  - Protocole: TCP/Postgres
  - Auth: credentials via env (`DATABASE_URL`) — À VALIDER pour prod (Vault ?)
  - Encryption: none in dev; en prod **TLS required** — À VALIDER
  - Exposure: internal (doit rester interne) — À VALIDER

- F02 — `pgadmin` ↔ `postgres`
  - Port: 5050 (host) → 80 (pgadmin) et 5432
  - Usage: administration DB
  - Risk: accès administratif exposé en dev — en prod **doit être restreint**

- F03 — `nextjs-app` → `qdrant`
  - Port: 6333 (HTTP) / 6334 (gRPC)
  - Auth: inconnue (API key ou autre) — À VALIDER
  - Encryption: none in dev; en prod **TLS recommended** — À VALIDER
  - Usage: stockage/lecture d'embeddings

- F04 — `nextjs-app` → `ollama`
  - Port: 11434 (HTTP)
  - Usage: envoi de prompts, réception de réponses (LLM inference)
  - Risques: fuite de PII via prompts, retention/logging des prompts dans Ollama — À VALIDER
  - Auth/chiffrement: À VALIDER (mTLS / API key / internal-only)

- F05 — Host dev → services exposés (3333,5432,6333,11434,5050)
  - Remarque: en dev ces ports sont publiquement mappés sur l'hôte; en prod ils doivent être derrière un proxy et non exposés directement.

## 5. Secrets & gestion des identifiants
- Observé: `.env.dev` contient `JWT_SECRET`, DB credentials et `ADMIN_PASSWORD` (dev placeholders) — **inacceptable en production**.
- Attendu en prod (À VALIDER): utilisation d'un gestionnaire de secrets (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault ou équivalent), rotation, et accès via IAM/roles ou secrets mounted at runtime.
- Points d'action: interdire les secrets en clair dans les repo, ajouter scans SCA/secret-detection dans CI.

## 6. Contrôles de sécurité recommandés (synthèse)
- Network segmentation: séparer ingress layer et services internes, bloquer egress non-justifié.
- TLS everywhere: API → services (Postgres, Qdrant, Ollama) en TLS, certs gérés par infra.
- Auth inter-services: API keys ou JWT + scopes, envisager mTLS pour services sensibles (DB admins, IA).
- Least privilege: comptes DB/roles limités aux besoins des services.
- Secrets: vault + policies, pas d'env files en prod.
- Image hardening: base images minimales, scans CVE en CI, image signing.
- Logging & monitoring: centralisation (ELK/Datadog/Prometheus+Grafana), audit trails, SIEM.
- Backup & restore: sauvegardes régulières Postgres et Qdrant, tests RTO/RPO.
- Privacy/PII: filtrage/masquage avant envoi à l'IA; politique de conservation des prompts (retention zéro par défaut) — À VALIDER.

## 7. Déploiement & CI/CD
- Observé: repo contient `Dockerfile` et `docker-compose` définitions.
- Recommandé (À VALIDER): pipelines CI (GitHub Actions/GitLab CI) pour build->scan->push images; déploiement via orchestration (Kubernetes / docker-compose en VM) selon l'infra.
- Jobs CI recommandés: linter, tests, SCA (dependabot/ou équivalent), secret-scan, container-scan, déploiement canari.

## 8. Observabilité & opérations
- Logs applicatifs envoyés vers central (format JSON), metrics exposées (Prometheus), alerting pour erreurs et délais.
- Healthchecks: Postgres et Ollama healthchecks observés dans `docker-compose.dev.yml` — conserver et intégrer probes en prod.

## 9. Sauvegardes & résilience
- Postgres: dumps réguliers exportés vers stockage sécurisé (S3/GCS) + point-in-time recovery si nécessaire.
- Qdrant: snapshot de stockage vectoriel selon fréquence d'écriture.
- Ollama: modèles et artefacts sur volume persistant; prévoir orchestration pour réinstallation et politique de déploiement des modèles.

## 10. Gouvernance & accès
- Admins: liste des comptes admin (ex: `ADMIN_EMAIL` présent en dev) — À VALIDER
- Accès console/infra: 2FA/SSO obligatoire pour accès production.
- RBAC: définir rôles pour accès DB, administration modèle IA, support.

## 11. Scénarios d'attaque et mesures mitigantes (résumé)
- Exfiltration via prompts: filtrage, tokenisation, redaction, et logging contrôlé.
- Compromission image container: scanning + image signing.
- Accès non autorisé à DB: firewall, réseau interne, MFA et rotation credentials.

## 12. Hypothèses et éléments « À VALIDER » (liste condensée)
- La topologie réseau prod (existence d'un reverse-proxy/ingress, LB, VPC/subnets).
- Méthode de gestion des secrets en prod.
- Chiffrement en transit entre `nextjs-app` et services (Postgres, Qdrant, Ollama).
- Authentification inter-services (API keys, JWT, mTLS).
- Politique de retention et logging des prompts envoyés à Ollama.
- Exposition publique des services (liste exacte des ports ouverts en prod).
- Processus CI/CD et locations des images (registry privé/public).

## 13. Questions à adresser à GODAGA (prioritaires)
1. En prod, comment sont exposés les services ? reverse-proxy/ingress utilisé ? domaines et certificats gérés par qui ?
2. Où sont stockés les secrets en prod ? Existe-t-il un Vault ou des env files montés ?
3. Quelle est la politique de chiffrement en transit : TLS obligatoire entre services ? mTLS ?
4. Ollama : quels modèles sont déployés en prod ? Logs/retention des prompts ? Politique d’accès aux modèles ?
5. Qdrant : auth activée en prod ? snapshots et backup policy ?
6. CI/CD : pipeline existant (GitHub Actions / GitLab / autre) et contrôle d'images (scan, signing) ?
7. Liste des comptes admin et procédure d'onboarding/offboarding.
8. Règles egress autorisées (régles firewall, accès Internet depuis containers).

## 14. Pièces jointes & références
- [Matrice de flux](/docs/matrice_flux.md)
- `docker-compose.dev.yml`, `.env.dev`, `docker-compose.yml`, `.env`
- Terraform / infra docs: **À FOURNIR**

## 15. Prochaines étapes (plan d'action)
- GODAGA: répondre aux questions de la section 13 et fournir diagramme infra prod.
- Compléter DAT avec schémas réseau, règles firewall, plans de secours.
- Automatiser l'extraction de la matrice de flux et ajouter job CI pour validation.
- Préparer atelier EBIOS RM avec la matrice complétée et les scénarios métiers.

---

*Fin du draft DAT — remplir les sections marquées "À VALIDER" avec l'équipe infra/GODAGA avant l'atelier EBIOS RM.*
