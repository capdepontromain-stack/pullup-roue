// ============================================================
// JEU « SUIS LE CADEAU »
// Un paquet est marqué d'un sceau doré, puis les trois paquets
// se mélangent sous les yeux du joueur. À lui de retrouver le bon.
//
// Le mélange est VRAI : les paquets échangent réellement leur place,
// et le paquet marqué contient réellement le lot. Rien n'est truqué.
// Le lot, lui, a été tiré et enregistré avant (validerCoordonnees),
// comme pour la roue : suivre le bon paquet ne change pas le lot,
// ça change le plaisir. Un joueur qui se trompe repart quand même
// avec son cadeau : on ne punit jamais un client dans une galerie.
//
// Interface commune à tous les jeux (voir LISEZ-MOI.md) :
//   id, nom, mot, suite, styles, preparer(ctx)
// ============================================================

(function () {

  const STYLES = `
  .bn-plateau { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 14px; }

  .bn-scene {
    position: relative;
    width: 100%;
    max-width: 340px;
    height: 168px;
  }

  .bn-paquet {
    position: absolute;
    top: 0; left: 0;
    width: 32%;
    background: none; border: 0; padding: 0;
    cursor: default;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition-property: transform, opacity, filter;
    transition-timing-function: cubic-bezier(.4,.02,.3,1);
    transition-duration: 0ms, .5s, .5s;
  }
  .bn-scene.choisir .bn-paquet { cursor: pointer; }
  .bn-paquet:focus-visible { outline: 3px solid var(--or-clair); outline-offset: 4px; border-radius: 14px; }

  .bn-svg { width: 100%; height: auto; display: block; overflow: visible; }
  .bn-svg .trait { fill: none; stroke: var(--or-clair); stroke-width: 3.4; stroke-linecap: round; stroke-linejoin: round; }
  .bn-svg .plein { fill: rgba(201,150,46,.13); stroke: none; }

  /* Le sceau doré : il ne s'affiche qu'au tout début, pour désigner le paquet à suivre */
  .bn-sceau {
    position: absolute;
    left: 50%; top: 52%;
    width: 46px; height: 46px;
    margin: -23px 0 0 -23px;
    opacity: 0;
    transition: opacity .45s ease, transform .45s ease;
    transform: scale(.6);
    pointer-events: none;
  }
  .bn-paquet.marque .bn-sceau { opacity: 1; transform: scale(1); }
  .bn-paquet.marque .bn-svg .trait { stroke: var(--or-blanc); }

  .bn-scene.choisir .bn-paquet:active .bn-svg { transform: scale(.94); }
  .bn-svg { transition: transform .2s ease; }

  /* Le paquet qu'on ouvre */
  .bn-lueur {
    position: absolute;
    left: 50%; top: 46%;
    width: 150%; aspect-ratio: 1;
    transform: translate(-50%, -50%) scale(.2);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,233,184,.75) 0%, rgba(239,195,104,.35) 32%, rgba(201,150,46,0) 68%);
    opacity: 0; pointer-events: none;
  }
  .bn-dedans { opacity: 0; }

  .bn-paquet.ouvert .bn-lueur { animation: bn-eclat 1.5s ease-out .12s both; }
  @keyframes bn-eclat {
    0%   { opacity: 0; transform: translate(-50%, -50%) scale(.2); }
    22%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(1.9); }
  }
  .bn-paquet.ouvert .bn-couvercle { animation: bn-couvercle .9s cubic-bezier(.25,.9,.3,1) both; }
  @keyframes bn-couvercle {
    0%   { transform: translate(0,0) rotate(0deg); opacity: 1; }
    18%  { transform: translate(0,5px) rotate(0deg); opacity: 1; }
    100% { transform: translate(-14px,-62px) rotate(-24deg); opacity: 0; }
  }
  .bn-paquet.ouvert.plein .bn-dedans { animation: bn-dedans 1s cubic-bezier(.2,.85,.3,1) .25s both; }
  @keyframes bn-dedans {
    0%   { opacity: 0; transform: translateY(20px); }
    35%  { opacity: 1; }
    100% { opacity: 1; transform: translateY(-38px); }
  }

  /* Un paquet vide : on le voit bien, il ne contient rien */
  .bn-vide {
    position: absolute;
    left: 50%; top: 56%;
    transform: translate(-50%, -50%);
    font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
    font-weight: 700; color: var(--gris);
    opacity: 0; transition: opacity .4s ease .35s;
    pointer-events: none;
  }
  .bn-paquet.ouvert.vide .bn-vide { opacity: 1; }
  .bn-paquet.ouvert.vide .bn-svg .trait { stroke: var(--gris); opacity: .55; }

  .bn-scene.fini .bn-paquet:not(.ouvert) { opacity: .18; filter: grayscale(.5); }

  .bn-consigne {
    font-size: 12.5px; letter-spacing: 1.7px; text-transform: uppercase;
    font-weight: 600; color: var(--gris);
    min-height: 1.2em; text-align: center;
  }
  .bn-verdict {
    font-family: var(--serif); font-weight: 600;
    font-size: 21px; line-height: 1.25;
    color: var(--or-blanc);
    margin: 0; min-height: 1.2em;
    opacity: 0; transform: translateY(8px);
    transition: opacity .5s ease, transform .5s ease;
  }
  .bn-verdict.montre { opacity: 1; transform: none; }

  @media (prefers-reduced-motion: reduce) {
    .bn-paquet.ouvert .bn-lueur,
    .bn-paquet.ouvert .bn-couvercle,
    .bn-paquet.ouvert.plein .bn-dedans { animation-duration: .01s !important; animation-delay: 0s !important; }
    .bn-paquet.ouvert.plein .bn-dedans { opacity: 1; }
  }
  `;

  // Le paquet fermé, dessiné au trait. Le contenu est posé derrière
  // le corps : il monte et sort par le haut quand le couvercle s'envole.
  function dessinerPaquet(traceIcone) {
    return `
    <svg class="bn-svg" viewBox="0 0 120 150" aria-hidden="true">
      <g class="bn-dedans">
        <g transform="translate(29 45) scale(0.62)">
          <g class="trait">${traceIcone}</g>
        </g>
      </g>
      <g class="bn-corps">
        <rect class="plein" x="20" y="74" width="80" height="62" rx="5"/>
        <rect class="trait" x="20" y="74" width="80" height="62" rx="5"/>
        <path class="trait" d="M60 74 v62"/>
      </g>
      <g class="bn-couvercle">
        <rect class="plein" x="12" y="52" width="96" height="24" rx="5"/>
        <rect class="trait" x="12" y="52" width="96" height="24" rx="5"/>
        <path class="trait" d="M60 52 c-18 0 -26 -24 -11 -24 c11 0 11 16 11 24 z"/>
        <path class="trait" d="M60 52 c18 0 26 -24 11 -24 c-11 0 -11 16 -11 24 z"/>
        <path class="trait" d="M60 52 v24"/>
      </g>
    </svg>`;
  }

  // Le sceau doré du paquet à suivre : une étoile cerclée, dessinée au trait
  const SCEAU = `
    <svg class="bn-sceau" viewBox="0 0 60 60" fill="none" stroke="#FFE9B8" stroke-width="3"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="30" cy="30" r="24" fill="rgba(20,16,9,.72)"/>
      <path d="M30 15 l4.6 9.7 l10.4 1.4 l-7.6 7.3 l1.9 10.6 L30 39 l-9.3 5 l1.9 -10.6 l-7.6 -7.3 l10.4 -1.4 z"/>
    </svg>`;

  window.PullUpJeux = window.PullUpJeux || {};

  // Deux clés pour le même jeu : « suiscadeau » est le nom propre, et
  // « bonneteau » reste accepté parce que des opérations enregistrées en
  // base peuvent encore porter cet identifiant. Le mot ne sort jamais de
  // la maison : il n'est plus ni dans l'adresse du fichier, ni à l'écran.
  const SUIS_LE_CADEAU = {
    id: 'suiscadeau',
    nom: 'Suis le Cadeau',
    mot: 'la hotte',                        // « la hotte a parlé… »
    suite: 'Ouvre l’œil, ça va bouger.',    // phrase affichée à la fin du ticket à gratter
    styles: STYLES,

    preparer(ctx) {
      // RÈGLE D'OR : en manche non décisive, ni le nom ni l'icône du
      // lot n'apparaissent. Icône neutre, verdict qui passe la main.
      const decisif = ctx.decisif !== false;
      const trace = decisif ? ctx.icone(ctx.lot.nom) : (ctx.icones && ctx.icones.etoile) || ctx.icone('');

      ctx.zone.innerHTML = `
        <h2>Suis bien ton paquet</h2>
        <p class="question-soustitre">Un paquet est marqué. Ne le quitte pas des yeux pendant le mélange.</p>
        <div class="bn-plateau">
          <div class="bn-scene" id="bn-scene">
            ${[0, 1, 2].map(i => `
              <button type="button" class="bn-paquet" data-i="${i}" id="bn-paquet-${i}"
                      aria-label="Paquet ${i + 1}">
                <span class="bn-lueur" aria-hidden="true"></span>
                ${dessinerPaquet(trace)}
                ${SCEAU}
                <span class="bn-vide">Vide</span>
              </button>`).join('')}
          </div>
          <span class="bn-consigne" id="bn-consigne">Regarde bien…</span>
          <p class="bn-verdict" id="bn-verdict" role="status"></p>
        </div>
      `;

      const scene = ctx.zone.querySelector('#bn-scene');
      const consigne = ctx.zone.querySelector('#bn-consigne');
      const verdict = ctx.zone.querySelector('#bn-verdict');
      const paquets = [0, 1, 2].map(i => ctx.zone.querySelector('#bn-paquet-' + i));

      // Le paquet n° « bon » contient réellement le lot.
      const bon = Math.floor(Math.random() * 3);
      const place = [0, 1, 2];                 // place[i] = la case où se trouve le paquet i
      const minuteries = [];
      const plusTard = (fn, ms) => { minuteries.push(setTimeout(fn, ms)); };
      let phase = 'intro';

      // Une case fait 32 % de la scène, plus 2 % d'écart : un pas vaut
      // 106,25 % de la largeur d'un paquet.
      function poser(i, caseVoulue, y, ms) {
        const el = paquets[i];
        el.style.transitionDuration = ms + 'ms, .5s, .5s';
        el.style.transform = 'translate(' + (caseVoulue * 106.25) + '%, ' + y + 'px)';
      }

      paquets.forEach((el, i) => poser(i, i, 0, 0));

      // Un échange : les deux paquets se croisent, l'un passe devant l'autre.
      function echanger(a, b, duree) {
        const ca = place[a], cb = place[b];
        const milieu = (ca + cb) / 2;
        paquets[a].style.zIndex = 3;
        paquets[b].style.zIndex = 1;
        poser(a, milieu, -30, duree / 2);
        poser(b, milieu, 26, duree / 2);
        plusTard(() => { poser(a, cb, 0, duree / 2); poser(b, ca, 0, duree / 2); }, duree / 2);
        place[a] = cb;
        place[b] = ca;
      }

      function melanger() {
        phase = 'melange';
        consigne.textContent = 'Ça mélange…';
        const paires = [[0, 1], [1, 2], [0, 2]];
        const nb = ctx.sobre ? 3 : 6;
        let t = 0;
        for (let k = 0; k < nb; k++) {
          const duree = ctx.sobre ? 180 : Math.round(620 - k * 42);
          const paire = paires[Math.floor(Math.random() * paires.length)];
          const retard = t;
          plusTard(() => { echanger(paire[0], paire[1], duree); ctx.vibrer(8); }, retard);
          t += duree + 40;
        }
        plusTard(choisir, t + 220);
      }

      function choisir() {
        phase = 'choix';
        scene.classList.add('choisir');
        consigne.textContent = 'Où est ton paquet ?';
        ctx.vibrer(25);
      }

      function ouvrir(i, avecLot) {
        paquets[i].classList.add('ouvert', avecLot ? 'plein' : 'vide');
      }

      function toucher(i) {
        if (phase !== 'choix') return;
        phase = 'fini';
        scene.classList.add('fini');
        scene.classList.remove('choisir');
        const juste = (i === bon);
        consigne.textContent = juste ? 'Bien suivi !' : 'Perdu de vue !';
        ctx.vibrer(juste ? [25, 45, 25] : 60);

        ouvrir(i, juste);

        if (juste) {
          plusTard(() => {
            verdict.textContent = decisif ? ctx.lot.nom
              : 'Bien joué. La suite se joue à la manche d’après.';
            verdict.classList.add('montre');
            ctx.vibrer(ctx.lot.perdant ? 90 : [70, 50, 130]);
          }, ctx.sobre ? 120 : 950);
          plusTard(ctx.terminer, ctx.sobre ? 800 : 2500);
        } else {
          // Le paquet marqué s'ouvre à son tour : le joueur voit où il était,
          // et repart quand même avec ce qu'il contenait.
          plusTard(() => {
            consigne.textContent = 'Il était là';
            ouvrir(bon, true);
            ctx.vibrer(20);
          }, ctx.sobre ? 150 : 1100);
          plusTard(() => {
            verdict.textContent = decisif ? ctx.lot.nom
              : 'Perdu de vue… mais rien n’est joué : la suite arrive.';
            verdict.classList.add('montre');
            ctx.vibrer(ctx.lot.perdant ? 90 : [70, 50, 130]);
          }, ctx.sobre ? 300 : 2050);
          plusTard(ctx.terminer, ctx.sobre ? 900 : 3600);
        }
      }

      paquets.forEach((el, i) => {
        el.addEventListener('pointerdown', () => toucher(i));
        el.addEventListener('click', () => toucher(i));
      });

      // Le sceau se montre, puis s'efface : le mélange peut commencer.
      plusTard(() => {
        paquets[bon].classList.add('marque');
        consigne.textContent = 'Celui-ci est le tien';
        ctx.vibrer(20);
      }, ctx.sobre ? 60 : 500);
      plusTard(() => paquets[bon].classList.remove('marque'), ctx.sobre ? 400 : 2100);
      plusTard(melanger, ctx.sobre ? 600 : 2500);

      // Filet : si personne ne touche l'écran, un paquet s'ouvre tout seul.
      plusTard(() => { if (phase === 'choix') toucher(bon); }, 30000);
    }
  };

  window.PullUpJeux.suiscadeau = SUIS_LE_CADEAU;
  window.PullUpJeux.bonneteau = SUIS_LE_CADEAU;   // ancien identifiant, gardé pour la base

})();
