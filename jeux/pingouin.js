// ============================================================
// JEU « LES TROIS PINGOUINS » (la roulette péi)
// Trois rouleaux, une ligne dorée, trois essais. La règle tient
// en une phrase : trois pingouins alignés, c'est gagné.
//
// Le pingouin est un pingouin de La Réunion : chapeau de paille,
// lunettes de soleil. Il partage les rouleaux avec un palmier
// coiffé de son étoile de Noël, un letchi et un paquet cadeau.
// Tout est dessiné au trait fin doré, dans la grille 100 x 100
// des icônes de la roue (icones.js). Aucune émoticône.
//
// HONNÊTETÉ : comme pour la roue et le bandit, le lot a déjà été
// tiré et enregistré AVANT le jeu (validerCoordonnees), selon le
// taux de gagnants de l'opération. Le jeu ne fait que le révéler.
// Le scénario des trois essais est donc écrit d'avance :
//   - gagnant : les trois pingouins s'alignent au TROISIÈME essai
//               (les deux premiers montent la tension, un pingouin
//               puis deux) ;
//   - perdant : aucun essai n'aligne les trois, et le dernier
//               s'arrête à une case près, le pingouin manquant
//               bien visible juste au-dessus ou juste en dessous
//               de la ligne dorée. C'est le « il s'en est fallu
//               d'un », et il est parfaitement loyal puisque le
//               lot était tiré avant que le joueur touche l'écran.
// Personne ne peut donc « mieux jouer » pour gagner davantage.
//
// Interface commune à tous les jeux (voir LISEZ-MOI.md) :
//   id, nom, mot, suite, styles, preparer(ctx)
// ============================================================

