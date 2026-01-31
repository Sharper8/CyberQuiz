# Configuration des Variables d'Environnement

## Structure des Fichiers .env

### 📁 Fichiers de Configuration

| Fichier | Usage | Gitignore | Description |
|---------|-------|-----------|-------------|
| `.env.example` | Template production | ✅ Commité | Template pour les variables de production |
| `.env.dev.example` | Template dev | ✅ Commité | Template pour les variables de développement |
| `.env` | **Production** | ❌ Ignoré | Variables de production (secrets sensibles) |
| `.env.dev` | **Développement** | ❌ Ignoré | Variables de développement (valeurs par défaut sûres) |

### 🔧 Utilisation

#### Développement Local

Le fichier `.env.dev` est utilisé par `docker-compose.dev.yml`:

```bash
# Démarrer en mode développement
docker compose -f docker-compose.dev.yml up -d
```

**Configuration par défaut:**
- Base de données: `postgresql://cyberquiz:changeme@localhost:5432/cyberquiz`
- Admin: `admin@cyberquiz.fr` / `password`
- Ollama: `http://localhost:11434`
- Qdrant: `http://localhost:6333`
- Node: `development`

#### Production

Le fichier `.env` est utilisé par `docker-compose.yml`:

```bash
# Démarrer en mode production
docker compose up -d
```

**⚠️ IMPORTANT:** Avant de déployer en production, créez `.env` depuis `.env.example` et modifiez:

1. **Secrets de sécurité:**
   ```bash
   JWT_SECRET=CHANGE_THIS_TO_RANDOM_SECRET_KEY_IN_PRODUCTION
   POSTGRES_PASSWORD=CHANGE_THIS_IN_PRODUCTION_STRONG_PASSWORD
   ADMIN_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
   ```

2. **URLs Docker:**
   - Base de données: `postgres:5432` (nom du service Docker)
   - Ollama: `http://ollama:11434` (nom du service Docker)
   - Qdrant: `http://qdrant:6333` (nom du service Docker)

3. **Configuration Admin:**
   ```bash
   ADMIN_EMAIL=admin@yourdomain.com
   ADMIN_PASSWORD=VotreMotDePasseForteEtSecurise
   ```

### 🔐 Sécurité

#### Fichiers à NE JAMAIS commiter:
- `.env` - Contient les secrets de production
- `.env.dev` - Peut contenir des clés API de développement

#### Fichiers à commiter:
- `.env.example` - Template pour la production
- `.env.dev.example` - Template pour le développement

### 📝 Exemple de Setup Initial

#### 1. Développement

```bash
# Copier le template de dev
cp .env.dev.example .env.dev

# Modifier si nécessaire (optionnel pour le dev local)
nano .env.dev

# Démarrer
docker compose -f docker-compose.dev.yml up -d
```

#### 2. Production

```bash
# Copier le template de prod
cp .env.example .env

# ⚠️ OBLIGATOIRE: Modifier les secrets
nano .env

# Changer ces valeurs:
# - JWT_SECRET
# - POSTGRES_PASSWORD
# - ADMIN_PASSWORD
# - ADMIN_EMAIL

# Démarrer
docker compose up -d
```

### 🚨 Checklist de Sécurité Production

- [ ] Modifier `JWT_SECRET` avec une valeur aléatoire forte (32+ caractères)
- [ ] Changer `POSTGRES_PASSWORD` (16+ caractères, alphanumérique + symboles)
- [ ] Définir un `ADMIN_PASSWORD` fort (12+ caractères)
- [ ] Mettre à jour `ADMIN_EMAIL` avec une adresse valide
- [ ] Vérifier que `NODE_ENV=production`
- [ ] Confirmer que les URLs utilisent les noms de services Docker (`postgres`, `ollama`, `qdrant`)
- [ ] Ne JAMAIS commiter le fichier `.env` de production

### 🔄 Migration Dev → Prod

Si vous avez développé localement et voulez déployer:

```bash
# 1. Créer .env pour la production
cp .env.example .env

# 2. Modifier les secrets (voir checklist ci-dessus)
nano .env

# 3. Arrêter le dev
docker compose -f docker-compose.dev.yml down

# 4. Démarrer la prod
docker compose up -d

# 5. Vérifier les logs
docker compose logs -f nextjs-app
```

### 📚 Variables Disponibles

| Variable | Description | Dev | Prod |
|----------|-------------|-----|------|
| `DATABASE_URL` | URL de connexion PostgreSQL | localhost:5432 | postgres:5432 |
| `POSTGRES_DB` | Nom de la base de données | cyberquiz | cyberquiz |
| `POSTGRES_USER` | Utilisateur PostgreSQL | cyberquiz | cyberquiz |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | changeme | **À CHANGER** |
| `JWT_SECRET` | Secret pour les tokens JWT | dev-secret | **À CHANGER** |
| `ADMIN_EMAIL` | Email admin | admin@cyberquiz.fr | **À CHANGER** |
| `ADMIN_PASSWORD` | Mot de passe admin | password | **À CHANGER** |
| `NODE_ENV` | Environnement Node | development | production |
| `OLLAMA_BASE_URL` | URL Ollama AI | localhost:11434 | ollama:11434 |
| `QDRANT_URL` | URL Qdrant vector DB | localhost:6333 | qdrant:6333 |
| `ALLOW_EXTERNAL_AI` | Autoriser APIs externes | false | false |

### 🎯 Notes Importantes

1. **Localhost vs Services Docker:**
   - En dev local: utilisez `localhost` pour accéder aux services depuis votre machine
   - En prod Docker: utilisez les noms de services (`postgres`, `ollama`, `qdrant`) pour la communication inter-conteneurs

2. **Gitignore:**
   - `.env` et `.env.dev` sont dans `.gitignore`
   - Seuls les fichiers `.example` sont versionnés

3. **Régénération de Secrets:**
   ```bash
   # Générer un JWT_SECRET aléatoire
   openssl rand -hex 32
   
   # Générer un mot de passe fort
   openssl rand -base64 24
   ```

4. **Sauvegarde:**
   - Sauvegardez votre `.env` de production dans un gestionnaire de secrets sécurisé
   - Ne partagez JAMAIS vos secrets dans Slack, email, ou code source
