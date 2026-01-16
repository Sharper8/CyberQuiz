# API Export/Import des Questions

## Authentification

Tous les endpoints requièrent une authentification admin via JWT token.

Le token est stocké dans un cookie HTTP-only `auth-token`.

## Endpoints

### 1. Export des Questions

**Endpoint** : `GET /api/admin/questions/export`

**Paramètres de query** :
- `format` (requis) : `"csv"` ou `"xlsx"`
- `status` (optionnel) : `"all"` | `"accepted"` | `"to_review"` | `"rejected"` (défaut: `"all"`)

**Réponse** :
- HTTP 200 : Fichier en tant que blob
- HTTP 400 : Format invalide
- HTTP 401 : Non authentifié
- HTTP 500 : Erreur serveur

**Exemples** :

```bash
# Exporter toutes les questions en CSV
curl -b "auth-token=YOUR_TOKEN" \
  -o questions.csv \
  "http://localhost:3000/api/admin/questions/export?format=csv"

# Exporter uniquement les questions acceptées en Excel
curl -b "auth-token=YOUR_TOKEN" \
  -o accepted.xlsx \
  "http://localhost:3000/api/admin/questions/export?format=xlsx&status=accepted"

# Exporter les questions en attente en CSV
curl -b "auth-token=YOUR_TOKEN" \
  -o pending.csv \
  "http://localhost:3000/api/admin/questions/export?format=csv&status=to_review"
```

### 2. Import des Questions

**Endpoint** : `POST /api/admin/questions/import`

**Content-Type** : `multipart/form-data`

**Body** :
- `file` (requis) : Fichier CSV

**Réponse** :
```json
{
  "imported": 5,
  "importedIds": [1, 2, 3, 4, 5],
  "errors": [
    {
      "row": 7,
      "error": "Question already exists (duplicate detected)"
    }
  ],
  "total": 6,
  "message": "Successfully imported 5 questions (1 errors)"
}
```

**Status codes** :
- HTTP 200 : Au moins une question importée
- HTTP 400 : Aucune question importée ou format invalide
- HTTP 401 : Non authentifié
- HTTP 500 : Erreur serveur

**Exemples** :

```bash
# Importer des questions
curl -b "auth-token=YOUR_TOKEN" \
  -F "file=@questions.csv" \
  http://localhost:3000/api/admin/questions/import

# Avec gestion du résultat
curl -b "auth-token=YOUR_TOKEN" \
  -F "file=@questions.csv" \
  http://localhost:3000/api/admin/questions/import \
  | jq '.'
```

## Schéma CSV pour l'import

### Structire CSV attendue

```
Question,Option 1,Option 2,Correct Answer,Explanation,Category,Difficulty,Quality Score,Status,MITRE Techniques,Tags
```

### Colonnes détaillées

#### Requises

| Colonne | Type | Description |
|---------|------|-------------|
| Question | string | Texte de la question (max 1000 chars) |
| Option 1 | string | Première réponse possible |
| Option 2 | string | Deuxième réponse possible |
| Correct Answer | string | La réponse correcte (doit correspondre exactement à Option 1 ou Option 2) |
| Explanation | string | Explication détaillée de la réponse |

#### Optionnelles

| Colonne | Type | Défaut | Exemple |
|---------|------|--------|---------|
| Category | string | "Sécurité" | "Sécurité Réseau" |
| Difficulty | float | 0.5 | 0.7 (entre 0 et 1) |
| Quality Score | float | 0.7 | 0.8 (entre 0 et 1) |
| Status | enum | "to_review" | "accepted" ou "to_review" |
| MITRE Techniques | string | "" | "T1234;T5678" (séparés par ;) |
| Tags | string | "" | "phishing;social" (séparés par ;) |

## Traitement des doublons

### Détection

Les doublons sont détectés via un hash SHA256 **normalisé** :
1. Convertir en minuscules
2. Supprimer la ponctuation
3. Normaliser les espaces
4. Calculer SHA256

### Exemples de doublons détectés

Ces deux questions seraient considérées comme dupliquées :
- "Le HTTPS garantit la confidentialité des données"
- "le https garantit la confidentialité des données"
- "Le HTTPS, garantit la confidentialité... des données"

### Gestion

Si une question dupliquée est détectée pendant l'import :
- Elle est rejetée automatiquement
- Un message d'erreur est généré
- L'import continue avec les autres lignes

## Gestion des erreurs lors de l'import

### Erreurs communes

```
"Missing question text or correct answer"
→ Les colonnes Question ou Correct Answer sont vides

"Question already exists (duplicate detected)"
→ Une question identique existe déjà en base

"Invalid JSON in model output"
→ Erreur lors du parsing de la ligne CSV
```

### Rapport d'import

Après un import, vous recevez :
```json
{
  "imported": 4,          // Nombre de questions ajoutées
  "importedIds": [1, 2, 3, 4],  // IDs des questions créées
  "errors": [
    {
      "row": 5,           // Numéro de ligne (0-indexed + 1)
      "error": "Reason"   // Description de l'erreur
    }
  ],
  "total": 5,             // Total de lignes traitées
  "message": "..."        // Message résumé
}
```

## Bonnes pratiques

1. **Sauvegarde avant import** : Toujours exporter avant de faire un import
2. **Validation CSV** : Utilisez un éditeur CSV ou Excel pour vérifier votre fichier
3. **Encodage** : Assurez-vous que le fichier est en UTF-8
4. **Guillemets** : Échappez les guillemets en les doublant
5. **Tests** : Importez d'abord un petit fichier de test
6. **Monitoring** : Vérifiez le rapport d'erreurs après chaque import

## Limitations actuelles

- ✅ Format CSV uniquement pour l'import
- ✅ Questions vrai/faux uniquement (2 options)
- ✅ Pas de mise à jour des questions existantes (seulement création)
- ✅ Pas d'export/import des scores ou sessions
- ✅ Les questions importées manuellement ont `aiProvider: "manual-import"`

## Performance

- **Export** : ~1000 questions en <500ms
- **Import** : ~100 questions en <5 secondes
- **Détection de doublons** : Hash-based, très rapide

## Maintenance

### Archiver la banque complète
```bash
# Export en CSV
curl -b "auth-token=TOKEN" \
  "http://localhost:3000/api/admin/questions/export?format=csv&status=all" \
  > archive-$(date +%Y%m%d).csv
```

### Cloner la banque vers un autre environnement
```bash
# Export de la source
curl -b "auth-token=TOKEN_SOURCE" \
  "http://source.example.com/api/admin/questions/export?format=csv" \
  > questions.csv

# Import vers la destination
curl -b "auth-token=TOKEN_DEST" \
  -F "file=@questions.csv" \
  http://destination.example.com/api/admin/questions/import
```
