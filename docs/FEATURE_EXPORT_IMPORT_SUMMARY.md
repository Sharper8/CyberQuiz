# Implémentation Export/Import CSV/Excel - Résumé

## 📋 Fonctionnalités implémentées

### ✅ Export
- Exporter les questions en **CSV** ou **Excel (.xlsx)**
- Filtrer par statut : Toutes, Acceptées, En attente, Rejetées
- Inclut toutes les métadonnées (catégories, difficulté, scores, tags, MITRE techniques)
- Nommage automatique des fichiers avec timestamp

### ✅ Import
- Importer des questions depuis **fichiers CSV**
- Support des colonnes requises et optionnelles
- Détection automatique des doublons via hash normalisé
- Rapport détaillé des erreurs ligne par ligne
- Gestion gracieuse des erreurs partielles (import continue même en cas d'erreur)

### ✅ Interface utilisateur
- Composant réutilisable `ExportImportPanel` 
- Dialogs de configuration pour export et import
- Intégration dans la page admin
- Messages de notification via toast

## 📁 Fichiers créés/modifiés

### Endpoints API

```
app/api/admin/questions/export/route.ts  - API export (CSV + Excel)
app/api/admin/questions/import/route.ts  - API import (CSV)
```

### Composants React

```
src/components/ExportImportPanel.tsx - Composant UI export/import
```

### Documentation

```
docs/EXPORT_IMPORT.md                - Guide complet d'utilisation
docs/API_EXPORT_IMPORT.md            - Documentation API détaillée
docs/IMPORT_EXPORT_GUIDE.md          - Guide format CSV (existant, amélioré)
```

### Fichiers de test/exemple

```
sample-questions.csv                 - Fichier CSV d'exemple avec 5 questions
scripts/test-export-import.sh        - Script de test bash
```

### Modifications existantes

```
app/admin/page.tsx                   - Ajout du composant ExportImportPanel
package.json                         - Ajout de la dépendance 'xlsx'
```

## 🚀 Utilisation

### Dans l'interface admin

1. Accédez à `http://localhost:3000/admin`
2. Connectez-vous avec vos identifiants admin
3. Cliquez sur **"Export"** ou **"Import"** dans la section Actions

### Export
- Choisissez le format (CSV ou Excel)
- Sélectionnez le statut des questions à exporter
- Cliquez "Download"
- Le fichier est téléchargé automatiquement

### Import
- Préparez un fichier CSV avec les colonnes requises
- Cliquez sur "Import"
- Sélectionnez le fichier CSV
- Consultez le rapport d'import

## 📊 Format CSV

### Colonnes requises
```
Question, Option 1, Option 2, Correct Answer, Explanation
```

### Colonnes optionnelles
```
Category, Difficulty, Quality Score, Status, MITRE Techniques, Tags
```

### Exemple minimal
```csv
Question,Option 1,Option 2,Correct Answer,Explanation
Le HTTPS chiffre les données,True,False,True,HTTPS utilise SSL/TLS pour chiffrer
```

### Exemple complet
```csv
Question,Option 1,Option 2,Correct Answer,Explanation,Category,Difficulty,Quality Score,Status,MITRE Techniques,Tags
Le phishing est une attaque,True,False,True,Le phishing utilise la manipulation,Sécurité,0.4,0.85,to_review,T1566,phishing;social-engineering
```

## 🔧 Configuration technique

### Dépendances ajoutées
- **xlsx** : Bibliothèque pour générer des fichiers Excel

### Authentification
- Tous les endpoints requièrent un token JWT admin
- Les tokens sont validés via `verifyAdminToken()`

### Détection des doublons
- Basée sur un hash SHA256 normalisé
- Normalisation : minuscules + pas de ponctuation + espaces unifiés
- Les doublons sont rejetés automatiquement

### Sécurité
- Validation des fichiers CSV
- Limitation des requêtes (middleware rate-limiting en place)
- Validation des paramètres
- Gestion des erreurs sans exposition d'informations sensibles

## 📈 Performances

| Opération | Nombre de questions | Temps estimé |
|-----------|-------------------|--------------|
| Export CSV | 1000 | <500ms |
| Export Excel | 1000 | <1s |
| Import | 100 | <5s |
| Détection doublons | N/A | Hash très rapide |

## ✅ Tests recommandés

### Manuel
1. Exporter quelques questions en CSV
2. Ouvrir dans Excel et vérifier le format
3. Modifier une question, exporter en Excel
4. Importer le fichier modifié
5. Vérifier que les questions ont été créées/mises à jour

### Automatisé
```bash
cd /Users/a33782/Documents/CyberQuiz
./scripts/test-export-import.sh
```

## 🐛 Limitations connues

1. **Import uniquement CSV** : Pas d'import direct Excel (peut être ajouté)
2. **Pas de mise à jour** : L'import crée toujours des nouvelles entrées
3. **Questions vrai/faux** : Seulement 2 options supportées
4. **Pas d'export de scores** : Seules les questions sont exportées

## 🚀 Améliorations possibles

1. **Import Excel** : Accepter `.xlsx` en plus de `.csv`
2. **Mode merge** : Fusionner avec les questions existantes au lieu de créer des doublons
3. **Édition en masse** : Modifier plusieurs questions en une seule import
4. **Scheduling** : Exporter automatiquement chaque jour/semaine
5. **Historique** : Tracer les imports/exports effectués
6. **Validation côté client** : Preview avant import dans le navigateur

## 📞 Support et documentation

Pour plus de détails, consultez :
- [docs/EXPORT_IMPORT.md](./docs/EXPORT_IMPORT.md) - Guide complet d'utilisation
- [docs/API_EXPORT_IMPORT.md](./docs/API_EXPORT_IMPORT.md) - Documentation API
- [sample-questions.csv](./sample-questions.csv) - Fichier d'exemple

## ✨ Résumé des changements

| Élément | Avant | Après |
|---------|-------|-------|
| Export | ❌ Non disponible | ✅ CSV + Excel |
| Import | ❌ Non disponible | ✅ CSV with validation |
| Gestion en masse | ❌ Ajouter une par une | ✅ Importer plusieurs à la fois |
| Sauvegarde | ❌ Manuel | ✅ Export automatisé |
| Doublons | ❌ Pas de détection | ✅ Détection hash |
