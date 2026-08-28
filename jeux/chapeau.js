// ============================================================
// JEU « LE CHAPEAU DU MAGICIEN »
// Trois hauts-de-forme posés sur la piste. Le joueur en désigne
// un, le magicien le soulève : le lapin s'en échappe, ou pas.
//
// Écrit le 26/08/2026 pour l'univers du cirque de Cap Sacré-Cœur.
// C'est le numéro le plus reconnaissable d'un magicien, il tient
// en un geste, et il se comprend sans une seule ligne de règle.
//
// HONNÊTETÉ, comme dans tous les autres jeux : le lot est tiré et
// enregistré AVANT que le joueur touche un chapeau. Le jeu ne
// recrée aucune probabilité, il met en scène un résultat déjà
// écrit :
//   - manche décisive gagnée : le lapin sort du chapeau choisi ;
//   - manche décisive perdue : le chapeau choisi est vide, et
//     c'est LE MAGICIEN qui soulève ensuite celui où il était.
//     Le joueur voit le presque-gain sans avoir rien à se
//     reprocher, et l'écran le dit en toutes lettres ;
//   - manche non décisive : un nuage d'étoiles, le numéro
//     continue. On ne parle jamais du lot avant la fin.
//
// Interface commune à tous les jeux (voir LISEZ-MOI.md) :
//   id, nom, mot, suite, styles, preparer(ctx)
// ============================================================

