// LE PRÉ-THÈME (29/08/2026)
// --------------------------
// Chargé en PREMIER dans <body>, sans defer : il s'exécute avant le
// premier rendu de la page. Il pose la classe de thème mémorisée à la
// visite précédente (app.js écrit roue_theme_<slug> à chaque partie),
// pour que la page s'habille du bon thème dès la première image :
//   - plus de flash de fond sombre avant le thème clair ;
//   - le fond bokeh doré (65 Ko) n'est plus téléchargé pour rien
//     quand le thème est clair.
// Première visite d'un slug inconnu : rien ne se passe, app.js posera
// le thème comme avant. Le slug de Cap Sacré-Cœur est connu d'avance.
(function () {
  try {
    var slug = new URLSearchParams(location.search).get('e') || 'test';
    var theme = localStorage.getItem('roue_theme_' + slug);
    if (!theme && slug === 'cap-sacre-coeur') theme = 'csc';
    if (theme && theme !== 'or' && /^[a-z-]{1,20}$/.test(theme)) {
      document.body.classList.add('theme-' + theme);
    }
  } catch (e) { /* navigation privée : app.js habillera la page */ }
})();
