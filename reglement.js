// Le bouton « Retour au jeu » ramène vers la MÊME opération que celle
// d'où le joueur vient (le lien d'ouverture porte ?e=...). Sans cela,
// il retombait sur l'opération par défaut, c'est-à-dire un habillage
// qui n'est pas celui de sa galerie. (Fichier externe : la CSP de la
// page interdit les scripts écrits dans le HTML.)
(function () {
  var slug = new URLSearchParams(location.search).get('e');
  if (slug) {
    document.getElementById('lien-retour').href =
      'index.html?e=' + encodeURIComponent(slug);
  }
})();
