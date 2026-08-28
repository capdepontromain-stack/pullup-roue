// ============================================================
// JEU « LE SAPIN DE LA GALERIE »
// Cinq boules à accrocher sur le grand sapin, une par une, là où
// le joueur veut. Quand la dernière est posée, l'étoile s'allume
// au sommet, ou pas.
//
// C'est le jeu de Noël du lot : pas de fête foraine, pas de
// chapiteau, le sapin de la galerie et rien d'autre. Il se joue
// aussi bien avec un enfant de quatre ans sur les genoux, ce qui
// n'est le cas d'aucun des autres.
//
// HONNÊTETÉ (la règle de toute l'application) : le lot est tiré et
// enregistré par le serveur AVANT que le joueur touche l'écran. Le
// jeu ne crée aucune probabilité, il met en scène un résultat déjà
// écrit :
//   - gagnant : les cinq boules tiennent, l'étoile s'allume ;
//   - perdant : la cinquième glisse de sa branche et roule au pied
//               du sapin. L'étoile reste éteinte, à une boule près.
// L'endroit où le joueur accroche ne change rien, et la phrase de
// fin le dit franchement.
//
// Interface commune à tous les jeux (voir LISEZ-MOI.md) :
//   id, nom, mot, suite, styles, preparer(ctx)
// ============================================================

