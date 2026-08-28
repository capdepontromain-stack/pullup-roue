// ============================================================
// JEU « LA HOTTE GÉANTE »
// Le seul jeu du parcours qui se joue au doigt : la hotte suit la
// main, les cadeaux tombent du haut de la galerie, et il faut les
// recevoir. C'est aussi le jeu qui porte le nom de l'opération,
// et l'objet que les visiteurs ont sous les yeux dans la galerie.
//
// HONNÊTETÉ (la règle de toute l'application) : le lot est tiré et
// enregistré par le serveur AVANT que le joueur touche l'écran. Le
// jeu ne crée aucune probabilité, il met en scène un résultat déjà
// écrit :
//   - gagnant : les quatre cadeaux finissent dans la hotte ;
//   - perdant : les trois premiers rentrent, et le dernier
//               rebondit sur le bord. Le « à un cadeau près ».
// Les cadeaux tombent vers la hotte quoi qu'il arrive : le joueur
// n'a rien à réussir, il accompagne. C'est un geste de plaisir, pas
// une épreuve d'adresse, et la phrase de fin le dit franchement.
//
// Interface commune à tous les jeux (voir LISEZ-MOI.md) :
//   id, nom, mot, suite, styles, preparer(ctx)
// ============================================================

(function () {

  const NB_CADEAUX = 4;

  // --------------------------------------------------------
  // LES DESSINS
  // Tout est en SVG, dessiné ici : rien à télécharger, rien qui
  // pixellise, et la même image sur un téléphone d'entrée de gamme
  // et sur un grand écran de démonstration.
  // --------------------------------------------------------

  // La hotte, en osier tressé, vue de face et légèrement évasée.
  const HOTTE = `
    <svg viewBox="0 0 132 104" width="106" height="84" aria-hidden="true">
      <defs>
        <linearGradient id="htt-osier" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#B5822C"/>
          <stop offset="45%"  stop-color="#8A5F1C"/>
          <stop offset="100%" stop-color="#5B3D10"/>
        </linearGradient>
        <linearGradient id="htt-bord" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#FFE9B8"/>
          <stop offset="100%" stop-color="#B5822C"/>
        </linearGradient>
      </defs>
      <!-- Le corps de la hotte -->
      <path d="M14 22 L118 22 L104 96 Q66 104 28 96 Z"
            fill="url(#htt-osier)" stroke="#3A2408" stroke-width="2.5"
            stroke-linejoin="round"/>
      <!-- Le tressage : trois cercles d'osier et quelques montants -->
      <g stroke="#3A2408" stroke-width="1.6" opacity=".55" fill="none">
        <path d="M17 40 Q66 47 115 40"/>
        <path d="M21 60 Q66 67 111 60"/>
        <path d="M25 79 Q66 86 107 79"/>
        <path d="M40 23 L48 96"/>
        <path d="M66 23 L66 100"/>
        <path d="M92 23 L84 96"/>
      </g>
      <!-- Le bord roulé, celui qui reçoit les cadeaux -->
      <path d="M8 22 Q66 10 124 22 Q66 34 8 22 Z"
            fill="url(#htt-bord)" stroke="#3A2408" stroke-width="2.2"
            stroke-linejoin="round"/>
    </svg>`;

  // Un cadeau. Trois habillages, pour que la pluie ne soit pas
  // quatre fois le même paquet.
  function cadeau(n) {
    const habits = [
      { boite: '#A81B1F', bord: '#5E0F11', ruban: '#FFE9B8' },
      { boite: '#EFC368', bord: '#8A6A21', ruban: '#A81B1F' },
      { boite: '#F3E7D3', bord: '#9A8B70', ruban: '#C9962E' }
    ];
    const h = habits[n % habits.length];
    return `
    <svg viewBox="0 0 44 46" width="38" height="40" aria-hidden="true">
      <rect x="4" y="14" width="36" height="28" rx="3"
            fill="${h.boite}" stroke="${h.bord}" stroke-width="2"/>
      <rect x="2" y="9" width="40" height="8" rx="2.5"
            fill="${h.boite}" stroke="${h.bord}" stroke-width="2"/>
      <rect x="19" y="9" width="6" height="33"
            fill="${h.ruban}" opacity=".95"/>
      <path d="M22 10 C14 10, 12 2, 18 2 C22 2, 22 7, 22 10
               C22 7, 22 2, 26 2 C32 2, 30 10, 22 10 Z"
            fill="${h.ruban}" stroke="${h.bord}" stroke-width="1.3"/>
    </svg>`;
  }

  // --------------------------------------------------------
  // LE STYLE DU JEU
  // --------------------------------------------------------
  const STYLES = `
  .htt-plateau { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px; }

  /* LA GALERIE, DE NUIT
     Un sol qui remonte vers un fond sombre, et rien d'autre : c'est
     la pluie de cadeaux qui doit occuper le regard. */
  .htt-scene {
    position: relative;
    width: 100%;
    max-width: 348px;
    height: 316px;
    border-radius: 18px;
    overflow: hidden;
    touch-action: none;               /* le doigt pilote la hotte, il ne fait pas défiler la page */
    user-select: none;
    cursor: grab;
    background:
      radial-gradient(ellipse 70% 34% at 50% 100%, rgba(201,150,46,.20) 0%, transparent 66%),
      linear-gradient(180deg, #150B18 0%, #1B0D14 42%, #24110C 100%);
    border: 1.5px solid rgba(201,150,46,.42);
    box-shadow: inset 0 2px 0 rgba(255,233,184,.12), 0 16px 38px rgba(0,0,0,.55);
  }
  .htt-scene:active { cursor: grabbing; }

  /* Le sol de la galerie, une simple bande qui attrape la lumière. */
  .htt-sol {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 54px;
    background: linear-gradient(180deg, rgba(255,233,184,.10), rgba(255,233,184,.02));
    border-top: 1px solid rgba(201,150,46,.34);
  }

  /* Les flocons du fond : lents, discrets, jamais devant les cadeaux. */
  .htt-flocon {
    position: absolute;
    top: -8px;
    width: 4px; height: 4px;
    border-radius: 50%;
    background: rgba(246,241,230,.55);
    animation: htt-neige linear infinite;
  }
  @keyframes htt-neige {
    0%   { transform: translateY(0) translateX(0); opacity: 0; }
    12%  { opacity: .8; }
    100% { transform: translateY(330px) translateX(16px); opacity: 0; }
  }

  /* LA HOTTE
     Elle suit le doigt, mais jamais d'un coup : elle glisse. Un
     objet lourd qui rattrape la main, c'est ce qui donne le poids. */
  .htt-hotte {
    position: absolute;
    bottom: 16px; left: 0;
    width: 106px;
    margin-left: -53px;
    filter: drop-shadow(0 8px 16px rgba(0,0,0,.6));
    will-change: transform;
  }
  .htt-hotte.recoit { animation: htt-recoit .34s ease-out; }
  @keyframes htt-recoit {
    0%   { transform: scale(1); }
    35%  { transform: scale(1.09, .9); }
    100% { transform: scale(1); }
  }

  /* La consigne qui flotte au-dessus de la hotte au premier tour. */
  .htt-consigne {
    position: absolute;
    left: 50%; top: 50%;
    transform: translate(-50%, -50%);
    padding: 9px 16px;
    border-radius: 999px;
    background: rgba(20,15,9,.82);
    border: 1px solid rgba(201,150,46,.45);
    color: #FFE9B8; /* en dur : la pastille est sombre, la variable devenait encre sur noir en thème clair */
    font-family: var(--sans);
    font-size: 13.5px;
    letter-spacing: .3px;
    white-space: nowrap;
    animation: htt-respire 1.9s ease-in-out infinite;
  }
  @keyframes htt-respire {
    0%,100% { opacity: .95; transform: translate(-50%,-50%) scale(1); }
    50%     { opacity: .75; transform: translate(-50%,-50%) scale(.97); }
  }

  .htt-cadeau {
    position: absolute;
    top: 0; left: 0;
    margin: -20px 0 0 -19px;
    filter: drop-shadow(0 5px 10px rgba(0,0,0,.55));
    will-change: transform;
  }
  .htt-cadeau.rate { opacity: .5; }

  /* Le petit éclat quand un cadeau tombe dans la hotte. */
  .htt-plouf {
    position: absolute;
    width: 74px; height: 74px;
    margin: -37px 0 0 -37px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,243,212,.7) 0%, rgba(239,195,104,.24) 44%, transparent 70%);
    opacity: 0;
    pointer-events: none;
  }
  .htt-plouf.brille { animation: htt-plouf .55s ease-out forwards; }
  @keyframes htt-plouf {
    0%   { opacity: 1; transform: scale(.3); }
    100% { opacity: 0; transform: scale(1.5); }
  }

  /* Le compte des cadeaux reçus. */
  .htt-compte { display: flex; flex-direction: column; align-items: center; gap: 7px; }
  .htt-kicker {
    font-size: 11px; letter-spacing: 2.2px; text-transform: uppercase;
    color: var(--gris);
  }
  .htt-kicker strong { color: var(--or-clair); font-size: 13px; }
  .htt-jauge { display: flex; gap: 8px; }
  .htt-jauge i {
    display: block; width: 12px; height: 12px; border-radius: 3px;
    border: 1.5px solid rgba(201,150,46,.55);
    background: transparent;
    transition: background .3s ease, transform .3s var(--rebond, ease-out);
  }
  .htt-jauge i.pleine {
    background: linear-gradient(180deg, #FFE9B8, #C9962E);
    transform: scale(1.16);
    box-shadow: 0 0 10px rgba(239,195,104,.5);
  }
  .htt-jauge i.ratee {
    border-color: rgba(188,178,161,.4);
    background: repeating-linear-gradient(45deg, rgba(188,178,161,.22) 0 2px, transparent 2px 5px);
  }

  .htt-verdict {
    min-height: 46px; text-align: center;
    font-family: var(--serif); font-size: 19px; line-height: 1.3;
    /* Le verdict vit sur le fond de page : la variable suit le thème. */
    color: var(--or-blanc);
  }
  .htt-verdict small {
    display: block; margin-top: 6px;
    font-family: var(--sans); font-size: 13.5px;
    color: var(--creme); opacity: .85; line-height: 1.5;
  }

  @media (prefers-reduced-motion: reduce) {
    .htt-flocon, .htt-consigne { animation: none; }
  }
  `;

  window.PullUpJeux = window.PullUpJeux || {};

  window.PullUpJeux.hotte = {
    id: 'hotte',
    nom: 'La Hotte Géante',
    mot: 'la hotte',                                   // « la hotte a hésité… »
    suite: 'La hotte géante attend en bas de l’écran.', // fin du ticket à gratter

    styles: STYLES,

    preparer(ctx) {
      // Une manche qui n'est pas la dernière ne révèle jamais le lot :
      // elle se joue toujours « tout près » et passe la main. C'est la
      // dernière manche qui tranche, pour tout le monde pareil.
      const gagne = ctx.decisif !== false && !ctx.lot.perdant;

      // LE SCÉNARIO DES QUATRE CADEAUX, écrit avant le premier geste.
      // true = il tombe dans la hotte. Gagnant : les quatre. Perdant :
      // les trois premiers, et le dernier rebondit sur le bord.
      const scenario = gagne ? [true, true, true, true]
                             : [true, true, true, false];

      const flocons = Array.from({ length: 16 }, (_, i) => {
        const g = 4 + Math.random() * 92;
        const d = (Math.random() * 6).toFixed(1);
        const v = (7 + Math.random() * 6).toFixed(1);
        const t = (2.5 + Math.random() * 2.5).toFixed(1);
        return '<span class="htt-flocon" style="left:' + g.toFixed(1) + '%;' +
               'animation-duration:' + v + 's;animation-delay:' + d + 's;' +
               'width:' + t + 'px;height:' + t + 'px"></span>';
      }).join('');

      ctx.zone.innerHTML = `
        <h2>${ctx.secondTour ? 'Deuxième hotte' : 'La Hotte Géante'}</h2>
        <p class="question-soustitre">Garde le doigt sur l’écran et fais glisser la hotte.</p>

        <div class="htt-plateau">
          <div class="htt-compte">
            <div class="htt-kicker" id="htt-kicker">Cadeau <strong>1</strong> sur ${NB_CADEAUX}</div>
            <div class="htt-jauge" id="htt-jauge" role="img" aria-label="Aucun cadeau reçu">
              ${Array.from({ length: NB_CADEAUX }, () => '<i></i>').join('')}
            </div>
          </div>

          <div class="htt-scene" id="htt-scene">
            ${flocons}
            <span class="htt-sol" aria-hidden="true"></span>
            <span class="htt-plouf" id="htt-plouf" aria-hidden="true"></span>
            <span class="htt-hotte" id="htt-hotte">${HOTTE}</span>
            <span class="htt-consigne" id="htt-consigne">Fais glisser ton doigt&nbsp;→</span>
          </div>

          <p class="htt-verdict" id="htt-verdict" role="status"></p>
        </div>
      `;

      const scene    = ctx.zone.querySelector('#htt-scene');
      const hotte    = ctx.zone.querySelector('#htt-hotte');
      const consigne = ctx.zone.querySelector('#htt-consigne');
      const plouf    = ctx.zone.querySelector('#htt-plouf');
      const jauge    = ctx.zone.querySelector('#htt-jauge');
      const kicker   = ctx.zone.querySelector('#htt-kicker');
      const verdict  = ctx.zone.querySelector('#htt-verdict');

      const ecrire = (titre, detail) => {
        verdict.innerHTML = titre + (detail ? '<small>' + detail + '</small>' : '');
      };

      // --- L'état du jeu -------------------------------------
      let largeur = scene.clientWidth || 348;
      const DEMI_HOTTE = 53;
      const BORD = DEMI_HOTTE + 4;

      let cible = largeur / 2;      // où le doigt demande à la hotte d'aller
      let position = largeur / 2;   // où elle est vraiment (elle glisse)
      let recus = 0;
      let lances = 0;
      let fini = false;
      let commence = false;
      let boucle = null;

      hotte.style.transform = 'translateX(' + position + 'px)';

      // --- Le doigt ------------------------------------------
      function suivre(x) {
        const boite = scene.getBoundingClientRect();
        cible = Math.max(BORD, Math.min(boite.width - BORD, x - boite.left));
        if (!commence) demarrer();
      }
      function surPointeur(e) {
        if (e.touches && e.touches[0]) suivre(e.touches[0].clientX);
        else if (typeof e.clientX === 'number') suivre(e.clientX);
      }
      scene.addEventListener('pointerdown', surPointeur);
      scene.addEventListener('pointermove', surPointeur);
      scene.addEventListener('touchstart', surPointeur, { passive: true });
      scene.addEventListener('touchmove',  surPointeur, { passive: true });

      // Personne ne bouge le doigt ? Le jeu part quand même au bout de
      // trois secondes : un joueur bloqué devant un écran qui attend,
      // c'est une partie perdue pour tout le monde.
      const secours = setTimeout(() => { if (!commence) demarrer(); }, 3000);

      // --- La pluie de cadeaux -------------------------------
      const cadeaux = [];

      function lacherCadeau() {
        if (fini) return;
        const rang = lances;
        lances++;

        const el = document.createElement('span');
        el.className = 'htt-cadeau';
        el.innerHTML = cadeau(rang);
        scene.appendChild(el);

        // Le cadeau part d'en haut, à un endroit qui n'est pas celui de
        // la hotte : sinon il n'y a rien à accompagner. Il se corrige
        // ensuite tout seul pendant sa chute (voir avancer).
        const depart = 40 + Math.random() * (largeur - 80);
        cadeaux.push({
          el: el,
          x: depart,
          y: -24,
          vitesse: 1.5 + Math.random() * 0.5,
          entre: scenario[rang] !== false,
          rang: rang,
          termine: false
        });

        kicker.innerHTML = 'Cadeau <strong>' + Math.min(lances, NB_CADEAUX) +
                           '</strong> sur ' + NB_CADEAUX;
      }

      function marquer(rang, reussi) {
        const puces = jauge.querySelectorAll('i');
        if (puces[rang]) puces[rang].classList.add(reussi ? 'pleine' : 'ratee');
        jauge.setAttribute('aria-label', recus + ' cadeau' + (recus > 1 ? 'x' : '') + ' reçus');
      }

      // --- La boucle d'animation -----------------------------
      // Une seule boucle pour la hotte et pour les cadeaux : c'est ce
      // qui garde le mouvement lisse même sur un téléphone modeste.
      const SOL = 240;    // la hauteur du bord de la hotte dans la scène

      function avancer() {
        // La hotte rattrape le doigt, avec un peu de retard : c'est ce
        // retard qui lui donne du poids.
        position += (cible - position) * 0.18;
        hotte.style.transform = 'translateX(' + position + 'px)';

        for (const c of cadeaux) {
          if (c.termine) continue;
          c.y += c.vitesse * 2.6;

          // LE CADEAU VIENT VERS LA HOTTE
          // Il se rapproche doucement de l'aplomb de la hotte pendant
          // sa chute : le joueur a le sentiment de l'attraper, et le
          // résultat, lui, était écrit avant. Le cadeau qui ne doit
          // pas rentrer fait le même trajet, et ne se corrige plus
          // dans les tout derniers pixels.
          const encoreLoin = c.y < SOL - 60;
          if (c.entre || encoreLoin) {
            c.x += (position - c.x) * (c.entre ? 0.045 : 0.028);
          } else {
            // Il file à côté : c'est le « à un cadeau près ».
            c.x += (c.x < position ? -1 : 1) * 1.6;
          }

          c.el.style.transform =
            'translate(' + c.x.toFixed(1) + 'px,' + c.y.toFixed(1) + 'px) ' +
            'rotate(' + (c.y * (c.rang % 2 ? 0.8 : -0.8)).toFixed(1) + 'deg)';

          if (c.y >= SOL) {
            c.termine = true;
            if (c.entre) {
              recus++;
              c.el.remove();
              marquer(c.rang, true);
              plouf.style.left = position + 'px';
              plouf.style.top  = (SOL + 6) + 'px';
              plouf.classList.remove('brille');
              void plouf.offsetWidth;
              plouf.classList.add('brille');
              hotte.classList.remove('recoit');
              void hotte.offsetWidth;
              hotte.classList.add('recoit');
              ctx.vibrer(35);
            } else {
              c.el.classList.add('rate');
              marquer(c.rang, false);
              ctx.vibrer(18);
              // Il roule sur le sol et s'arrête, bien visible.
              c.el.style.transition = 'transform .7s ease-out, opacity .7s ease-out';
              c.el.style.transform =
                'translate(' + (c.x + (c.x < position ? -30 : 30)).toFixed(1) + 'px,' +
                (SOL + 42) + 'px) rotate(96deg)';
            }
          }
        }

        if (!fini) boucle = requestAnimationFrame(avancer);
      }

      // --- Le déroulé ----------------------------------------
      let horloge = null;

      function demarrer() {
        if (commence) return;
        commence = true;
        clearTimeout(secours);
        consigne.style.transition = 'opacity .4s ease';
        consigne.style.opacity = '0';
        setTimeout(() => consigne.remove(), 420);
        ecrire('Ils arrivent.', 'Reste dessous.');

        boucle = requestAnimationFrame(avancer);
        lacherCadeau();
        horloge = setInterval(() => {
          if (lances >= NB_CADEAUX) { clearInterval(horloge); terminerBientot(); return; }
          lacherCadeau();
        }, 1250);
      }

      function terminerBientot() {
        // On laisse le dernier cadeau finir sa chute avant de conclure.
        setTimeout(() => {
          fini = true;
          if (boucle) cancelAnimationFrame(boucle);

          if (gagne) {
            ctx.vibrer(110);
            ecrire('Les quatre sont dedans !',
                   'La hotte est pleine. Regarde ce que tu as gagné.');
          } else {
            const restantes = (ctx.manches || 1) - (ctx.manche || 1);
            ecrire('Le dernier a filé à côté.',
                   restantes > 0
                     ? 'Trois sur quatre. Il reste ' +
                       (restantes === 1 ? 'une manche.' : restantes + ' manches.')
                     : 'Trois sur quatre. Ton lot était tiré avant le premier ' +
                       'cadeau : ta main n’y est pour rien, et elle n’aurait ' +
                       'rien pu y faire.');
          }
          setTimeout(ctx.terminer, ctx.sobre ? 500 : 2600);
        }, ctx.sobre ? 200 : 1500);
      }

      // La largeur de la scène peut changer (rotation du téléphone).
      window.addEventListener('resize', () => {
        largeur = scene.clientWidth || largeur;
      });

      ecrire('Quatre cadeaux vont tomber.', 'Pose ton doigt sur l’écran.');
    }
  };

})();
