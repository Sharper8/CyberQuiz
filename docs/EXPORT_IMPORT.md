# Fonctionnalité Export/Import des Questions

## Vue d'ensemble

Le système CyberQuiz inclut une fonctionnalité complète d'export et d'import de questions en format CSV et Excel. Cette fonctionnalité permet aux administrateurs de :

- **Exporter** toutes les questions ou un sous-ensemble (acceptées, en attente, rejetées)
- **Importer** des questions à partir d'un fichier CSV
- **Gérer en masse** la banque de questions

## Accès

La fonctionnalité se trouve sur la page Admin (`/admin`) dans la section "Actions" :
- Bouton **Export** : Exporte les questions en CSV ou Excel
- Bouton **Import** : Importe des questions depuis un fichier CSV

## Export de Questions

### Formats supportés
- **CSV** : Format texte simple, compatible avec Excel, Google Sheets, etc.
- **Excel** : Format `.xlsx` avec formatage

### Options d'export
- **Toutes les questions** : Exporte toutes les questions de la banque
- **Acceptées uniquement** : Exporte seulement les questions acceptées
- **En attente de révision** : Exporte les questions en attente d'approbation
- **Rejetées** : Exporte les questions rejetées

### Colonnes exportées
L'export inclut les colonnes suivantes :
- ID
- Question
- Option 1
- Option 2
- Correct Answer
- Explanation
- Category
- Difficulty (0-1)
- Quality Score (0-1)
- Status
- MITRE Techniques (séparées par des point-virgules)
- Tags (séparées par des point-virgules)
- Created At

## Import de Questions

### Format requis

Le fichier CSV doit contenir les colonnes **obligatoires** suivantes :

| Colonne | Format | Exemple |
|---------|--------|---------|
| Question | Texte | "Le HTTPS garantit la confidentialité" |
| Option 1 | Texte | "True" |
| Option 2 | Texte | "False" |
| Correct Answer | Doit correspondre à une option | "True" |
| Explanation | Texte | "HTTPS utilise SSL/TLS pour chiffrer les données" |

### Colonnes optionnelles

| Colonne | Format | Défaut | Exemple |
|---------|--------|--------|---------|
| Category | Texte | "Sécurité" | "Sécurité Réseau" |
| Difficulty | Nombre 0-1 | 0.5 | 0.7 |
| Quality Score | Nombre 0-1 | 0.7 | 0.8 |
| Status | "to_review" ou "accepted" | "to_review" | "accepted" |
| MITRE Techniques | Séparées par ; | Vide | "T1234;T5678" |
| Tags | Séparées par ; | Vide | "phishing;social-engineering" |

### Exemple de fichier CSV

```csv
Question,Option 1,Option 2,Correct Answer,Explanation,Category,Difficulty,Quality Score,Status,MITRE Techniques,Tags
Le phishing est une technique de manipulation,True,False,True,Le phishing utilise la manipulation pour inciter les utilisateurs à révéler des données,Sécurité,0.4,0.85,to_review,T1566,phishing;social-engineering
Un VPN chiffre votre trafic internet,True,False,True,Un VPN crée un tunnel sécurisé et chiffre tout votre trafic,Sécurité Réseau,0.5,0.9,to_review,T1133,vpn;chiffrement
```

### Format CSV détails

**Encodage** : UTF-8

**Guillemets** : 
- Si votre texte contient des virgules ou des sauts de ligne, enveloppez-le avec des guillemets : `"Texte avec, virgule"`
- Si votre texte contient des guillemets, doublez-les : `"Texte avec "" guillemets"`

**Exemple avec guillemets** :
```csv
"Question avec, virgule",True,False,True,"Explication avec "" guillemets",Sécurité,0.5,0.8,to_review,,
```

### Processus d'import

1. Cliquez sur le bouton **Import**
2. Sélectionnez votre fichier CSV
3. Le système traite l'import et affiche :
   - Le nombre de questions importées avec succès
   - Les erreurs rencontrées (avec numéro de ligne)
   - Motif de chaque erreur

### Détection de doublons

Lors de l'import :
- Les questions dupliquées exactes sont détectées via un **hash SHA256** normalisé
- Les questions dupliquées sont rejetées automatiquement
- La normalisation supprime la casse, la ponctuation et les espaces multiples

### Gestion des erreurs

L'import continue même en cas d'erreur sur une ligne. Un rapport détaillé est fourni :

```
Imported: 5 questions
Errors: 2 rows
- Row 3: Missing question text or correct answer
- Row 7: Question already exists (duplicate detected)
```

## Flux de travail recommandé

### Sauvegarder la banque existante
```
1. Cliquez sur Export
2. Sélectionnez "Toutes les questions"
3. Choisissez le format (CSV ou Excel)
4. Téléchargez et conservez la sauvegarde
```

### Ajouter des questions en masse
```
1. Préparez un fichier CSV avec vos questions
2. Vérifiez le format (colonnes requises, encodage UTF-8)
3. Cliquez sur Import
4. Sélectionnez votre fichier
5. Vérifiez le rapport d'import
```

### Nettoyer/Modifier les questions
```
1. Exportez les questions en Excel
2. Modifiez-les dans Excel
3. Enregistrez en CSV
4. Importez le fichier modifié
```

## Limitations et notes

- **Taille des fichiers** : Pas de limite théorique, testée avec 1000+ questions
- **Caractères spéciaux** : Utilisez l'encodage UTF-8
- **Options multiples** : Le système supporte actuellement uniquement les questions vrai/faux (2 options)
- **Imports partiels** : Si l'import échoue partiellement, les questions déjà importées sont conservées

## Exemples de fichiers

Un fichier d'exemple `sample-questions.csv` est fourni à la racine du projet pour vous guider.

## Commandes API directes

### Export CSV
```bash
curl -b "auth-token=YOUR_TOKEN" \
  "http://localhost:3000/api/admin/questions/export?format=csv&status=all"
```

### Export Excel
```bash
curl -b "auth-token=YOUR_TOKEN" \
  "http://localhost:3000/api/admin/questions/export?format=xlsx&status=accepted"
```

### Import
```bash
curl -b "auth-token=YOUR_TOKEN" \
  -F "file=@questions.csv" \
  http://localhost:3000/api/admin/questions/import
```

## Troubleshooting

### L'import échoue avec "Invalid character"
→ Vérifiez l'encodage du fichier (doit être UTF-8)

### Les doublons ne sont pas détectés
→ Ils sont détectés uniquement via hash (normalisé). Les questions avec des différences minimes (ponctuation, casse) sont considérées comme des doublons.

### L'import est lent
→ C'est normal pour les fichiers volumineux (100+ questions). Soyez patient.

### Je vois "Missing required columns"
→ Vérifiez que votre CSV contient : Question, Option 1, Option 2, Correct Answer, Explanation
