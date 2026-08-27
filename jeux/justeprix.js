// ============================================================
// JEU « LE JUSTE PRIX DES COMMERÇANTS »
// Chaque jour, un article d'une boutique de la galerie est mis
// en vitrine dans le jeu. Le joueur devine son prix en trois
// essais : à chaque coup, la zone dorée se resserre autour du
// vrai prix. Puis le juste prix est révélé, avec l'écart.
//
// HONNÊTETÉ : comme pour la roue et le bandit, le lot a déjà
// été tiré et enregistré AVANT le jeu (validerCoordonnees).
// L'estimation ne change rien au lot : c'est un défi pour la
// gloire, et l'écran le dit. Le jeu ne fait que conclure sur
// la révélation du lot, sans jamais prétendre le contraire.
//
// Les articles viennent de la table roue_justeprix de Supabase
// (une ligne par article, colonne operation = le slug). Tant
// que la table n'existe pas, des articles de démonstration
// prennent le relais : le joueur ne voit jamais un écran vide.
//
// Interface commune à tous les jeux (voir LISEZ-MOI.md) :
//   id, nom, mot, suite, styles, preparer(ctx)
// ============================================================

(function () {

  const STYLES = `
  .jp-plateau { width: 100%; display: flex; flex-direction: column; gap: var(--e4); text-align: left; }

  /* --- L'article en vitrine --- */
  .jp-vitrine {
    border: 1px solid var(--filet);
    border-radius: 2px;
    padding: var(--e4) var(--e4) var(--e3);
    background:
      radial-gradient(150px 100px at 50% 0%, rgba(201, 150, 46, .16), transparent 72%),
      rgba(246, 241, 230, .03);
    display: flex; flex-direction: column; align-items: center; gap: var(--e2);
    text-align: center;
  }
  .jp-vitrine svg { width: 92px; height: 92px; }
  .jp-article {
    font-family: var(--serif); font-weight: 600;
    font-size: var(--t-titre-s); line-height: 1.2;
    color: var(--or-blanc);
  }
  .jp-boutique {
    font-size: var(--t-etiquette); font-weight: 600;
    letter-spacing: 2.2px; text-transform: uppercase;
    color: var(--gris);
  }

  /* --- La saisie du prix --- */
  .jp-saisie {
    border: 1px solid var(--filet-fort);
    border-radius: 2px;
    min-height: 62px;
    padding: var(--e2) var(--e4);
    display: flex; align-items: baseline; justify-content: center; gap: 2px;
    background: rgba(201, 150, 46, .07);
  }
  .jp-saisie .jp-chiffres {
    font-family: var(--serif); font-weight: 800;
    font-size: 36px; line-height: 1;
    color: var(--or-blanc);
    letter-spacing: 1px;
    min-width: 1ch;
  }
  .jp-saisie .jp-vide { color: rgba(201, 150, 46, .45); }
  .jp-saisie .jp-euro {
    font-size: 19px; color: var(--or); margin-left: 5px;
    font-family: var(--serif); font-weight: 600;
  }

  /* --- Le clavier chiffré --- */
  .jp-clavier {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--e2);
  }
  .jp-touche {
    min-height: var(--touche);
    border: 1px solid var(--filet);
    border-radius: 2px;
    background: rgba(246, 241, 230, .03);
    color: var(--creme);
    font-family: var(--sans); font-size: 19px; font-weight: 600;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background .14s ease, border-color .14s ease;
  }
  .jp-touche:active { background: rgba(201, 150, 46, .18); border-color: var(--filet-fort); }
  .jp-touche:focus-visible { outline: 2px solid var(--or-clair); outline-offset: 2px; }
  .jp-touche.jp-fonction {
    font-size: var(--t-etiquette); font-weight: 600;
    letter-spacing: 1.6px; text-transform: uppercase; color: var(--gris);
  }

  .jp-proposer { width: 100%; }

  /* --- Le verdict entre deux essais --- */
  .jp-verdict {
    font-family: var(--serif); font-weight: 800;
    font-size: clamp(34px, 10vw, 44px); line-height: 1;
    letter-spacing: -.01em;
    color: var(--rouge-clair);
    margin: 0;
  }
  .jp-verdict.jp-bas { color: var(--or-clair); }
  .jp-essai-note { font-size: var(--t-petit); color: var(--gris); line-height: 1.5; }

  /* --- La fourchette dorée --- */
  .jp-fourchette {
    border: 1px solid var(--filet);
    border-radius: 2px;
    padding: var(--e4);
    background: rgba(246, 241, 230, .03);
  }
  .jp-jauge {
    position: relative; height: 12px;
    background: rgba(246, 241, 230, .07);
    border: 1px solid var(--filet);
    overflow: hidden;
  }
  .jp-zone {
    position: absolute; top: 0; bottom: 0;
    background: linear-gradient(90deg, rgba(201, 150, 46, .22), rgba(201, 150, 46, .6));
    transition: left .7s var(--signature), width .7s var(--signature);
  }
  .jp-curseur {
    position: absolute; top: -5px; width: 2px; height: 22px;
    background: var(--or-blanc);
    box-shadow: 0 0 9px rgba(239, 195, 104, .8);
    transition: left .7s var(--signature);
  }
  .jp-bornes {
    display: flex; justify-content: space-between;
    font-size: var(--t-etiquette); color: var(--gris);
    letter-spacing: 1px; margin-top: var(--e2);
  }
  .jp-fourchette p { font-size: var(--t-petit); color: var(--gris); margin-top: var(--e2); }
  .jp-fourchette p strong { color: var(--creme); font-weight: 600; }

  /* Les trois essais, en points */
  .jp-essais { display: flex; gap: 7px; }
  .jp-essais span {
    width: 10px; height: 10px; border-radius: 50%;
    border: 1px solid var(--filet-fort);
  }
  .jp-essais span.jp-use { background: var(--or); border-color: var(--or); }

  /* --- La révélation du juste prix --- */
  .jp-kicker {
    font-size: var(--t-etiquette); font-weight: 600;
    letter-spacing: 2.6px; text-transform: uppercase; color: var(--or);
  }
  .jp-prix {
    font-family: var(--serif); font-weight: 800;
    font-size: var(--t-hero); line-height: 1;
    color: var(--or-blanc);
    text-shadow: 0 0 26px rgba(239, 195, 104, .35);
    margin: 0;
  }
  .jp-ecart { font-size: var(--t-corps); color: var(--gris); line-height: 1.55; }
  .jp-ecart strong { color: var(--creme); font-weight: 600; }
  .jp-suite {
    font-size: var(--t-petit); color: var(--gris);
    opacity: 0; transform: translateY(8px);
    transition: opacity .5s var(--signature), transform .5s var(--signature);
  }
  .jp-suite.jp-montre { opacity: 1; transform: none; }

  /* La note d'honnêteté : le lot est tiré au sort, pas au mérite */
  .jp-mention { font-size: var(--t-mention); color: var(--gris); line-height: 1.5; }

  .jp-apparait { animation: jp-pose .55s var(--signature) backwards; }
  @keyframes jp-pose {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .jp-zone, .jp-curseur, .jp-suite { transition-duration: .01s; }
    .jp-apparait { animation: none; }
  }
  `;

  // Icônes d'articles dessinées au trait, dans la grille 100 x 100
  // des icônes de la roue (icones.js). Le jeu porte les siennes
  // pour les articles qui n'existent pas côté lots.
  const ICONES_ARTICLES = {
    sac: `<path d="M34 40 c0 -12 7 -19 16 -19 s16 7 16 19" />
          <path d="M22 40 h56 l-5 40 h-46 z" />
          <path d="M22 51 h56" opacity=".45" />
          <circle cx="50" cy="60" r="4" />`,
    flacon: `<rect x="43" y="16" width="14" height="10" />
             <path d="M38 34 h24 l6 12 v34 h-36 v-34 z" />
             <path d="M38 62 h36" opacity=".45" />
             <path d="M43 26 h14 v8 h-14 z" />`,
    montre: `<circle cx="50" cy="50" r="20" />
             <path d="M50 40 v10 h8" />
             <path d="M42 30 l-4 -12 h24 l-4 12" />
             <path d="M42 70 l-4 12 h24 l-4 -12" />`
  };

  // Les articles de démonstration : de vrais commerçants de
  // Cap Sacré-Coeur, des prix ronds de vitrine. Ils servent
  // tant que la table roue_justeprix n'est pas remplie.
  const ARTICLES_DEMO = [
    { nom: 'Le sac cabas de Noël',        boutique: 'La boutique de mode homme',         emplacement: 'Allée centrale',    prix: 29.90, icone: 'sac' },
    { nom: 'Le coffret gourmand',          boutique: 'La boulangerie de la galerie', emplacement: 'Entrée principale', prix: 12.50, icone: 'gourmandise' },
    { nom: "L'eau de toilette d'hiver",    boutique: 'L’institut beauté',   emplacement: 'Allée centrale',    prix: 24.90, icone: 'flacon' },
    { nom: 'La montre de fin d’année',     boutique: 'La galerie',    emplacement: 'Place du sapin',    prix: 49.00, icone: 'montre' }
  ];

  // Les articles servis par Supabase, quand la table existe.
  let articlesCharges = null;

  // Le chargement part une fois la page prête : app.js est alors
  // chargé, donc la connexion Supabase (sb) existe. Si quoi que
  // ce soit échoue, les articles de démonstration font le jeu.
  function chargerArticles() {
    try {
      if (typeof sb === 'undefined' || typeof EVENEMENT === 'undefined') return;
      sb.from('roue_justeprix')
        .select('nom, boutique, emplacement, prix, icone')
        .eq('operation', EVENEMENT)
        .eq('actif', true)
        .order('ordre')
        .then(function (rep) {
          if (rep && !rep.error && rep.data && rep.data.length) {
            const propres = rep.data.filter(function (a) {
              return a && a.nom && a.boutique && Number(a.prix) > 0;
            });
            if (propres.length) articlesCharges = propres;
          }
        }, function () { /* table absente : la démonstration prend le relais */ });
    } catch (e) {
      // Table absente ou réseau coupé : la démonstration prend le relais.
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', chargerArticles);
  } else {
    chargerArticles();
  }

  // L'article du jour : la date décide, tout le monde a le même.
  // Le second tour (bonus « deux parties ») prend l'article suivant,
  // sinon le joueur connaîtrait déjà le prix.
  function articleDuJour(secondTour) {
    const liste = (articlesCharges && articlesCharges.length ? articlesCharges : ARTICLES_DEMO);
    const jour = Math.floor(Date.now() / 86400000);
    const decalage = secondTour ? 1 : 0;
    const a = liste[(jour + decalage) % liste.length];
    return {
      nom: String(a.nom),
      boutique: String(a.boutique || ''),
      emplacement: String(a.emplacement || ''),
      prix: Math.round(Number(a.prix) * 100) / 100,
      icone: a.icone
    };
  }

  // 24.9 devient « 24,90 € », 25 devient « 25 € »
  function prixLisible(n) {
    const texte = (Math.round(n * 100) % 100 === 0)
      ? String(Math.round(n))
      : n.toFixed(2).replace('.', ',');
    return texte + ' €';
  }

  function iconeArticle(article, ctx) {
    if (article.icone && ICONES_ARTICLES[article.icone]) return ICONES_ARTICLES[article.icone];
    if (article.icone && ctx.icones[article.icone]) return ctx.icones[article.icone];
    return ctx.icone(article.nom);
  }

  window.PullUpJeux = window.PullUpJeux || {};

  window.PullUpJeux.justeprix = {
    id: 'justeprix',
    nom: 'Le Juste Prix des Commerçants',
    mot: 'la vitrine',                          // « la vitrine a parlé... »
    suite: 'La vitrine t’attend.',              // phrase de fin du ticket à gratter
    styles: STYLES,

    preparer(ctx) {
      const article = articleDuJour(ctx.secondTour);
      if (!article || !(article.prix > 0)) throw new Error('Aucun article à deviner');

      const ESSAIS_MAX = 3;
      const prix = article.prix;
      // Le plafond de la jauge : un chiffre rond au-dessus du prix,
      // jamais centré sur lui (sinon il se lirait sur la jauge).
      const PLAFOND = Math.max(20, Math.ceil((prix * (1.7 + Math.random() * 0.9)) / 10) * 10);

      let essais = 0;
      let borneBasse = 0;
      let bornePlafond = PLAFOND;
      let saisie = '';
      let fini = false;
      let meilleurEcart = Infinity;

      const svgArticle =
        `<svg viewBox="0 0 100 100" fill="none" stroke="#EFC368" stroke-width="3.5"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
           ${iconeArticle(article, ctx)}</svg>`;

      ctx.zone.innerHTML = `
        <h2>${ctx.secondTour ? 'Deuxième vitrine' : 'Le Juste Prix'}</h2>
        <p class="question-soustitre">Devine le prix de l’article du jour en trois essais. La zone dorée se resserre à chaque coup.</p>
        <div class="jp-plateau" id="jp-plateau">

          <div class="jp-vitrine jp-apparait">
            ${svgArticle}
            <div class="jp-article">${ctx.echap(article.nom)}</div>
            <div class="jp-boutique">${ctx.echap(article.boutique)}${article.emplacement ? ' · ' + ctx.echap(article.emplacement) : ''}</div>
          </div>

          <div id="jp-etape"></div>
        </div>
      `;

      const etape = ctx.zone.querySelector('#jp-etape');

      function afficherSaisie(titreEssai) {
        etape.innerHTML = `
          <div class="jp-plateau">
            <div class="jp-kicker" id="jp-compteur">${titreEssai}</div>
            <div class="jp-saisie" aria-live="polite">
              <span class="jp-chiffres" id="jp-affichage"><span class="jp-vide">0</span></span>
              <span class="jp-euro">€</span>
            </div>
            <div class="jp-clavier" role="group" aria-label="Clavier des prix">
              ${[1,2,3,4,5,6,7,8,9].map(function (n) {
                return '<button type="button" class="jp-touche" data-touche="' + n + '">' + n + '</button>';
              }).join('')}
              <button type="button" class="jp-touche jp-fonction" data-touche=",">virgule</button>
              <button type="button" class="jp-touche" data-touche="0">0</button>
              <button type="button" class="jp-touche jp-fonction" data-touche="corr" aria-label="Corriger">corr.</button>
            </div>
            <button type="button" class="btn btn-or jp-proposer" id="jp-proposer" disabled>Je propose ce prix</button>
          </div>
        `;
        saisie = '';
        majAffichage();

        etape.querySelectorAll('.jp-touche').forEach(function (touche) {
          touche.addEventListener('click', function () {
            if (fini) return;
            const t = touche.getAttribute('data-touche');
            if (t === 'corr') {
              saisie = saisie.slice(0, -1);
            } else if (t === ',') {
              if (saisie.indexOf(',') === -1 && saisie.length) saisie += ',';
            } else {
              const morceaux = saisie.split(',');
              if (morceaux.length === 2 && morceaux[1].length >= 2) return;   // deux centimes maxi
              if (morceaux.length === 1 && morceaux[0].length >= 4) return;   // quatre chiffres maxi
              if (saisie === '0') saisie = '';                                // pas de 03 €
              saisie += t;
            }
            ctx.vibrer(8);
            majAffichage();
          });
        });
        etape.querySelector('#jp-proposer').addEventListener('click', proposer);
      }

      function majAffichage() {
        const zone = etape.querySelector('#jp-affichage');
        const bouton = etape.querySelector('#jp-proposer');
        if (!zone) return;
        zone.innerHTML = saisie
          ? ctx.echap(saisie)
          : '<span class="jp-vide">0</span>';
        if (bouton) bouton.disabled = !(valeurSaisie() > 0);
      }

      function valeurSaisie() {
        const v = parseFloat(saisie.replace(',', '.'));
        return isNaN(v) ? 0 : v;
      }

      function proposer() {
        if (fini) return;
        const estimation = valeurSaisie();
        if (!(estimation > 0)) return;
        essais++;
        const ecart = Math.abs(estimation - prix);
        if (ecart < meilleurEcart) meilleurEcart = ecart;

        if (ecart < 0.005) { reveler(true); return; }
        if (essais >= ESSAIS_MAX) { reveler(false); return; }

        const tropHaut = estimation > prix;
        if (tropHaut) bornePlafond = Math.min(bornePlafond, estimation);
        else borneBasse = Math.max(borneBasse, estimation);
        afficherVerdict(estimation, tropHaut);
      }

      function afficherVerdict(estimation, tropHaut) {
        const gauche = (borneBasse / PLAFOND) * 100;
        const largeur = ((bornePlafond - borneBasse) / PLAFOND) * 100;
        const curseur = Math.min(99, (estimation / PLAFOND) * 100);
        const points = [];
        for (let i = 0; i < ESSAIS_MAX; i++) {
          points.push('<span' + (i < essais ? ' class="jp-use"' : '') + '></span>');
        }
        etape.innerHTML = `
          <div class="jp-plateau jp-apparait">
            <div class="jp-kicker">Essai ${essais} sur ${ESSAIS_MAX}</div>
            <p class="jp-verdict ${tropHaut ? '' : 'jp-bas'}" role="status">${tropHaut ? 'Trop haut' : 'Trop bas'}</p>
            <div class="jp-fourchette">
              <div class="jp-jauge" aria-hidden="true">
                <span class="jp-zone" style="left:0%; width:100%"></span>
                <span class="jp-curseur" style="left:${curseur.toFixed(1)}%"></span>
              </div>
              <div class="jp-bornes"><span>0 €</span><span>${prixLisible(PLAFOND)}</span></div>
              <p>Le vrai prix est <strong>quelque part dans l’or</strong>, entre ${prixLisible(borneBasse)} et ${prixLisible(bornePlafond)}. Ton prix : ${prixLisible(estimation)}.</p>
            </div>
            <div class="jp-essais" aria-label="${essais} essai${essais > 1 ? 's' : ''} sur ${ESSAIS_MAX}">${points.join('')}</div>
            <p class="jp-essai-note">${essais === ESSAIS_MAX - 1 ? 'Dernier essai. Un coup d’œil à la vitrine peut tout changer.' : 'Il te reste ' + (ESSAIS_MAX - essais) + ' essais. L’étiquette est dans la boutique, si tu veux vérifier.'}</p>
            <button type="button" class="btn btn-or jp-proposer" id="jp-nouveau">Nouveau prix</button>
          </div>
        `;
        ctx.vibrer(tropHaut ? [16, 40, 16] : 22);
        // La zone dorée se resserre sous les yeux du joueur. Le style
        // de départ est posé, on force le navigateur à le peindre,
        // puis on donne la cible : la transition fait le mouvement.
        const zoneOr = etape.querySelector('.jp-zone');
        if (zoneOr) {
          void zoneOr.offsetWidth;
          zoneOr.style.left = gauche.toFixed(1) + '%';
          zoneOr.style.width = Math.max(2, largeur).toFixed(1) + '%';
        }
        etape.querySelector('#jp-nouveau').addEventListener('click', function () {
          afficherSaisie('Essai ' + (essais + 1) + ' sur ' + ESSAIS_MAX);
        });
      }

      function reveler(exact) {
        fini = true;
        const phraseEcart = exact
          ? 'Prix exact, au centime. Personne ne fait mieux.'
          : 'Tu y étais à <strong>' + prixLisible(meilleurEcart) + ' près</strong>.';
        etape.innerHTML = `
          <div class="jp-plateau jp-apparait">
            <div class="jp-kicker">Le juste prix était</div>
            <p class="jp-prix" role="status">${prixLisible(prix)}</p>
            <p class="jp-ecart">${phraseEcart}</p>
            <p class="jp-mention">L’estimation, c’est pour la gloire : ton lot du jour est tiré au sort, comme pour tout le monde.</p>
            <p class="jp-suite" id="jp-suite">Voyons maintenant ce que la hotte t’a réservé.</p>
          </div>
        `;
        ctx.vibrer(exact ? [70, 50, 130] : [24, 50, 40]);
        const attente = ctx.sobre ? 500 : 1500;
        setTimeout(function () {
          const suite = etape.querySelector('#jp-suite');
          if (suite) suite.classList.add('jp-montre');
        }, ctx.sobre ? 60 : 900);
        setTimeout(ctx.terminer, attente + (ctx.sobre ? 300 : 1900));
      }

      afficherSaisie('Essai 1 sur ' + ESSAIS_MAX);
    }
  };

})();
