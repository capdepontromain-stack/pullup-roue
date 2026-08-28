// ============================================================
// JEU « LA BOUTIQUE ÉTOILÉE »
// Chaque jour, une vitrine de la galerie porte l'étoile, et
// personne ne dit laquelle : à toi de la trouver. C'est le seul
// jeu du parcours qui parle des commerçants eux-mêmes, et qui
// donne envie de lever les yeux sur les vitrines en sortant.
//
// POURQUOI CE JEU EXISTE : la Boutique Étoilée est annoncée sur
// les affiches, au micro et dans le kit remis aux commerçants,
// mais elle n'existait nulle part dans l'application. Il fallait
// soit la retirer des supports, soit la jouer. La voici.
//
// HONNÊTETÉ (la règle de toute l'application) : le lot est tiré et
// enregistré par le serveur AVANT que le joueur touche l'écran. Le
// jeu ne crée aucune probabilité, il met en scène un résultat déjà
// écrit :
//   - gagnant : l'étoile s'allume sur la vitrine choisie ;
//   - perdant : elle s'allume sur la vitrine d'à côté. Le « à une
//               boutique près », et la vraie boutique du jour est
//               montrée quand même, parce que c'est elle qui fera
//               marcher le joueur dans la galerie.
// Le choix du joueur ne décide de rien, et la phrase de fin le dit.
//
// Interface commune à tous les jeux (voir LISEZ-MOI.md) :
//   id, nom, mot, suite, styles, preparer(ctx)
// ============================================================