(function () {

  // --------------------------------------------------------
  // LES DESSINS, au trait, dans la grille 100 x 100 des icônes
  // du jeu. Aucun émoji : tout est dessiné, comme partout
  // ailleurs dans l'application.
  // --------------------------------------------------------

  // Le haut-de-forme, vu de face : calotte haute légèrement évasée,
  // ruban large, bord fin et courbe. Un chapeau de magicien se
  // reconnaît à sa hauteur, pas à sa largeur.
  const CHAPEAU = `
    <path d="M33 20 c0 -3 34 -3 34 0 v34 h-34 z"/>
    <path d="M33 48 h34" stroke-width="9" stroke-linecap="butt"/>
    <path d="M16 62 c0 -6 15 -9 34 -9 s34 3 34 9 s-15 9 -34 9 s-34 -3 -34 -9 z"/>`;

  // Le lapin du magicien. Trois essais de colombe au trait n'ont jamais
  // donné autre chose qu'un gribouillis : le lapin, lui, se reconnaît à
  // ses deux oreilles, et c'est LE cliché du chapeau. Vérifié à l'écran
  // avant d'être retenu.
  const LAPIN = `
    <path d="M38 48 c-5 -13 -5 -26 0 -28 c5 -2 10 10 10 24"/>
    <path d="M62 48 c5 -13 5 -26 0 -28 c-5 -2 -10 10 -10 24"/>
    <circle cx="50" cy="64" r="18"/>
    <circle cx="43" cy="61" r="2.2"/><circle cx="57" cy="61" r="2.2"/>
    <path d="M50 68 v3"/>
    <path d="M50 71 c-3 4 -8 3 -9 -1"/>
    <path d="M50 71 c3 4 8 3 9 -1"/>`;

  // Les étoiles : la magie a opéré, mais rien n'est encore sorti. C'est
  // ce que voit le joueur dans une manche de passage.
  const ETOILES = `
    <path d="M50 14 l6 20 l20 6 l-20 6 l-6 20 l-6 -20 l-20 -6 l20 -6 z"/>
    <path d="M78 60 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 l9 -3 z"/>
    <path d="M22 58 l2.5 7 l7 2.5 l-7 2.5 l-2.5 7 l-2.5 -7 l-7 -2.5 l7 -2.5 z"/>`;

  // L'étincelle de la bouffée de magie
  const ETINCELLE = `
    <path d="M50 12 l7 26 l26 7 l-26 7 l-7 26 l-7 -26 l-26 -7 l26 -7 z"/>`;

  const STYLES = `
  .ch-piste {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(6px, 2.4vw, 14px);
    margin: var(--e6) auto var(--e6);
    width: 100%;
    max-width: 400px;
    align-items: end;
  }

  .ch-place:focus-visible { outline: 3px solid var(--or-clair); outline-offset: 3px; }
  .ch-place {
    position: relative;
    background: none;
    border: 0;
    padding: 0 0 14px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: ch-entre .5s var(--signature) backwards;
  }
  .ch-place:nth-child(2) { animation-delay: .08s; }
  .ch-place:nth-child(3) { animation-delay: .16s; }
  @keyframes ch-entre {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: none; }
  }

  /* Le tapis de la piste sous chaque chapeau */
  .ch-tapis {
    position: absolute;
    bottom: 0; left: 50%;
    transform: translateX(-50%);
    width: 86%; height: 14px;
    border-radius: 50%;
    background: radial-gradient(ellipse at 50% 50%,
      rgba(255, 236, 190, .34) 0%, rgba(180, 120, 50, .12) 52%, transparent 78%);
    filter: blur(2px);
  }

  .ch-chapeau {
    position: relative;
    z-index: 2;
    width: 100%;
    aspect-ratio: 1 / 1;
    display: grid;
    place-items: center;
    transition: transform .45s var(--signature);
  }
  .ch-chapeau svg { width: 100%; height: 100%; }
  .ch-chapeau .trait {
    fill: none;
    stroke: var(--or-clair);
    stroke-width: 4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* L'appel : les chapeaux respirent l'un après l'autre */
  .ch-place:not(.ch-joue) .ch-chapeau { animation: ch-appelle 3s ease-in-out infinite; }
  .ch-place:nth-child(2):not(.ch-joue) .ch-chapeau { animation-delay: .35s; }
  .ch-place:nth-child(3):not(.ch-joue) .ch-chapeau { animation-delay: .7s; }
  @keyframes ch-appelle {
    0%, 82%, 100% { transform: translateY(0); }
    90%           { transform: translateY(-5px); }
  }

  /* Le chapeau se soulève : il monte et bascule, comme au poignet */
  .ch-place.ch-souleve .ch-chapeau {
    transform: translateY(-62%) rotate(-18deg);
    animation: none;
  }
  .ch-place.ch-vide .ch-chapeau .trait { stroke: rgba(246, 241, 230, .34); }
  body.theme-csc .ch-place.ch-vide .ch-chapeau .trait { stroke: rgba(23, 34, 44, .32); }

  /* Ce qui sort du chapeau, posé dessous, révélé au soulèvement */
  .ch-dessous {
    position: absolute;
    z-index: 1;
    bottom: 14%;
    left: 50%;
    width: 78%;
    transform: translate(-50%, 6px);
    opacity: 0;
    transition: opacity .4s ease, transform .6s var(--signature);
  }
  .ch-dessous svg { width: 100%; height: auto; }
  .ch-dessous .trait { fill: none; stroke-width: 4.5; stroke-linecap: round; stroke-linejoin: round; }
  .ch-place.ch-montre .ch-dessous { opacity: 1; transform: translate(-50%, -34%); }
  .ch-lapin .trait   { stroke: var(--or-blanc); }
  .ch-etoiles .trait { stroke: var(--or-clair); }

  /* La bouffée d'étincelles au moment où le chapeau se lève */
  .ch-etincelles {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
  }
  .ch-etincelle {
    position: absolute;
    width: 13px; height: 13px;
    opacity: 0;
  }
  .ch-etincelle svg { width: 100%; height: 100%; fill: var(--or-blanc); }
  .ch-place.ch-souleve .ch-etincelle { animation: ch-etincelle .9s ease-out forwards; }
  @keyframes ch-etincelle {
    0%   { opacity: 0; transform: translate(0, 0) scale(.4); }
    30%  { opacity: 1; }
    100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1.1); }
  }

  .ch-verdict {
    font-family: var(--serif); font-weight: 600;
    font-size: 21px; line-height: 1.25;
    color: var(--or-blanc);
    min-height: 1.2em;
    opacity: 0; transform: translateY(8px);
    transition: opacity .5s ease, transform .5s ease;
  }
  .ch-verdict.montre { opacity: 1; transform: none; }
  .ch-verdict small {
    display: block;
    margin-top: 6px;
    font-family: var(--sans);
    font-size: var(--t-petit);
    font-weight: 400;
    color: var(--gris);
    line-height: 1.45;
  }

  @media (prefers-reduced-motion: reduce) {
    .ch-place, .ch-chapeau, .ch-etincelle { animation: none !important; }
    .ch-chapeau, .ch-dessous { transition-duration: .01s !important; }
  }
  `;

  function melanger(liste) {
    const t = liste.slice();
    for (let i = t.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [t[i], t[j]] = [t[j], t[i]];
    }
    return t;
  }

  window.PullUpJeux = window.PullUpJeux || {};

  window.PullUpJeux.chapeau = {
    id: 'chapeau',
    nom: 'Le Chapeau du Magicien',
    mot: 'le chapeau',                                  // « le chapeau a hésité… »
    suite: 'Trois chapeaux t’attendent sur la piste.',  // fin du billet d'entrée
    styles: STYLES,

    preparer(ctx) {
      // Une manche qui n'est pas la dernière ne révèle jamais le lot :
      // elle se joue « tout près » et passe la main.
      const decisif = ctx.decisif !== false;
      const gagne = decisif && !ctx.lot.perdant;
      // Où se cache le lapin, écrit avant que le joueur ne touche
      // quoi que ce soit.
      const places = [0, 1, 2];
      const cachette = melanger(places)[0];

      const etincelles = Array.from({ length: 7 }, (_, i) => {
        const angle = (-120 + i * 24) * Math.PI / 180;
        const dx = Math.round(Math.cos(angle) * 46);
        const dy = Math.round(Math.sin(angle) * 46);
        return `<span class="ch-etincelle" style="left:44%; top:38%; --dx:${dx}px; --dy:${dy}px; animation-delay:${(i * 0.045).toFixed(2)}s">
                  <svg viewBox="0 0 100 100" aria-hidden="true">${ETINCELLE}</svg>
                </span>`;
      }).join('');

      const place = i => `
        <button type="button" class="ch-place" id="ch-place-${i}"
                aria-label="Chapeau ${i + 1}">
          <span class="ch-tapis" aria-hidden="true"></span>
          <span class="ch-dessous" id="ch-dessous-${i}" aria-hidden="true"></span>
          <span class="ch-chapeau" aria-hidden="true">
            <svg viewBox="0 0 100 100"><g class="trait">${CHAPEAU}</g></svg>
          </span>
          <span class="ch-etincelles" aria-hidden="true">${etincelles}</span>
        </button>`;

      ctx.zone.innerHTML = `
        <div class="jeu-tete">
          <h2>Le Chapeau du Magicien</h2>
          <p class="question-soustitre" id="ch-consigne">Choisis un chapeau. Le magicien le soulève.</p>
        </div>
        <div class="ch-piste" id="ch-piste">${places.map(place).join('')}</div>
        <p class="ch-verdict" id="ch-verdict" role="status"></p>
      `;

      const verdict = ctx.zone.querySelector('#ch-verdict');
      const boutons = places.map(i => ctx.zone.querySelector('#ch-place-' + i));
      let joue = false;

      function ecrire(titre, detail) {
        verdict.innerHTML = ctx.echap(titre) + (detail ? '<small>' + ctx.echap(detail) + '</small>' : '');
        verdict.classList.add('montre');
      }

      function garnir(i, quoi) {
        const el = ctx.zone.querySelector('#ch-dessous-' + i);
        const classe = quoi === 'lapin' ? 'ch-lapin' : 'ch-etoiles';
        const dessin = quoi === 'lapin' ? LAPIN : ETOILES;
        el.className = 'ch-dessous ' + classe;
        el.innerHTML = `<svg viewBox="0 0 100 100"><g class="trait">${dessin}</g></svg>`;
      }

      function soulever(i, quoi) {
        if (quoi) garnir(i, quoi);
        boutons[i].classList.add('ch-souleve');
        if (!quoi) boutons[i].classList.add('ch-vide');
        setTimeout(() => boutons[i].classList.add('ch-montre'), ctx.sobre ? 20 : 260);
      }

      boutons.forEach((btn, i) => {
        btn.addEventListener('click', () => {
          if (joue) return;
          joue = true;
          boutons.forEach(b => { b.classList.add('ch-joue'); b.disabled = true; });
          ctx.vibrer(30);
          ctx.zone.querySelector('#ch-consigne').textContent = 'Et voilà…';

          if (!decisif) {
            // Manche de passage : un nuage d'étoiles, rien n'est dit
            // du lot, et le numéro continue.
            soulever(i, 'etoiles');
            const restantes = (ctx.manches || 1) - (ctx.manche || 1);
            setTimeout(() => {
              ctx.vibrer(60);
              ecrire('Juste un nuage d’étoiles.',
                     restantes === 1 ? 'Il reste une manche.' : 'Il reste ' + restantes + ' manches.');
            }, ctx.sobre ? 60 : 900);
            setTimeout(ctx.terminer, ctx.sobre ? 700 : 2600);
            return;
          }

          if (gagne) {
            // Le chapeau choisi est le bon : c'est la règle de la mise
            // en scène, le résultat était écrit avant le premier clic.
            soulever(i, 'lapin');
            setTimeout(() => {
              ctx.vibrer([40, 60, 40]);
              ecrire('Le lapin sort du chapeau !', 'Le magicien te salue.');
            }, ctx.sobre ? 60 : 950);
            setTimeout(ctx.terminer, ctx.sobre ? 700 : 3000);
            return;
          }

          // Perdu : le chapeau choisi est vide, puis LE MAGICIEN
          // soulève lui-même celui où était le lapin. Le joueur voit
          // le presque-gain sans avoir rien à se reprocher.
          soulever(i, null);
          const autre = cachette === i ? (i + 1) % 3 : cachette;
          setTimeout(() => {
            ctx.vibrer(70);
            ecrire('Ce chapeau était vide.');
          }, ctx.sobre ? 40 : 800);
          setTimeout(() => soulever(autre, 'lapin'), ctx.sobre ? 80 : 1500);
          setTimeout(() => {
            ecrire('Il était là.',
                   'Ton lot était tiré avant que tu choisisses : aucun autre chapeau n’y aurait rien changé.');
          }, ctx.sobre ? 120 : 2300);
          setTimeout(ctx.terminer, ctx.sobre ? 700 : 4200);
        });
      });
    }
  };

})();
