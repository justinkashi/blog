const { supabaseUrl, supabasePublishableKey } = window.BLOG_CONFIG;
const connexion = document.querySelector("#connexion");
const atelier = document.querySelector("#atelier");
const formConnexion = document.querySelector("#form-connexion");
const erreurConnexion = document.querySelector("#erreur-connexion");
const formTexte = document.querySelector("#form-texte");
const formLivre = document.querySelector("#form-livre");
const formAuteur = document.querySelector("#form-auteur");
const messagePublication = document.querySelector("#message-publication");
const boutonPublier = document.querySelector("#publier");
const cleSession = "blog_session_auteur";
let contenu = { auteur: {}, textes: [], livres: [] };
let modificationsEnAttente = false;

function texteErreur(reponse, corps) {
  if (reponse.status === 401 || reponse.status === 403) return "Le mot de passe est incorrect ou votre session a expiré.";
  return corps?.message || corps?.hint || "Une erreur est survenue. Veuillez réessayer.";
}

async function appelerRpc(nom, parametres) {
  const reponse = await fetch(`${supabaseUrl}/rest/v1/rpc/${nom}`, {
    method: "POST",
    headers: {
      apikey: supabasePublishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(parametres),
  });

  const texte = await reponse.text();
  let corps;
  try {
    corps = texte ? JSON.parse(texte) : null;
  } catch {
    corps = texte;
  }

  if (!reponse.ok) throw new Error(texteErreur(reponse, corps));
  return corps;
}

async function chargerContenu() {
  try {
    const reponse = await fetch(`${supabaseUrl}/rest/v1/blog_content?id=eq.1&select=content,updated_at`, {
      headers: { apikey: supabasePublishableKey },
    });
    if (!reponse.ok) throw new Error();
    const lignes = await reponse.json();
    if (lignes[0]?.content) {
      document.querySelector("#date-publication").textContent = `Dernière publication : ${new Date(lignes[0].updated_at).toLocaleString("fr-CA")}`;
      return lignes[0].content;
    }
  } catch {
    // La copie de secours permet à l’auteur de commencer même si Supabase répond mal.
  }

  const reponseSecours = await fetch("../contenu.json");
  if (!reponseSecours.ok) throw new Error("Le contenu n’a pas pu être chargé.");
  return reponseSecours.json();
}

function afficherMessage(texte, erreur = false) {
  messagePublication.textContent = texte;
  messagePublication.classList.toggle("error-message", erreur);
  messagePublication.hidden = false;
  window.clearTimeout(afficherMessage.minuterie);
  afficherMessage.minuterie = window.setTimeout(() => {
    messagePublication.hidden = true;
  }, 5000);
}

function signalerModification() {
  modificationsEnAttente = true;
  document.querySelector("#etat-modifications").textContent = "Des changements attendent d’être publiés.";
}

function signalerPublication() {
  modificationsEnAttente = false;
  document.querySelector("#etat-modifications").textContent = "Tous les changements sont publiés.";
  document.querySelector("#date-publication").textContent = `Dernière publication : ${new Date().toLocaleString("fr-CA")}`;
}

function creerElementEntree(titre, details, index, type) {
  const bouton = document.createElement("button");
  bouton.type = "button";
  bouton.className = "entry-button";
  bouton.dataset.index = index;
  bouton.dataset.type = type;

  const bloc = document.createElement("span");
  const titreElement = document.createElement("strong");
  titreElement.textContent = titre || "Sans titre";
  const detailsElement = document.createElement("span");
  detailsElement.textContent = details;
  bloc.append(titreElement, detailsElement);

  const action = document.createElement("span");
  action.textContent = "Modifier →";
  bouton.append(bloc, action);
  return bouton;
}

function afficherListeTextes() {
  const liste = document.querySelector("#liste-edition-textes");
  liste.replaceChildren();
  contenu.textes.forEach((texte, index) => {
    liste.append(creerElementEntree(texte.titre, `${texte.categorie} · ${texte.date}`, index, "texte"));
  });
  if (!contenu.textes.length) {
    const vide = document.createElement("p");
    vide.className = "empty-list";
    vide.textContent = "Aucun texte pour le moment.";
    liste.append(vide);
  }
}

function afficherListeLivres() {
  const liste = document.querySelector("#liste-edition-livres");
  liste.replaceChildren();
  contenu.livres.forEach((livre, index) => {
    liste.append(creerElementEntree(livre.titre, `${livre.genre} · ${livre.annee}`, index, "livre"));
  });
  if (!contenu.livres.length) {
    const vide = document.createElement("p");
    vide.className = "empty-list";
    vide.textContent = "Aucun livre pour le moment.";
    liste.append(vide);
  }
}

function htmlVersTexte(html = "") {
  const modele = document.createElement("template");
  modele.innerHTML = String(html);
  const blocs = [...modele.content.querySelectorAll("p, h2, h3, blockquote, li")]
    .map((element) => element.textContent.trim())
    .filter(Boolean);
  return blocs.length ? blocs.join("\n\n") : modele.content.textContent.trim();
}

function echapperHtml(texte) {
  return String(texte)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function texteVersHtml(texte) {
  return String(texte)
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((paragraphe) => `<p>${echapperHtml(paragraphe).replaceAll("\n", "<br>")}</p>`)
    .join("");
}

function identifiantDepuisTitre(titre) {
  const base = String(titre)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || `texte-${Date.now()}`;
  let identifiant = base;
  let suffixe = 2;
  while (contenu.textes.some((texte) => texte.id === identifiant)) identifiant = `${base}-${suffixe++}`;
  return identifiant;
}

function dateFrancaise() {
  return new Intl.DateTimeFormat("fr-CA", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
}

function ouvrirFormTexte(index = null) {
  formTexte.reset();
  document.querySelector("#texte-index").value = index ?? "";
  document.querySelector("#titre-form-texte").textContent = index === null ? "Nouveau texte" : "Modifier ce texte";
  document.querySelector("#supprimer-texte").hidden = index === null;

  if (index === null) {
    document.querySelector("#texte-date").value = dateFrancaise();
    document.querySelector("#texte-lecture").value = "5 min";
  } else {
    const texte = contenu.textes[index];
    document.querySelector("#texte-titre").value = texte.titre ?? "";
    document.querySelector("#texte-categorie").value = texte.categorie ?? "Philosophie";
    document.querySelector("#texte-date").value = texte.date ?? "";
    document.querySelector("#texte-resume").value = texte.resume ?? "";
    document.querySelector("#texte-lecture").value = texte.lecture ?? "";
    document.querySelector("#texte-exemple").checked = Boolean(texte.exemple);
    document.querySelector("#texte-contenu").value = htmlVersTexte(texte.contenu);
  }

  formTexte.hidden = false;
  formTexte.scrollIntoView({ behavior: "smooth", block: "start" });
  document.querySelector("#texte-titre").focus({ preventScroll: true });
}

function lireFormTexte() {
  if (!formTexte.reportValidity()) return false;
  const indexBrut = document.querySelector("#texte-index").value;
  const index = indexBrut === "" ? null : Number(indexBrut);
  const titre = document.querySelector("#texte-titre").value.trim();
  const existant = index === null ? null : contenu.textes[index];
  const texte = {
    id: existant?.id || identifiantDepuisTitre(titre),
    titre,
    categorie: document.querySelector("#texte-categorie").value,
    date: document.querySelector("#texte-date").value.trim(),
    resume: document.querySelector("#texte-resume").value.trim(),
    lecture: document.querySelector("#texte-lecture").value.trim(),
    exemple: document.querySelector("#texte-exemple").checked,
    contenu: texteVersHtml(document.querySelector("#texte-contenu").value),
  };

  if (index === null) contenu.textes.unshift(texte);
  else contenu.textes[index] = texte;
  signalerModification();
  afficherListeTextes();
  formTexte.hidden = true;
  return true;
}

function ouvrirFormLivre(index = null) {
  formLivre.reset();
  document.querySelector("#livre-index").value = index ?? "";
  document.querySelector("#titre-form-livre").textContent = index === null ? "Nouveau livre" : "Modifier ce livre";
  document.querySelector("#supprimer-livre").hidden = index === null;

  if (index !== null) {
    const livre = contenu.livres[index];
    document.querySelector("#livre-titre").value = livre.titre ?? "";
    document.querySelector("#livre-genre").value = livre.genre ?? "";
    document.querySelector("#livre-annee").value = livre.annee ?? "";
    document.querySelector("#livre-description").value = livre.description ?? "";
    document.querySelector("#livre-lien").value = livre.lien ?? "";
    document.querySelector("#livre-couleur").value = livre.couleur === "bleu" ? "bleu" : "ocre";
    document.querySelector("#livre-exemple").checked = Boolean(livre.exemple);
  }

  formLivre.hidden = false;
  formLivre.scrollIntoView({ behavior: "smooth", block: "start" });
  document.querySelector("#livre-titre").focus({ preventScroll: true });
}

function lireFormLivre() {
  if (!formLivre.reportValidity()) return false;
  const indexBrut = document.querySelector("#livre-index").value;
  const index = indexBrut === "" ? null : Number(indexBrut);
  const livre = {
    titre: document.querySelector("#livre-titre").value.trim(),
    genre: document.querySelector("#livre-genre").value.trim(),
    annee: document.querySelector("#livre-annee").value.trim(),
    description: document.querySelector("#livre-description").value.trim(),
    lien: document.querySelector("#livre-lien").value.trim(),
    couleur: document.querySelector("#livre-couleur").value,
    exemple: document.querySelector("#livre-exemple").checked,
  };

  if (index === null) contenu.livres.unshift(livre);
  else contenu.livres[index] = livre;
  signalerModification();
  afficherListeLivres();
  formLivre.hidden = true;
  return true;
}

function lireFormAuteur() {
  if (!formAuteur.reportValidity()) return false;
  contenu.auteur = {
    presentation: document.querySelector("#auteur-presentation").value.trim(),
    suite: document.querySelector("#auteur-suite").value.trim(),
    courriel: document.querySelector("#auteur-courriel").value.trim(),
  };
  signalerModification();
  return true;
}

function remplirAuteur() {
  document.querySelector("#auteur-presentation").value = contenu.auteur?.presentation ?? "";
  document.querySelector("#auteur-suite").value = contenu.auteur?.suite ?? "";
  document.querySelector("#auteur-courriel").value = contenu.auteur?.courriel ?? "";
}

function preparerAtelier() {
  contenu.textes ??= [];
  contenu.livres ??= [];
  contenu.auteur ??= {};
  afficherListeTextes();
  afficherListeLivres();
  remplirAuteur();
  connexion.hidden = true;
  atelier.hidden = false;
}

formConnexion.addEventListener("submit", async (evenement) => {
  evenement.preventDefault();
  const bouton = formConnexion.querySelector("button[type=submit]");
  bouton.disabled = true;
  erreurConnexion.hidden = true;
  try {
    const jeton = await appelerRpc("blog_editor_login", {
      password_input: document.querySelector("#mot-de-passe").value,
    });
    sessionStorage.setItem(cleSession, jeton);
    document.querySelector("#mot-de-passe").value = "";
    contenu = await chargerContenu();
    preparerAtelier();
  } catch (erreur) {
    erreurConnexion.textContent = erreur.message;
    erreurConnexion.hidden = false;
  } finally {
    bouton.disabled = false;
  }
});

document.querySelector("#voir-mot-de-passe").addEventListener("click", () => {
  const champ = document.querySelector("#mot-de-passe");
  const visible = champ.type === "text";
  champ.type = visible ? "password" : "text";
  document.querySelector("#voir-mot-de-passe").textContent = visible ? "Afficher" : "Masquer";
});

document.querySelectorAll(".tab-button").forEach((bouton) => {
  bouton.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach((autre) => {
      const actif = autre === bouton;
      autre.classList.toggle("active", actif);
      autre.setAttribute("aria-pressed", String(actif));
    });
    document.querySelectorAll(".editor-section").forEach((section) => {
      section.hidden = section.id !== `section-${bouton.dataset.section}`;
    });
  });
});

document.querySelector("#nouveau-texte").addEventListener("click", () => ouvrirFormTexte());
document.querySelector("#nouveau-livre").addEventListener("click", () => ouvrirFormLivre());

document.querySelector("#liste-edition-textes").addEventListener("click", (evenement) => {
  const bouton = evenement.target.closest("[data-type=texte]");
  if (bouton) ouvrirFormTexte(Number(bouton.dataset.index));
});

document.querySelector("#liste-edition-livres").addEventListener("click", (evenement) => {
  const bouton = evenement.target.closest("[data-type=livre]");
  if (bouton) ouvrirFormLivre(Number(bouton.dataset.index));
});

document.querySelectorAll("[data-fermer-form]").forEach((bouton) => {
  bouton.addEventListener("click", () => {
    document.querySelector(`#form-${bouton.dataset.fermerForm}`).hidden = true;
  });
});

formTexte.addEventListener("submit", (evenement) => {
  evenement.preventDefault();
  if (lireFormTexte()) afficherMessage("Le texte est gardé. Publiez les changements quand vous êtes prêt.");
});

formLivre.addEventListener("submit", (evenement) => {
  evenement.preventDefault();
  if (lireFormLivre()) afficherMessage("Le livre est gardé. Publiez les changements quand vous êtes prêt.");
});

formAuteur.addEventListener("submit", (evenement) => {
  evenement.preventDefault();
  if (lireFormAuteur()) afficherMessage("La présentation est gardée. Publiez les changements quand vous êtes prêt.");
});

document.querySelector("#supprimer-texte").addEventListener("click", () => {
  const index = Number(document.querySelector("#texte-index").value);
  if (!window.confirm(`Supprimer « ${contenu.textes[index].titre} » ?`)) return;
  contenu.textes.splice(index, 1);
  formTexte.hidden = true;
  signalerModification();
  afficherListeTextes();
});

document.querySelector("#supprimer-livre").addEventListener("click", () => {
  const index = Number(document.querySelector("#livre-index").value);
  if (!window.confirm(`Supprimer « ${contenu.livres[index].titre} » ?`)) return;
  contenu.livres.splice(index, 1);
  formLivre.hidden = true;
  signalerModification();
  afficherListeLivres();
});

boutonPublier.addEventListener("click", async () => {
  if (!formTexte.hidden && !lireFormTexte()) return;
  if (!formLivre.hidden && !lireFormLivre()) return;
  if (!lireFormAuteur()) return;

  boutonPublier.disabled = true;
  boutonPublier.textContent = "Publication…";
  try {
    const jeton = sessionStorage.getItem(cleSession);
    if (!jeton) throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
    await appelerRpc("blog_editor_save", { session_token: jeton, new_content: contenu });
    signalerPublication();
    afficherMessage("Les changements sont publiés. Ils sont maintenant visibles sur le site.");
  } catch (erreur) {
    afficherMessage(erreur.message, true);
    if (/session|mot de passe/i.test(erreur.message)) sessionStorage.removeItem(cleSession);
  } finally {
    boutonPublier.disabled = false;
    boutonPublier.textContent = "Publier les changements";
  }
});

document.querySelector("#deconnexion").addEventListener("click", async () => {
  const jeton = sessionStorage.getItem(cleSession);
  sessionStorage.removeItem(cleSession);
  if (jeton) appelerRpc("blog_editor_logout", { session_token: jeton }).catch(() => {});
  atelier.hidden = true;
  connexion.hidden = false;
  formConnexion.reset();
});

window.addEventListener("beforeunload", (evenement) => {
  if (!modificationsEnAttente) return;
  evenement.preventDefault();
  evenement.returnValue = "";
});

(async function initialiser() {
  const jeton = sessionStorage.getItem(cleSession);
  if (!jeton) return;
  try {
    contenu = await chargerContenu();
    preparerAtelier();
  } catch {
    sessionStorage.removeItem(cleSession);
  }
})();
