# Guide d'Import/Export de Questions

## Format CSV

Le système accepte les fichiers CSV avec les colonnes suivantes :

### Colonnes Requises
- **Question** : Le texte de la question
- **Option 1** : Première option (généralement "True" pour vrai/faux)
- **Option 2** : Deuxième option (généralement "False" pour vrai/faux)
- **Correct Answer** : La réponse correcte (doit correspondre exactement à l'une des options)
- **Explanation** : L'explication de la réponse

### Colonnes Optionnelles
- **Category** : Catégorie de la question (ex: "Sécurité", "Réseau", etc.)
- **Difficulty** : Niveau de difficulté (0 à 1, ex: 0.5 pour moyen)
- **Quality Score** : Score de qualité (0 à 1, ex: 0.8)
- **Status** : Statut de la question ("to_review" ou "accepted", défaut: "to_review")
- **MITRE Techniques** : Techniques MITRE concernées (séparées par des points-virgules, ex: "T1234;T5678")
- **Tags** : Tags/Étiquettes (séparés par des points-virgules, ex: "phishing;social-engineering")

## Exemple CSV

```csv
Question,Option 1,Option 2,Correct Answer,Explanation,Category,Difficulty,Quality Score,Status,MITRE Techniques,Tags
Le HTTPS garantit la confidentialité des données,True,False,True,HTTPS utilise le chiffrement SSL/TLS pour protéger les données en transit,Sécurité Réseau,0.5,0.8,to_review,T1234,chiffrement;confidentialité
Un mot de passe de 6 caractères est suffisant,True,False,False,Les mots de passe doivent avoir au minimum 12 caractères et contenir des caractères spéciaux,Sécurité des Identifiants,0.3,0.9,to_review,T5678,authentification;mots-de-passe
```

## Conseils d'Import

1. **Format UTF-8** : Assurez-vous que le fichier est encodé en UTF-8
2. **Guillemets** : Si votre texte contient des virgules ou des sauts de ligne, utilisez des guillemets (ex: `"Texte avec, virgule"`)
3. **Doublage de guillemets** : Si votre texte contient des guillemets, doublez-les (ex: `"Question avec "" guillemets"`)
4. **Fichiers Excel** : Vous pouvez utiliser le bouton "Export" pour générer un fichier Excel, puis le convertir en CSV via "Fichier > Enregistrer sous"

## Détection de Doublons

Lors de l'import :
- Les questions dupliquées exactes sont détectées via un hash et rejetées automatiquement
- L'import continue même en cas d'erreur sur une ligne
- Un rapport d'erreur est affiché listant les problèmes rencontrés

## Export

Le système propose deux formats :
- **CSV** : Format texte simple, compatible avec Excel
- **Excel (.xlsx)** : Format Excel avec formatage

Vous pouvez exporter :
- **Toutes les questions**
- **Uniquement les acceptées**
- **Uniquement celles en attente de révision**
- **Uniquement les rejetées**
