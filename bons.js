// ============================================================
// LE PORTEFEUILLE DE BONS
// ------------------------------------------------------------
// POURQUOI CE FICHIER EXISTE
// Jusqu'ici, un bon vivait sur l'écran où il était né, et
// nulle part ailleurs : le lot gagné restait sur l'écran de
// résultat, et un bon pris sur une promotion vivait sur son
// propre écran. Un joueur qui repartait avec deux bons ne les
// voyait donc jamais ensemble, et n'avait aucun endroit où les
// retrouver dix minutes plus tard, devant la caisse.
// C'est le point sur lequel Romain insiste le plus : « à la fin
// des jeux on puisse voir les bons à utiliser directement chez
// les commerçants, que les bons soient mis en avant ».
//
// Ce fichier ne fait qu'une chose : tenir la liste des bons du
// joueur et savoir la dessiner. Il ne connaît ni le quiz, ni les
// jeux, ni la base de données. On l'appelle depuis app.js à deux
// endroits seulement (quand un lot est gagné, quand un bon de
// promotion est pris), et il se débrouille avec le reste.
//
// OÙ SONT RANGÉS LES BONS
// Dans le téléphone du joueur (localStorage), jamais ailleurs.
// C'est volontaire : un bon n'est pas une donnée personnelle à
// stocker sur un serveur, c'est un ticket dans une poche. Le
// serveur, lui, connaît déjà la participation et le lot.
//
// L'ÉTAT « DÉJÀ UTILISÉ » n'est pas dupliqué ici : il est lu dans
// la clé que l'application tient depuis toujours
// (roue_bons_utilises). Deux vérités sur le même sujet auraient
// fini par se contredire, et c'est le genre de contradiction qui
// se règle devant un commerçant, au pire moment.
// ============================================================

