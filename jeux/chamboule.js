// ============================================================
// JEU « LE CHAMBOULE-TOUT »
// Six boîtes en pyramide, trois balles, et le bruit que ça fait
// quand tout tombe. Le jeu de fête foraine par excellence, celui
// que tout le monde a joué une fois, sans une règle à expliquer.
//
// HONNÊTETÉ : comme la roue, le bandit manchot et les trois
// cadeaux pareils, le lot est tiré et enregistré par le serveur
// AVANT que le joueur touche quoi que ce soit. Le jeu ne crée
// aucune probabilité : il met en scène un résultat déjà écrit.
//   - gagnant : les deux dernières boîtes tombent à la troisième
//               balle. La pyramide est rase.
//   - perdant : il en reste UNE debout, tout en haut de la
//               planche. Le fameux « à une boîte près ».
// Le joueur ne vise pas : il lance. Rien de ce qu'il fait ne
// change le résultat, et l'écran ne lui laisse jamais croire le
// contraire (« ta balle n'y est pour rien, ton lot était tiré
// avant le premier lancer »).
//
// Interface commune à tous les jeux (voir LISEZ-MOI.md) :
//   id, nom, mot, suite, styles, preparer(ctx)
// ============================================================

(function () {

  const NB_BOITES = 6;
  const NB_BALLES = 3;

  // --------------------------------------------------------
  // LE STYLE DU JEU
  // Les boîtes sont en CSS et non en image : elles doivent
  // tomber, tourner et rouler, et un dégradé se plie à ça mieux
  // qu'un fichier. Trois matières seulement, les mêmes que le
  // reste du jeu : l'or, le velours rouge, le noir chaud.
  // --------------------------------------------------------
  const STYLES = `
  .chb-plateau { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 14px; }

  /* Le stand : le fond de toile derrière la pyramide. */
  .chb-stand {
    position: relative;
    width: 100%;
    max-width: 340px;
    height: 268px;
    border-radius: 16px;
    overflow: hidden;
    background:
      radial-gradient(ellipse 80% 54% at 50% 96%, rgba(201,150,46,.16) 0%, transparent 62%),
      repeating-linear-gradient(90deg,
        rgba(168,27,31,.5) 0 22px,
        rgba(243,231,211,.11) 22px 44px),
      linear-gradient(180deg, #24100c 0%, #170a08 100%);
    border: 1.5px solid rgba(201,150,46,.4);
    box-shadow: inset 0 2px 0 rgba(255,233,184,.12), 0 14px 34px rgba(0,0,0,.5);
  }

  /* La pyramide : trois étages posés sur la planche. */
  .chb-pyramide {
    position: absolute;
    left: 0; right: 0;
    bottom: 34px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
  }
  .chb-etage { display: flex; gap: 9px; justify-content: center; }

  /* Une boîte de conserve : le corps, le couvercle, la bande. */
  .chb-boite {
    position: relative;
    width: 44px; height: 52px;
    border-radius: 5px / 7px;
    background:
      linear-gradient(90deg,
        #8A6A21 0%, #E3B85A 22%, #FFF3D4 38%, #E3B85A 58%, #A87C28 82%, #6E5015 100%);
    box-shadow: 0 5px 12px rgba(0,0,0,.45);
    transform-origin: 50% 50%;
    transition: transform .62s cubic-bezier(.28,.9,.4,1), opacity .5s ease;
  }
  /* Le couvercle, vu de trois quarts */
  .chb-boite::before {
    content: '';
    position: absolute;
    left: 0; right: 0; top: -4px;
    height: 9px;
    border-radius: 50%;
    background: linear-gradient(180deg, #FFF3D4 0%, #D5A947 70%, #8A6A21 100%);
  }
  /* La bande rouge, l'étiquette du stand */
  .chb-boite::after {
    content: '';
    position: absolute;
    left: 0; right: 0; top: 18px;
    height: 15px;
    background: linear-gradient(180deg, rgba(168,27,31,.95), rgba(110,17,19,.95));
    box-shadow: inset 0 1px 0 rgba(255,233,184,.3), inset 0 -1px 0 rgba(0,0,0,.35);
  }

  /* La boîte tombée reste là, couchée : un chamboule-tout se regarde
     autant après qu'avant. Elle passe simplement derrière les autres et
     s'assombrit un peu, comme une boîte qui n'est plus en jeu. */
  .chb-boite.tombee {
    z-index: 0;
    filter: brightness(.82) saturate(.9);
    box-shadow: 0 3px 14px rgba(0,0,0,.6);
  }

  /* La planche */
  .chb-planche {
    position: absolute;
    left: 26px; right: 26px;
    bottom: 26px;
    height: 9px;
    border-radius: 2px;
    background: linear-gradient(180deg, #C9962E, #6E5015);
    box-shadow: 0 6px 16px rgba(0,0,0,.55);
  }

  /* La balle : elle part du bas de l'écran et monte vers la pyramide. */
  .chb-balle {
    position: absolute;
    left: 50%;
    bottom: 8px;
    width: 26px; height: 26px;
    margin-left: -13px;
    border-radius: 50%;
    background: radial-gradient(circle at 34% 30%, #FF9A8E 0%, #D8383E 42%, #8E1418 100%);
    box-shadow: 0 3px 10px rgba(0,0,0,.5), inset -2px -3px 6px rgba(0,0,0,.35);
    opacity: 0;
    pointer-events: none;
  }
  .chb-balle.lancee { animation: chb-lance .46s cubic-bezier(.4,.05,.6,1) forwards; }
  @keyframes chb-lance {
    0%   { opacity: 1; transform: translateY(0) scale(1); }
    70%  { opacity: 1; transform: translateY(-150px) scale(.72); }
    100% { opacity: 0; transform: translateY(-186px) scale(.5); }
  }

  /* Le petit éclat au moment de l'impact */
  .chb-impact {
    position: absolute;
    left: 50%; top: 46%;
    width: 90px; height: 90px;
    margin: -45px 0 0 -45px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,243,212,.6) 0%, rgba(239,195,104,.22) 42%, transparent 68%);
    opacity: 0;
    pointer-events: none;
  }
  .chb-impact.bang { animation: chb-bang .42s ease-out forwards; }
  @keyframes chb-bang {
    0%   { opacity: .95; transform: scale(.35); }
    100% { opacity: 0;   transform: scale(1.5); }
  }

  /* Le compte des balles restantes */
  .chb-compte { display: flex; flex-direction: column; align-items: center; gap: 7px; }
  .chb-kicker {
    font-size: 11px; letter-spacing: 2.2px; text-transform: uppercase;
    color: var(--gris);
  }
  .chb-kicker strong { color: var(--or-clair); font-size: 13px; }
  .chb-balles { display: flex; gap: 7px; }
  .chb-balles i {
    display: block; width: 11px; height: 11px; border-radius: 50%;
    background: radial-gradient(circle at 34% 30%, #FF9A8E 0%, #D8383E 45%, #8E1418 100%);
    box-shadow: 0 0 8px rgba(216,56,62,.5);
    transition: opacity .3s ease, transform .3s ease;
  }
  .chb-balles i.jouee { opacity: .2; transform: scale(.7); box-shadow: none; }

  .chb-verdict {
    min-height: 46px;
    text-align: center;
    font-family: var(--serif);
    font-size: 19px;
    line-height: 1.3;
    color: var(--or-blanc);
  }
  .chb-verdict small {
    display: block;
    margin-top: 6px;
    font-family: var(--sans);
    font-size: 13.5px;
    color: var(--creme);
    opacity: .85;
    line-height: 1.5;
  }

  @media (prefers-reduced-motion: reduce) {
    .chb-boite { transition-duration: .01ms; }
    .chb-balle.lancee, .chb-impact.bang { animation-duration: .01ms; }
  }
  `;

  // Chaque boîte tombe de sa place : une chute identique pour les six
  // ferait un décor qui glisse, pas une pyramide qui s'écroule. Les
  // valeurs suivent la géométrie de la pyramide (un étage = 57 px) pour
  // que chaque boîte finisse couchée SUR la planche, jamais dessous.
  // Chaque boîte a sa place au sol, de la gauche vers la droite, pour
  // qu'aucune ne se couche sur une autre. La descente vaut la hauteur de
  // l'étage (57 px) plus les 4 px que gagne une boîte en se couchant.
  const CHUTES = {
    0: 'translate(-57px, 4px)    rotate(-86deg)',   // base gauche   -> tout à gauche
    3: 'translate(-40px, 61px)   rotate(-94deg)',   // milieu gauche
    5: 'translate(-22px, 118px)  rotate(-88deg)',   // le sommet     -> au centre gauche
    1: 'translate(22px, 4px)     rotate(92deg)',    // base milieu
    4: 'translate(40px, 61px)    rotate(88deg)',    // milieu droit
    2: 'translate(57px, 4px)     rotate(94deg)'     // base droite   -> tout à droite
  };

  window.PullUpJeux = window.PullUpJeux || {};

  window.PullUpJeux.chamboule = {
    id: 'chamboule',
    nom: 'Le Chamboule-Tout',
    mot: 'la planche',                                  // « la planche a hésité… »
    suite: 'Six boîtes t’attendent sur la planche.',    // fin du ticket à gratter

    styles: STYLES,

    preparer(ctx) {
      // Une manche qui n'est pas la dernière ne révèle jamais le lot :
      // elle se joue toujours « tout près » et passe la main. C'est la
      // dernière manche qui tranche, pour tout le monde pareil.
      const gagne = ctx.decisif !== false && !ctx.lot.perdant;

      // LE SCÉNARIO DES TROIS BALLES, écrit avant le premier lancer.
      // Combien de boîtes tombent à chaque balle. Gagnant : les six.
      // Perdant : cinq, et la dernière reste debout tout en haut.
      const scenario = gagne ? [2, 2, 2] : [2, 2, 1];

      // L'ordre dans lequel les boîtes tombent : le sommet d'abord,
      // puis l'étage du milieu, puis la base. C'est le seul ordre qui
      // ne laisse jamais une boîte suspendue au-dessus du vide. La
      // dernière de la liste (la base, à droite) est donc celle qui
      // reste debout quand c'est perdu : une boîte seule au milieu de
      // la planche, l'image même du « à une boîte près ».
      const ordre = [5, 3, 4, 0, 1, 2];

      const boite = i => `<span class="chb-boite" id="chb-boite-${i}"></span>`;

      ctx.zone.innerHTML = `
        <h2>${ctx.secondTour ? 'Deuxième planche' : 'Le Chamboule-Tout'}</h2>
        <p class="question-soustitre">Trois balles pour faire tomber les six boîtes.</p>

        <div class="chb-plateau">
          <div class="chb-compte">
            <div class="chb-kicker" id="chb-kicker">Balle <strong>1</strong> sur ${NB_BALLES}</div>
            <div class="chb-balles" id="chb-balles" role="img" aria-label="Trois balles">
              ${Array.from({ length: NB_BALLES }, () => '<i></i>').join('')}
            </div>
          </div>

          <div class="chb-stand" id="chb-stand">
            <div class="chb-pyramide" id="chb-pyramide">
              <div class="chb-etage">${boite(5)}</div>
              <div class="chb-etage">${boite(3)}${boite(4)}</div>
              <div class="chb-etage">${boite(0)}${boite(1)}${boite(2)}</div>
            </div>
            <div class="chb-planche" aria-hidden="true"></div>
            <span class="chb-impact" id="chb-impact" aria-hidden="true"></span>
            <span class="chb-balle" id="chb-balle" aria-hidden="true"></span>
          </div>

          <button type="button" class="btn btn-or btn-grand" id="chb-lancer">Lance la balle</button>
          <p class="chb-verdict" id="chb-verdict" role="status"></p>
        </div>
      `;

      const stand    = ctx.zone.querySelector('#chb-stand');
      const balle    = ctx.zone.querySelector('#chb-balle');
      const impact   = ctx.zone.querySelector('#chb-impact');
      const bouton   = ctx.zone.querySelector('#chb-lancer');
      const kicker   = ctx.zone.querySelector('#chb-kicker');
      const jauge    = ctx.zone.querySelector('#chb-balles');
      const verdict  = ctx.zone.querySelector('#chb-verdict');

      let lancer = 0;          // combien de balles ont été lancées
      let tombees = 0;         // combien de boîtes sont par terre
      let occupe = false;

      const ecrire = (titre, detail) => {
        verdict.innerHTML = titre + (detail ? '<small>' + detail + '</small>' : '');
      };

      const LIBELLES = ['Lance la balle', 'Deuxième balle', 'Dernière balle'];

      function faireTomber(combien) {
        for (let k = 0; k < combien; k++) {
          const i = ordre[tombees];
          if (i === undefined) break;
          const el = ctx.zone.querySelector('#chb-boite-' + i);
          if (el) {
            // Un léger décalage entre les boîtes : elles ne tombent
            // jamais toutes au même instant, sinon c'est un décor.
            setTimeout(() => {
              el.style.transform = CHUTES[i];
              el.classList.add('tombee');
            }, ctx.sobre ? 0 : k * 90);
          }
          tombees++;
        }
      }

      bouton.addEventListener('click', function () {
        if (occupe || lancer >= NB_BALLES) return;
        occupe = true;
        bouton.disabled = true;

        // La balle part.
        balle.classList.remove('lancee');
        void balle.offsetWidth;                 // on rembobine l'animation
        balle.classList.add('lancee');
        ctx.vibrer(18);

        const combien = scenario[lancer];
        lancer++;

        // L'impact, puis les boîtes qui partent.
        setTimeout(() => {
          impact.classList.remove('bang');
          void impact.offsetWidth;
          impact.classList.add('bang');
          ctx.vibrer(combien >= 2 ? 55 : 30);
          faireTomber(combien);

          // Le compte des balles.
          const puces = jauge.querySelectorAll('i');
          if (puces[lancer - 1]) puces[lancer - 1].classList.add('jouee');

          const fini = lancer >= NB_BALLES;
          if (!fini) {
            kicker.innerHTML = 'Balle <strong>' + (lancer + 1) + '</strong> sur ' + NB_BALLES;
            jauge.setAttribute('aria-label', (NB_BALLES - lancer) + ' balles restantes');
            bouton.textContent = LIBELLES[lancer] || 'Balle suivante';
            const reste = NB_BOITES - tombees;
            ecrire(reste === 1 ? 'Il en reste une.' : 'Il en reste ' + reste + '.',
                   reste === 1 ? 'Une seule boîte encore debout.' : '');
            bouton.disabled = false;
            occupe = false;
            return;
          }

          // Dernière balle : le verdict.
          bouton.style.display = 'none';
          setTimeout(() => {
            if (gagne) {
              stand.classList.add('gagne');
              ctx.vibrer(110);
              ecrire('Tout est par terre !', 'La planche est rase. Regarde ce que tu as gagné.');
            } else {
              const restantes = (ctx.manches || 1) - (ctx.manche || 1);
              ecrire('Il en restait une.',
                     restantes > 0
                       ? 'La dernière a tenu bon. Il reste ' +
                         (restantes === 1 ? 'une manche.' : restantes + ' manches.')
                       : 'La dernière a tenu bon. Ton lot était tiré avant le premier ' +
                         'lancer : aucune autre balle n’y aurait rien changé.');
            }
          }, ctx.sobre ? 60 : 620);

          setTimeout(ctx.terminer, ctx.sobre ? 700 : 3200);
        }, ctx.sobre ? 40 : 330);
      });

      ecrire('Six boîtes, trois balles.', 'Touche le bouton, et regarde ça.');
    }
  };

})();
