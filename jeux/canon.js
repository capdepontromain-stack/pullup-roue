// ============================================================
// JEU « L'HOMME OBUS »
// Le clou d'un programme de cirque : un canon, une jauge de
// poudre qui monte et qui descend, et un artiste qui traverse le
// chapiteau pour retomber dans le filet, tout au bout.
//
// C'est la seule mécanique de JAUGE du parcours : on n'appuie pas
// une fois (le trapèze), on ne glisse pas le doigt (la hotte), on
// arrête une aiguille qui court. Trois façons de jouer différentes,
// c'est ce qui évite que trois manches se ressemblent.
//
// HONNÊTETÉ (la règle de toute l'application) : le lot est tiré et
// enregistré par le serveur AVANT que le joueur touche l'écran. Le
// jeu ne crée aucune probabilité, il met en scène un résultat déjà
// écrit :
//   - gagnant : l'artiste atteint le filet, tout au fond ;
//   - perdant : il retombe juste devant, à un mètre du bord.
// La jauge que le joueur arrête ne commande rien : c'est écrit noir
// sur blanc à la fin de la manche, et la poudre chargée est
// affichée telle qu'il l'a arrêtée, sans tricherie d'affichage.
//
// Interface commune à tous les jeux (voir LISEZ-MOI.md) :
//   id, nom, mot, suite, styles, preparer(ctx)
// ============================================================

