// ============================================================
// JEU « LE BANDIT MANCHOT » (la machine à sous de la hotte)
// Trois rouleaux qui défilent, une ligne de gain au centre,
// un levier qu'on tire au doigt. La règle tient en une phrase :
// trois symboles alignés, c'est gagné.
//
// Le lot a déjà été tiré et enregistré avant (validerCoordonnees) :
// la machine ne fait que le révéler, comme la roue.
//   - lot gagnant  : les trois rouleaux s'alignent sur son icône
//   - lot perdant  : deux symboles identiques, le troisième tombe
//                    à côté. Le fameux « à un symbole près ».
//
// Interface commune à tous les jeux (voir LISEZ-MOI.md) :
//   id, nom, mot, suite, styles, preparer(ctx)
// ============================================================

(function () {

  const STYLES = `
  .bandit-plateau { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 16px; }

  .bandit-machine {
    --case: 60px;
    width: 100%;
    max-width: 340px;
    padding: 13px;
    border-radius: 22px;
    background: linear-gradient(163deg, #2e2415 0%, #171108 46%, #241b0f 100%);
    border: 1.5px solid rgba(201,150,46,.55);
    box-shadow: inset 0 1px 0 rgba(255,233,184,.18), 0 14px 34px rgba(0,0,0,.5);
    position: relative;
  }

  .bandit-rouleaux { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }

  .bandit-fenetre {
    position: relative;
    height: calc(var(--case) * 3);
    overflow: hidden;
    border-radius: 12px;
    background: linear-gradient(180deg, #0f0b05 0%, #1d1610 50%, #0f0b05 100%);
    border: 1px solid rgba(201,150,46,.4);
    box-shadow: inset 0 0 18px rgba(0,0,0,.75);
  }
  /* Le haut et le bas s'estompent : l'œil ne lit que la ligne du milieu */
  .bandit-fenetre::after {
    content: '';
    position: absolute; inset: 0; z-index: 2; pointer-events: none;
    background: linear-gradient(180deg,
      rgba(15,11,5,.97) 0%, rgba(15,11,5,.62) 21%, rgba(15,11,5,0) 34%,
      rgba(15,11,5,0) 66%, rgba(15,11,5,.62) 79%, rgba(15,11,5,.97) 100%);
  }

  .bandit-bande {
    position: absolute; left: 0; right: 0; top: 0;
    will-change: transform;
    transition-property: transform;
    transition-timing-function: cubic-bezier(.13,.72,.22,1);
    transition-duration: 0ms;
  }
  .bandit-bande.file { filter: blur(1.5px); }

  .bandit-case { height: var(--case); display: flex; align-items: center; justify-content: center; }
  .bandit-case svg { width: 60%; height: auto; max-height: 76%; }

  /* La ligne de gain : deux repères dorés et un liseré au milieu */
  .bandit-ligne {
    position: absolute; z-index: 3; pointer-events: none;
    left: 13px; right: 13px;
    top: calc(13px + var(--case));
    height: var(--case);
    border-top: 1px solid rgba(239,195,104,.45);
    border-bottom: 1px solid rgba(239,195,104,.45);
    transition: background .4s ease, box-shadow .4s ease;
  }
  .bandit-ligne::before, .bandit-ligne::after {
    content: '';
    position: absolute; top: 50%; margin-top: -7px;
    border: 7px solid transparent;
  }
  .bandit-ligne::before { left: -13px; border-left-color: var(--or); }
  .bandit-ligne::after  { right: -13px; border-right-color: var(--or); }

  .bandit-machine.gagne .bandit-ligne {
    background: rgba(239,195,104,.12);
    box-shadow: 0 0 26px rgba(239,195,104,.5), inset 0 0 22px rgba(239,195,104,.16);
    animation: bandit-ligne-bat 1.1s ease-in-out 2;
  }
  @keyframes bandit-ligne-bat {
    0%, 100% { background: rgba(239,195,104,.12); }
    50%      { background: rgba(239,195,104,.26); }
  }

  /* --- Le levier --- */
  .bandit-levier {
    background: none; border: 0; padding: 0;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    touch-action: none;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
  }
  .bandit-levier:focus-visible { outline: 3px solid var(--or-clair); outline-offset: 5px; border-radius: 14px; }
  /* LE LEVIER SE VOIT (26/08/2026, Romain : « on ne comprend pas que
     c'est là qu'il faut cliquer »). Il est plus grand, il porte un halo
     qui bat comme une ampoule de foire, une flèche qui montre le geste,
     et sa consigne est devenue un vrai bouton doré. */
  .bandit-levier svg { width: 132px; height: auto; overflow: visible; }
  .bandit-levier .trait { fill: none; stroke: var(--or-clair); stroke-width: 4; stroke-linecap: round; }
  .bandit-bras { transition: transform .32s cubic-bezier(.3,1.5,.5,1); }
  .bandit-levier.tire .bandit-bras { transition-duration: .18s; }
  .bandit-halo { transform-origin: 48px 22px; }
  .bandit-levier:not(.joue) .bandit-halo { animation: bandit-halo 2.2s ease-out infinite; }
  .bandit-levier.joue .bandit-halo, .bandit-levier.joue .bandit-fleche { display: none; }
  @keyframes bandit-halo {
    0%   { opacity: .55; transform: scale(.72); }
    70%  { opacity: 0;   transform: scale(1.45); }
    100% { opacity: 0;   transform: scale(1.45); }
  }
  .bandit-fleche { transform-origin: 48px 52px; }
  .bandit-levier:not(.joue) .bandit-fleche { animation: bandit-fleche 1.9s ease-in-out infinite; }
  @keyframes bandit-fleche {
    0%, 100% { opacity: .35; transform: translateY(0); }
    50%      { opacity: .95; transform: translateY(7px); }
  }

  .bandit-consigne {
    display: inline-block;
    margin-top: 2px;
    padding: 9px 20px;
    border-radius: 999px;
    border: 1px solid rgba(239,195,104,.55);
    background: linear-gradient(180deg, rgba(239,195,104,.2) 0%, rgba(201,150,46,.1) 100%);
    font-size: 13.5px; letter-spacing: 2.2px; text-transform: uppercase;
    font-weight: 700; color: var(--or-blanc);
    box-shadow: 0 8px 22px -14px rgba(0,0,0,.9);
  }
  .bandit-levier:not(.joue) .bandit-consigne { animation: bandit-consigne 2.6s ease-in-out infinite; }
  @keyframes bandit-consigne {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239,195,104,.0); }
    50%      { box-shadow: 0 0 18px 1px rgba(239,195,104,.32); }
  }
  .bandit-levier:not(.joue) .bandit-boule { animation: bandit-appelle 2.4s ease-in-out infinite; }
  @keyframes bandit-appelle {
    0%, 72%, 100% { transform: translateY(0); }
    82%           { transform: translateY(9px); }
  }

  .bandit-verdict {
    font-family: var(--serif); font-weight: 600;
    font-size: 21px; line-height: 1.25;
    color: var(--or-blanc);
    margin: 0; min-height: 1.2em;
    opacity: 0; transform: translateY(8px);
    transition: opacity .5s ease, transform .5s ease;
  }
  .bandit-verdict.montre { opacity: 1; transform: none; }

  @media (prefers-reduced-motion: reduce) {
    .bandit-bande { transition-duration: .01s !important; filter: none !important; }
    .bandit-levier:not(.joue) .bandit-boule { animation: none; }
    .bandit-machine.gagne .bandit-ligne { animation: none; }
  }
  `;

  const CASE = 60;      // hauteur d'un symbole, en pixels
  const BOUCLES = 9;    // combien de fois la liste des symboles est répétée sur la bande

  function melanger(liste) {
    const t = liste.slice();
    for (let i = t.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [t[i], t[j]] = [t[j], t[i]];
    }
    return t;
  }

  window.PullUpJeux = window.PullUpJeux || {};

  window.PullUpJeux.bandit = {
    id: 'bandit',
    nom: 'Le bandit manchot',
    mot: 'la machine',                        // « la machine a parlé… »
    suite: 'La machine t’attend.',            // phrase affichée à la fin du ticket à gratter
    styles: STYLES,

    preparer(ctx) {
      // Les rouleaux ne montrent que de vrais lots : une machine à sous
      // n'affiche pas « retente demain » sur ses rouleaux.
      let symboles = ctx.lots.filter(l => !l.perdant);
      if (symboles.length < 3) symboles = ctx.lots.slice();
      const n = symboles.length;

      // Où doit s'arrêter chaque rouleau ?
      // Une manche qui n'est pas la dernière ne révèle jamais le lot :
      // elle se joue toujours « tout près » et passe la main. C'est
      // la dernière manche qui tranche, pour tout le monde pareil.
      const gagne = ctx.decisif !== false && !ctx.lot.perdant;
      let cibles;
      if (gagne) {
        const i = Math.max(0, symboles.findIndex(l => l.nom === ctx.lot.nom));
        cibles = [i, i, i];
      } else {
        // Perdu : deux symboles identiques, le troisième à côté.
        const melange = melanger(symboles.map((l, i) => i));
        const paire = melange[0];
        const seul = melange[1] !== undefined ? melange[1] : (paire + 1) % n;
        cibles = [paire, paire, seul];
      }

      // Chaque rouleau a son propre ordre (la même liste, décalée) :
      // sans ça, les trois colonnes afficheraient le même motif.
      const ordres = [0, 1, 2].map(i => symboles.slice(i).concat(symboles.slice(0, i)));
      // Où se trouve le symbole visé dans l'ordre de ce rouleau
      const places = [0, 1, 2].map(i => (cibles[i] - i + n * 2) % n);

      const bande = i => {
        let html = '';
        for (let b = 0; b < BOUCLES; b++) {
          ordres[i].forEach(lot => {
            html += `<div class="bandit-case"><svg viewBox="0 0 100 100" fill="none" stroke="#EFC368"
                     stroke-width="4" stroke-linecap="round" stroke-linejoin="round"
                     aria-hidden="true">${ctx.icone(lot.nom)}</svg></div>`;
          });
        }
        return html;
      };

      ctx.zone.innerHTML = `
        <h2>Le bandit manchot</h2>
        <p class="question-soustitre">Trois symboles alignés sur la ligne dorée, c’est gagné.</p>
        <div class="bandit-plateau">
          <div class="bandit-machine" id="bandit-machine" style="--case:${CASE}px">
            <div class="bandit-rouleaux">
              ${[0, 1, 2].map(i => `
                <div class="bandit-fenetre">
                  <div class="bandit-bande" id="bandit-bande-${i}">${bande(i)}</div>
                </div>`).join('')}
            </div>
            <div class="bandit-ligne" aria-hidden="true"></div>
          </div>

          <button type="button" class="bandit-levier" id="bandit-levier" aria-label="Tirer le levier">
            <svg viewBox="0 0 96 124" aria-hidden="true">
              <defs>
                <radialGradient id="bandit-boule-or" cx="36%" cy="30%" r="72%">
                  <stop offset="0" stop-color="#FFE9B8"/>
                  <stop offset="52%" stop-color="#E3B85A"/>
                  <stop offset="100%" stop-color="#9a6f1c"/>
                </radialGradient>
              </defs>
              <rect class="trait" x="20" y="94" width="56" height="22" rx="11"
                    fill="rgba(201,150,46,.16)"/>
              <path class="trait" d="M35 105 h26" stroke-width="3" opacity=".7"/>
              <g class="bandit-bras" id="bandit-bras" style="transform-origin: 48px 102px;">
                <path class="trait" d="M48 98 V34" stroke-width="8"/>
                <!-- Le halo qui bat autour de la boule : le premier geste
                     du jeu doit se voir depuis l'autre bout de l'écran. -->
                <circle class="bandit-halo" cx="48" cy="22" r="20"
                        fill="none" stroke="#FFE9B8" stroke-width="2.5"/>
                <circle class="bandit-boule" cx="48" cy="22" r="18"
                        fill="url(#bandit-boule-or)" stroke="#7a5410" stroke-width="1.8"/>
              </g>
              <!-- La flèche qui descend : elle dit le geste, pas seulement l'endroit. -->
              <g class="bandit-fleche" stroke="#FFE9B8" stroke-width="3"
                 stroke-linecap="round" stroke-linejoin="round" fill="none">
                <path d="M78 46 v18 M71 58 l7 7 l7 -7"/>
              </g>
            </svg>
            <span class="bandit-consigne" id="bandit-consigne">Tire le levier</span>
          </button>

          <p class="bandit-verdict" id="bandit-verdict" role="status"></p>
        </div>
      `;

      const machine = ctx.zone.querySelector('#bandit-machine');
      const levier = ctx.zone.querySelector('#bandit-levier');
      const bras = ctx.zone.querySelector('#bandit-bras');
      const consigne = ctx.zone.querySelector('#bandit-consigne');
      const verdict = ctx.zone.querySelector('#bandit-verdict');
      const bandes = [0, 1, 2].map(i => ctx.zone.querySelector('#bandit-bande-' + i));

      let joue = false;

      function poserBras(degres) {
        bras.style.transform = 'rotate(' + degres + 'deg)';
      }

      // Le doigt tire le levier vers le bas : le bras suit la main.
      let depart = null;
      levier.addEventListener('pointerdown', e => {
        if (joue) return;
        depart = e.clientY;
        levier.classList.add('tire');
        try { levier.setPointerCapture(e.pointerId); } catch (err) { /* sans importance */ }
      });
      levier.addEventListener('pointermove', e => {
        if (joue || depart === null) return;
        const tire = Math.max(0, Math.min(70, e.clientY - depart));
        poserBras(tire * 0.82);
      });
      function relacher() {
        if (joue || depart === null) return;
        depart = null;
        levier.classList.remove('tire');
        // Simple tape ou vrai geste : dans les deux cas le levier part.
        poserBras(58);
        setTimeout(() => poserBras(0), 260);
        lancer();
      }
      levier.addEventListener('pointerup', relacher);
      levier.addEventListener('pointercancel', relacher);
      levier.addEventListener('click', () => { if (!joue && depart === null) { poserBras(58); setTimeout(() => poserBras(0), 260); lancer(); } });

      function lancer() {
        if (joue) return;
        joue = true;
        levier.classList.add('joue');
        levier.disabled = true;
        consigne.textContent = 'Ça tourne…';
        ctx.vibrer(35);

        const durees = ctx.sobre ? [200, 320, 440] : [2500, 3400, 4300];

        bandes.forEach((el, i) => {
          // On s'arrête loin dans la bande : le rouleau a le temps de défiler.
          const place = (BOUCLES - 2) * n + places[i];
          const arrivee = -(place - 1) * CASE;   // -1 : la ligne de gain est la case du milieu

          el.classList.add('file');
          // Le style de départ doit être posé avant la transition
          el.style.transitionDuration = '0ms';
          el.style.transform = 'translateY(0px)';
          void el.offsetHeight;
          el.style.transitionDuration = durees[i] + 'ms';
          el.style.transform = 'translateY(' + arrivee + 'px)';

          // Le flou s'enlève juste avant l'arrêt, quand l'œil peut relire
          setTimeout(() => el.classList.remove('file'), Math.max(60, durees[i] - 700));
          // Le rouleau se cale : petit coup sec dans la main
          setTimeout(() => ctx.vibrer(i === 2 ? [20, 50, 30] : 18), durees[i]);
        });

        const fin = durees[2];
        setTimeout(annoncer, fin + (ctx.sobre ? 60 : 500));
        setTimeout(ctx.terminer, fin + (ctx.sobre ? 500 : 2400));
      }

      function annoncer() {
        consigne.textContent = gagne ? 'Ligne gagnante' : 'Pas d’alignement';
        if (gagne) machine.classList.add('gagne');
        // Le lot est tiré avant que les rouleaux tournent : écrire « il
        // s'en est fallu d'un symbole » fabriquerait un presque-gain qui
        // n'a jamais existé.
        // Manche non décisive : on ne parle surtout pas du lot, on dit
        // seulement ce qu'il reste à jouer.
        const restantes = (ctx.manches || 1) - (ctx.manche || 1);
        verdict.textContent = gagne
          ? 'Trois fois le même : ' + ctx.lot.nom
          : (restantes > 0
              ? 'Deux sur trois. La machine passe la main : il reste ' +
                (restantes === 1 ? 'une manche.' : restantes + ' manches.')
              : 'Deux sur trois. La machine s’est arrêtée là.');
        verdict.classList.add('montre');
        ctx.vibrer(gagne ? [70, 50, 130] : 90);
      }
    }
  };

})();
