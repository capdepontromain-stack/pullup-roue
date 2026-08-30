// ============================================================
// JEU « TROIS PAREILS »
// Neuf cartes face cachée sur la table, quatre retournements.
// La règle tient en une phrase : trouver trois fois LE LOGO DE LA
// GALERIE (décision de Romain du 29/08/2026 ; les dessins du cirque
// servent de cartes « à côté »). Depuis le 29/08/2026, ce jeu est la
// MANCHE 2 du parcours réel (bandit, cartes, roue) : en manche non
// décisive il perd toujours de peu et passe la main à la roue.
//
// Il remplace « Suis le Cadeau » (les paquets qui se mélangent),
// que Romain a écarté le 25/08/2026 : il n'aime pas les cadeaux
// qui se déplacent. Ce n'est pas non plus un memory classique
// (jeux/memory.js, écarté lui aussi, « vu et revu ») : on ne
// cherche pas des paires, on cherche un TRIO.
//
// HONNÊTETÉ : comme la roue, le bandit et la roulette des
// pingouins, le lot est tiré et enregistré AVANT le jeu, selon
// le taux de gagnants de l'opération. Le jeu ne recrée aucune
// probabilité : il met en scène un résultat déjà écrit.
//   - gagnant : le troisième cadeau pareil sort au DERNIER
//               retournement, jamais avant ;
//   - perdant : deux cadeaux pareils, et le dernier tombe à
//               côté. La table retourne alors elle-même une
//               dernière carte, qui montre le trio manqué.
//
// POURQUOI C'EST LA TABLE QUI RETOURNE CETTE CARTE, et pas le
// joueur : le presque-gain rend le jeu excitant, mais il ne doit
// jamais se transformer en reproche (« j'aurais dû prendre
// celle-là »). En la retournant elle-même, la table montre le
// trio manqué sans que le joueur ait rien à se reprocher, et
// l'écran le dit en toutes lettres : le lot était tiré avant la
// première carte, aucun autre choix n'y aurait rien changé.
//
// Interface commune à tous les jeux (voir LISEZ-MOI.md) :
//   id, nom, mot, suite, styles, preparer(ctx)
// ============================================================

