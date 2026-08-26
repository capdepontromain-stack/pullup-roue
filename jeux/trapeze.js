// ============================================================
// JEU « LE TRAPÈZE VOLANT »
// Le numéro qui fait lever la tête sous un chapiteau : le
// voltigeur se balance, il lâche la barre, il vole, et l'attrapeur
// le reçoit par les poignets. Une seule décision pour le joueur,
// un seul geste, et trois secondes de suspension.
//
// HONNÊTETÉ (la règle de toute l'application) : le lot est tiré et
// enregistré par le serveur AVANT que le joueur touche l'écran. Le
// jeu ne crée aucune probabilité, il met en scène un résultat déjà
// écrit :
//   - gagnant : les poignets se referment, et la poussière d'or
//               retombe sur la piste ;
//   - perdant : les doigts se frôlent, le voltigeur tombe dans le
//               filet et se relève en saluant. Personne ne se fait
//               mal sous un chapiteau, c'est un numéro.
// Le moment où le joueur appuie ne change rien, et l'écran ne lui
// laisse jamais croire le contraire : la phrase de fin le dit.
//
// Interface commune à tous les jeux (voir LISEZ-MOI.md) :
//   id, nom, mot, suite, styles, preparer(ctx)
// ============================================================

(function () {

  // --------------------------------------------------------
  // LES DEUX SILHOUETTES
  // Dessinées à la main, en SVG, dans les ors de la charte : pas
  // une seule image venue de l'extérieur, donc rien à détourer,
  // rien qui pixellise, et le même trait à toutes les tailles.
  // Le style est celui d'une affiche de cirque : un membre = un
  // trait épais et arrondi, un maillot rouge, aucune tentative de
  // réalisme. C'est ce qui se lit le mieux dans 50 pixels de large
  // sur un téléphone.
  // --------------------------------------------------------

  // Le voltigeur, suspendu par les mains à sa barre. Les bras
  // montent droit vers le haut, la tête est entre les épaules, les
  // jambes sont groupées : la position d'attente, celle d'avant.
  const VOLTIGEUR = `
    <svg viewBox="0 0 72 118" width="52" height="86" aria-hidden="true">
      <defs>
        <linearGradient id="trp-or" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#FFF3D4"/>
          <stop offset="46%"  stop-color="#EFC368"/>
          <stop offset="100%" stop-color="#C08C25"/>
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#trp-or)" stroke-width="9"
         stroke-linecap="round" stroke-linejoin="round">
        <path d="M31 9 L29 40"/>
        <path d="M41 9 L43 40"/>
        <path d="M36 44 L36 70"/>
        <path d="M36 70 L27 90 L34 104"/>
        <path d="M36 70 L45 90 L38 105"/>
      </g>
      <circle cx="36" cy="33" r="10.5" fill="url(#trp-or)"
              stroke="#3A1D06" stroke-width="1.6"/>
      <rect x="26" y="49" width="20" height="17" rx="5"
            fill="#A81B1F" stroke="#5E0F11" stroke-width="1.4"/>
    </svg>`;

  // L'attrapeur, accroché par les jarrets, tête en bas, les bras
  // tendus vers le vide. C'est lui qui reçoit.
  const ATTRAPEUR = `
    <svg viewBox="0 0 72 118" width="50" height="82" aria-hidden="true">
      <g fill="none" stroke="#E8C982" stroke-width="9"
         stroke-linecap="round" stroke-linejoin="round">
        <path d="M28 10 L27 28 L34 44"/>
        <path d="M44 10 L45 28 L38 44"/>
        <path d="M36 44 L36 70"/>
        <path d="M36 74 L26 96"/>
        <path d="M36 74 L46 96"/>
      </g>
      <circle cx="36" cy="84" r="10" fill="#E8C982"
              stroke="#3A1D06" stroke-width="1.6"/>
      <rect x="26" y="50" width="20" height="17" rx="5"
            fill="#8E1418" stroke="#4A0C0E" stroke-width="1.4"/>
    </svg>`;

  // --------------------------------------------------------
  // LE STYLE DU JEU
  // Tout est dessiné : la toile rayée du chapiteau, les ampoules
  // de la charpente, le faisceau du projecteur, le filet. Trois
  // matières seulement, les mêmes que le reste de l'application :
  // le velours rouge, l'or, le noir chaud.
  // --------------------------------------------------------
  const STYLES = `
  .trp-plateau { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 13px; }

  /* LE CHAPITEAU, VU DE L'INTÉRIEUR
     Le regard part du sommet (la toile), descend le long du
     faisceau, et se pose sur le filet. C'est ce trajet qui donne la
     hauteur, et la hauteur est tout le sujet du trapèze. */
  .trp-chapiteau {
    position: relative;
    width: 100%;
    max-width: 348px;
    height: 322px;
    border-radius: 18px;
    overflow: hidden;
    background:
      radial-gradient(ellipse 60% 40% at 50% 8%, rgba(255,233,184,.18) 0%, transparent 68%),
      radial-gradient(ellipse 92% 46% at 50% 106%, rgba(168,27,31,.30) 0%, transparent 64%),
      linear-gradient(180deg, #2A0F0C 0%, #1B0908 48%, #110504 100%);
    border: 1.5px solid rgba(201,150,46,.42);
    box-shadow: inset 0 2px 0 rgba(255,233,184,.14), 0 16px 38px rgba(0,0,0,.55);
  }

  /* La toile rayée qui coiffe la scène, en arc, très en retrait :
     elle situe le lieu, elle ne doit pas se disputer le regard avec
     le numéro. */
  .trp-toile {
    position: absolute;
    top: -34px; left: -12%;
    width: 124%; height: 74px;
    border-radius: 50% / 0 0 100% 100%;
    background: repeating-linear-gradient(90deg,
      rgba(134,20,23,.92) 0 20px,
      rgba(226,209,182,.72) 20px 40px);
    box-shadow: 0 5px 20px rgba(0,0,0,.55);
  }

  /* La charpente : la poutre d'où pendent les deux trapèzes. */
  .trp-poutre {
    position: absolute;
    top: 40px; left: 40px; right: 40px;
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(180deg, rgba(201,150,46,.7), rgba(110,80,21,.7));
  }

  /* La rampe d'ampoules sous la toile : le cirque commence là. */
  .trp-ampoules {
    position: absolute;
    top: 26px; left: 14px; right: 14px;
    display: flex; justify-content: space-between;
  }
  .trp-ampoules i {
    display: block; width: 6px; height: 6px; border-radius: 50%;
    background: #FFE9B8;
    box-shadow: 0 0 9px rgba(255,233,184,.85);
    animation: trp-clignote 2.4s ease-in-out infinite;
  }
  .trp-ampoules i:nth-child(2n) { animation-delay: .4s; }
  .trp-ampoules i:nth-child(3n) { animation-delay: .8s; }
  .trp-ampoules i:nth-child(5n) { animation-delay: 1.2s; }
  @keyframes trp-clignote { 0%,100% { opacity: 1; } 50% { opacity: .35; } }

  /* Le faisceau du projecteur, braqué sur le vide entre les deux
     trapèzes : c'est là que tout se joue. */
  .trp-faisceau {
    position: absolute;
    top: 30px; left: 50%;
    width: 216px; height: 268px;
    margin-left: -108px;
    background: linear-gradient(180deg, rgba(255,233,184,.19) 0%, rgba(255,233,184,.05) 58%, transparent 100%);
    clip-path: polygon(42% 0%, 58% 0%, 100% 100%, 0% 100%);
    pointer-events: none;
  }

  /* LES DEUX TRAPÈZES
     Une corde, une barre, un point d'accroche sur la poutre. Ils se
     balancent en opposition : quand l'un avance, l'autre recule.
     C'est ce contretemps qui rend le numéro lisible. */
  .trp-agres {
    position: absolute;
    top: 42px;
    width: 3px; height: 106px;
    background: linear-gradient(180deg, rgba(255,233,184,.8), rgba(201,150,46,.5));
    transform-origin: 50% 0%;
  }
  .trp-agres::after {
    content: '';
    position: absolute;
    left: -22px; bottom: -3px;
    width: 47px; height: 6px;
    border-radius: 3px;
    background: linear-gradient(180deg, #FFE9B8, #B98421);
    box-shadow: 0 2px 7px rgba(0,0,0,.55);
  }
  .trp-gauche { left: 104px; animation: trp-balance 2.6s ease-in-out infinite; }
  .trp-droite { left: 244px; animation: trp-balance 2.6s ease-in-out infinite reverse; }
  @keyframes trp-balance {
    0%, 100% { transform: rotate(-23deg); }
    50%      { transform: rotate(23deg); }
  }
  /* La barre qu'on vient de quitter continue toute seule, plus mollement. */
  .trp-agres.vide { opacity: .55; }

  /* Les deux artistes, accrochés à leur barre. */
  .trp-artiste {
    position: absolute;
    left: 50%; bottom: -84px;
    margin-left: -26px;
    filter: drop-shadow(0 5px 12px rgba(0,0,0,.6));
  }
  .trp-attrapeur { bottom: -80px; margin-left: -25px; }

  /* Le voltigeur, une fois qu'il a lâché : il quitte la barre et
     vit sa vie dans la scène. Sa trajectoire est calculée au moment
     du lâcher, jamais écrite en dur : deux téléphones n'ont pas la
     même largeur, et un arc faux se voit tout de suite. */
  .trp-vol {
    position: absolute;
    z-index: 4;
    filter: drop-shadow(0 6px 14px rgba(0,0,0,.62));
  }

  /* LE FILET
     Il est là dès le début, et c'est voulu : on ne joue pas avec la
     peur du vide, on regarde un numéro. */
  .trp-filet {
    position: absolute;
    left: 18px; right: 18px; bottom: 16px;
    height: 30px;
    border-radius: 4px;
    background:
      repeating-linear-gradient(46deg,  rgba(226,209,182,.26) 0 1.4px, transparent 1.4px 15px),
      repeating-linear-gradient(-46deg, rgba(226,209,182,.26) 0 1.4px, transparent 1.4px 15px);
    border-top: 2px solid rgba(201,150,46,.5);
  }
  .trp-filet.rebond { animation: trp-rebond .9s ease-out; }
  @keyframes trp-rebond {
    0%   { transform: scaleY(1); }
    24%  { transform: scaleY(2.1) translateY(7px); }
    56%  { transform: scaleY(.8); }
    78%  { transform: scaleY(1.14); }
    100% { transform: scaleY(1); }
  }

  /* L'éclat de la prise : deux mains qui se referment, ça se voit. */
  .trp-eclat {
    position: absolute;
    width: 104px; height: 104px;
    margin: -52px 0 0 -52px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,243,212,.8) 0%, rgba(239,195,104,.3) 40%, transparent 70%);
    opacity: 0;
    pointer-events: none;
  }
  .trp-eclat.brille { animation: trp-brille .75s ease-out forwards; }
  @keyframes trp-brille {
    0%   { opacity: 1; transform: scale(.28); }
    100% { opacity: 0; transform: scale(1.8); }
  }

  /* La poussière d'or qui retombe après la prise. */
  .trp-paillette {
    position: absolute;
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #FFE9B8;
    box-shadow: 0 0 8px rgba(255,233,184,.9);
    opacity: 0;
  }
  .trp-paillette.tombe { animation: trp-paillette 1.6s ease-in forwards; }
  @keyframes trp-paillette {
    0%   { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(130px) scale(.35); }
  }

  /* Le compteur de balancements, et le verdict. */
  .trp-kicker {
    font-size: 11px; letter-spacing: 2.2px; text-transform: uppercase;
    color: var(--gris); text-align: center; min-height: 15px;
  }
  .trp-kicker strong { color: var(--or-clair); font-size: 13px; }

  .trp-verdict {
    min-height: 46px; text-align: center;
    font-family: var(--serif); font-size: 19px; line-height: 1.3;
    color: var(--or-blanc);
  }
  .trp-verdict small {
    display: block; margin-top: 6px;
    font-family: var(--sans); font-size: 13.5px;
    color: var(--creme); opacity: .85; line-height: 1.5;
  }

  @media (prefers-reduced-motion: reduce) {
    .trp-agres, .trp-ampoules i { animation: none; }
    .trp-agres { transform: rotate(0deg); }
  }
  `;

  window.PullUpJeux = window.PullUpJeux || {};

  window.PullUpJeux.trapeze = {
    id: 'trapeze',
    nom: 'Le Trapèze Volant',
    mot: 'le trapèze',                                   // « le trapèze a hésité… »
    suite: 'Là-haut, deux trapèzes t’attendent.',        // fin du ticket à gratter

    styles: STYLES,

    preparer(ctx) {
      // Une manche qui n'est pas la dernière ne révèle jamais le lot :
      // elle se joue toujours « tout près » et passe la main. C'est la
      // dernière manche qui tranche, pour tout le monde pareil.
      const gagne = ctx.decisif !== false && !ctx.lot.perdant;

      const ampoules = Array.from({ length: 13 }, () => '<i></i>').join('');

      ctx.zone.innerHTML = `
        <h2>${ctx.secondTour ? 'Deuxième envol' : 'Le Trapèze Volant'}</h2>
        <p class="question-soustitre">Le voltigeur se balance. À toi de lui dire quand lâcher.</p>

        <div class="trp-plateau">
          <div class="trp-kicker" id="trp-kicker">Le numéro va commencer</div>

          <div class="trp-chapiteau" id="trp-chapiteau">
            <span class="trp-toile" aria-hidden="true"></span>
            <span class="trp-ampoules" aria-hidden="true">${ampoules}</span>
            <span class="trp-poutre" aria-hidden="true"></span>
            <span class="trp-faisceau" aria-hidden="true"></span>

            <span class="trp-agres trp-gauche" id="trp-barre-gauche" aria-hidden="true">
              <span class="trp-artiste" id="trp-voltigeur">${VOLTIGEUR}</span>
            </span>

            <span class="trp-agres trp-droite" aria-hidden="true">
              <span class="trp-artiste trp-attrapeur" id="trp-attrapeur">${ATTRAPEUR}</span>
            </span>

            <span class="trp-eclat" id="trp-eclat" aria-hidden="true"></span>
            <span class="trp-filet" id="trp-filet" aria-hidden="true"></span>
          </div>

          <button type="button" class="btn btn-or btn-grand" id="trp-lacher">Lâche la barre&nbsp;!</button>
          <p class="trp-verdict" id="trp-verdict" role="status"></p>
        </div>
      `;

      const scene     = ctx.zone.querySelector('#trp-chapiteau');
      const barreG    = ctx.zone.querySelector('#trp-barre-gauche');
      const voltigeur = ctx.zone.querySelector('#trp-voltigeur');
      const attrapeur = ctx.zone.querySelector('#trp-attrapeur');
      const eclat     = ctx.zone.querySelector('#trp-eclat');
      const filet     = ctx.zone.querySelector('#trp-filet');
      const bouton    = ctx.zone.querySelector('#trp-lacher');
      const kicker    = ctx.zone.querySelector('#trp-kicker');
      const verdict   = ctx.zone.querySelector('#trp-verdict');

      let parti = false;

      const ecrire = (titre, detail) => {
        verdict.innerHTML = titre + (detail ? '<small>' + detail + '</small>' : '');
      };

      // Un compteur de balancements, pour que l'attente ait un rythme.
      // Il ne sert qu'à donner envie d'appuyer : il n'ouvre aucune
      // fenêtre, il ne ferme aucune porte. Le joueur lâche quand il
      // veut et le numéro se déroule pareil.
      let balancement = 0;
      const horloge = setInterval(() => {
        if (parti) return;
        balancement++;
        kicker.innerHTML = 'Balancement <strong>' + balancement + '</strong>';
      }, 2600);

      // La position d'un élément DANS la scène, en pixels, quelle que
      // soit la rotation en cours de sa corde. C'est ce qui permet de
      // partir vraiment d'où le voltigeur se trouve au moment du
      // lâcher, et d'arriver vraiment dans les mains de l'attrapeur.
      function centreDans(el) {
        const a = el.getBoundingClientRect();
        const b = scene.getBoundingClientRect();
        return {
          x: a.left - b.left + a.width / 2,
          y: a.top  - b.top  + a.height / 2,
          w: a.width,
          h: a.height
        };
      }

      // La poussière d'or, semée à l'endroit de la prise.
      function paillettes(x, y) {
        if (ctx.sobre) return;
        for (let i = 0; i < 15; i++) {
          const p = document.createElement('span');
          p.className = 'trp-paillette';
          p.style.left = (x - 45 + Math.random() * 90) + 'px';
          p.style.top  = (y - 25 + Math.random() * 40) + 'px';
          scene.appendChild(p);
          setTimeout(() => p.classList.add('tombe'), i * 42);
          setTimeout(() => p.remove(), 2100 + i * 42);
        }
      }

      bouton.addEventListener('click', function () {
        if (parti) return;
        parti = true;
        clearInterval(horloge);
        bouton.disabled = true;
        bouton.style.display = 'none';
        ctx.vibrer(20);

        // Où est le voltigeur à cet instant précis, et où sont les
        // mains de l'attrapeur ? Les deux cordes tournent, donc les
        // deux réponses changent d'une seconde à l'autre : on les
        // mesure maintenant, on ne les devine pas.
        const depart = centreDans(voltigeur);
        const mains  = centreDans(attrapeur);
        const cadre  = scene.getBoundingClientRect();

        // Les mains de l'attrapeur sont EN HAUT de son dessin (il est
        // tête en bas) : le point de rendez-vous est donc au-dessus de
        // son centre, pas dessus.
        const cibleX = mains.x - 6;
        const cibleY = mains.y - mains.h * 0.30;

        // Le voltigeur quitte sa barre : on le détache du trapèze (qui
        // continue son balancement, vide) et on le pose dans la scène,
        // exactement là où il était.
        const boite = voltigeur.getBoundingClientRect();
        voltigeur.remove();
        barreG.classList.add('vide');

        const vol = document.createElement('span');
        vol.className = 'trp-vol';
        vol.innerHTML = VOLTIGEUR;
        vol.style.left = (boite.left - cadre.left) + 'px';
        vol.style.top  = (boite.top  - cadre.top)  + 'px';
        scene.appendChild(vol);

        const dx = cibleX - depart.x;
        const dy = cibleY - depart.y;

        kicker.textContent = 'Il vole';
        ecrire('Il a lâché.', '');

        // LE VOL, CALCULÉ ET NON ÉCRIT EN DUR
        // Le voltigeur monte d'abord (un saut de trapèze monte
        // toujours avant de redescendre), fait son salto, puis
        // rejoint le point de rendez-vous. Les deux fins sont
        // écrites d'avance : le résultat ne dépend pas du geste.
        const duree = ctx.sobre ? 1 : (gagne ? 1450 : 2050);
        const etapes = gagne
          ? [
              { transform: 'translate(0px, 0px) rotate(0deg)' },
              { transform: 'translate(' + (dx * .34) + 'px, ' + (dy * .2 - 54) + 'px) rotate(200deg)', offset: .36 },
              { transform: 'translate(' + (dx * .74) + 'px, ' + (dy * .62 - 24) + 'px) rotate(348deg)', offset: .72 },
              { transform: 'translate(' + dx + 'px, ' + dy + 'px) rotate(360deg)' }
            ]
          : [
              { transform: 'translate(0px, 0px) rotate(0deg)' },
              { transform: 'translate(' + (dx * .34) + 'px, ' + (dy * .2 - 52) + 'px) rotate(196deg)', offset: .30 },
              // Le frôlement : il arrive au rendez-vous, à un cheveu.
              { transform: 'translate(' + (dx * .96) + 'px, ' + (dy - 4) + 'px) rotate(342deg)', offset: .54 },
              { transform: 'translate(' + (dx * .99) + 'px, ' + (dy + 10) + 'px) rotate(358deg)', offset: .60 },
              // Puis la chute, jusqu'au filet.
              { transform: 'translate(' + (dx * .88) + 'px, ' + (dy + 148) + 'px) rotate(500deg)' }
            ];

        const anim = vol.animate(etapes, {
          duration: duree,
          easing: gagne ? 'cubic-bezier(.36,.02,.5,1)' : 'cubic-bezier(.34,.03,.62,1)',
          fill: 'forwards'
        });

        if (gagne) {
          // La prise : l'éclat, la vibration, la poussière d'or.
          eclat.style.left = cibleX + 'px';
          eclat.style.top  = cibleY + 'px';
          setTimeout(() => {
            eclat.classList.add('brille');
            ctx.vibrer(110);
            paillettes(cibleX, cibleY);
            kicker.textContent = 'Attrapé';
            ecrire('Les mains se sont refermées !',
                   'Il est passé. Regarde ce que tu as gagné.');
          }, ctx.sobre ? 30 : duree - 90);

        } else {
          // Le frôlement, puis la chute dans le filet. Le voltigeur se
          // relève et salue : sous un chapiteau, on ne tombe jamais
          // pour de bon.
          setTimeout(() => {
            ctx.vibrer(28);
            kicker.textContent = 'Le frôlement';
            ecrire('Les doigts se sont touchés.', '');
          }, ctx.sobre ? 20 : duree * .58);

          setTimeout(() => {
            filet.classList.add('rebond');
            ctx.vibrer(60);
            const restantes = (ctx.manches || 1) - (ctx.manche || 1);
            kicker.textContent = 'Dans le filet';
            ecrire('Le filet l’a rattrapé.',
                   restantes > 0
                     ? 'Il se relève et salue. Il reste ' +
                       (restantes === 1 ? 'une manche.' : restantes + ' manches.')
                     : 'Il se relève et salue. Ton lot était tiré avant le premier ' +
                       'balancement : lâcher plus tôt ou plus tard n’y aurait rien changé.');
          }, ctx.sobre ? 60 : duree + 40);
        }

        // Le voltigeur s'efface doucement une fois le numéro fini,
        // pour ne pas rester planté dans le filet pendant qu'on lit.
        if (anim && anim.finished && anim.finished.then) {
          anim.finished.then(() => {
            vol.style.transition = 'opacity .5s ease';
            setTimeout(() => { vol.style.opacity = gagne ? '1' : '.55'; }, 500);
          }).catch(() => {});
        }

        setTimeout(ctx.terminer, ctx.sobre ? 700 : (gagne ? 3500 : 4200));
      });

      ecrire('Deux trapèzes, un seul saut.', 'Appuie quand tu le sens.');
    }
  };

})();
