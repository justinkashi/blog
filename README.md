# La chambre d’étude

Blog littéraire en français conçu pour publier des essais, des critiques, des textes de philosophie et des livres.

## Modifier le contenu

Tout le contenu éditorial se trouve dans `contenu.js`.

- Modifiez les deux paragraphes de la section `auteur` et remplacez l’adresse courriel.
- Remplacez les quatre textes d’exemple dans le tableau `textes`.
- Remplacez les fiches temporaires du tableau `livres` par les ouvrages réels.
- Passez `exemple` à `false` pour retirer les étiquettes qui signalent le contenu de démonstration.

Chaque texte possède un identifiant unique, une catégorie, une date, un titre, un résumé, un temps de lecture et une liste de paragraphes. Les catégories créent automatiquement les boutons de filtrage.

## Voir le site localement

Ouvrez `index.html` dans un navigateur ou lancez un petit serveur local depuis ce dossier.

```powershell
python -m http.server 8000
```

Le site sera disponible à l’adresse `http://localhost:8000`.

## Publier avec GitHub Pages

Dans les réglages du dépôt GitHub, ouvrez **Pages**, choisissez **Deploy from a branch**, puis sélectionnez la branche `main` et le dossier `/ (root)`.
