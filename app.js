let contenu;
const listeTextes = document.querySelector("#liste-textes");
const listeLivres = document.querySelector("#liste-livres");
const filtres = document.querySelector("#filtres");
const recherche = document.querySelector("#recherche");
const aucunResultat = document.querySelector("#aucun-resultat");
const lecteur = document.querySelector("#lecteur");
let categorieActive = "Tous";

function echapper(valeur = "") {
  return String(valeur)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function urlPublique(valeur) {
  try {
    const url = new URL(valeur);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function nettoyerHtml(html = "") {
  const modele = document.createElement("template");
  modele.innerHTML = String(html);
  const balisesPermises = new Set(["P", "BR", "STRONG", "EM", "H2", "H3", "BLOCKQUOTE", "UL", "OL", "LI", "A"]);

  [...modele.content.querySelectorAll("*")].forEach((element) => {
    if (!balisesPermises.has(element.tagName)) {
      element.replaceWith(...element.childNodes);
      return;
    }

    const href = element.tagName === "A" ? element.getAttribute("href") : "";
    [...element.attributes].forEach((attribut) => element.removeAttribute(attribut.name));
    if (element.tagName === "A") {
      const lien = urlPublique(href);
      if (lien) {
        element.setAttribute("href", lien);
        element.setAttribute("rel", "noreferrer");
        element.setAttribute("target", "_blank");
      }
    }
  });

  return modele.innerHTML;
}

function normaliser(texte) {
  return String(texte)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function creerFiltres() {
  const categories = ["Tous", ...new Set(contenu.textes.map((texte) => texte.categorie).filter(Boolean))];
  filtres.innerHTML = categories
    .map(
      (categorie) => `
        <button
          class="filter-button${categorie === categorieActive ? " active" : ""}"
          type="button"
          data-categorie="${echapper(categorie)}"
          aria-pressed="${categorie === categorieActive}"
        >${echapper(categorie)}</button>`,
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
              ${echapper(texte.categorie)} <span aria-hidden="true">·</span> ${echapper(texte.date)}
              ${texte.exemple ? '<span class="sample-label">Texte d’exemple</span>' : ""}
            </p>
            <h3>${echapper(texte.titre)}</h3>
            <p>${echapper(texte.resume)}</p>
          </div>
          <div class="writing-action">
            <span>${echapper(texte.lecture)}</span>
            <button type="button" data-texte="${echapper(texte.id)}" aria-label="Lire ${echapper(texte.titre)}">Lire <span aria-hidden="true">↗</span></button>
          </div>
        </article>`,
    )
    .join("");

  aucunResultat.hidden = textesFiltres.length > 0;
}

function afficherLivres() {
  listeLivres.innerHTML = contenu.livres
    .map((livre) => {
      const lien = urlPublique(livre.lien);
      const couleur = livre.couleur === "bleu" ? "bleu" : "ocre";
      return `
        <article class="book-card">
          <div class="book-cover ${couleur}">
            <span>La chambre d’étude</span>
            <strong>${echapper(livre.titre)}</strong>
            <small>${echapper(livre.genre)}</small>
          </div>
          <div class="book-details">
            <p class="article-meta">${echapper(livre.genre)} <span aria-hidden="true">·</span> ${echapper(livre.annee)}</p>
            <h3>${echapper(livre.titre)}</h3>
            <p>${echapper(livre.description)}</p>
            ${
              lien
                ? `<a class="book-link" href="${echapper(lien)}" target="_blank" rel="noreferrer">En savoir plus <span aria-hidden="true">↗</span></a>`
                : '<span class="sample-label">Fiche à compléter</span>'
            }
          </div>
        </article>`;
    })
    .join("");
}

function ouvrirTexte(id) {
  const texte = contenu.textes.find((entree) => entree.id === id);
  if (!texte) return;

  document.querySelector("#lecteur-meta").textContent = `${texte.categorie} · ${texte.date} · ${texte.lecture}`;
  document.querySelector("#lecteur-titre").textContent = texte.titre;
  document.querySelector("#lecteur-chapeau").textContent = texte.resume;
  document.querySelector("#lecteur-contenu").innerHTML = nettoyerHtml(texte.contenu);
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

document.querySelector("#annee").textContent = new Date().getFullYear();

async function chargerDepuisSupabase() {
  const { supabaseUrl, supabasePublishableKey } = window.BLOG_CONFIG;
  const reponse = await fetch(`${supabaseUrl}/rest/v1/blog_content?id=eq.1&select=content`, {
    headers: { apikey: supabasePublishableKey },
  });
  if (!reponse.ok) throw new Error("Le contenu en ligne n’est pas disponible.");
  const lignes = await reponse.json();
  if (!lignes[0]?.content) throw new Error("Le contenu en ligne est vide.");
  return lignes[0].content;
}

async function chargerContenu() {
  try {
    return await chargerDepuisSupabase();
  } catch (erreur) {
    console.warn("Le site utilise sa copie de secours.", erreur);
    const reponse = await fetch("./contenu.json");
    if (!reponse.ok) throw new Error("Le contenu du site n’a pas pu être chargé.");
    return reponse.json();
  }
}

async function initialiser() {
  contenu = await chargerContenu();
  contenu.textes ??= [];
  contenu.livres ??= [];
  document.querySelector("#bio-principale").textContent = contenu.auteur?.presentation ?? "";
  document.querySelector("#bio-suite").textContent = contenu.auteur?.suite ?? "";
  const courriel = String(contenu.auteur?.courriel ?? "").replace(/[\r\n]/g, "");
  document.querySelector("#contact").href = `mailto:${courriel}`;
  creerFiltres();
  afficherTextes();
  afficherLivres();
}

initialiser().catch((erreur) => {
  listeTextes.innerHTML = `<p class="empty-state">${echapper(erreur.message)}</p>`;
});