(function () {

  // LES SIX VITRINES
  // Jamais une enseigne réelle : ce sont les MÉTIERS de la galerie
  // qui sont nommés, comme partout ailleurs dans l'application. Une
  // marque nommée sans son accord, c'est un problème juridique, et
  // ces noms-là ne coûtent rien à personne.
  const BOUTIQUES = [
    { nom: 'La boulangerie',   auvent: '#A81B1F' },
    { nom: 'Le salon de coiffure', auvent: '#7A4B86' },
    { nom: 'L’institut beauté', auvent: '#1F6F63' },
    { nom: 'Le comptoir à burgers', auvent: '#C4621F' },
    { nom: 'La boutique de mode', auvent: '#2E4E86' },
    { nom: 'Le magasin de jouets', auvent: '#B3282D' }
  ];

  // Une devanture : l'auvent rayé, la vitrine éclairée, la porte.
  // Le tout dessiné ici, en SVG : rien à télécharger, net partout.
  function devanture(couleur) {
    const cle = couleur.replace('#', '');
    return `
    <svg viewBox="0 0 100 100" width="100%" height="100%"
         preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="etl-vitre-${cle}" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%"   stop-color="rgba(255,233,184,.32)"/>
          <stop offset="52%"  stop-color="rgba(255,233,184,.11)"/>
          <stop offset="100%" stop-color="rgba(255,233,184,.04)"/>
        </linearGradient>
      </defs>

      <!-- Le mur de la boutique -->
      <rect x="3" y="4" width="94" height="92" rx="4"
            fill="rgba(30,20,12,.9)" stroke="rgba(201,150,46,.26)" stroke-width="1.2"/>

      <!-- La vitrine éclairée -->
      <rect x="11" y="42" width="78" height="40" rx="2.5"
            fill="url(#etl-vitre-${cle})"
            stroke="rgba(201,150,46,.5)" stroke-width="1.4"/>
      <!-- Le reflet en biais, celui qui fait « verre » -->
      <path d="M15 82 L38 44 L50 44 L27 82 Z" fill="rgba(255,243,212,.12)"/>

      <!-- La porte -->
      <rect x="40" y="64" width="20" height="32" rx="2"
            fill="rgba(255,233,184,.13)" stroke="rgba(201,150,46,.45)" stroke-width="1.2"/>
      <circle cx="56" cy="80" r="1.4" fill="rgba(255,233,184,.7)"/>

      <!-- L'AUVENT
           Le trapèze de couleur, puis trois bandes claires posées
           dessus en suivant la même pente, puis le bord festonné.
           Trois formes, aucune image : c'est ce qui reste net sur
           tous les écrans. -->
      <path d="M5 36 L13 15 L87 15 L95 36 Z" fill="${couleur}"/>
      <g fill="rgba(246,241,230,.82)">
        <path d="M25 15 L18.5 36 L30.5 36 L35 15 Z"/>
        <path d="M49 15 L45.5 36 L57.5 36 L59 15 Z"/>
        <path d="M73 15 L72.5 36 L84.5 36 L83 15 Z"/>
      </g>
      <!-- Le feston du bas, la petite dentelle des devantures -->
      <path d="M5 36 q5.6 8 11.2 0 q5.6 8 11.2 0 q5.6 8 11.2 0 q5.6 8 11.2 0
               q5.6 8 11.2 0 q5.6 8 11.2 0 q5.6 8 11.2 0 q5.6 8 11.2 0
               L95 32 L5 32 Z"
            fill="${couleur}" opacity=".95"/>
      <!-- Le liseré doré qui souligne l'auvent -->
      <path d="M5 33.4 L95 33.4" stroke="rgba(255,233,184,.4)" stroke-width="1"/>
    </svg>`;
  }

  // L'étoile du jour : celle qu'on cherche.
  const ETOILE = `
    <svg viewBox="0 0 48 48" width="46" height="46" aria-hidden="true">
      <defs>
        <radialGradient id="etl-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stop-color="#FFF3D4"/>
          <stop offset="58%"  stop-color="#EFC368"/>
          <stop offset="100%" stop-color="#C9962E"/>
        </radialGradient>
      </defs>
      <path d="M24 3 L29.6 17.4 L45 18.6 L33.2 28.6 L36.9 43.6 L24 35.4
               L11.1 43.6 L14.8 28.6 L3 18.6 L18.4 17.4 Z"
            fill="url(#etl-halo)" stroke="#8A6A21" stroke-width="1.3"
            stroke-linejoin="round"/>
    </svg>`;

  const STYLES = `
  .etl-plateau { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 13px; }

  /* LA GALERIE : deux rangées de trois vitrines, comme une allée
     vue de face. Chaque case est une boutique qu'on peut toucher. */
  .etl-rue {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    width: 100%;
    max-width: 348px;
  }

  .etl-boutique:focus-visible { outline: 3px solid var(--or-clair); outline-offset: 3px; }
  .etl-boutique {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: transform .28s var(--rebond, ease-out), filter .28s ease;
  }
  .etl-boutique:disabled { cursor: default; }
  .etl-cadre {
    position: relative;
    width: 100%;
    aspect-ratio: 100 / 96;
    border-radius: 9px;
    overflow: hidden;
    box-shadow: 0 6px 16px rgba(0,0,0,.45);
    transition: box-shadow .3s ease, filter .3s ease;
  }
  .etl-nom {
    font-family: var(--sans);
    font-size: 11.5px;
    line-height: 1.25;
    color: var(--gris);
    text-align: center;
    letter-spacing: .2px;
    transition: color .3s ease;
  }

  .etl-boutique:not(:disabled):hover { transform: translateY(-3px); }
  .etl-boutique:not(:disabled):active { transform: scale(.96); }

  /* La boutique que le joueur a désignée : elle sort du rang. */
  .etl-boutique.choisie .etl-cadre {
    box-shadow: 0 0 0 2px var(--or-clair), 0 10px 24px rgba(0,0,0,.55);
  }
  .etl-boutique.choisie .etl-nom { color: var(--or-blanc); }

  /* Les boutiques écartées pendant le dépouillement : elles
     s'éteignent une par une, c'est ça le suspense. */
  .etl-boutique.eteinte { filter: brightness(.42) saturate(.5); }
  .etl-boutique.eteinte .etl-nom { color: rgba(188,178,161,.42); }
  body.theme-csc .eteinte .etl-nom { color: rgba(23,34,44,.38); }

  /* La boutique du jour, une fois révélée. */
  .etl-boutique.etoilee .etl-cadre {
    box-shadow: 0 0 0 2px #FFE9B8, 0 0 32px rgba(239,195,104,.55), 0 12px 26px rgba(0,0,0,.5);
    filter: none;
  }
  .etl-boutique.etoilee .etl-nom { color: var(--or-blanc); font-weight: 500; }

  /* L'étoile, posée sur la vitrine gagnante. */
  .etl-etoile {
    position: absolute;
    /* Au milieu de la VITRINE, pas au milieu de la case : l'auvent
       occupe le tiers haut du dessin, et une étoile posée dessus
       aurait l'air d'être tombée du toit. */
    top: 60%; left: 50%;
    margin: -23px 0 0 -23px;
    z-index: 3;
    opacity: 0;
    filter: drop-shadow(0 3px 10px rgba(0,0,0,.6));
  }
  .etl-etoile.parait { animation: etl-parait .8s var(--rebond, cubic-bezier(.34,1.42,.64,1)) forwards; }
  @keyframes etl-parait {
    0%   { opacity: 0; transform: scale(.2) rotate(-140deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  .etl-etoile.parait::after {
    content: '';
    position: absolute;
    inset: -18px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,243,212,.5) 0%, transparent 68%);
    animation: etl-pulse 2.2s ease-in-out infinite;
  }
  @keyframes etl-pulse { 0%,100% { opacity: .8; transform: scale(1); } 50% { opacity: .35; transform: scale(1.2); } }

  .etl-kicker {
    font-size: 11px; letter-spacing: 2.2px; text-transform: uppercase;
    color: var(--gris); text-align: center; min-height: 15px;
  }
  .etl-kicker strong { color: var(--or-clair); font-size: 13px; }

  .etl-verdict {
    min-height: 46px; text-align: center;
    font-family: var(--serif); font-size: 19px; line-height: 1.3;
    color: var(--or-blanc);
  }
  .etl-verdict small {
    display: block; margin-top: 6px;
    font-family: var(--sans); font-size: 13.5px;
    color: var(--creme); opacity: .85; line-height: 1.5;
  }

  @media (prefers-reduced-motion: reduce) {
    .etl-etoile.parait { animation-duration: .01ms; }
    .etl-etoile.parait::after { animation: none; }
  }
  `;

  window.PullUpJeux = window.PullUpJeux || {};

  window.PullUpJeux.etoiles = {
    id: 'etoiles',
    nom: 'La Boutique Étoilée',
    mot: 'l’étoile',                                      // « l’étoile a hésité… »
    suite: 'Une vitrine de la galerie porte l’étoile.',    // fin du ticket à gratter

    styles: STYLES,

    preparer(ctx) {
      // Une manche qui n'est pas la dernière ne révèle jamais le lot :
      // elle se joue toujours « tout près » et passe la main. C'est la
      // dernière manche qui tranche, pour tout le monde pareil.
      const gagne = ctx.decisif !== false && !ctx.lot.perdant;

      const cases = BOUTIQUES.map((b, i) => `
        <button type="button" class="etl-boutique" id="etl-b${i}" data-i="${i}"
                aria-label="Choisir ${ctx.echap(b.nom)}">
          <span class="etl-cadre">
            ${devanture(b.auvent)}
            <span class="etl-etoile" id="etl-e${i}">${ETOILE}</span>
          </span>
          <span class="etl-nom">${ctx.echap(b.nom)}</span>
        </button>`).join('');

      ctx.zone.innerHTML = `
        <h2>${ctx.secondTour ? 'Deuxième vitrine' : 'La Boutique Étoilée'}</h2>
        <p class="question-soustitre">Une vitrine de la galerie porte l’étoile du jour. Laquelle&nbsp;?</p>

        <div class="etl-plateau">
          <div class="etl-kicker" id="etl-kicker">Touche la vitrine que tu sens</div>
          <div class="etl-rue" id="etl-rue">${cases}</div>
          <p class="etl-verdict" id="etl-verdict" role="status"></p>
        </div>
      `;

      const rue     = ctx.zone.querySelector('#etl-rue');
      const kicker  = ctx.zone.querySelector('#etl-kicker');
      const verdict = ctx.zone.querySelector('#etl-verdict');
      const boutons = Array.from(rue.querySelectorAll('.etl-boutique'));

      let joue = false;

      const ecrire = (titre, detail) => {
        verdict.innerHTML = titre + (detail ? '<small>' + detail + '</small>' : '');
      };

      function choisir(i) {
        if (joue) return;
        joue = true;
        ctx.vibrer(20);

        boutons.forEach(b => { b.disabled = true; });
        boutons[i].classList.add('choisie');

        // OÙ EST L'ÉTOILE ?
        // Gagnant : sur la vitrine touchée. Perdant : sur sa voisine,
        // pour que le joueur voie exactement à quoi ça tenait, et
        // surtout pour qu'il reparte avec une vraie information : la
        // boutique du jour, celle qu'il ira regarder en sortant.
        const gagnante = gagne ? i : (i + 1) % BOUTIQUES.length;

        kicker.textContent = 'On regarde les vitrines';
        ecrire('Voyons voir.', '');

        // LE DÉPOUILLEMENT
        // Les vitrines s'éteignent une par une, dans l'ordre de la
        // rue, en gardant la gagnante pour la fin. C'est long de deux
        // secondes et c'est tout l'intérêt du jeu.
        const aEteindre = boutons
          .map((_, k) => k)
          .filter(k => k !== gagnante);

        aEteindre.forEach((k, rang) => {
          setTimeout(() => {
            boutons[k].classList.add('eteinte');
            ctx.vibrer(12);
          }, ctx.sobre ? 0 : 260 + rang * 300);
        });

        const finDuNoir = ctx.sobre ? 60 : 260 + aEteindre.length * 300 + 260;

        setTimeout(() => {
          boutons[gagnante].classList.remove('eteinte');
          boutons[gagnante].classList.add('etoilee');
          const etoile = ctx.zone.querySelector('#etl-e' + gagnante);
          if (etoile) etoile.classList.add('parait');
          ctx.vibrer(gagne ? 110 : 45);

          if (gagne) {
            kicker.textContent = 'C’est la tienne';
            ecrire('L’étoile était bien là !',
                   'Tu as posé le doigt sur la boutique du jour. Regarde ce que tu as gagné.');
          } else {
            const restantes = (ctx.manches || 1) - (ctx.manche || 1);
            kicker.textContent = 'C’était la voisine';
            ecrire('L’étoile était juste à côté.',
                   restantes > 0
                     ? 'La boutique du jour, c’était ' + BOUTIQUES[gagnante].nom.toLowerCase() +
                       '. Il reste ' + (restantes === 1 ? 'une manche.' : restantes + ' manches.')
                     : 'La boutique du jour, c’était ' + BOUTIQUES[gagnante].nom.toLowerCase() +
                       '. Va voir sa vitrine en sortant. Ton lot était tiré avant ton ' +
                       'choix : une autre vitrine n’aurait rien changé.');
          }

          setTimeout(ctx.terminer, ctx.sobre ? 600 : 3400);
        }, finDuNoir);
      }

      boutons.forEach((b, i) => b.addEventListener('click', () => choisir(i)));

      ecrire('Six vitrines, une seule étoile.', 'Choisis celle que tu veux.');
    }
  };

})();
