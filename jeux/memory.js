// ============================================================
// ⚠ JEU ÉCARTÉ PAR ROMAIN LE 25/08/2026 : « le memory, c'est vu et revu ».
// Le fichier est gardé au cas où, mais il n'est PAS chargé dans
// index.html : il ne tourne nulle part. Pour le remettre en service,
// ajouter <script src="jeux/memory.js"></script> avant app.js.
// ============================================================

// ============================================================
// JEU « LE MEMORY DE NOËL »
// Six cartes, trois paires à retrouver. Les paires montrent de
// vrais lots de la galerie : le joueur découvre ce qui est en jeu
// en jouant. Quand les trois paires sont retournées, la hotte
// désigne celle qui est pour lui : le lot tiré et enregistré avant.
//
// Interface commune à tous les jeux (voir LISEZ-MOI.md) :
//   id, nom, mot, suite, styles, preparer(ctx)
// ============================================================

(function () {

  const STYLES = `
  .memory-plateau { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 16px; }

  .memory-compteur {
    font-size: 12.5px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: rgba(246,241,230,.6);
    font-weight: 600;
  }
  .memory-compteur strong { color: var(--or-clair); font-weight: 700; }

  .memory-grille {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 9px;
    width: 100%;
    max-width: 360px;
  }

  .carte {
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
    perspective: 800px;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    transition: opacity .5s ease, transform .5s ease;
  }
  .carte:focus-visible { outline: 3px solid var(--or-clair); outline-offset: 4px; border-radius: 15px; }

  .carte-plateau {
    position: relative;
    display: block;
    width: 100%;
    padding-top: 124%;
    transform-style: preserve-3d;
    transition: transform .48s cubic-bezier(.3,.8,.35,1);
  }
  .carte.ouverte .carte-plateau { transform: rotateY(180deg); }

  .carte-face {
    position: absolute;
    inset: 0;
    border-radius: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 6px;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    overflow: hidden;
  }

  .carte-dos {
    background: linear-gradient(158deg, #2a2114 0%, #17110a 55%, #221a0f 100%);
    border: 1.5px solid rgba(201,150,46,.55);
    box-shadow: inset 0 0 0 3px rgba(201,150,46,.13), 0 5px 16px rgba(0,0,0,.4);
  }
  .carte-dos svg { width: 52%; height: auto; opacity: .82; }

  .carte-avant {
    transform: rotateY(180deg);
    background: linear-gradient(160deg, rgba(56,44,24,.96) 0%, rgba(28,22,13,.96) 100%);
    border: 1.5px solid rgba(239,195,104,.7);
    box-shadow: inset 0 0 22px rgba(201,150,46,.12), 0 5px 16px rgba(0,0,0,.4);
  }
  .carte-avant svg { width: 50%; height: auto; }
  .carte-nom {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: .5px;
    line-height: 1.15;
    text-align: center;
    color: var(--creme);
    padding: 0 2px;
  }

  /* Paire retrouvée : la carte s'allume et se calme */
  .carte.trouvee .carte-avant {
    border-color: var(--or-clair);
    box-shadow: inset 0 0 26px rgba(239,195,104,.26), 0 0 18px rgba(201,150,46,.35);
  }
  .carte.trouvee { animation: carte-trouvee .5s ease-out; }
  @keyframes carte-trouvee {
    0%   { transform: scale(1); }
    45%  { transform: scale(1.07); }
    100% { transform: scale(1); }
  }

  /* Deux cartes différentes : elles tremblent avant de se refermer */
  .carte.rate .carte-plateau { animation: carte-rate .42s ease-in-out; }
  @keyframes carte-rate {
    0%, 100% { transform: rotateY(180deg) translateX(0); }
    25%      { transform: rotateY(180deg) translateX(-5px); }
    75%      { transform: rotateY(180deg) translateX(5px); }
  }

  /* Le petit coup de pouce si le joueur cale */
  .carte.indice .carte-plateau { transform: rotateY(180deg); }

  /* La paire gagnante, à la fin */
  .memory-grille.fini .carte { opacity: .26; }
  .memory-grille.fini .carte.gagnante { opacity: 1; animation: carte-gagnante 1.4s ease-in-out infinite; }
  @keyframes carte-gagnante {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.06); }
  }
  .memory-grille.fini .carte.gagnante .carte-avant {
    border-color: var(--or-blanc);
    box-shadow: inset 0 0 30px rgba(255,233,184,.3), 0 0 26px rgba(239,195,104,.55);
  }

  .memory-verdict {
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
  .memory-verdict.montre { opacity: 1; transform: none; }

  @media (prefers-reduced-motion: reduce) {
    .carte-plateau { transition-duration: .01s; }
    .carte.trouvee, .memory-grille.fini .carte.gagnante { animation: none; }
    .carte.rate .carte-plateau { animation: none; }
  }
  `;

  // Le dos des cartes : un losange doré, sobre, sans aucun pictogramme système
  const DOS = `
    <svg viewBox="0 0 100 100" fill="none" stroke="#C9962E" stroke-width="3"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M50 10 L76 50 L50 90 L24 50 Z"/>
      <path d="M50 30 L63 50 L50 70 L37 50 Z"/>
      <path d="M14 34 v-8 h8 M86 34 v-8 h-8 M14 66 v8 h8 M86 66 v8 h-8"/>
    </svg>`;

  function melanger(liste) {
    const t = liste.slice();
    for (let i = t.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [t[i], t[j]] = [t[j], t[i]];
    }
    return t;
  }

  window.PullUpJeux = window.PullUpJeux || {};

  window.PullUpJeux.memory = {
    id: 'memory',
    nom: 'Le memory de Noël',
    mot: 'la hotte',                       // « la hotte a parlé… »
    suite: 'Les cartes sont mélangées.',   // phrase affichée à la fin du ticket à gratter
    styles: STYLES,

    preparer(ctx) {
      // Trois lots sur le plateau : celui du joueur, plus deux autres
      // de la galerie tirés au hasard. Le joueur voit ce qui est en jeu.
      const autres = melanger(ctx.lots.filter(l => l.nom !== ctx.lot.nom));
      const surLePlateau = [ctx.lot].concat(autres.slice(0, 2));
      const nbPaires = surLePlateau.length;

      // Deux cartes par lot, puis on bat le paquet
      let cartes = [];
      surLePlateau.forEach((lot, i) => { cartes.push({ lot, paire: i }); cartes.push({ lot, paire: i }); });
      cartes = melanger(cartes);

      ctx.zone.innerHTML = `
        <h2>Le memory de Noël</h2>
        <p class="question-soustitre">Retrouve les ${nbPaires === 3 ? 'trois' : nbPaires} paires. La hotte en garde une pour toi.</p>
        <div class="memory-plateau">
          <span class="memory-compteur" id="memory-compteur"><strong>0</strong> / ${nbPaires} paires</span>
          <div class="memory-grille" id="memory-grille">
            ${cartes.map((c, i) => `
              <button type="button" class="carte" data-i="${i}" data-paire="${c.paire}"
                      aria-label="Retourner la carte ${i + 1}">
                <span class="carte-plateau">
                  <span class="carte-face carte-dos">${DOS}</span>
                  <span class="carte-face carte-avant">
                    <svg viewBox="0 0 100 100" fill="none" stroke="#EFC368" stroke-width="4"
                         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ctx.icone(c.lot.nom)}</svg>
                    <span class="carte-nom">${ctx.echap(ctx.libelle(c.lot))}</span>
                  </span>
                </span>
              </button>`).join('')}
          </div>
          <p class="memory-verdict" id="memory-verdict" role="status"></p>
        </div>
      `;

      const grille = ctx.zone.querySelector('#memory-grille');
      const compteur = ctx.zone.querySelector('#memory-compteur');
      const verdict = ctx.zone.querySelector('#memory-verdict');
      const toutes = Array.from(grille.querySelectorAll('.carte'));

      let ouvertes = [];
      let trouvees = 0;
      let bloque = false;
      let fini = false;
      const minuteries = [];
      const plusTard = (fn, ms) => minuteries.push(setTimeout(fn, ms));

      function retourner(carte) {
        if (fini || bloque) return;
        if (carte.classList.contains('ouverte') || carte.classList.contains('trouvee')) return;

        carte.classList.add('ouverte');
        ctx.vibrer(12);
        ouvertes.push(carte);
        if (ouvertes.length < 2) return;

        const [a, b] = ouvertes;
        ouvertes = [];
        bloque = true;

        if (a.dataset.paire === b.dataset.paire) {
          // Paire trouvée : les deux cartes restent face visible
          plusTard(() => {
            a.classList.add('trouvee');
            b.classList.add('trouvee');
            trouvees++;
            compteur.innerHTML = '<strong>' + trouvees + '</strong> / ' + nbPaires + ' paires';
            ctx.vibrer([20, 40, 20]);
            bloque = false;
            if (trouvees === nbPaires) terminerPartie();
          }, ctx.sobre ? 60 : 340);
        } else {
          // Raté : les deux cartes se referment
          plusTard(() => { a.classList.add('rate'); b.classList.add('rate'); }, 40);
          plusTard(() => {
            a.classList.remove('ouverte', 'rate');
            b.classList.remove('ouverte', 'rate');
            bloque = false;
          }, ctx.sobre ? 200 : 900);
        }
      }

      function terminerPartie() {
        if (fini) return;
        fini = true;
        minuteries.forEach(clearTimeout);

        plusTard(() => {
          grille.classList.add('fini');
          toutes.forEach(c => {
            if (c.dataset.paire === '0') c.classList.add('gagnante');   // la paire 0 est celle du joueur
          });
          verdict.textContent = ctx.lot.perdant
            ? 'La hotte a gardé : ' + ctx.lot.nom
            : 'La hotte a choisi pour toi : ' + ctx.lot.nom;
          verdict.classList.add('montre');
          ctx.vibrer(ctx.lot.perdant ? 90 : [70, 50, 130]);
        }, ctx.sobre ? 100 : 650);

        plusTard(ctx.terminer, ctx.sobre ? 900 : 2900);
      }

      toutes.forEach(carte => {
        carte.addEventListener('pointerdown', () => retourner(carte));
        carte.addEventListener('click', () => retourner(carte));
      });

      // Coup de pouce : au bout de 20 secondes, toutes les cartes se montrent
      // une seconde. Personne ne reste bloqué devant une borne en galerie.
      plusTard(() => {
        if (fini) return;
        toutes.forEach(c => c.classList.add('indice'));
        plusTard(() => toutes.forEach(c => c.classList.remove('indice')), 1100);
      }, 20000);

      // Filet de sécurité : au bout de 40 secondes, la partie se termine seule.
      plusTard(() => {
        if (fini) return;
        toutes.forEach(c => c.classList.add('ouverte', 'trouvee'));
        trouvees = nbPaires;
        compteur.innerHTML = '<strong>' + nbPaires + '</strong> / ' + nbPaires + ' paires';
        terminerPartie();
      }, 40000);
    }
  };

})();
