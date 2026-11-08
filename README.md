# La chambre d’étude

Blog littéraire en français pour publier des textes de philosophie, des essais, des critiques, des œuvres littéraires et des livres.

## Utiliser l’espace auteur

L’auteur ouvre `https://justinkashi.github.io/blog/ecrire/`, saisit son mot de passe, puis utilise les formulaires en français. Il peut ajouter, modifier ou supprimer des textes et des livres, ainsi que modifier sa présentation. Le bouton **Publier les changements** met immédiatement le contenu à jour sur le site.

L’auteur n’a pas besoin d’un compte GitHub ou Supabase. Sa session reste ouverte pendant douze heures dans l’onglet du navigateur. Le mot de passe n’est jamais enregistré dans le dépôt GitHub.

## Fonctionnement

Le site public est hébergé sur GitHub Pages. Son contenu modifiable est conservé dans un projet Supabase distinct, protégé par Row Level Security. Le fichier `contenu.json` sert de copie de secours si Supabase est temporairement indisponible.

Le fichier `config.js` contient seulement l’adresse du projet et la clé **publishable** de Supabase. Supabase conçoit cette clé pour qu’elle soit intégrée aux sites publics. Elle ne donne pas les droits d’administration : les règles de la base autorisent seulement la lecture du contenu public et l’enregistrement par une session d’auteur valide.

Les mots de passe, la clé secrète Supabase, la clé `service_role` et les fichiers `.env` ne doivent jamais être ajoutés au dépôt.

## Voir le site localement

```powershell
python -m http.server 8000
```

Le site public sera disponible à `http://localhost:8000` et l’espace auteur à `http://localhost:8000/ecrire/`.
