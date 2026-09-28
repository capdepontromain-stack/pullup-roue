// LE FILET DE SECOURS (20/09/2026)
// ---------------------------------
// Chargé en PREMIER dans <head>, sans defer : il s'exécute avant tous
// les autres scripts, donc il voit leurs erreurs, y compris celles de
// lecture (un vieux téléphone qui ne comprend pas la syntaxe d'app.js
// abandonne le fichier entier et la page reste morte).
//
// Ce qu'il fait, et rien d'autre :
//   1. si le jeu n'a pas démarré, il affiche un écran lisible avec un
//      bouton « Réessayer », au lieu d'une page figée sans explication ;
//   2. si le jeu a démarré et qu'une erreur imprévue survient en cours
//      de partie, il pose un bandeau discret en haut de l'écran avec un
//      bouton pour relancer la page, et laisse la partie continuer ;
//   3. il écrit l'erreur dans la console, préfixée, pour le dépannage.
//
// Écrit en JavaScript d'ancienne école (var, pas de fonction fléchée,
// pas de gabarit de texte) : ce fichier doit rester lisible par le
// téléphone le plus vieux de la galerie, c'est sa raison d'être.
// Aucun style dans la feuille : tout est posé ici, pour que l'écran de
// secours s'affiche même si style.css n'est jamais arrivé.
(function () {
  'use strict';

  var demarre = false;      // app.js a signalé qu'il tournait
  var panneauPose = false;  // l'écran de secours est déjà affiché
  var bandeauPose = false;  // le bandeau discret a déjà servi
  var reports = 0;          // nombre de reports du garde-temps

  // Le garde-temps de départ : 12 secondes après la construction de la
  // page. En galerie, les scripts pèsent environ 250 Ko : c'est large,
  // même sur un réseau poussif. Si la page télécharge encore, on se
  // donne deux rallonges de 8 s avant de conclure.
  var ATTENTE = 12000;
  var RALLONGE = 8000;
  var RALLONGES_MAX = 2;

  function estPret() {
    return demarre || !!window.PullUpJeuPret;
  }

  // ---------------------------------------------------------------
  // L'écran de secours : le jeu ne s'est jamais ouvert.
  // ---------------------------------------------------------------
  function poserPanneau(raison) {
    if (panneauPose || estPret()) return;
    panneauPose = true;
    try {
      var fond = document.createElement('div');
      fond.setAttribute('role', 'alert');
      fond.id = 'filet-secours';
      fond.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;' +
        'align-items:center;justify-content:center;padding:24px;' +
        'background:#141009;color:#F6F1E6;text-align:center;' +
        'font-family:Jost,Avenir Next,Arial,sans-serif;line-height:1.5';

      var bloc = document.createElement('div');
      bloc.style.cssText = 'max-width:440px';

      var titre = document.createElement('p');
      titre.textContent = 'Le jeu n’arrive pas à s’ouvrir';
      titre.style.cssText = 'font-size:22px;font-weight:700;color:#EFC368;margin:0 0 12px';

      var texte = document.createElement('p');
      texte.textContent = 'La connexion s’est peut-être interrompue en cours de route. ' +
        'Appuie sur Réessayer : en général, tout repart.';
      texte.style.cssText = 'font-size:16px;margin:0 0 22px';

      var bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.textContent = 'Réessayer';
      bouton.style.cssText = 'min-height:48px;padding:12px 30px;border:0;border-radius:999px;' +
        'background:#C9962E;color:#141009;font-size:17px;font-weight:700;' +
        'font-family:inherit;cursor:pointer';
      bouton.onclick = function () { location.reload(); };

      var note = document.createElement('p');
      note.textContent = 'Rien n’a été enregistré : le jeu ne s’est pas ouvert. ' +
        'Si cela recommence, réessaie un peu plus tard ou écris à contact@pullup.re';
      note.style.cssText = 'font-size:13px;color:#BCB2A1;margin:22px 0 0';

      bloc.appendChild(titre);
      bloc.appendChild(texte);
      bloc.appendChild(bouton);
      bloc.appendChild(note);
      fond.appendChild(bloc);
      (document.body || document.documentElement).appendChild(fond);
      try { bouton.focus(); } catch (e) { /* sans importance */ }
      if (window.console && console.warn) {
        console.warn('[filet] écran de secours affiché :', raison);
      }
    } catch (e) { /* si même ça échoue, il n'y a plus rien à tenter */ }
  }

  // ---------------------------------------------------------------
  // Le bandeau discret : la partie tourne, mais quelque chose a cassé.
  // Il ne bloque rien, se referme tout seul, et ne sert qu'une fois.
  // ---------------------------------------------------------------
  function poserBandeau() {
    if (bandeauPose || panneauPose) return;
    bandeauPose = true;
    try {
      var barre = document.createElement('div');
      barre.setAttribute('role', 'status');
      barre.id = 'filet-bandeau';
      barre.style.cssText = 'position:fixed;left:12px;right:12px;top:12px;z-index:99998;' +
        'display:flex;gap:10px;align-items:center;justify-content:space-between;' +
        'padding:12px 14px;border-radius:14px;background:#1e1710;color:#F6F1E6;' +
        'border:1px solid rgba(201,150,46,.55);box-shadow:0 8px 24px rgba(0,0,0,.45);' +
        'font-family:Jost,Avenir Next,Arial,sans-serif;font-size:14px;line-height:1.35';

      var texte = document.createElement('span');
      texte.textContent = 'Petit souci technique. Si l’écran ne répond plus, relance la page.';
      texte.style.cssText = 'flex:1;text-align:left';

      var bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.textContent = 'Relancer';
      bouton.style.cssText = 'flex:0 0 auto;min-height:40px;padding:8px 18px;border:0;' +
        'border-radius:999px;background:#C9962E;color:#141009;font-size:14px;' +
        'font-weight:700;font-family:inherit;cursor:pointer';
      bouton.onclick = function () { location.reload(); };

      var fermer = document.createElement('button');
      fermer.type = 'button';
      fermer.setAttribute('aria-label', 'Fermer ce message');
      fermer.textContent = '×';
      fermer.style.cssText = 'flex:0 0 auto;width:40px;height:40px;border:0;background:none;' +
        'color:#BCB2A1;font-size:22px;font-family:inherit;cursor:pointer';
      fermer.onclick = function () { retirer(); };

      function retirer() {
        if (barre && barre.parentNode) barre.parentNode.removeChild(barre);
      }

      barre.appendChild(texte);
      barre.appendChild(bouton);
      barre.appendChild(fermer);
      (document.body || document.documentElement).appendChild(barre);
      setTimeout(retirer, 12000);
    } catch (e) { /* sans importance */ }
  }

  // ---------------------------------------------------------------
  // Les deux guetteurs : erreurs de script et promesses non tenues.
  // Avant le démarrage, on laisse 1,5 s de battement : une erreur peut
  // très bien tomber juste avant que le jeu finisse de s'installer.
  // ---------------------------------------------------------------
  function signaler(raison) {
    if (window.console && console.warn) console.warn('[filet]', raison);
    if (estPret()) { poserBandeau(); return; }
    setTimeout(function () {
      if (estPret()) return;
      poserPanneau(raison);
    }, 1500);
  }

  window.addEventListener('error', function (ev) {
    // Les images et les feuilles absentes ne remontent pas jusqu'ici
    // (elles ne bouillonnent pas) : ce qui arrive est bien du script.
    signaler((ev && ev.message) || 'erreur de script');
  });

  window.addEventListener('unhandledrejection', function (ev) {
    var motif = 'requête non aboutie';
    try {
      if (ev && ev.reason) motif = String(ev.reason.message || ev.reason);
    } catch (e) { /* certaines raisons ne se lisent pas */ }
    signaler(motif);
  });

  // ---------------------------------------------------------------
  // Le garde-temps : personne n'a signalé le démarrage.
  // ---------------------------------------------------------------
  function verifier() {
    if (estPret()) return;
    // La page télécharge encore ses fichiers : on patiente une fois de
    // plus plutôt que d'accuser un réseau simplement lent.
    if (document.readyState !== 'complete' && reports < RALLONGES_MAX) {
      reports++;
      setTimeout(verifier, RALLONGE);
      return;
    }
    poserPanneau('le jeu n’a pas démarré dans le temps imparti');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(verifier, ATTENTE);
    });
  } else {
    setTimeout(verifier, ATTENTE);
  }

  // ---------------------------------------------------------------
  // Ce que le jeu appelle quand il est en place (fin d'app.js).
  // ---------------------------------------------------------------
  window.PullUpFilet = {
    demarre: function () {
      demarre = true;
      window.PullUpJeuPret = true;
      var panneau = document.getElementById('filet-secours');
      if (panneau && panneau.parentNode) panneau.parentNode.removeChild(panneau);
      panneauPose = false;
    }
  };
})();