(function () {

  const CLE_PORTEFEUILLE = 'roue_mes_bons';
  const CLE_UTILISES     = 'roue_bons_utilises';   // la clé historique d'app.js

  function lire(cle, defaut) {
    try { return JSON.parse(localStorage.getItem(cle) || defaut); }
    catch (e) { return JSON.parse(defaut); }
  }

  function ecrire(cle, valeur) {
    try { localStorage.setItem(cle, JSON.stringify(valeur)); }
    catch (e) { /* mémoire pleine ou navigation privée : on continue sans */ }
  }

  function echapper(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const MOIS  = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
                 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  function jourLisible(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return JOURS[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS[d.getMonth()];
  }

  const Bons = {

    // --------------------------------------------------------
    // AJOUTER UN BON
    // Appelé par app.js quand le joueur gagne un lot, et quand il
    // prend un bon sur une promotion. Un même code n'entre qu'une
    // fois : rejouer la même promotion ne crée pas un doublon.
    // --------------------------------------------------------
    // TOUT EFFACER : réservé à la version d'essai (le bouton « Rejouer
    // quand même »), pour que chaque partie de démonstration reparte
    // d'un portefeuille vierge. Chez une vraie galerie, rien n'appelle
    // jamais cette fonction : les bons d'un joueur ne s'effacent pas.
    toutEffacer() {
      try {
        localStorage.removeItem(CLE_PORTEFEUILLE);
        localStorage.removeItem(CLE_UTILISES);
      } catch (e) { /* navigation privée : rien à effacer */ }
    },

    ajouter(bon) {
      if (!bon || !bon.code) return null;
      const tout = lire(CLE_PORTEFEUILLE, '{}');
      if (tout[bon.code]) return tout[bon.code];      // déjà dans la poche

      tout[bon.code] = {
        code:       String(bon.code),
        lot:        bon.lot || '',
        commercant: bon.commercant || '',
        detail:     bon.detail || '',
        // 'jeu' pour un lot gagné en jouant, 'promo' pour un bon
        // pris dans la liste des offres. L'écran les sépare : ce
        // qu'on a gagné n'a pas le même goût que ce qu'on a pris.
        source:     bon.source === 'promo' ? 'promo' : 'jeu',
        validite:   bon.validite || '',
        obtenu:     new Date().toISOString()
      };
      ecrire(CLE_PORTEFEUILLE, tout);
      return tout[bon.code];
    },

    // --------------------------------------------------------
    // LIRE LE PORTEFEUILLE
    // Les bons encore valables d'abord, dans l'ordre où ils ont
    // été obtenus ; les bons déjà utilisés à la fin.
    // --------------------------------------------------------
    liste() {
      const tout = lire(CLE_PORTEFEUILLE, '{}');
      const utilises = lire(CLE_UTILISES, '{}');
      return Object.keys(tout).map(code => {
        const b = Object.assign({}, tout[code]);
        const u = utilises[code];
        b.utilise = !!u;
        b.utiliseLe = u ? u.date : null;
        return b;
      }).sort((a, b) => {
        if (a.utilise !== b.utilise) return a.utilise ? 1 : -1;
        return String(a.obtenu).localeCompare(String(b.obtenu));
      });
    },

    // Combien de bons le joueur peut encore présenter.
    combienValables() {
      return this.liste().filter(b => !b.utilise).length;
    },

    // --------------------------------------------------------
    // DESSINER LA LISTE
    // `conteneur` est l'élément à remplir. `surUtiliser` est
    // appelé avec le bon quand le joueur appuie sur le bouton de
    // validation : c'est app.js qui sait ouvrir l'écran de
    // confirmation et lancer l'horloge, pas ce fichier.
    // --------------------------------------------------------
    rendre(conteneur, surUtiliser) {
      if (!conteneur) return;
      const bons = this.liste();
      conteneur.innerHTML = '';

      if (!bons.length) {
        conteneur.innerHTML =
          '<p class="bons-vide">Tu n’as pas encore de bon.<br>' +
          'Joue une partie, ou prends une offre dans les promos du moment.</p>';
        return;
      }

      const valables = bons.filter(b => !b.utilise);
      const passes   = bons.filter(b => b.utilise);

      if (valables.length) {
        const titre = document.createElement('p');
        titre.className = 'bons-section';
        titre.textContent = valables.length === 1
          ? 'Ton bon, à présenter au commerçant'
          : 'Tes ' + valables.length + ' bons, à présenter au commerçant';
        conteneur.appendChild(titre);
        valables.forEach(b => conteneur.appendChild(carteBon(b, surUtiliser)));
      }

      if (passes.length) {
        const titre = document.createElement('p');
        titre.className = 'bons-section bons-section-passee';
        titre.textContent = passes.length === 1 ? 'Bon déjà utilisé' : 'Bons déjà utilisés';
        conteneur.appendChild(titre);
        passes.forEach(b => conteneur.appendChild(carteBon(b, surUtiliser)));
      }
    }
  };

  // --------------------------------------------------------
  // UNE CARTE DE BON
  // Dessinée comme un ticket : deux encoches sur les côtés, une
  // ligne pointillée, et le code en gros au milieu. C'est la
  // forme que tout le monde reconnaît sans qu'on l'explique.
  // --------------------------------------------------------
  function carteBon(bon, surUtiliser) {
    const el = document.createElement('article');
    el.className = 'bon-ticket' + (bon.utilise ? ' bon-ticket-passe' : '');

    const origine = bon.source === 'promo' ? 'Offre de la galerie' : 'Gagné en jouant';

    el.innerHTML =
      '<div class="bon-ticket-haut">' +
        '<span class="bon-origine">' + echapper(origine) + '</span>' +
        (bon.commercant ? '<span class="bon-commercant">' + echapper(bon.commercant) + '</span>' : '') +
      '</div>' +
      '<div class="bon-lot">' + echapper(bon.lot) + '</div>' +
      (bon.detail ? '<div class="bon-detail">' + echapper(bon.detail) + '</div>' : '') +
      '<div class="bon-perfo" aria-hidden="true"></div>' +
      '<div class="bon-code-zone">' +
        '<span class="bon-code-libelle">Ton code</span>' +
        '<span class="bon-code">' + echapper(bon.code) + '</span>' +
      '</div>';

    if (bon.utilise) {
      const note = document.createElement('span');
      note.className = 'bon-passe-note';
      note.textContent = bon.utiliseLe
        ? 'Utilisé le ' + jourLisible(bon.utiliseLe)
        : 'Déjà utilisé';
      el.appendChild(note);
    } else {
      if (bon.validite) {
        const v = document.createElement('span');
        v.className = 'bon-validite';
        v.textContent = 'Valable jusqu’au ' + bon.validite;
        el.appendChild(v);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-or bon-utiliser';
      btn.textContent = 'Je suis chez le commerçant';
      btn.addEventListener('click', () => {
        if (typeof surUtiliser === 'function') surUtiliser(bon);
      });
      el.appendChild(btn);
    }

    return el;
  }

  window.PullUpBons = Bons;

})();
