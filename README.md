# La chambre d’étude

Blog littéraire en français conçu pour publier des essais, des critiques, des textes de philosophie et des livres.

## Modifier le contenu avec l’espace auteur

Le site utilise [Pages CMS](https://app.pagescms.org) pour offrir un formulaire d’édition sans code.

1. Le propriétaire du dépôt installe l’application GitHub de Pages CMS pour le dépôt `justinkashi/blog`.
2. L’auteur crée un compte GitHub et reçoit une invitation comme collaborateur du dépôt.
3. L’auteur ouvre `https://app.pagescms.org`, se connecte avec GitHub et choisit le dépôt `blog`.
4. Il ouvre **Contenu du site**, ajoute ou modifie ses textes, puis enregistre.
5. GitHub Pages republie automatiquement le site après chaque enregistrement.

Les champs de l’éditeur sont en français. Ils couvrent la biographie, les textes complets, les catégories, les livres et les liens de publication. Désactivez l’option `Texte d’exemple` ou `Fiche à compléter` quand le contenu réel est prêt.

Le contenu éditorial est enregistré dans `contenu.json`. Le fichier `.pages.yml` décrit les formulaires affichés par Pages CMS.

Chaque texte possède un identifiant unique, une catégorie, une date, un titre, un résumé, un temps de lecture et son contenu complet. Les catégories créent automatiquement les boutons de filtrage.

## Voir le site localement

Ouvrez `index.html` dans un navigateur ou lancez un petit serveur local depuis ce dossier.

```powershell
python -m http.server 8000
```

Le site sera disponible à l’adresse `http://localhost:8000`.

## Publier avec GitHub Pages

Dans les réglages du dépôt GitHub, ouvrez **Pages**, choisissez **Deploy from a branch**, puis sélectionnez la branche `main` et le dossier `/ (root)`.