(function () {

  // --------------------------------------------------------
  // QUATRE MODÈLES DE CADEAUX, dessinés au trait dans la
  // grille 100 x 100 des icônes de la roue. Quatre silhouettes
  // franchement différentes (carrée, ronde, haute, en sac) :
  // il faut les distinguer d'un coup d'œil, sinon le jeu n'a
  // aucun sens.
  // --------------------------------------------------------
  // QUATRE CADEAUX EN COULEUR (27/08/2026, demande de Romain :
  // « améliore les images, les cadeaux »). Avant : quatre silhouettes
  // au trait doré, qui se ressemblaient toutes une fois posées dans
  // une case de 60 px. Maintenant chacun a SA couleur de papier et SON
  // ruban : rouge, or, crème, vert. Le jeu consiste à reconnaître trois
  // cadeaux pareils, la couleur fait donc la moitié du travail, et le
  // reste se lit à la forme pour qui distingue mal les couleurs.
  // QUATRE DESSINS DU CIRQUE (27/08/2026, Romain : « changer d'image,
  // trouver trois images identiques, et comme ça t'amuser à mettre des
  // dessins du cirque »). Les cadeaux d'avant se ressemblaient trop
  // dans une case de 60 px. Quatre silhouettes du chapiteau, chacune
  // avec SA couleur et SA forme : impossibles à confondre, même pour
  // qui distingue mal les couleurs.
  const CADEAUX = {
    // Le chapiteau rouge
    chapiteau: `
      <path d="M50 12 L14 52 h72 Z" fill="#D8383E"/>
      <path d="M50 12 L32 52 h36 Z" fill="#F3E7D3"/>
      <path d="M18 52 h64 l-6 32 h-52 z" fill="#B3282D"/>
      <path d="M42 84 v-20 c0 -6 16 -6 16 0 v20 z" fill="#2A1104"/>
      <path d="M50 12 v-7" stroke="#EFC368" stroke-width="3"/>
      <path d="M50 5 l12 3 l-12 4 z" fill="#EFC368"/>`,

    // L'étoile d'or
    etoile: `
      <path d="M50 10 l11 24 l26 3 l-19 18 l5 26 l-23 -13 l-23 13 l5 -26 l-19 -18 l26 -3 z"
            fill="#EFC368"/>
      <path d="M50 10 l11 24 l26 3 l-19 18 l-18 -45 z" fill="#C9962E"/>`,

    // La balle de jongleur, verte et crème
    balle: `
      <circle cx="50" cy="50" r="34" fill="#1F6E4B"/>
      <path d="M50 16 a34 34 0 0 1 0 68 c12 -10 18 -21 18 -34 s-6 -24 -18 -34 z" fill="#F3E7D3"/>
      <circle cx="50" cy="50" r="34" fill="none" stroke="#155238" stroke-width="2"/>
      <ellipse cx="38" cy="34" rx="8" ry="5" fill="#FFFFFF" opacity=".35"/>`,

    // Le chapeau haut de forme, noir à ruban rouge
    chapeau: `
      <rect x="30" y="24" width="40" height="42" rx="4" fill="#2A2118"/>
      <rect x="30" y="52" width="40" height="12" fill="#B3282D"/>
      <path d="M16 66 h68 c0 8 -68 8 -68 0 z" fill="#3A2F22"/>
      <path d="M34 28 c0 16 0 26 2 34" stroke="#4A3E2E" stroke-width="3" fill="none"/>`,

    // L'éléphant du cirque (30/08/2026, la troupe s'agrandit avec le bandit)
    elephant: `
      <circle cx="46" cy="54" r="25" fill="#8DA3B9" stroke="#54687C" stroke-width="3"/>
      <ellipse cx="33" cy="54" rx="12" ry="16" fill="#6E8296" stroke="#54687C" stroke-width="2.5"/>
      <path d="M67 46 c11 2 15 11 13 19 c-2 7 -10 10 -15 7" fill="none" stroke="#8DA3B9" stroke-width="9" stroke-linecap="round"/>
      <circle cx="53" cy="48" r="3.4" fill="#22303C"/>
      <path d="M36 30 l10 -16 l10 16 z" fill="#D8383E" stroke="#8E1418" stroke-width="2.5"/>
      <circle cx="46" cy="13" r="3.5" fill="#EFC368"/>`,

    // Le clown, nez rouge et chapeau pointu
    clown: `
      <circle cx="50" cy="56" r="23" fill="#F6E4CE" stroke="#B98F63" stroke-width="3"/>
      <circle cx="30" cy="54" r="9" fill="#E07B28"/><circle cx="70" cy="54" r="9" fill="#E07B28"/>
      <circle cx="42" cy="50" r="3" fill="#22303C"/><circle cx="58" cy="50" r="3" fill="#22303C"/>
      <circle cx="50" cy="60" r="6.5" fill="#D8383E" stroke="#8E1418" stroke-width="2"/>
      <path d="M39 70 c6 6 16 6 22 0" fill="none" stroke="#8E1418" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M38 36 l12 -20 l12 20 z" fill="#4FA3D8" stroke="#22618E" stroke-width="2.5"/>
      <circle cx="50" cy="14" r="4" fill="#EFC368"/>`
  };

  // LE LOGO DE LA GALERIE, LE TRIO À TROUVER (29/08/2026, Romain :
  // « nous devons trouver trois fois le logo Cap Sacré-Cœur dans ce
  // jeu »). Même principe que le jackpot du bandit manchot : c'est le
  // VRAI pictogramme officiel (img/client/picto-csc.png), posé en
  // image dans le SVG. Pour une autre galerie, il suffit de changer ce
  // fichier. Les dessins du cirque ci-dessus restent les cartes
  // « à côté » : le joueur cherche le logo au milieu du cirque.
  const LOGO_GALERIE = `<image href="img/client/picto-csc.png" x="8" y="10"
      width="84" height="80" preserveAspectRatio="xMidYMid meet"/>`;

  // LE REPLI SI LE PICTO MANQUE (tour n°7, 29/08/2026) : pour une
  // galerie sans fichier picto, les cartes du trio seraient VIDES
  // pendant que les verdicts parlent d'un logo invisible. On teste le
  // fichier dès le chargement de ce script (pendant le quiz, bien
  // avant la première carte) ; s'il manque, le trio devient l'ÉTOILE
  // D'OR et tous les textes disent « étoile » au lieu de « logo ».
  // L'étoile est réservée à ce rôle : les cartes « à côté » ne la
  // tirent jamais (voir preparer), donc aucune confusion possible.
  let LOGO_CHARGE = true;
  (function () {
    try {
      const t = new Image();
      t.onerror = () => { LOGO_CHARGE = false; };
      t.src = 'img/client/picto-csc.png';
    } catch (e) { /* environnement sans Image : on garde le logo */ }
  })();

  // Le nom parlé de chaque carte, pour les lecteurs d'écran et les
  // verdicts : « logo » n'est pas un mot qu'on montre tel quel.
  const NOMS = {
    logo: 'le logo de la galerie',
    chapiteau: 'le chapiteau rouge',
    etoile: 'l’étoile d’or',
    balle: 'la balle de jongleur',
    chapeau: 'le chapeau du magicien',
    elephant: 'l’éléphant du cirque',
    clown: 'le clown'
  };

  // Le nom de la galerie, pour écrire la règle du jeu (même lecture
  // prudente que dans bandit.js : OPERATION est déclaré en « let »
  // dans app.js, il n'est pas une propriété de window).
  function nomGalerie() {
    const n = (typeof OPERATION !== 'undefined' && OPERATION.lieu || '').trim();
    return n || 'de la galerie';
  }

  // Le dos des cartes : un losange et son cœur, rien de plus.
  const DOS = `
    <path d="M50 22 L66 50 L50 78 L34 50 Z"/>
    <circle cx="50" cy="50" r="6.5"/>`;

  const NB_CARTES = 9;        // grille de trois sur trois
  const RETOURNEMENTS = 4;    // ce que le joueur a le droit de retourner

  const STYLES = `
  .ct-plateau { width: 100%; display: flex; flex-direction: column; gap: var(--e4); text-align: left; }

  /* --- Le décompte des cartes : lisible en une seconde --- */
  .ct-compte {
    display: flex; align-items: baseline; justify-content: space-between; gap: var(--e3);
    border-bottom: 1px solid var(--filet);
    padding-bottom: var(--e2);
  }
  .ct-kicker {
    font-size: var(--t-etiquette); font-weight: 600;
    letter-spacing: 2.6px; text-transform: uppercase; color: var(--or);
  }
  .ct-kicker strong {
    font-family: var(--serif); font-weight: 800;
    font-size: 19px; letter-spacing: 0; color: var(--or-blanc);
    margin: 0 3px;
  }
  .ct-points { display: flex; gap: 7px; flex: 0 0 auto; }
  .ct-points span {
    width: 10px; height: 10px; border-radius: 50%;
    border: 1px solid var(--filet-fort);
    transition: background .3s var(--signature), border-color .3s var(--signature);
  }
  .ct-points span.ct-use { background: var(--or); border-color: #EFC368; }
  .ct-points span.ct-encours {
    background: var(--or-blanc); border-color: var(--or-blanc);
    box-shadow: 0 0 9px rgba(239, 195, 104, .75);
  }
  .ct-reste { font-size: var(--t-mention); color: var(--gris); line-height: 1.5; margin: 0; }

  /* --- La table --- */
  .ct-table {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--e2);
    align-self: center; width: 100%; max-width: 318px;
  }

  .ct-carte {
    background: none; border: 0; padding: 0;
    cursor: pointer; display: block; width: 100%;
    -webkit-tap-highlight-color: transparent;
    perspective: 800px;
  }
  .ct-carte:disabled { cursor: default; }
  .ct-carte:focus-visible { outline: 3px solid var(--or-clair); outline-offset: 3px; }

  /* Le retournement est fait en deux dimensions, la carte se pince sur
     son axe et se rouvre avec l'autre face. La version en vraie 3D
     (rotateY + backface-visibility) a été essayée et abandonnée : selon
     les moteurs, une carte sur deux restait affichée sur son dos alors
     qu'elle était bien retournée dans la page. Ce pincement-là se
     comporte partout pareil, coûte moins cher à afficher, et se lit
     exactement comme un retournement de carte. */
  .ct-plaque {
    display: flex; align-items: center; justify-content: center;
    width: 100%; aspect-ratio: 1 / 1.06;
    border: 1px solid var(--filet);
    border-radius: 2px;
    overflow: hidden;
    background: linear-gradient(158deg, #2e2415 0%, #171108 48%, #241b0f 100%);
    box-shadow: inset 0 1px 0 rgba(255, 233, 184, .14);
    transition: transform .2s var(--sortie), border-color .3s var(--signature),
                background .3s var(--signature), box-shadow .4s var(--signature);
  }
  .ct-carte.ct-pince .ct-plaque { transform: scaleX(.02); }
  .ct-plaque svg {
    width: 46%; height: auto; max-height: 62%;
    fill: none; stroke: #EFC368; stroke-width: 3.5;
    stroke-linecap: round; stroke-linejoin: round;
    opacity: .5;
  }
  .ct-carte.ct-ouverte .ct-plaque {
    background: linear-gradient(168deg, rgba(246, 241, 230, .08) 0%, rgba(20, 15, 9, .9) 100%);
    border-color: var(--filet-fort);
  }
  .ct-carte.ct-ouverte .ct-plaque svg {
    width: 72%; max-height: 78%; opacity: 1;
    /* Les cadeaux sont peints, pas tracés : on retire le contour hérité
       du dos de carte, et on leur pose une ombre pour les décoller du
       fond sombre. */
    stroke: none;
    filter: drop-shadow(0 3px 7px rgba(0, 0, 0, .55));
  }

  /* La carte qui appelle le doigt, tant qu'on n'a rien touché */
  .ct-table:not(.ct-jouee) .ct-carte:not(.ct-ouverte) .ct-plaque { animation: ct-respire 3.2s ease-in-out infinite; }
  .ct-carte:nth-child(3n+2) .ct-plaque { animation-delay: .28s; }
  .ct-carte:nth-child(3n) .ct-plaque   { animation-delay: .56s; }
  @keyframes ct-respire {
    0%, 82%, 100% { transform: none; }
    90%           { transform: translateY(-4px); }
  }

  /* Le trio gagnant, ou le trio manqué que la table dévoile */
  .ct-carte.ct-marquee .ct-plaque {
    border-color: #EFC368;
    box-shadow: 0 0 24px rgba(239, 195, 104, .45), inset 0 0 20px rgba(239, 195, 104, .14);
    background: linear-gradient(168deg, rgba(239, 195, 104, .18) 0%, rgba(20, 15, 9, .9) 100%);
  }
  .ct-carte.ct-marquee .ct-plaque svg { stroke: #FFE9B8; }
  .ct-carte.ct-gagnante .ct-plaque { animation: ct-bat 1.1s ease-in-out 2; }
  @keyframes ct-bat {
    0%, 100% { box-shadow: 0 0 24px rgba(239, 195, 104, .45), inset 0 0 20px rgba(239, 195, 104, .14); }
    50%      { box-shadow: 0 0 34px rgba(239, 195, 104, .75), inset 0 0 26px rgba(239, 195, 104, .26); }
  }
  /* La carte que la table retourne toute seule se distingue des siennes */
  .ct-carte.ct-donnee .ct-plaque { border-style: dashed; }

  /* --- Le verdict --- */
  .ct-verdict {
    font-family: var(--serif); font-weight: 600;
    font-size: var(--t-titre-s); line-height: 1.25;
    color: var(--or-blanc);
    /* La hauteur est réservée d'avance : la table ne saute pas
       sous le doigt quand le verdict s'écrit. */
    margin: 0; min-height: 100px;
    opacity: 0; transform: translateY(8px);
    transition: opacity .5s var(--signature), transform .5s var(--signature);
  }
  .ct-verdict.ct-montre { opacity: 1; transform: none; }
  .ct-verdict small {
    display: block; margin-top: var(--e2);
    font-family: var(--sans); font-weight: 400;
    font-size: var(--t-petit); color: var(--gris); line-height: 1.55;
  }

  @media (prefers-reduced-motion: reduce) {
    .ct-plaque { transition-duration: .01s; animation: none !important; }
    .ct-carte.ct-gagnante .ct-plaque { animation: none; }
    .ct-verdict, .ct-points span { transition-duration: .01s; }
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

  window.PullUpJeux.cartes = {
    id: 'cartes',
    nom: 'Trois Pareils',
    mot: 'la pioche',                              // « la pioche a hésité… »
    suite: 'Neuf cartes t’attendent, face cachée.', // fin du ticket à gratter
    styles: STYLES,

    preparer(ctx) {
      // Une manche qui n'est pas la dernière ne révèle jamais le lot :
      // elle se joue toujours « tout près » et passe la main. C'est
      // la dernière manche qui tranche, pour tout le monde pareil.
      const gagne = ctx.decisif !== false && !ctx.lot.perdant;
      // Le trio à trouver est TOUJOURS le logo de la galerie (décision
      // de Romain, 29/08/2026) ; les cartes « à côté » sont deux
      // dessins du cirque tirés au hasard. L'étoile d'or n'est jamais
      // tirée « à côté » : elle est réservée au rôle de secours du
      // logo (voir LOGO_CHARGE), sinon un repli pourrait afficher
      // cinq étoiles sur la table.
      const modeles = melanger(['chapiteau', 'balle', 'chapeau', 'elephant', 'clown']);
      const A = 'logo', B = modeles[0], C = modeles[1];
      // Le mot des consignes et des verdicts suit le dessin réel.
      const trio = LOGO_CHARGE
        ? { consigne: 'logos ' + ctx.echap(nomGalerie()),
            un: 'Le logo est sur la table.', deux: 'Deux logos.',
            trois: 'Trois logos !', pas: 'Pas le logo.',
            deuxSurTrois: 'Deux logos sur trois.',
            pasSorti: 'Le troisième logo n’est pas sorti.' }
        : { consigne: 'étoiles d’or',
            un: 'L’étoile est sur la table.', deux: 'Deux étoiles.',
            trois: 'Trois étoiles !', pas: 'Pas l’étoile.',
            deuxSurTrois: 'Deux étoiles sur trois.',
            pasSorti: 'La troisième étoile n’est pas sortie.' };

      // Le scénario des quatre retournements, écrit avant que le
      // joueur touche la moindre carte. Le troisième cadeau pareil
      // ne sort qu'au dernier retournement, jamais avant : c'est là
      // que se joue toute la tension.
      const sortie = gagne ? [A, B, A, A] : [A, B, A, C];
      // La carte que la table retourne elle-même quand c'est perdu
      const carteDeLaTable = A;

      const carte = i => `
        <button type="button" class="ct-carte" id="ct-carte-${i}"
                aria-label="Carte ${i + 1}, face cachée">
          <span class="ct-plaque">
            <svg viewBox="0 0 100 100" aria-hidden="true">${DOS}</svg>
          </span>
        </button>`;

      ctx.zone.innerHTML = `
        <h2>${ctx.secondTour ? 'Deuxième donne' : 'Trois Pareils'}</h2>
        <p class="question-soustitre">Trouve trois ${trio.consigne} en quatre cartes.</p>

        <div class="ct-plateau">
          <div class="ct-compte">
            <div class="ct-kicker" id="ct-kicker">Carte <strong>1</strong> sur ${RETOURNEMENTS}</div>
            <div class="ct-points" id="ct-points" role="img" aria-label="Carte 1 sur ${RETOURNEMENTS}"></div>
          </div>
          <p class="ct-reste" id="ct-reste">Touche la carte qui t’attire.</p>

          <div class="ct-table" id="ct-table">
            ${Array.from({ length: NB_CARTES }, (_, i) => carte(i)).join('')}
          </div>

          <p class="ct-verdict" id="ct-verdict" role="status"></p>
        </div>
      `;

      const table = ctx.zone.querySelector('#ct-table');
      const kicker = ctx.zone.querySelector('#ct-kicker');
      const points = ctx.zone.querySelector('#ct-points');
      const reste = ctx.zone.querySelector('#ct-reste');
      const verdict = ctx.zone.querySelector('#ct-verdict');
      const cartes = Array.from({ length: NB_CARTES }, (_, i) =>
        ctx.zone.querySelector('#ct-carte-' + i));

      let retournees = 0;
      let occupe = false;
      const ouvertes = [];   // { bouton, modele }

      function svgCadeau(nom) {
        const dessin = nom === 'logo'
          ? (LOGO_CHARGE ? LOGO_GALERIE : CADEAUX.etoile)
          : CADEAUX[nom];
        return `<svg viewBox="0 0 100 100" aria-hidden="true">${dessin}</svg>`;
      }

      function majCompte() {
        const numero = Math.min(retournees + 1, RETOURNEMENTS);
        kicker.innerHTML = 'Carte <strong>' + numero + '</strong> sur ' + RETOURNEMENTS;
        points.setAttribute('aria-label', 'Carte ' + numero + ' sur ' + RETOURNEMENTS);
        let html = '';
        for (let i = 0; i < RETOURNEMENTS; i++) {
          const classe = i < retournees ? ' class="ct-use"'
                       : (i === retournees ? ' class="ct-encours"' : '');
          html += '<span' + classe + '></span>';
        }
        points.innerHTML = html;
      }
      majCompte();

      // La carte se pince sur son axe, change de face au milieu du
      // geste, et se rouvre. Le pincement dure deux dixièmes de
      // seconde de chaque côté ; sans animation, tout est immédiat.
      const PINCE = 200;
      function ouvrir(bouton, modele, marquee, fini) {
        bouton.disabled = true;
        const poser = () => {
          bouton.querySelector('.ct-plaque').innerHTML = svgCadeau(modele);
          bouton.classList.add('ct-ouverte');
          if (marquee) bouton.classList.add('ct-marquee');
          bouton.classList.remove('ct-pince');
          bouton.setAttribute('aria-label', 'Carte retournée : ' + (NOMS[modele] || modele));
          if (fini) setTimeout(fini, ctx.sobre ? 10 : PINCE);
        };
        if (ctx.sobre) { poser(); return; }
        bouton.classList.add('ct-pince');
        setTimeout(poser, PINCE);
      }

      function ecrire(titre, note) {
        verdict.innerHTML = titre + (note ? '<small>' + note + '</small>' : '');
        verdict.classList.add('ct-montre');
      }

      cartes.forEach(bouton => {
        bouton.addEventListener('click', () => {
          if (occupe || retournees >= RETOURNEMENTS) return;
          if (bouton.classList.contains('ct-ouverte')) return;
          occupe = true;
          table.classList.add('ct-jouee');
          verdict.classList.remove('ct-montre');

          const modele = sortie[retournees];
          ouvrir(bouton, modele);
          ouvertes.push({ bouton: bouton, modele: modele });
          retournees++;
          majCompte();
          ctx.vibrer(28);

          const attente = ctx.sobre ? 80 : 620;
          setTimeout(() => conclure(), attente);
        });
      });

      function conclure() {
        const dernier = retournees >= RETOURNEMENTS;
        const pareilles = ouvertes.filter(o => o.modele === sortie[0]);

        if (!dernier) {
          // La ligne du haut dit ce qu'il reste, le verdict raconte ce
          // qui vient de se passer : les deux ne répètent jamais la
          // même phrase.
          reste.textContent = (RETOURNEMENTS - retournees) === 1
            ? 'Plus qu’une carte.'
            : 'Il te reste ' + (RETOURNEMENTS - retournees) + ' cartes.';
          if (retournees === 1) {
            ecrire(trio.un, 'Il t’en faut trois.');
          } else if (pareilles.length >= 2) {
            ecrire(trio.deux, 'Le troisième se cache encore quelque part.');
          } else {
            ecrire(trio.pas, 'Rien n’est joué, la table est encore pleine.');
          }
          occupe = false;
          return;
        }

        // Fin de partie.
        reste.textContent = 'Les cartes ont parlé.';
        if (gagne) {
          pareilles.forEach(o => {
            o.bouton.classList.add('ct-marquee', 'ct-gagnante');
          });
          const nom = ctx.lot && ctx.lot.nom ? ctx.echap(String(ctx.lot.nom)) : '';
          ecrire(trio.trois, nom ? 'Ton cadeau : ' + nom : '');
          ctx.vibrer([70, 50, 130]);
          setTimeout(ctx.terminer, ctx.sobre ? 600 : 2600);
          return;
        }

        // Perdu : la table retourne elle-même la carte qui manquait.
        // C'est elle qui la choisit, pas le joueur : le presque-gain
        // reste excitant sans se transformer en reproche.
        ecrire(trio.deuxSurTrois, 'La table en retourne une dernière…');
        ctx.vibrer(70);

        const fermees = cartes.filter(b => !b.classList.contains('ct-ouverte'));
        const choisie = fermees[Math.floor(Math.random() * fermees.length)];
        const suite = () => {
          if (choisie) {
            ouvrir(choisie, carteDeLaTable, true);
            choisie.classList.add('ct-donnee');
            pareilles.forEach(o => o.bouton.classList.add('ct-marquee'));
          }
          ctx.vibrer(90);
          setTimeout(() => {
            // Manche non décisive : on ne parle jamais du lot, seulement
            // de ce qu'il reste à jouer.
            const restantes = (ctx.manches || 1) - (ctx.manche || 1);
            ecrire(trio.pasSorti,
                   restantes > 0
                     ? 'Il se cachait dans les cartes restantes. Il reste ' +
                       (restantes === 1 ? 'une manche.' : restantes + ' manches.')
                     : 'Il se cachait dans les cartes restantes. Ton lot était tiré avant la première ' +
                       'carte : aucune autre carte n’y aurait rien changé.');
          }, ctx.sobre ? 60 : 700);
          setTimeout(ctx.terminer, ctx.sobre ? 700 : 3400);
        };
        setTimeout(suite, ctx.sobre ? 80 : 900);
      }
    }
  };

})();