(function () {

  // --------------------------------------------------------
  // LES SYMBOLES, dessinés au trait dans la grille 100 x 100
  // --------------------------------------------------------
  const SYMBOLES = {

    // Le pingouin péi : chapeau de paille et lunettes de soleil.
    // Le clin d'œil est dans le costume, jamais dans la posture :
    // c'est un pingouin en vacances, pas un pingouin ridicule.
    pingouin: `
      <path d="M50 36 C41 36 36 43 36 51 C30 56 27 66 27 74 C27 83 36 90 50 90 C64 90 73 83 73 74 C73 66 70 56 64 51 C64 43 59 36 50 36 Z"/>
      <path d="M50 58 C42 58 38 68 38 77 C38 85 43 90 50 90 C57 90 62 85 62 77 C62 68 58 58 50 58 Z"/>
      <path d="M28 66 C21 72 20 82 25 88 M72 66 C79 72 80 82 75 88"/>
      <path d="M43 90 l-8 6 h11 M57 90 l8 6 h-11"/>
      <path d="M45 55 h10 l-5 6 Z"/>
      <rect x="33" y="44" width="14" height="8" rx="3"/>
      <rect x="53" y="44" width="14" height="8" rx="3"/>
      <path d="M47 48 h6"/>
      <path d="M20 35 C30 43 70 43 80 35"/>
      <path d="M35 36 C35 25 40 20 50 20 C60 20 65 25 65 36"/>`,

    // Le palmier coiffé de son étoile : Noël sous les tropiques.
    palmier: `
      <path d="M45 92 C45 74 47 60 52 48"/>
      <path d="M52 48 C40 36 24 36 16 47"/>
      <path d="M52 48 C64 36 80 37 87 48"/>
      <path d="M52 48 C36 47 24 55 20 68"/>
      <path d="M52 48 C70 48 80 57 83 70"/>
      <circle cx="45" cy="54" r="3"/>
      <circle cx="58" cy="55" r="3"/>
      <path d="M52 16 L54.5 22.5 L61.5 22.9 L56.1 27.3 L57.9 34.1 L52 30.3 L46.1 34.1 L47.9 27.3 L42.5 22.9 L49.5 22.5 Z"/>`,

    // Le letchi : le fruit de Noël à La Réunion. Une seule feuille,
    // couchée et nervurée, et une queue droite. Deux feuilles
    // symétriques se lisaient comme le nœud d'une boule de Noël, et
    // une tige penchée comme la mèche d'une bombe : ni l'un ni
    // l'autre n'a sa place ici. Les petits chevrons font l'écorce.
    letchi: `
      <circle cx="49" cy="63" r="22"/>
      <path d="M49 41 v-7"/>
      <path d="M49 34 C57 26 70 28 75 35 C68 43 55 42 49 34 Z"/>
      <path d="M53 36 h17"/>
      <path d="M40 57 l4 -4 l4 4 M54 55 l4 -4 l4 4 M42 71 l4 -4 l4 4 M56 69 l4 -4 l4 4 M47 64 l4 -4 l4 4"/>`,

    // Le paquet cadeau, repris à l'identique des icônes de la roue.
    cadeau: `
      <rect x="20" y="46" width="60" height="38" rx="4"/>
      <path d="M14 34 h72 v12 h-72 z"/><path d="M50 34 v50"/>
      <path d="M50 34 c-14 0 -20 -18 -8 -18 c8 0 8 12 8 18 z"/>
      <path d="M50 34 c14 0 20 -18 8 -18 c-8 0 -8 12 -8 18 z"/>`
  };

  // La bande des rouleaux. Trois pingouins sur neuf cases, placés
  // pour qu'il existe des cases « tout près » d'un pingouin (celles
  // qui le montrent juste au-dessus ou juste en dessous de la ligne)
  // et des cases franchement loin de lui. C'est ce qui permet de
  // faire monter la tension d'un essai à l'autre sans jamais mentir.
  // Les deux cases « loin » ne portent volontairement pas le même
  // symbole (un cadeau et un letchi) : sans ça, les rouleaux qui ne
  // sortent pas de pingouin afficheraient toujours la même image, et
  // la machine se lirait comme un décor peint.
  const BANDE = ['pingouin', 'letchi', 'cadeau', 'palmier', 'pingouin',
                 'cadeau', 'letchi', 'palmier', 'pingouin'];
  const DECALAGE = 3;   // de combien de cases la bande tourne d'un rouleau à l'autre

  const CASE = 56;      // hauteur d'un symbole, en pixels
  const BOUCLES = 7;    // combien de fois la bande est répétée
  const DEPART = 1;     // sur quelle répétition le rouleau se replace entre deux essais
  const ARRIVEE = BOUCLES - 2;
  const ESSAIS_MAX = 3;

  const STYLES = `
  .pg-plateau { width: 100%; display: flex; flex-direction: column; gap: var(--e4); text-align: left; }

  /* --- Le décompte des essais : lisible en une seconde --- */
  .pg-compte {
    display: flex; align-items: baseline; justify-content: space-between; gap: var(--e3);
    border-bottom: 1px solid var(--filet);
    padding-bottom: var(--e2);
  }
  .pg-kicker {
    font-size: var(--t-etiquette); font-weight: 600;
    letter-spacing: 2.6px; text-transform: uppercase; color: var(--or);
  }
  .pg-kicker strong {
    font-family: var(--serif); font-weight: 800;
    font-size: 19px; letter-spacing: 0; color: var(--or-blanc);
    margin: 0 3px;
  }
  .pg-points { display: flex; gap: 7px; flex: 0 0 auto; }
  .pg-points span {
    width: 10px; height: 10px; border-radius: 50%;
    border: 1px solid var(--filet-fort);
    transition: background .3s var(--signature), border-color .3s var(--signature);
  }
  .pg-points span.pg-use { background: var(--or); border-color: var(--or); }
  .pg-points span.pg-encours {
    background: var(--or-blanc); border-color: var(--or-blanc);
    box-shadow: 0 0 9px rgba(239, 195, 104, .75);
  }
  .pg-reste { font-size: var(--t-mention); color: var(--gris); line-height: 1.5; margin: 0; }

  /* --- La machine --- */
  .pg-machine {
    --case: ${CASE}px;
    align-self: center;
    width: 100%;
    max-width: 330px;
    padding: 12px;
    border-radius: 2px;
    background: linear-gradient(163deg, #2e2415 0%, #171108 46%, #241b0f 100%);
    border: 1px solid var(--filet-fort);
    box-shadow: inset 0 1px 0 rgba(255, 233, 184, .16), 0 14px 34px rgba(0, 0, 0, .5);
    position: relative;
  }
  .pg-rouleaux { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }

  .pg-fenetre {
    position: relative;
    height: calc(var(--case) * 3);
    overflow: hidden;
    border-radius: 2px;
    background: linear-gradient(180deg, #0f0b05 0%, #1d1610 50%, #0f0b05 100%);
    border: 1px solid var(--filet);
    box-shadow: inset 0 0 18px rgba(0, 0, 0, .75);
  }
  /* Le haut et le bas s'estompent : l'œil ne lit que la ligne du milieu */
  .pg-fenetre::after {
    content: '';
    position: absolute; inset: 0; z-index: 2; pointer-events: none;
    background: linear-gradient(180deg,
      rgba(15, 11, 5, .97) 0%, rgba(15, 11, 5, .62) 21%, rgba(15, 11, 5, 0) 34%,
      rgba(15, 11, 5, 0) 66%, rgba(15, 11, 5, .62) 79%, rgba(15, 11, 5, .97) 100%);
    transition: background .55s var(--signature);
  }
  /* Le « à une case près » : le voile se lève sur le troisième rouleau,
     le pingouin manquant se voit enfin, juste à côté de la ligne. */
  .pg-machine.pg-presque .pg-fenetre:nth-child(3)::after {
    background: linear-gradient(180deg,
      rgba(15, 11, 5, .72) 0%, rgba(15, 11, 5, .16) 22%, rgba(15, 11, 5, 0) 36%,
      rgba(15, 11, 5, 0) 64%, rgba(15, 11, 5, .16) 78%, rgba(15, 11, 5, .72) 100%);
  }
  .pg-machine.pg-presque .pg-fenetre:nth-child(3) { border-color: var(--filet-fort); }

  .pg-bande {
    position: absolute; left: 0; right: 0; top: 0;
    will-change: transform;
    transition-property: transform;
    transition-timing-function: cubic-bezier(.13, .72, .22, 1);
    transition-duration: 0ms;
  }
  .pg-bande.pg-file { filter: blur(1.6px); }

  .pg-case { height: var(--case); display: flex; align-items: center; justify-content: center; }
  .pg-case svg {
    width: 62%; height: auto; max-height: 78%;
    fill: none; stroke: #EFC368; stroke-width: 4;
    stroke-linecap: round; stroke-linejoin: round;
  }

  /* La ligne de gain : deux repères dorés et un liseré au milieu */
  .pg-ligne {
    position: absolute; z-index: 3; pointer-events: none;
    left: 12px; right: 12px;
    top: calc(12px + var(--case));
    height: var(--case);
    border-top: 1px solid rgba(239, 195, 104, .45);
    border-bottom: 1px solid rgba(239, 195, 104, .45);
    transition: background .4s ease, box-shadow .4s ease;
  }
  .pg-ligne::before, .pg-ligne::after {
    content: '';
    position: absolute; top: 50%; margin-top: -7px;
    border: 7px solid transparent;
  }
  .pg-ligne::before { left: -12px; border-left-color: #EFC368; }
  .pg-ligne::after  { right: -12px; border-right-color: #EFC368; }

  .pg-machine.pg-gagne .pg-ligne {
    background: rgba(239, 195, 104, .12);
    box-shadow: 0 0 26px rgba(239, 195, 104, .5), inset 0 0 22px rgba(239, 195, 104, .16);
    animation: pg-ligne-bat 1.1s ease-in-out 2;
  }
  @keyframes pg-ligne-bat {
    0%, 100% { background: rgba(239, 195, 104, .12); }
    50%      { background: rgba(239, 195, 104, .26); }
  }

  /* --- Le verdict de l'essai --- */
  .pg-verdict {
    font-family: var(--serif); font-weight: 600;
    font-size: var(--t-titre-s); line-height: 1.25;
    color: var(--or-blanc);
    /* La hauteur est réservée d'avance : le bouton ne saute pas
       sous le doigt quand le verdict s'écrit. */
    margin: 0; min-height: 112px;
    opacity: 0; transform: translateY(8px);
    transition: opacity .5s var(--signature), transform .5s var(--signature);
  }
  .pg-verdict.pg-montre { opacity: 1; transform: none; }
  .pg-verdict small {
    display: block; margin-top: var(--e2);
    font-family: var(--sans); font-weight: 400;
    font-size: var(--t-petit); color: var(--gris); line-height: 1.55;
  }

  .pg-lancer { width: 100%; min-height: var(--touche); }

  @media (prefers-reduced-motion: reduce) {
    .pg-bande { transition-duration: .01s !important; filter: none !important; }
    .pg-machine.pg-gagne .pg-ligne { animation: none; }
    .pg-fenetre::after, .pg-verdict, .pg-points span { transition-duration: .01s; }
  }
  `;

  // Les cases d'une bande, rangées en trois familles :
  //  - « pingouin » : le symbole gagnant lui-même
  //  - « pres »     : une case ordinaire, avec un pingouin juste au-dessus
  //                   ou juste en dessous (le presque-gain)
  //  - « loin »     : une case ordinaire, sans pingouin voisin
  function familles(ordre) {
    const n = ordre.length;
    const res = { pingouin: [], pres: [], loin: [] };
    for (let j = 0; j < n; j++) {
      if (ordre[j] === 'pingouin') { res.pingouin.push(j); continue; }
      const voisin = ordre[(j + 1) % n] === 'pingouin' || ordre[(j - 1 + n) % n] === 'pingouin';
      (voisin ? res.pres : res.loin).push(j);
    }
    return res;
  }
  const FAMILLES = familles(BANDE);

  window.PullUpJeux = window.PullUpJeux || {};

  window.PullUpJeux.pingouin = {
    id: 'pingouin',
    nom: 'Les Trois Pingouins',
    mot: 'la roulette',                        // « la roulette a hésité… »
    suite: 'Les pingouins t’attendent.',       // phrase de fin du ticket à gratter
    styles: STYLES,

    preparer(ctx) {
      // Une manche qui n'est pas la dernière ne révèle jamais le lot :
      // elle se joue toujours « tout près » et passe la main. C'est
      // la dernière manche qui tranche, pour tout le monde pareil.
      const gagne = ctx.decisif !== false && !ctx.lot.perdant;
      const n = BANDE.length;

      // Chaque rouleau a son propre ordre (la même bande, décalée) :
      // sans ça, les trois colonnes afficheraient le même motif.
      const ordres = [0, 1, 2].map(i =>
        BANDE.slice(i * DECALAGE).concat(BANDE.slice(0, i * DECALAGE)));

      // Le scénario des trois essais, écrit avant le premier geste
      // du joueur. La tension monte : un pingouin, puis deux, puis
      // les trois (ou le troisième à une case près).
      const scenario = [
        ['pingouin', 'loin', 'loin'],
        ['pingouin', 'pingouin', 'loin'],
        gagne ? ['pingouin', 'pingouin', 'pingouin']
              : ['pingouin', 'pingouin', 'pres']
      ];

      // Les cibles se choisissent dans la bande d'origine, jamais deux
      // fois la même dans un même essai : deux rouleaux arrêtés sur la
      // même case de la bande afficheraient une colonne identique, et
      // la machine aurait l'air truquée alors qu'elle ne l'est pas.
      const cibles = scenario.map(ligne => {
        const pris = [];
        return ligne.map((type, i) => {
          const libres = FAMILLES[type].filter(b => pris.indexOf(b) === -1);
          const choix = (libres.length ? libres : FAMILLES[type])[
            Math.floor(Math.random() * (libres.length || FAMILLES[type].length))];
          const base = (choix === undefined) ? 0 : choix;
          pris.push(base);
          // De la case de la bande d'origine à la case de ce rouleau
          return (base - i * DECALAGE + n * 3) % n;
        });
      });

      // Les symboles sont définis une seule fois et réutilisés par
      // référence : la machine affiche 189 cases sans alourdir la page.
      const defs = Object.keys(SYMBOLES).map(nom =>
        `<symbol id="pg-s-${nom}" viewBox="0 0 100 100">${SYMBOLES[nom]}</symbol>`).join('');

      const bande = i => {
        let html = '';
        for (let b = 0; b < BOUCLES; b++) {
          for (let j = 0; j < n; j++) {
            html += `<div class="pg-case"><svg viewBox="0 0 100 100" aria-hidden="true"><use href="#pg-s-${ordres[i][j]}"/></svg></div>`;
          }
        }
        return html;
      };

      ctx.zone.innerHTML = `
        <h2>${ctx.secondTour ? 'Deuxième tour' : 'Les Trois Pingouins'}</h2>
        <p class="question-soustitre">Trois pingouins alignés sur la ligne dorée, c’est gagné. Tu as trois essais.</p>

        <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${defs}</defs></svg>

        <div class="pg-plateau">
          <div class="pg-compte">
            <div class="pg-kicker" id="pg-kicker">Essai <strong>1</strong> sur ${ESSAIS_MAX}</div>
            <div class="pg-points" id="pg-points" role="img" aria-label="Essai 1 sur ${ESSAIS_MAX}"></div>
          </div>
          <p class="pg-reste" id="pg-reste">Deux autres essais après celui-ci.</p>

          <div class="pg-machine" id="pg-machine">
            <div class="pg-rouleaux">
              ${[0, 1, 2].map(i => `
                <div class="pg-fenetre">
                  <div class="pg-bande" id="pg-bande-${i}">${bande(i)}</div>
                </div>`).join('')}
            </div>
            <div class="pg-ligne" aria-hidden="true"></div>
          </div>

          <p class="pg-verdict" id="pg-verdict" role="status"></p>

          <button type="button" class="btn btn-or pg-lancer" id="pg-lancer">Lancer les rouleaux</button>
        </div>
      `;

      const machine = ctx.zone.querySelector('#pg-machine');
      const bouton = ctx.zone.querySelector('#pg-lancer');
      const kicker = ctx.zone.querySelector('#pg-kicker');
      const points = ctx.zone.querySelector('#pg-points');
      const reste = ctx.zone.querySelector('#pg-reste');
      const verdict = ctx.zone.querySelector('#pg-verdict');
      const bandes = [0, 1, 2].map(i => ctx.zone.querySelector('#pg-bande-' + i));

      let essai = 0;        // essais déjà joués
      let tourne = false;

      // Position d'un rouleau : la case visée se pose sur la ligne du milieu
      const position = (rep, place) => -((rep * n + place) - 1) * CASE;

      // Les rouleaux partent tous de la même répétition
      bandes.forEach(el => { el.style.transform = 'translateY(' + position(DEPART, 0) + 'px)'; });

      function majCompte() {
        const numero = Math.min(essai + 1, ESSAIS_MAX);
        kicker.innerHTML = 'Essai <strong>' + numero + '</strong> sur ' + ESSAIS_MAX;
        points.setAttribute('aria-label', 'Essai ' + numero + ' sur ' + ESSAIS_MAX);
        let html = '';
        for (let i = 0; i < ESSAIS_MAX; i++) {
          const classe = i < essai ? ' class="pg-use"' : (i === essai ? ' class="pg-encours"' : '');
          html += '<span' + classe + '></span>';
        }
        points.innerHTML = html;
        reste.textContent = essai === 0 ? 'Deux autres essais après celui-ci.'
          : essai === 1 ? 'Encore un essai après celui-ci.'
          : 'Dernier essai.';
        bouton.textContent = essai === 0 ? 'Lancer les rouleaux'
          : essai === 1 ? 'Deuxième essai'
          : 'Dernier essai';
      }
      majCompte();

      bouton.addEventListener('click', lancer);

      function lancer() {
        if (tourne || essai >= ESSAIS_MAX) return;
        tourne = true;
        bouton.disabled = true;
        verdict.classList.remove('pg-montre');
        machine.classList.remove('pg-presque');
        ctx.vibrer(30);

        const dernier = essai === ESSAIS_MAX - 1;
        const durees = ctx.sobre
          ? (dernier ? [180, 280, 400] : [160, 240, 320])
          : (dernier ? [1500, 2300, 3300] : [1150, 1650, 2200]);

        bandes.forEach((el, i) => {
          const place = cibles[essai][i];
          el.classList.add('pg-file');
          el.style.transitionDuration = '0ms';
          el.style.transform = 'translateY(' + position(DEPART, 0) + 'px)';
          void el.offsetHeight;
          el.style.transitionDuration = durees[i] + 'ms';
          el.style.transform = 'translateY(' + position(ARRIVEE, place) + 'px)';

          // Le flou s'enlève juste avant l'arrêt, quand l'œil peut relire
          setTimeout(() => el.classList.remove('pg-file'), Math.max(50, durees[i] - 600));
          // Le rouleau se cale : petit coup sec dans la main
          setTimeout(() => ctx.vibrer(i === 2 ? [18, 45, 28] : 16), durees[i]);
        });

        const fin = durees[2];
        setTimeout(annoncer, fin + (ctx.sobre ? 60 : 420));
      }

      function annoncer() {
        essai++;
        const dernier = essai === ESSAIS_MAX;
        const nom = ctx.lot && ctx.lot.nom ? String(ctx.lot.nom) : '';

        if (!dernier) {
          verdict.innerHTML = essai === 1
            ? 'Un pingouin sur la ligne.<small>Il en manque deux. Il te reste deux essais.</small>'
            : 'Deux pingouins sur la ligne.<small>Le troisième est allé se baigner. Reste le dernier essai.</small>';
          verdict.classList.add('pg-montre');
          ctx.vibrer(essai === 1 ? 25 : 55);
          majCompte();
          // Les rouleaux se replacent en silence, prêts à repartir loin :
          // la bande se répète, l'œil ne voit aucun saut.
          bandes.forEach((el, i) => {
            el.style.transitionDuration = '0ms';
            el.style.transform = 'translateY(' + position(DEPART, cibles[essai - 1][i]) + 'px)';
          });
          setTimeout(() => {
            tourne = false;
            bouton.disabled = false;
          }, ctx.sobre ? 100 : 500);
          return;
        }

        // Troisième essai : la fin de partie.
        if (gagne) {
          machine.classList.add('pg-gagne');
          verdict.innerHTML = 'Les trois pingouins sont là.' +
            (nom ? '<small>Ton cadeau : ' + ctx.echap(nom) + '</small>' : '');
        } else {
          machine.classList.add('pg-presque');
          // Manche non décisive : on ne parle jamais du lot ni du tirage,
          // seulement de ce qu'il reste à jouer.
          const restantes = (ctx.manches || 1) - (ctx.manche || 1);
          verdict.innerHTML = 'Deux pingouins, et le troisième juste à côté.' +
            (restantes > 0
              ? '<small>Il s’en est fallu d’une case. Il reste ' +
                (restantes === 1 ? 'une manche.' : restantes + ' manches.') + '</small>'
              : '<small>Il s’en est fallu d’une case. Le tirage, lui, était fait avant la partie : rien à te reprocher.</small>');
        }
        verdict.classList.add('pg-montre');
        majCompte();
        bouton.hidden = true;
        ctx.vibrer(gagne ? [70, 50, 130] : 80);
        setTimeout(ctx.terminer, ctx.sobre ? 600 : 2600);
      }
    }
  };

})();
