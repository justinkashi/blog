const contenu = CONTENU_DU_SITE;
const listeTextes = document.querySelector("#liste-textes");
const listeLivres = document.querySelector("#liste-livres");
const filtres = document.querySelector("#filtres");
const recherche = document.querySelector("#recherche");
const aucunResultat = document.querySelector("#aucun-resultat");
const lecteur = document.querySelector("#lecteur");
let categorieActive = "Tous";

function normaliser(texte) {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function creerFiltres() {
  const categories = ["Tous", ...new Set(contenu.textes.map((texte) => texte.categorie))];
  filtres.innerHTML = categories
    .map(
      (categorie) => `
        <button
          class="filter-button${categorie === categorieActive ? " active" : ""}"
          type="button"
          data-categorie="${categorie}"
          aria-pressed="${categorie === categorieActive}"
        >${categorie}</button>`,
    )
    .join("");
}

function afficherTextes() {
  const requete = normaliser(recherche.value.trim());
  const textesFiltres = contenu.textes.filter((texte) => {
    const bonneCategorie = categorieActive === "Tous" || texte.categorie === categorieActive;
    const contenuIndexe = normaliser(`${texte.titre} ${texte.resume} ${texte.categorie}`);
    return bonneCategorie && contenuIndexe.includes(requete);
  });

  listeTextes.innerHTML = textesFiltres
    .map(
      (texte, index) => `
        <article class="writing-card">
          <p class="writing-index">${String(index + 1).padStart(2, "0")}</p>
          <div class="writing-main">
            <p class="article-meta">
              ${texte.categorie} <span aria-hidden="true">·</span> ${texte.date}
              ${texte.exemple ? '<span class="sample-label">Texte d’exemple</span>' : ""}
            </p>
            <h3>${texte.titre}</h3>
            <p>${texte.resume}</p>
          </div>
          <div class="writing-action">
            <span>${texte.lecture}</span>
            <button type="button" data-texte="${texte.id}" aria-label="Lire ${texte.titre}">Lire <span aria-hidden="true">↗</span></button>
          </div>
        </article>`,
    )
    .join("");

  aucunResultat.hidden = textesFiltres.length > 0;
}

function afficherLivres() {
  listeLivres.innerHTML = contenu.livres
    .map(
      (livre) => `
        <article class="book-card">
          <div class="book-cover ${livre.couleur}">
            <span>La chambre d’étude</span>
            <strong>${livre.titre}</strong>
            <small>${livre.genre}</small>
          </div>
          <div class="book-details">
            <p class="article-meta">${livre.genre} <span aria-hidden="true">·</span> ${livre.annee}</p>
            <h3>${livre.titre}</h3>
            <p>${livre.description}</p>
            ${
              livre.lien
                ? `<a class="book-link" href="${livre.lien}">En savoir plus <span aria-hidden="true">↗</span></a>`
                : '<span class="sample-label">Fiche à compléter</span>'
            }
          </div>
        </article>`,
    )
    .join("");
}

function ouvrirTexte(id) {
  const texte = contenu.textes.find((entree) => entree.id === id);
  if (!texte) return;

  document.querySelector("#lecteur-meta").textContent = `${texte.categorie} · ${texte.date} · ${texte.lecture}`;
  document.querySelector("#lecteur-titre").textContent = texte.titre;
  document.querySelector("#lecteur-chapeau").textContent = texte.resume;
  document.querySelector("#lecteur-contenu").innerHTML = texte.contenu.map((paragraphe) => `<p>${paragraphe}</p>`).join("");
  lecteur.showModal();
}

filtres.addEventListener("click", (evenement) => {
  const bouton = evenement.target.closest("[data-categorie]");
  if (!bouton) return;
  categorieActive = bouton.dataset.categorie;
  creerFiltres();
  afficherTextes();
});

recherche.addEventListener("input", afficherTextes);
listeTextes.addEventListener("click", (evenement) => {
  const bouton = evenement.target.closest("[data-texte]");
  if (bouton) ouvrirTexte(bouton.dataset.texte);
});

document.querySelector(".dialog-close").addEventListener("click", () => lecteur.close());
lecteur.addEventListener("click", (evenement) => {
  if (evenement.target === lecteur) lecteur.close();
});

const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".navigation");
menuButton.addEventListener("click", () => {
  const ouvert = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!ouvert));
  navigation.classList.toggle("open", !ouvert);
});

navigation.addEventListener("click", () => {
  menuButton.setAttribute("aria-expanded", "false");
  navigation.classList.remove("open");
});

document.querySelector("#bio-principale").textContent = contenu.auteur.presentation;
document.querySelector("#bio-suite").textContent = contenu.auteur.suite;
document.querySelector("#contact").href = `mailto:${contenu.auteur.courriel}`;
document.querySelector("#annee").textContent = new Date().getFullYear();

creerFiltres();
afficherTextes();
afficherLivres();
