// ============================================================
// JEU « LES TROIS PAQUETS »
// Trois cadeaux fermés. Le joueur en touche un, il s'ouvre.
// Le lot a déjà été tiré et enregistré avant : ce jeu le révèle,
// exactement comme la roue révèle son segment.
//
// Interface commune à tous les jeux (voir LISEZ-MOI.md) :
//   id, nom, mot, suite, styles, preparer(ctx)
// ============================================================

(function () {

  const STYLES = `
  .paquets-plateau { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 18px; }

  .paquets {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    width: 100%;
    max-width: 360px;
  }

  .paquet {
    position: relative;
    background: none;
    border: 0;
    padding: 6px 0 0;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition: transform .45s cubic-bezier(.2,.8,.3,1), opacity .5s ease, filter .5s ease;
  }
  .paquet:focus-visible { outline: 3px solid var(--or-clair); outline-offset: 4px; border-radius: 16px; }

  /* Les paquets respirent doucement : ils ont l'air vivants, prêts à être choisis */
  .paquet-scene {
    position: relative;
    width: 100%;
    display: block;
    animation: paquet-flotte 3.4s ease-in-out infinite;
  }
  .paquet:nth-child(2) .paquet-scene { animation-delay: -1.1s; }
  .paquet:nth-child(3) .paquet-scene { animation-delay: -2.2s; }
  @keyframes paquet-flotte {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50%      { transform: translateY(-6px) rotate(-1.2deg); }
  }

  .paquet-svg { width: 100%; height: auto; display: block; overflow: visible; }
  .paquet-svg .trait { fill: none; stroke: var(--or-clair); stroke-width: 3.4; stroke-linecap: round; stroke-linejoin: round; }
  .paquet-svg .plein { fill: rgba(201,150,46,.13); stroke: none; }

  .paquet-num {
    font-family: var(--serif);
    font-size: 17px;
    /* var(--gris) et pas un crème en dur : sur le thème clair, le
       crème disparaissait complètement du fond de page. */
    color: var(--gris);
    line-height: 1;
    transition: color .4s ease, opacity .4s ease;
  }

  /* La lueur dorée qui jaillit du paquet quand il s'ouvre */
  .paquet-lueur {
    position: absolute;
    left: 50%; top: 46%;
    width: 150%; aspect-ratio: 1;
    transform: translate(-50%, -50%) scale(.2);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,233,184,.75) 0%, rgba(239,195,104,.35) 32%, rgba(201,150,46,0) 68%);
    opacity: 0;
    pointer-events: none;
  }

  .paquet-dedans { opacity: 0; }

  /* Au doigt : le paquet s'enfonce légèrement */
  .paquet:active .paquet-scene { transform: scale(.94); }

  /* --- L'ouverture --- */
  .paquets.joue .paquet { pointer-events: none; }
  .paquets.joue .paquet-scene { animation: none; }

  .paquets.joue .paquet:not(.choisi) {
    opacity: .2;
    transform: scale(.86) translateY(6px);
    filter: grayscale(.5);
  }
  .paquets.joue .paquet:not(.choisi) .paquet-num { opacity: 0; }

  .paquet.choisi { transform: scale(1.06); }
  .paquet.choisi .paquet-num { color: var(--or-clair); }

  .paquet.choisi .paquet-lueur { animation: paquet-eclat 1.5s ease-out .18s both; }
  @keyframes paquet-eclat {
    0%   { opacity: 0; transform: translate(-50%, -50%) scale(.2); }
    22%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(1.9); }
  }

  .paquet.choisi .paquet-couvercle { animation: paquet-couvercle .95s cubic-bezier(.25,.9,.3,1) both; }
  @keyframes paquet-couvercle {
    0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
    18%  { transform: translate(0, 5px) rotate(0deg); opacity: 1; }
    100% { transform: translate(-14px, -66px) rotate(-24deg); opacity: 0; }
  }

  .paquet.choisi .paquet-corps { animation: paquet-corps .95s cubic-bezier(.25,.9,.3,1) both; }
  @keyframes paquet-corps {
    0%   { transform: scaleY(1); }
    20%  { transform: scaleY(.93); }
    55%  { transform: scaleY(1.04); }
    100% { transform: scaleY(1); }
  }

  .paquet.choisi .paquet-dedans { animation: paquet-dedans 1s cubic-bezier(.2,.85,.3,1) .3s both; }
  @keyframes paquet-dedans {
    0%   { opacity: 0; transform: translateY(20px); }
    35%  { opacity: 1; }
    100% { opacity: 1; transform: translateY(-38px); }
  }

  .paquet-lot {
    font-family: var(--serif);
    font-weight: 600;
    font-size: 21px;
    line-height: 1.25;
    color: var(--or-blanc);
    margin: 0;
    min-height: 1.2em;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity .5s ease, transform .5s ease;
  }
  .paquet-lot.montre { opacity: 1; transform: none; }

  @media (prefers-reduced-motion: reduce) {
    .paquet-scene { animation: none !important; }
    .paquet.choisi .paquet-lueur,
    .paquet.choisi .paquet-couvercle,
    .paquet.choisi .paquet-corps,
    .paquet.choisi .paquet-dedans { animation-duration: .01s !important; animation-delay: 0s !important; }
    .paquet.choisi .paquet-dedans { opacity: 1; }
  }
  `;

  // Le paquet fermé, dessiné au trait : couvercle, nœud, corps, ruban.
  // Le contenu (l'icône du lot) est posé DERRIÈRE le corps : il monte
  // et sort par le haut quand le couvercle s'envole.
  function dessinerPaquet(traceIcone) {
    return `
    <svg class="paquet-svg" viewBox="0 0 120 150" aria-hidden="true">
      <g class="paquet-dedans">
        <g transform="translate(29 45) scale(0.62)">
          <g class="trait">${traceIcone}</g>
        </g>
      </g>
      <g class="paquet-corps" style="transform-origin: 60px 138px;">
        <rect class="plein" x="20" y="74" width="80" height="62" rx="5"/>
        <rect class="trait" x="20" y="74" width="80" height="62" rx="5"/>
        <path class="trait" d="M60 74 v62"/>
      </g>
      <g class="paquet-couvercle">
        <rect class="plein" x="12" y="52" width="96" height="24" rx="5"/>
        <rect class="trait" x="12" y="52" width="96" height="24" rx="5"/>
        <path class="trait" d="M60 52 c-18 0 -26 -24 -11 -24 c11 0 11 16 11 24 z"/>
        <path class="trait" d="M60 52 c18 0 26 -24 11 -24 c-11 0 -11 16 -11 24 z"/>
        <path class="trait" d="M60 52 v24"/>
      </g>
    </svg>`;
  }

  window.PullUpJeux = window.PullUpJeux || {};

  window.PullUpJeux.paquets = {
    id: 'paquets',
    nom: 'Les Trois Paquets',
    mot: 'le paquet',                       // « le paquet a parlé… »
    suite: 'Trois paquets t’attendent.',    // phrase affichée à la fin du ticket à gratter
    styles: STYLES,

    preparer(ctx) {
      // RÈGLE D'OR : en manche non décisive, le jeu ne révèle ni ne
      // nomme JAMAIS le lot (voir LISEZ-MOI). L'icône devient neutre
      // (une étoile) et le verdict renvoie vers la suite.
      const decisif = ctx.decisif !== false;
      const trace = decisif ? ctx.icone(ctx.lot.nom) : (ctx.icones && ctx.icones.etoile) || ctx.icone('');

      ctx.zone.innerHTML = `
        <h2>Choisis ton paquet</h2>
        <p class="question-soustitre">Trois cadeaux, un seul est pour toi. Touche celui qui t’attire.</p>
        <div class="paquets-plateau">
          <div class="paquets" id="paquets-grille">
            ${[1, 2, 3].map(n => `
              <button type="button" class="paquet" data-num="${n}" aria-label="Ouvrir le paquet ${n}">
                <span class="paquet-scene">
                  <span class="paquet-lueur" aria-hidden="true"></span>
                  ${dessinerPaquet(trace)}
                </span>
                <span class="paquet-num">${n}</span>
              </button>`).join('')}
          </div>
          <p class="paquet-lot" id="paquet-lot" role="status"></p>
        </div>
      `;

      const grille = ctx.zone.querySelector('#paquets-grille');
      const nomLot = ctx.zone.querySelector('#paquet-lot');
      let joue = false;

      function ouvrir(paquet) {
        if (joue) return;
        joue = true;
        grille.classList.add('joue');
        paquet.classList.add('choisi');
        ctx.vibrer([25, 45, 25]);

        // Le nom du lot arrive juste après que le contenu soit sorti du
        // paquet, et SEULEMENT en manche décisive : avant la dernière
        // manche, le paquet passe la main sans rien promettre.
        setTimeout(() => {
          nomLot.textContent = decisif
            ? ctx.lot.nom
            : 'Le paquet passe la main. La suite se joue à la manche d’après.';
          nomLot.classList.add('montre');
          ctx.vibrer(ctx.lot.perdant ? 90 : [70, 50, 130]);
        }, ctx.sobre ? 120 : 950);

        // Puis on passe à l'écran de résultat, qui annonce tout en grand
        setTimeout(ctx.terminer, ctx.sobre ? 800 : 2500);
      }

      grille.querySelectorAll('.paquet').forEach(paquet => {
        // pointerdown : la réponse est immédiate au doigt, sans les 300 ms du clic
        paquet.addEventListener('pointerdown', () => ouvrir(paquet));
        paquet.addEventListener('click', () => ouvrir(paquet));
      });
    }
  };

})();
