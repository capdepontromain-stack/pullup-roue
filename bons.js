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
  // LE MOT DU LIEU (25/09/2026) : « commerçant » vient de la galerie.
  // Une station-service (Engen) parle de « la caisse ». app.js pose
  // window.ROUE_MOTS depuis l'opération ; sans lui, rien ne change.
  function motAu() {
    return (window.ROUE_MOTS && window.ROUE_MOTS.au) || 'au commerçant';
  }
  function motChez() {
    return (window.ROUE_MOTS && window.ROUE_MOTS.chez) || 'chez le commerçant';
  }
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

  // Le « jour » d'un bon se compte en heure de La Réunion, comme
  // l'ouverture de l'opération dans app.js. Avant (tour n°6, 29/08/2026),
  // il se comptait en jour UTC : la journée basculait à 4 h du matin,
  // et un bon pris entre minuit et 4 h s'affichait « expiré » alors
  // qu'il venait d'être pris.
  function jourReunion(d) {
    const date = d || new Date();
    try {
      return new Intl.DateTimeFormat('fr-CA', { timeZone: 'Indian/Reunion' }).format(date);
    } catch (e) {
      return new Date(date.getTime() + 4 * 3600000).toISOString().slice(0, 10);
    }
  }

  // LE BON GAGNÉ AU JEU MEURT AVEC L'OPÉRATION (26/09/2026)
  // --------------------------------------------------------
  // Jusqu'ici, seul le bon d'une offre du jour expirait. Un lot gagné
  // au jeu, lui, restait présentable indéfiniment : le 26 décembre, le
  // joueur voyait encore « Valable jusqu'au 24 décembre 2026 inclus »
  // avec le bouton actif, alors que l'article 5 du règlement dit qu'il
  // ne peut plus être utilisé. La date de validité est écrite en
  // toutes lettres sur le bon, parce que c'est le joueur et le
  // commerçant qui la lisent : on la retraduit ici en date pour savoir
  // si elle est passée. Si l'opération n'en donne pas (colonne vide,
  // cas de la roue seule vendue à une station-service), rien n'expire :
  // ce n'est pas à ce fichier d'inventer une fin.
  const MOIS_FR = {
    'janvier': '01', 'février': '02', 'fevrier': '02', 'mars': '03',
    'avril': '04', 'mai': '05', 'juin': '06', 'juillet': '07',
    'août': '08', 'aout': '08', 'septembre': '09', 'octobre': '10',
    'novembre': '11', 'décembre': '12', 'decembre': '12'
  };
  function finDeValidite(texte) {
    const m = String(texte || '').toLowerCase().match(/(\d{1,2})(?:er)?\s+([a-zà-öø-ÿ]+)\s+(\d{4})/);
    if (!m || !MOIS_FR[m[2]]) return null;
    return m[3] + '-' + MOIS_FR[m[2]] + '-' + (m[1].length === 1 ? '0' + m[1] : m[1]);
  }
  function validitePassee(validite, aujourdHui) {
    const fin = finDeValidite(validite);
    return !!fin && aujourdHui > fin;
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
      const existant = tout[bon.code];
      if (existant) {
        // Une offre permanente garde le même code d'un jour à l'autre.
        // Si le joueur la reprend un autre jour, le bon redevient celui
        // du jour : sans ça, il resterait marqué « expiré » alors que
        // le joueur vient de le reprendre sous les yeux du commerçant.
        // Un bon déjà UTILISÉ, lui, reste utilisé : c'est le verrou.
        const utilise = !!lire(CLE_UTILISES, '{}')[bon.code];
        if (existant.source === 'promo' && !utilise &&
            jourReunion(new Date(existant.obtenu)) !== jourReunion()) {
          existant.obtenu = new Date().toISOString();
          ecrire(CLE_PORTEFEUILLE, tout);
        }
        return existant;
      }

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
        obtenu:     new Date().toISOString(),
        // LE BON RANGÉ AVANT D'ÊTRE MONTRÉ (24/09/2026)
        // Un bon « en attente » est écrit dans le téléphone mais
        // n'apparaît nulle part : ni dans la liste, ni dans le compteur
        // de l'onglet. Il sert au lot déjà tiré pendant que le joueur
        // fait encore ses manches : s'il est coupé, le bon existe et on
        // le lui rend au redémarrage (devoilerTout) ; s'il va au bout,
        // l'écran du résultat le dévoile et le suspense est intact.
        attente:    bon.attente === true
      };
      ecrire(CLE_PORTEFEUILLE, tout);
      return tout[bon.code];
    },

    // --------------------------------------------------------
    // DÉVOILER
    // `devoiler(code)` à la fin des manches, quand le joueur découvre
    // son lot. `devoilerTout()` au chargement de la page : un bon
    // encore en attente à ce moment-là ne peut venir que d'une partie
    // interrompue, puisqu'une partie qui va au bout dévoile le sien
    // avant de quitter l'écran. Renvoie le nombre de bons rendus.
    // --------------------------------------------------------
    devoiler(code) {
      if (!code) return false;
      const tout = lire(CLE_PORTEFEUILLE, '{}');
      const b = tout[code];
      if (!b || b.attente !== true) return false;
      b.attente = false;
      ecrire(CLE_PORTEFEUILLE, tout);
      return true;
    },

    devoilerTout() {
      const tout = lire(CLE_PORTEFEUILLE, '{}');
      let rendus = 0;
      Object.keys(tout).forEach(code => {
        if (tout[code] && tout[code].attente === true) {
          tout[code].attente = false;
          rendus++;
        }
      });
      if (rendus) ecrire(CLE_PORTEFEUILLE, tout);
      return rendus;
    },

    // --------------------------------------------------------
    // LIRE LE PORTEFEUILLE
    // Les bons encore valables d'abord, dans l'ordre où ils ont
    // été obtenus ; les bons déjà utilisés à la fin.
    // --------------------------------------------------------
    liste() {
      const tout = lire(CLE_PORTEFEUILLE, '{}');
      const utilises = lire(CLE_UTILISES, '{}');
      // LE BON D'UNE OFFRE DU JOUR NE VAUT QUE LE JOUR MÊME (28/08/2026,
      // décision de Romain). Un bon promo obtenu un autre jour est
      // marqué expiré : il reste visible, barré, pour que le joueur
      // comprenne la règle, mais il ne compte plus et ne s'utilise
      // plus. Les bons gagnés AU JEU, eux, vivent jusqu'à la date de
      // validité écrite sur le bon, puis expirent de la même façon
      // (26/09/2026 : avant cette date, rien ne les expirait jamais).
      const aujourdHui = jourReunion();
      // Les bons en attente sont invisibles : ils existent dans le
      // téléphone, mais le joueur n'est pas censé savoir ce qu'il a
      // gagné avant la fin de ses manches (24/09/2026).
      return Object.keys(tout).filter(code => tout[code] && tout[code].attente !== true).map(code => {
        const b = Object.assign({}, tout[code]);
        const u = utilises[code];
        b.utilise = !!u;
        b.utiliseLe = u ? u.date : null;
        b.expire = b.source === 'promo'
          ? jourReunion(new Date(b.obtenu || 0)) !== aujourdHui
          : validitePassee(b.validite, aujourdHui);
        return b;
      }).sort((a, b) => {
        const aMort = a.utilise || a.expire, bMort = b.utilise || b.expire;
        if (aMort !== bMort) return aMort ? 1 : -1;
        return String(a.obtenu).localeCompare(String(b.obtenu));
      });
    },

    // Combien de bons le joueur peut encore présenter.
    combienValables() {
      return this.liste().filter(b => !b.utilise && !b.expire).length;
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

      const valables = bons.filter(b => !b.utilise && !b.expire);
      const passes   = bons.filter(b => b.utilise || b.expire);

      if (valables.length) {
        const titre = document.createElement('p');
        titre.className = 'bons-section';
        titre.textContent = valables.length === 1
          ? 'Ton bon, à présenter ' + motAu()
          : 'Tes ' + valables.length + ' bons, à présenter ' + motAu();
        conteneur.appendChild(titre);
        valables.forEach(b => conteneur.appendChild(carteBon(b, surUtiliser)));
      }

      if (passes.length) {
        const titre = document.createElement('p');
        titre.className = 'bons-section bons-section-passee';
        titre.textContent = passes.length === 1 ? 'Bon passé' : 'Bons passés';
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
        // LE FILET DES ENSEIGNES PASSE ICI AUSSI (06/09/2026) : le
      // portefeuille affichait encore le vrai nom de la boutique alors
      // que l'écran du gagnant, lui, était filtré. Le bon est justement
      // ce que le visiteur présente en caisse : c'est le dernier endroit
      // où une enseigne non engagée doit apparaître. La fonction vit
      // dans app.js, chargé avant ce fichier ; si elle manquait, on
      // retombe simplement sur le nom d'origine.
      (bon.commercant ? '<span class="bon-commercant">' +
        echapper(typeof commercantPresentable === 'function'
          ? commercantPresentable(bon.commercant) : bon.commercant) +
        '</span>' : '') +
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
    } else if (bon.expire) {
      // Le bon d'une offre du jour, le lendemain : barré, avec la
      // règle écrite. Pas de bouton : il ne s'utilise plus.
      el.classList.add('bon-passe');
      const note = document.createElement('span');
      note.className = 'bon-passe-note';
      note.textContent = bon.source === 'promo'
        ? 'Expiré : ce bon n’était valable que le jour même.'
        : 'Expiré : ce bon n’était valable que jusqu’au ' + bon.validite + '.';
      el.appendChild(note);
    } else {
      if (bon.validite) {
        const v = document.createElement('span');
        v.className = 'bon-validite';
        // « aujourd'hui seulement » ne se dit pas « jusqu'au »...
        v.textContent = /aujourd/i.test(bon.validite)
          ? 'Valable aujourd’hui seulement'
          : 'Valable jusqu’au ' + bon.validite;
        el.appendChild(v);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-or bon-utiliser';
      btn.textContent = 'Je suis ' + motChez();
      btn.addEventListener('click', () => {
        if (typeof surUtiliser === 'function') surUtiliser(bon);
      });
      el.appendChild(btn);
    }

    return el;
  }

  window.PullUpBons = Bons;

})();