(function () {

  // L'ARTISTE, EN BOULE
  // Un homme obus ne vole pas les bras écartés : il se met en boule,
  // casque en avant. C'est cette silhouette compacte qui rend le vol
  // lisible même à 30 pixels.
  const OBUS = `
    <svg viewBox="0 0 72 56" width="58" height="45" aria-hidden="true">
      <defs>
        <linearGradient id="cnn-or" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#FFF3D4"/>
          <stop offset="48%"  stop-color="#EFC368"/>
          <stop offset="100%" stop-color="#C08C25"/>
        </linearGradient>
      </defs>
      <!-- Le corps replié en boule, dos rond, genoux ramenés -->
      <path d="M18 16 q10 -12 26 -6 q16 6 14 18 q-2 14 -18 18 q-18 4 -24 -8 q-6 -12 2 -22 Z"
            fill="#A81B1F" stroke="#5E0F11" stroke-width="2.2"/>
      <!-- Les jambes repliées, qui dépassent du corps -->
      <path d="M24 40 q9 5 17 1" fill="none" stroke="url(#cnn-or)"
            stroke-width="8" stroke-linecap="round"/>
      <!-- Les bras serrés autour des genoux -->
      <path d="M25 27 q10 -6 19 1" fill="none" stroke="url(#cnn-or)"
            stroke-width="7" stroke-linecap="round"/>
      <!-- Le casque, en avant, avec sa visière -->
      <circle cx="52" cy="22" r="11" fill="url(#cnn-or)"
              stroke="#3A1D06" stroke-width="1.8"/>
      <path d="M52 11 q9 4 8 12" fill="none" stroke="#3A1D06"
            stroke-width="2.4" stroke-linecap="round"/>
      <path d="M58 26 q6 0 7 4" fill="none" stroke="#5E0F11"
            stroke-width="3" stroke-linecap="round"/>
    </svg>`;

  const STYLES = `
  .cnn-plateau { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 13px; }

  .cnn-piste {
    position: relative;
    width: 100%;
    max-width: 348px;
    height: 214px;
    border-radius: 18px;
    overflow: hidden;
    background:
      radial-gradient(ellipse 74% 40% at 22% 96%, rgba(201,150,46,.18) 0%, transparent 64%),
      radial-gradient(ellipse 60% 34% at 88% 92%, rgba(168,27,31,.26) 0%, transparent 66%),
      linear-gradient(180deg, #2A0F0C 0%, #1B0908 52%, #110504 100%);
    border: 1.5px solid rgba(201,150,46,.42);
    box-shadow: inset 0 2px 0 rgba(255,233,184,.14), 0 16px 38px rgba(0,0,0,.55);
  }

  /* La bande de toile du chapiteau, tout en haut. */
  .cnn-toile {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 8px;
    background: repeating-linear-gradient(90deg,
      rgba(134,20,23,.9) 0 16px,
      rgba(226,209,182,.62) 16px 32px);
  }

  /* La rampe d'ampoules, la même que sous le chapiteau du trapèze :
     c'est ce qui fait que les jeux appartiennent au même cirque. */
  .cnn-ampoules {
    position: absolute;
    top: 14px; left: 12px; right: 12px;
    display: flex; justify-content: space-between;
  }
  .cnn-ampoules i {
    display: block; width: 5px; height: 5px; border-radius: 50%;
    background: #FFE9B8;
    box-shadow: 0 0 8px rgba(255,233,184,.8);
    animation: cnn-clignote 2.4s ease-in-out infinite;
  }
  .cnn-ampoules i:nth-child(2n) { animation-delay: .4s; }
  .cnn-ampoules i:nth-child(3n) { animation-delay: .9s; }
  @keyframes cnn-clignote { 0%,100% { opacity: 1; } 50% { opacity: .32; } }

  /* LE PUBLIC
     Deux rangées de têtes en contre-jour au fond du chapiteau. On ne
     distingue personne, et c'est le but : ce sont des silhouettes
     qui donnent la profondeur, pas des spectateurs qu'on regarde.
     Une seule forme répétée, décalée d'une rangée à l'autre. */
  .cnn-public {
    position: absolute;
    left: 0; right: 0; bottom: 40px;
    height: 52px;
    background-image:
      radial-gradient(circle 8px at 50% 100%, rgba(64,30,18,.94) 96%, transparent 100%),
      radial-gradient(circle 9px at 50% 100%, rgba(42,18,11,.96) 96%, transparent 100%);
    background-size: 22px 22px, 26px 26px;
    background-repeat: repeat-x, repeat-x;
    background-position: 0 62%, 12px 100%;
  }
  /* Quelques visages qui accrochent la lumière de la piste. */
  .cnn-public::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle 2px at 50% 88%, rgba(255,233,184,.22) 96%, transparent 100%);
    background-size: 76px 22px;
    background-repeat: repeat-x;
    background-position: 30px 100%;
  }

  /* Le projecteur braqué sur le filet : c'est là que le regard doit
     aller, puisque c'est là que le numéro se termine. */
  .cnn-projecteur {
    position: absolute;
    right: 6px; top: 6px;
    width: 130px; height: 200px;
    background: linear-gradient(190deg, rgba(255,233,184,.17) 0%, rgba(255,233,184,.05) 52%, transparent 100%);
    clip-path: polygon(52% 0%, 68% 0%, 100% 100%, 6% 100%);
    pointer-events: none;
  }

  /* La piste, au sol. */
  .cnn-sol {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 42px;
    background: linear-gradient(180deg, rgba(255,233,184,.09), rgba(255,233,184,.02));
    border-top: 1px solid rgba(201,150,46,.3);
  }

  /* LE CANON
     Un fût incliné, deux cercles de renfort, une gueule sombre, et
     des roues. Tout est en CSS : il doit pouvoir reculer au départ
     du coup, et une image ne recule pas. */
  .cnn-canon {
    position: absolute;
    left: 16px; bottom: 30px;
    width: 108px; height: 46px;
    transform-origin: 14% 74%;
    transform: rotate(-26deg);
    transition: transform .22s cubic-bezier(.34,1.42,.64,1);
  }
  .cnn-canon.recule { animation: cnn-recul .5s ease-out; }
  @keyframes cnn-recul {
    0%   { transform: rotate(-26deg) translateX(0); }
    18%  { transform: rotate(-26deg) translateX(-13px); }
    100% { transform: rotate(-26deg) translateX(0); }
  }
  .cnn-fut {
    position: absolute;
    left: 0; top: 8px;
    width: 100%; height: 30px;
    border-radius: 6px 15px 15px 6px;
    background: linear-gradient(180deg, #E3B85A 0%, #B5822C 42%, #6E5015 100%);
    box-shadow: inset 0 2px 0 rgba(255,243,212,.5), 0 5px 14px rgba(0,0,0,.55);
  }
  .cnn-fut::after {                       /* la gueule du canon */
    content: '';
    position: absolute;
    right: 2px; top: 3px;
    width: 13px; height: 24px;
    border-radius: 50%;
    background: radial-gradient(ellipse at 40% 50%, #1A0B06 0%, #37200C 100%);
    box-shadow: inset 1px 0 3px rgba(0,0,0,.9);
  }
  .cnn-anneau {
    position: absolute;
    top: 4px;
    width: 9px; height: 38px;
    border-radius: 4px;
    background: linear-gradient(180deg, #FFE9B8, #8A6A21);
  }
  .cnn-anneau.a1 { left: 26px; }
  .cnn-anneau.a2 { left: 58px; }
  .cnn-roue {
    position: absolute;
    left: 12px; bottom: -8px;
    width: 32px; height: 32px;
    border-radius: 50%;
    background: radial-gradient(circle at 40% 36%, #C9962E 0%, #6E5015 70%, #3A2408 100%);
    border: 3px solid #8A6A21;
    box-shadow: 0 4px 10px rgba(0,0,0,.6);
  }

  /* Le souffle du départ. */
  .cnn-souffle {
    position: absolute;
    left: 108px; bottom: 62px;
    width: 90px; height: 90px;
    margin: 0 0 -45px -45px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,243,212,.85) 0%, rgba(239,195,104,.4) 34%, rgba(168,27,31,.18) 58%, transparent 74%);
    opacity: 0;
    pointer-events: none;
  }
  .cnn-souffle.part { animation: cnn-boum .6s ease-out forwards; }
  @keyframes cnn-boum {
    0%   { opacity: 1; transform: scale(.2); }
    100% { opacity: 0; transform: scale(2); }
  }

  /* LE FILET D'ARRIVÉE, tout au fond de la piste. */
  .cnn-filet {
    position: absolute;
    right: 14px; bottom: 34px;
    width: 96px; height: 34px;
    border-radius: 4px;
    background:
      repeating-linear-gradient(46deg,  rgba(226,209,182,.2) 0 1.2px, transparent 1.2px 15px),
      repeating-linear-gradient(-46deg, rgba(226,209,182,.2) 0 1.2px, transparent 1.2px 15px);
    border-top: 3px solid rgba(255,233,184,.7);
    box-shadow: 0 0 18px rgba(239,195,104,.22);
  }
  /* Les deux poteaux qui tiennent le filet. */
  .cnn-filet::before, .cnn-filet::after {
    content: '';
    position: absolute;
    bottom: -12px;
    width: 4px; height: 16px;
    border-radius: 2px;
    background: linear-gradient(180deg, #C9962E, #6E5015);
  }
  .cnn-filet::before { left: -2px; }
  .cnn-filet::after  { right: -2px; }
  .cnn-filet.rebond { animation: cnn-rebond .8s ease-out; }
  @keyframes cnn-rebond {
    0%   { transform: scaleY(1); }
    26%  { transform: scaleY(2) translateY(6px); }
    60%  { transform: scaleY(.82); }
    100% { transform: scaleY(1); }
  }

  .cnn-obus { position: absolute; left: 0; top: 0; z-index: 4;
              filter: drop-shadow(0 5px 12px rgba(0,0,0,.6)); }

  /* LA JAUGE DE POUDRE
     Une aiguille qui court d'un bord à l'autre, de plus en plus
     vite : c'est le seul geste du jeu, et il doit avoir l'air
     difficile. La zone dorée est la « bonne » charge, celle que
     tout le monde vise. */
  .cnn-jauge {
    position: relative;
    width: 100%;
    max-width: 348px;
    height: 26px;
    border-radius: 13px;
    overflow: hidden;
    background: linear-gradient(90deg,
      rgba(46,27,14,.9) 0%, rgba(66,38,18,.9) 42%,
      rgba(120,72,26,.9) 68%, rgba(168,27,31,.9) 100%);
    border: 1.5px solid rgba(201,150,46,.45);
    box-shadow: inset 0 2px 5px rgba(0,0,0,.55);
  }
  .cnn-zone {
    position: absolute;
    top: 0; bottom: 0;
    left: 62%; width: 20%;
    background: linear-gradient(180deg, rgba(255,233,184,.55), rgba(201,150,46,.36));
    border-left: 2px solid rgba(255,243,212,.9);
    border-right: 2px solid rgba(255,243,212,.9);
    box-shadow: 0 0 14px rgba(239,195,104,.35);
  }
  .cnn-aiguille {
    position: absolute;
    top: -2px; bottom: -2px;
    width: 4px;
    margin-left: -2px;
    border-radius: 2px;
    background: #FFF3D4;
    box-shadow: 0 0 10px rgba(255,243,212,.9);
    will-change: transform;
  }
  .cnn-etiquettes {
    display: flex; justify-content: space-between;
    width: 100%; max-width: 348px;
    font-size: 12px; letter-spacing: 1.6px; text-transform: uppercase;
    color: var(--gris);
  }

  .cnn-kicker {
    font-size: 11px; letter-spacing: 2.2px; text-transform: uppercase;
    color: var(--gris); text-align: center; min-height: 15px;
  }
  .cnn-kicker strong { color: var(--or-clair); font-size: 13px; }

  .cnn-verdict {
    min-height: 46px; text-align: center;
    font-family: var(--serif); font-size: 19px; line-height: 1.3;
    color: var(--or-blanc);
  }
  .cnn-verdict small {
    display: block; margin-top: 6px;
    font-family: var(--sans); font-size: 13.5px;
    color: var(--creme); opacity: .85; line-height: 1.5;
  }

  @media (prefers-reduced-motion: reduce) {
    .cnn-canon.recule, .cnn-souffle.part, .cnn-filet.rebond { animation-duration: .01ms; }
  }
  `;

  window.PullUpJeux = window.PullUpJeux || {};

  window.PullUpJeux.canon = {
    id: 'canon',
    nom: 'L’Homme Obus',
    mot: 'le canon',                                  // « le canon a hésité… »
    suite: 'Le canon est déjà pointé vers le fond.',  // fin du ticket à gratter

    styles: STYLES,

    preparer(ctx) {
      // Une manche qui n'est pas la dernière ne révèle jamais le lot :
      // elle se joue toujours « tout près » et passe la main. C'est la
      // dernière manche qui tranche, pour tout le monde pareil.
      const gagne = ctx.decisif !== false && !ctx.lot.perdant;

      ctx.zone.innerHTML = `
        <h2>${ctx.secondTour ? 'Deuxième coup' : 'L’Homme Obus'}</h2>
        <p class="question-soustitre">Arrête la poudre où tu veux, puis mets le feu.</p>

        <div class="cnn-plateau">
          <div class="cnn-kicker" id="cnn-kicker">La poudre monte</div>

          <div class="cnn-piste" id="cnn-piste">
            <span class="cnn-toile" aria-hidden="true"></span>
            <span class="cnn-ampoules" aria-hidden="true">${Array.from({ length: 12 }, () => '<i></i>').join('')}</span>
            <span class="cnn-public" aria-hidden="true"></span>
            <span class="cnn-projecteur" aria-hidden="true"></span>
            <span class="cnn-sol" aria-hidden="true"></span>
            <span class="cnn-filet" id="cnn-filet" aria-hidden="true"></span>
            <span class="cnn-canon" id="cnn-canon" aria-hidden="true">
              <span class="cnn-fut"></span>
              <span class="cnn-anneau a1"></span>
              <span class="cnn-anneau a2"></span>
              <span class="cnn-roue"></span>
            </span>
            <span class="cnn-souffle" id="cnn-souffle" aria-hidden="true"></span>
          </div>

          <div class="cnn-jauge" id="cnn-jauge">
            <span class="cnn-zone" aria-hidden="true"></span>
            <span class="cnn-aiguille" id="cnn-aiguille" aria-hidden="true"></span>
          </div>
          <div class="cnn-etiquettes" aria-hidden="true">
            <span>Trop peu</span><span>Ce qu’il faut</span><span>Trop</span>
          </div>

          <button type="button" class="btn btn-or btn-grand" id="cnn-feu">Mets le feu&nbsp;!</button>
          <p class="cnn-verdict" id="cnn-verdict" role="status"></p>
        </div>
      `;

      const piste    = ctx.zone.querySelector('#cnn-piste');
      const canon    = ctx.zone.querySelector('#cnn-canon');
      const souffle  = ctx.zone.querySelector('#cnn-souffle');
      const filet    = ctx.zone.querySelector('#cnn-filet');
      const jauge    = ctx.zone.querySelector('#cnn-jauge');
      const aiguille = ctx.zone.querySelector('#cnn-aiguille');
      const bouton   = ctx.zone.querySelector('#cnn-feu');
      const kicker   = ctx.zone.querySelector('#cnn-kicker');
      const verdict  = ctx.zone.querySelector('#cnn-verdict');

      const ecrire = (titre, detail) => {
        verdict.innerHTML = titre + (detail ? '<small>' + detail + '</small>' : '');
      };

      // --- L'AIGUILLE ----------------------------------------
      // Elle fait des allers-retours, de plus en plus vite. Sur un
      // écran de 320 px comme sur un grand, elle met le même temps à
      // traverser : la difficulté ressentie ne dépend pas du téléphone.
      let largeur = jauge.clientWidth || 320;
      let part = 0;              // de 0 à 1
      let sens = 1;
      let vitesse = 0.011;
      let tire = false;
      let boucle = null;

      function courir() {
        if (tire) return;
        part += sens * vitesse;
        if (part >= 1) { part = 1; sens = -1; vitesse += 0.0016; }
        if (part <= 0) { part = 0; sens = 1;  vitesse += 0.0016; }
        aiguille.style.transform = 'translateX(' + (part * largeur).toFixed(1) + 'px)';
        boucle = requestAnimationFrame(courir);
      }
      boucle = requestAnimationFrame(courir);

      // --- LE COUP -------------------------------------------
      bouton.addEventListener('click', function () {
        if (tire) return;
        tire = true;
        if (boucle) cancelAnimationFrame(boucle);
        bouton.disabled = true;
        bouton.style.display = 'none';
        ctx.vibrer(24);

        // La charge est affichée telle que le joueur l'a arrêtée. On ne
        // déplace jamais l'aiguille après coup pour la faire coller au
        // résultat : ce serait exactement le genre de petit mensonge
        // que le reste de l'application s'interdit.
        const charge = Math.round(part * 100);
        kicker.innerHTML = 'Poudre chargée : <strong>' + charge + '&nbsp;%</strong>';

        canon.classList.add('recule');
        souffle.classList.remove('part');
        void souffle.offsetWidth;
        souffle.classList.add('part');
        ctx.vibrer(90);

        // L'artiste part de la gueule du canon et traverse la piste.
        const cadre = piste.getBoundingClientRect();
        const obus = document.createElement('span');
        obus.className = 'cnn-obus';
        obus.innerHTML = OBUS;
        obus.style.left = Math.round(cadre.width * 0.30) + 'px';
        obus.style.top  = (cadre.height - 120) + 'px';
        piste.appendChild(obus);

        // Où finit-il ? Dans le filet s'il gagne, juste devant sinon.
        const boiteFilet = filet.getBoundingClientRect();
        const arrivee = (boiteFilet.left - cadre.left) + (gagne ? 18 : -46);
        const depart = Math.round(cadre.width * 0.30);
        const dx = arrivee - depart;
        const dy = gagne ? 44 : 62;
        const duree = ctx.sobre ? 1 : 1250;

        obus.animate([
          { transform: 'translate(0px, 0px) rotate(-24deg)' },
          { transform: 'translate(' + (dx * .34) + 'px, ' + (-52) + 'px) rotate(-8deg)', offset: .34 },
          { transform: 'translate(' + (dx * .68) + 'px, ' + (-30) + 'px) rotate(12deg)', offset: .68 },
          { transform: 'translate(' + dx + 'px, ' + dy + 'px) rotate(34deg)' }
        ], {
          duration: duree,
          easing: 'cubic-bezier(.34,.06,.62,1)',
          fill: 'forwards'
        });

        ecrire('Il est parti !', '');

        setTimeout(() => {
          if (gagne) {
            filet.classList.add('rebond');
            ctx.vibrer(110);
            kicker.innerHTML = 'Dans le filet · poudre <strong>' + charge + '&nbsp;%</strong>';
            ecrire('Pile dans le filet !',
                   'Il a traversé tout le chapiteau. Regarde ce que tu as gagné.');
          } else {
            ctx.vibrer(45);
            const restantes = (ctx.manches || 1) - (ctx.manche || 1);
            kicker.innerHTML = 'Devant le filet · poudre <strong>' + charge + '&nbsp;%</strong>';
            ecrire('Il retombe juste devant.',
                   restantes > 0
                     ? 'À un mètre du filet. Il reste ' +
                       (restantes === 1 ? 'une manche.' : restantes + ' manches.')
                     : 'À un mètre du filet. Ton lot était tiré avant que tu arrêtes ' +
                       'la poudre : aucune charge ne l’aurait envoyé plus loin.');
          }
          setTimeout(ctx.terminer, ctx.sobre ? 600 : 2800);
        }, ctx.sobre ? 60 : duree + 60);
      });

      const surResize = () => {
        if (!jauge.isConnected) { window.removeEventListener('resize', surResize); return; }
        largeur = jauge.clientWidth || largeur;
      };
      window.addEventListener('resize', surResize);

      ecrire('Un canon, un filet, tout au fond.', 'Arrête la poudre quand tu veux.');
    }
  };

})();