(function () {

  const NB_BOULES = 5;

  // Les cinq crochets, en pourcentage de la scène. Ils suivent la
  // silhouette du sapin : large en bas, resserré en haut, jamais deux
  // à la même hauteur. C'est ce qui donne l'air d'un vrai sapin
  // décoré plutôt que d'une grille de cases.
  const CROCHETS = [
    { x: 50, y: 30 },
    { x: 33, y: 45 },
    { x: 66, y: 47 },
    { x: 24, y: 63 },
    { x: 74, y: 65 }
  ];

  // Les couleurs des boules, dans l'ordre où on les accroche.
  const BOULES = [
    { corps: '#A81B1F', reflet: '#E8686C' },
    { corps: '#C9962E', reflet: '#FFE9B8' },
    { corps: '#F3E7D3', reflet: '#FFFFFF' },
    { corps: '#7A1F5E', reflet: '#C56BA8' },
    { corps: '#1F6F63', reflet: '#6BC0B2' }
  ];

  function boule(n) {
    const b = BOULES[n % BOULES.length];
    return `
    <svg viewBox="0 0 34 42" width="30" height="37" aria-hidden="true">
      <defs>
        <radialGradient id="sap-b${n}" cx="36%" cy="30%" r="72%">
          <stop offset="0%"   stop-color="${b.reflet}"/>
          <stop offset="52%"  stop-color="${b.corps}"/>
          <stop offset="100%" stop-color="rgba(0,0,0,.55)"/>
        </radialGradient>
      </defs>
      <path d="M17 3 v6" stroke="#C9962E" stroke-width="2" stroke-linecap="round"/>
      <rect x="13" y="7" width="8" height="5" rx="1.5" fill="#C9962E"/>
      <circle cx="17" cy="26" r="14" fill="url(#sap-b${n})"/>
      <ellipse cx="12" cy="20" rx="4" ry="2.6" fill="rgba(255,255,255,.45)"
               transform="rotate(-28 12 20)"/>
    </svg>`;
  }

  const STYLES = `
  .sap-plateau { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px; }

  /* LA GALERIE, DE NUIT, AUTOUR DU SAPIN */
  .sap-scene {
    position: relative;
    width: 100%;
    max-width: 348px;
    height: 336px;
    border-radius: 18px;
    overflow: hidden;
    background:
      radial-gradient(ellipse 60% 40% at 50% 96%, rgba(201,150,46,.22) 0%, transparent 66%),
      linear-gradient(180deg, #101A16 0%, #0D1512 44%, #140C08 100%);
    border: 1.5px solid rgba(201,150,46,.42);
    box-shadow: inset 0 2px 0 rgba(255,233,184,.12), 0 16px 38px rgba(0,0,0,.55);
  }

  /* Le sol de la galerie, et l'ombre du sapin dessus. */
  .sap-sol {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 44px;
    background: linear-gradient(180deg, rgba(255,233,184,.10), rgba(255,233,184,.02));
    border-top: 1px solid rgba(201,150,46,.3);
  }

  /* LE SAPIN
     Trois étages de branches et un tronc. Chaque étage est un
     triangle découpé au clip-path, ce qui permet, contrairement au
     vieux truc des bordures, de lui donner un vrai dégradé : clair
     du côté de la lumière, sombre de l'autre. C'est ce dégradé qui
     empêche le sapin d'avoir l'air d'un logo découpé dans du papier.
     Une photographie, elle, n'aurait pas ce détourage net sur fond
     sombre, et pèserait cent fois plus lourd. */
  .sap-arbre { position: absolute; left: 0; right: 0; bottom: 34px; height: 274px; }
  .sap-etage {
    position: absolute;
    left: 50%;
    clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
    background:
      linear-gradient(102deg,
        #35806B 0%, #2C6D5B 30%, #23594A 58%, #174035 100%);
    filter: drop-shadow(0 8px 16px rgba(0,0,0,.55));
  }
  /* La neige posée sur le bord de chaque étage : une bande claire
     qui suit exactement la même découpe, décalée de quelques
     pixels vers le bas. Trois pixels, et le sapin sort du plat. */
  .sap-neige {
    position: absolute;
    left: 50%;
    clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
    background: linear-gradient(180deg, rgba(246,241,230,0) 86%, rgba(246,241,230,.62) 100%);
    pointer-events: none;
  }
  .sap-e1, .sap-n1 { bottom: 0;   margin-left: -104px; width: 208px; height: 116px; }
  .sap-e2, .sap-n2 { bottom: 88px; margin-left: -84px;  width: 168px; height: 98px; }
  .sap-e3, .sap-n3 { bottom: 166px; margin-left: -60px; width: 120px; height: 84px; }
  .sap-n1, .sap-n2, .sap-n3 { z-index: 2; }
  .sap-tronc {
    position: absolute;
    left: 50%; bottom: -16px; margin-left: -14px;
    width: 28px; height: 24px;
    border-radius: 3px 3px 4px 4px;
    background: linear-gradient(100deg, #7A4E1B 0%, #5A3814 52%, #3A2510 100%);
    box-shadow: 0 4px 10px rgba(0,0,0,.6);
  }

  /* La guirlande : des points de lumière posés sur les branches.
     Ils s'allument au fur et à mesure que les boules arrivent. */
  .sap-guirlande { position: absolute; inset: 0; pointer-events: none; }
  .sap-guirlande i {
    position: absolute;
    width: 5px; height: 5px;
    margin: -2.5px 0 0 -2.5px;
    border-radius: 50%;
    background: rgba(255,233,184,.22);
    transition: background .5s ease, box-shadow .5s ease;
  }
  .sap-guirlande i.allumee {
    background: #FFE9B8;
    box-shadow: 0 0 9px rgba(255,233,184,.9);
    animation: sap-scintille 2.6s ease-in-out infinite;
  }
  .sap-guirlande i:nth-child(3n).allumee { animation-delay: .7s; }
  .sap-guirlande i:nth-child(4n).allumee { animation-delay: 1.4s; }
  @keyframes sap-scintille { 0%,100% { opacity: 1; } 50% { opacity: .4; } }

  /* LES CROCHETS : les endroits où le joueur peut accrocher. */
  .sap-crochet {
    position: absolute;
    /* 44 px : la taille minimale d'une cible tactile. Le dessin du
       crochet, lui, garde sa taille (voir ::after). */
    width: 44px; height: 44px;
    margin: -22px 0 0 -22px;
    padding: 0; border: 0;
    border-radius: 50%;
    background: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .sap-crochet::after {
    content: '';
    position: absolute;
    inset: 15px;
    border-radius: 50%;
    border: 1.5px dashed rgba(255,233,184,.55);
    background: rgba(255,233,184,.07);
    animation: sap-appelle 1.8s ease-in-out infinite;
  }
  @keyframes sap-appelle {
    0%,100% { transform: scale(1);    opacity: .85; }
    50%     { transform: scale(1.28); opacity: .45; }
  }
  .sap-crochet:disabled { cursor: default; }
  .sap-crochet.prise::after { display: none; }

  /* La boule accrochée : elle arrive du panier et se pose. */
  .sap-boule {
    position: absolute;
    margin: -12px 0 0 -15px;
    z-index: 3;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,.55));
  }
  .sap-boule.pose { animation: sap-pose .5s cubic-bezier(.34,1.42,.64,1); }
  @keyframes sap-pose {
    0%   { transform: translateY(-26px) scale(.5); opacity: 0; }
    60%  { transform: translateY(3px) scale(1.06); opacity: 1; }
    100% { transform: translateY(0) scale(1); opacity: 1; }
  }
  /* Celle qui glisse : elle part de sa branche et roule au pied. */
  .sap-boule.glisse { animation: sap-glisse 1.2s cubic-bezier(.5,.02,.7,1) forwards; }
  @keyframes sap-glisse {
    0%   { transform: translate(0,0) rotate(0deg); }
    22%  { transform: translate(4px, 8px) rotate(24deg); }
    100% { transform: translate(22px, 168px) rotate(420deg); }
  }

  /* L'ÉTOILE DU SOMMET */
  .sap-etoile {
    position: absolute;
    left: 50%; top: 12px;
    margin-left: -21px;
    z-index: 4;
    opacity: .28;
    filter: grayscale(.7);
    transition: opacity .6s ease, filter .6s ease, transform .6s var(--rebond, ease-out);
  }
  .sap-etoile.allumee {
    opacity: 1;
    filter: none;
    transform: scale(1.16);
  }
  .sap-etoile.allumee::after {
    content: '';
    position: absolute;
    inset: -24px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,243,212,.5) 0%, transparent 68%);
    animation: sap-halo 2.4s ease-in-out infinite;
  }
  @keyframes sap-halo { 0%,100% { opacity: .85; transform: scale(1); } 50% { opacity: .35; transform: scale(1.25); } }

  /* Le panier de boules qui restent à accrocher. */
  .sap-panier { display: flex; flex-direction: column; align-items: center; gap: 7px; }
  .sap-kicker {
    font-size: 11px; letter-spacing: 2.2px; text-transform: uppercase;
    color: var(--gris);
  }
  .sap-kicker strong { color: var(--or-clair); font-size: 13px; }
  .sap-reste { display: flex; gap: 7px; align-items: center; }
  .sap-reste span { display: block; transition: opacity .3s ease, transform .3s ease; }
  .sap-reste span.posee { opacity: .18; transform: scale(.7); }

  .sap-verdict {
    min-height: 46px; text-align: center;
    font-family: var(--serif); font-size: 19px; line-height: 1.3;
    color: var(--or-blanc);
  }
  .sap-verdict small {
    display: block; margin-top: 6px;
    font-family: var(--sans); font-size: 13.5px;
    color: var(--creme); opacity: .85; line-height: 1.5;
  }

  @media (prefers-reduced-motion: reduce) {
    .sap-crochet::after, .sap-guirlande i.allumee, .sap-etoile.allumee::after { animation: none; }
    .sap-boule.pose { animation-duration: .01ms; }
  }
  `;

  window.PullUpJeux = window.PullUpJeux || {};

  window.PullUpJeux.sapin = {
    id: 'sapin',
    nom: 'Le Sapin de la Galerie',
    mot: 'le sapin',                                 // « le sapin a hésité… »
    suite: 'Le grand sapin attend ses cinq boules.', // fin du ticket à gratter

    styles: STYLES,

    preparer(ctx) {
      // Une manche qui n'est pas la dernière ne révèle jamais le lot :
      // elle se joue toujours « tout près » et passe la main. C'est la
      // dernière manche qui tranche, pour tout le monde pareil.
      const gagne = ctx.decisif !== false && !ctx.lot.perdant;

      // Les lumières de la guirlande, semées sur les trois étages.
      const lumieres = [
        [50, 22], [40, 33], [61, 34], [30, 42], [70, 43],
        [50, 40], [36, 54], [64, 55], [23, 58], [77, 59],
        [50, 52], [44, 66], [57, 67], [30, 72], [70, 73],
        [50, 64], [38, 78], [62, 79], [50, 76], [50, 86]
      ].map(([x, y]) => '<i style="left:' + x + '%;top:' + y + '%"></i>').join('');

      const crochets = CROCHETS.map((c, i) =>
        '<button type="button" class="sap-crochet" id="sap-c' + i + '" ' +
        'style="left:' + c.x + '%;top:' + c.y + '%" ' +
        'aria-label="Accrocher une boule ici"></button>').join('');

      const panier = BOULES.map((_, i) =>
        '<span id="sap-p' + i + '">' + boule(i) + '</span>').join('');

      ctx.zone.innerHTML = `
        <h2>${ctx.secondTour ? 'Deuxième sapin' : 'Le Sapin de la Galerie'}</h2>
        <p class="question-soustitre">Accroche les cinq boules où tu veux. L’étoile s’allume à la fin.</p>

        <div class="sap-plateau">
          <div class="sap-panier">
            <div class="sap-kicker" id="sap-kicker">Boule <strong>1</strong> sur ${NB_BOULES}</div>
            <div class="sap-reste" id="sap-panier" role="img" aria-label="Cinq boules à accrocher">${panier}</div>
          </div>

          <div class="sap-scene" id="sap-scene">
            <span class="sap-sol" aria-hidden="true"></span>
            <span class="sap-arbre" aria-hidden="true">
              <span class="sap-tronc"></span>
              <span class="sap-etage sap-e1"></span>
              <span class="sap-neige sap-n1"></span>
              <span class="sap-etage sap-e2"></span>
              <span class="sap-neige sap-n2"></span>
              <span class="sap-etage sap-e3"></span>
              <span class="sap-neige sap-n3"></span>
            </span>
            <span class="sap-guirlande" id="sap-guirlande" aria-hidden="true">${lumieres}</span>
            <span class="sap-etoile" id="sap-etoile" aria-hidden="true">
              <svg viewBox="0 0 48 48" width="42" height="42">
                <defs>
                  <radialGradient id="sap-or" cx="50%" cy="50%" r="50%">
                    <stop offset="0%"   stop-color="#FFF3D4"/>
                    <stop offset="58%"  stop-color="#EFC368"/>
                    <stop offset="100%" stop-color="#C9962E"/>
                  </radialGradient>
                </defs>
                <path d="M24 3 L29.6 17.4 L45 18.6 L33.2 28.6 L36.9 43.6 L24 35.4
                         L11.1 43.6 L14.8 28.6 L3 18.6 L18.4 17.4 Z"
                      fill="url(#sap-or)" stroke="#8A6A21" stroke-width="1.3"
                      stroke-linejoin="round"/>
              </svg>
            </span>
            ${crochets}
          </div>

          <p class="sap-verdict" id="sap-verdict" role="status"></p>
        </div>
      `;

      const scene     = ctx.zone.querySelector('#sap-scene');
      const guirlande = ctx.zone.querySelector('#sap-guirlande');
      const etoile    = ctx.zone.querySelector('#sap-etoile');
      const kicker    = ctx.zone.querySelector('#sap-kicker');
      const verdict   = ctx.zone.querySelector('#sap-verdict');
      const boutons   = CROCHETS.map((_, i) => ctx.zone.querySelector('#sap-c' + i));
      const lampes    = Array.from(guirlande.querySelectorAll('i'));

      let posees = 0;
      let fini = false;

      const ecrire = (titre, detail) => {
        verdict.innerHTML = titre + (detail ? '<small>' + detail + '</small>' : '');
      };

      // Chaque boule accrochée allume sa part de guirlande : le sapin
      // s'éclaire au fur et à mesure, c'est la récompense du geste.
      function allumer(part) {
        const jusque = Math.round(lampes.length * part);
        lampes.forEach((l, i) => { if (i < jusque) l.classList.add('allumee'); });
      }

      function accrocher(i) {
        if (fini || boutons[i].classList.contains('prise')) return;

        const rang = posees;
        posees++;
        ctx.vibrer(22);

        boutons[i].classList.add('prise');
        boutons[i].disabled = true;

        const el = document.createElement('span');
        el.className = 'sap-boule pose';
        el.id = 'sap-b' + rang;
        el.style.left = CROCHETS[i].x + '%';
        el.style.top  = CROCHETS[i].y + '%';
        el.innerHTML = boule(rang);
        scene.appendChild(el);

        const dansLePanier = ctx.zone.querySelector('#sap-p' + rang);
        if (dansLePanier) dansLePanier.classList.add('posee');

        allumer(posees / NB_BOULES);

        if (posees < NB_BOULES) {
          kicker.innerHTML = 'Boule <strong>' + (posees + 1) + '</strong> sur ' + NB_BOULES;
          const reste = NB_BOULES - posees;
          ecrire(reste === 1 ? 'Plus qu’une.' : 'Encore ' + reste + '.',
                 reste === 1 ? 'La dernière, et l’étoile s’allume.' : '');
          return;
        }

        // LA DERNIÈRE BOULE : c'est là que tout se joue, et c'était
        // écrit avant le premier geste.
        fini = true;
        boutons.forEach(b => { b.disabled = true; });
        kicker.textContent = 'Le sapin est décoré';

        if (gagne) {
          setTimeout(() => {
            etoile.classList.add('allumee');
            lampes.forEach(l => l.classList.add('allumee'));
            ctx.vibrer(110);
            ecrire('L’étoile s’allume !',
                   'Les cinq boules tiennent, le sapin est complet. Regarde ce que tu as gagné.');
          }, ctx.sobre ? 40 : 640);

        } else {
          // La cinquième glisse de sa branche et roule au pied du sapin.
          setTimeout(() => {
            el.classList.remove('pose');
            el.classList.add('glisse');
            ctx.vibrer(40);
            kicker.textContent = 'La dernière a glissé';
          }, ctx.sobre ? 20 : 620);

          setTimeout(() => {
            const restantes = (ctx.manches || 1) - (ctx.manche || 1);
            // La guirlande retombe d'un cran : il manque une boule.
            lampes.slice(Math.round(lampes.length * 0.8)).forEach(l => l.classList.remove('allumee'));
            ecrire('La cinquième a glissé.',
                   restantes > 0
                     ? 'L’étoile attend encore. Il reste ' +
                       (restantes === 1 ? 'une manche.' : restantes + ' manches.')
                     : 'Quatre boules sur cinq, et l’étoile reste éteinte. Ton lot était ' +
                       'tiré avant la première boule : une autre branche n’y aurait rien changé.');
          }, ctx.sobre ? 60 : 1760);
        }

        setTimeout(ctx.terminer, ctx.sobre ? 700 : (gagne ? 3400 : 4200));
      }

      boutons.forEach((b, i) => b.addEventListener('click', () => accrocher(i)));

      ecrire('Cinq boules, un grand sapin.', 'Touche une branche pour accrocher.');
    }
  };

})();
