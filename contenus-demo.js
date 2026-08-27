// ============================================
// CONTENUS DE DÉMONSTRATION
// Exemples réalistes pour montrer l'application
// avant que les commerçants aient saisi leurs offres.
// Remplacés automatiquement par les vraies données
// dès que les tables Supabase sont remplies.
// ============================================

// LE PROGRAMME, EN VRAI AGENDA (26/08/2026, demande de Romain)
// -------------------------------------------------------------
// Deux niveaux, et c'est l'affichage qui les distingue tout seul :
//   - les rendez-vous PERMANENTS n'ont pas de jour : ils sont réunis
//     en haut de l'écran, sous « Tous les jours » ;
//   - les autres portent un jour et une heure : ils se rangent sous
//     leur journée, du matin au soir, comme un agenda.
// Le programme tutoie, comme tout le reste du jeu.
// Les horaires ci-dessous sont un EXEMPLE, à remplacer par ceux de la
// galerie (table roue_programme dans Supabase, colonnes jour et heure).
const PROGRAMME_DEMO = [
  {
    titre: 'La photo dans la Hotte Géante',
    lieu: 'Place centrale',
    horaires: 'Aux heures d’ouverture de la galerie',
    detail: 'Installe-toi dans la hotte, sors ton téléphone et prends autant de photos que tu veux. C’est gratuit, sans achat et sans limite.',
    vedette: true
  },
  // ---- Samedi 12 décembre ----
  {
    jour: 'Samedi 12 décembre', heure: '10h30',
    titre: 'L’atelier ballons du lutin',
    lieu: 'Place centrale', horaires: '10h30 à 12h30',
    detail: 'Épée, fleur, petit chien : le lutin sculpte le ballon que l’enfant lui demande. Gratuit.'
  },
  {
    jour: 'Samedi 12 décembre', heure: '14h00',
    titre: 'La photo avec le Père Noël',
    lieu: 'Le trône, place centrale', horaires: '14h à 17h',
    detail: 'Le Père Noël reçoit les enfants sur son trône. Photo avec ton téléphone, gratuite et sans achat.',
    vedette: true
  },
  {
    jour: 'Samedi 12 décembre', heure: '15h30',
    titre: 'La chorale de Noël',
    lieu: 'Allée principale', horaires: '30 minutes de chants'
  },
  {
    jour: 'Samedi 12 décembre', heure: '16h30',
    titre: 'Le spectacle du chapiteau',
    lieu: 'Place centrale', horaires: '45 minutes',
    detail: 'Jonglage, acrobaties et magie : le chapiteau ouvre sa piste au milieu de la galerie.'
  },
  {
    jour: 'Samedi 12 décembre', heure: '18h00',
    titre: 'Le cracheur de feu',
    lieu: 'Parvis de la galerie', horaires: 'À la tombée de la nuit',
    detail: 'Le grand final du samedi, dehors, à voir en famille.'
  },

  // ---- Mercredi 16 décembre ----
  {
    jour: 'Mercredi 16 décembre', heure: '10h00',
    titre: 'L’atelier des enfants',
    lieu: 'Espace animation', horaires: '10h à 12h',
    detail: 'Boules à décorer, cartes de vœux et couronnes de Noël. Gratuit, dès 3 ans.'
  },
  {
    jour: 'Mercredi 16 décembre', heure: '14h00',
    titre: 'La photo avec le Père Noël',
    lieu: 'Le trône, place centrale', horaires: '14h à 17h',
    detail: 'Le Père Noël reçoit les enfants sur son trône. Photo gratuite, sans achat.'
  },
  {
    jour: 'Mercredi 16 décembre', heure: '15h00',
    titre: 'L’atelier ballons du lutin',
    lieu: 'Place centrale', horaires: '15h à 17h'
  },
  {
    jour: 'Mercredi 16 décembre', heure: '16h30',
    titre: 'Le spectacle du chapiteau',
    lieu: 'Place centrale', horaires: '45 minutes'
  },

  // ---- Samedi 19 décembre ----
  {
    jour: 'Samedi 19 décembre', heure: '10h30',
    titre: 'L’atelier ballons du lutin',
    lieu: 'Place centrale', horaires: '10h30 à 12h30'
  },
  {
    jour: 'Samedi 19 décembre', heure: '14h00',
    titre: 'La photo avec le Père Noël',
    lieu: 'Le trône, place centrale', horaires: '14h à 18h',
    detail: 'Dernier samedi avant Noël : le Père Noël reste une heure de plus.',
    vedette: true
  },
  {
    jour: 'Samedi 19 décembre', heure: '15h00',
    titre: 'La brigade du Père Noël',
    lieu: 'En déambulation dans les allées', horaires: '15h à 18h',
    detail: 'Le Père Noël, la Mère Noël et leurs lutins remontent la galerie, en musique et en gourmandises.'
  },
  {
    jour: 'Samedi 19 décembre', heure: '16h30',
    titre: 'La chorale de Noël',
    lieu: 'Allée principale', horaires: '30 minutes de chants'
  },
  {
    jour: 'Samedi 19 décembre', heure: '18h00',
    titre: 'Le cracheur de feu',
    lieu: 'Parvis de la galerie', horaires: 'À la tombée de la nuit',
    detail: 'Le grand final de l’opération.'
  }
];

const OFFRES_DEMO = [
  {
    enseigne: 'La boutique de mode homme', univers: 'mode',
    titre: 'Le deuxième article à moins 50 %',
    detail: 'Sur toute la collection de fin d\'année, le moins cher des deux à moitié prix.',
    valable_jusqu_au: '31 décembre', bon: 'Le deuxième article à moitié prix'
  },
  {
    enseigne: 'Le comptoir à burgers', univers: 'gourmandise',
    titre: 'Un menu acheté, une boisson offerte',
    detail: 'Sur présentation de ce bon, la boisson t’est offerte pour tout menu commandé.',
    valable_jusqu_au: '25 décembre', bon: 'Boisson offerte pour un menu acheté'
  },
  {
    enseigne: 'La bijouterie de la galerie', univers: 'bijoux',
    titre: 'Le coffret cadeau offert',
    detail: 'Écrin et emballage cadeau offerts pour tout achat, gravure comprise.',
    valable_jusqu_au: '24 décembre', bon: 'Coffret cadeau offert'
  },
  {
    enseigne: 'L’institut beauté', univers: 'beaute',
    titre: 'Un diagnostic de peau offert',
    detail: 'Quinze minutes avec une conseillère et un échantillon adapté, sans engagement.',
    valable_jusqu_au: '31 décembre', bon: 'Diagnostic de peau, 15 minutes'
  },
  {
    enseigne: 'La boutique de sport', univers: 'sport',
    titre: 'La deuxième paire à moitié prix',
    detail: 'Sur toutes les chaussures de running et de sport, la moins chère des deux à moins 50 %.',
    valable_jusqu_au: '5 janvier', bon: 'La deuxième paire à moitié prix'
  },
  {
    enseigne: 'Le magasin de jouets', univers: 'enfants',
    titre: 'Emballage cadeau offert',
    detail: 'Papier, ruban et étiquette personnalisée offerts pour tout achat, sans minimum.',
    valable_jusqu_au: '24 décembre', bon: 'Emballage cadeau offert'
  },
  {
    enseigne: 'La boulangerie de la galerie', univers: 'gourmandise',
    titre: 'La formule goûter à 4 €',
    detail: 'Une viennoiserie et une boisson chaude, tous les jours de 15h à 17h.',
    valable_jusqu_au: '31 décembre', bon: 'La formule goûter à 4 €'
  },
  {
    enseigne: 'La boutique déco', univers: 'maison',
    titre: 'Trois décorations achetées, la quatrième offerte',
    detail: 'Sur tout le rayon décoration de Noël, la moins chère des quatre est offerte.',
    valable_jusqu_au: '31 décembre', bon: 'La quatrième décoration offerte'
  }
];

// ATTENTION : ces offres sont des EXEMPLES de démonstration. Les noms de
// boutiques sont volontairement GÉNÉRIQUES (la boulangerie de la galerie,
// l'institut beauté...). Depuis le 25/08/2026, plus aucune enseigne réelle
// n'est citée ici : montrer une vraie marque avec une offre inventée, sans
// l'accord du commerçant, est un risque juridique et commercial, y compris
// pendant une démonstration. Ces exemples sont remplacés automatiquement
// par les vraies offres dès que les commerçants les saisissent.


// ============================================
// LES NOUVEAUTÉS ET LES TENDANCES
// Même logique que les offres : ces exemples
// s'affichent tant que la table roue_nouveautes
// n'est pas remplie, et disparaissent tout seuls
// dès que les commerçants saisissent les leurs.
// ============================================

const NOUVEAUTES_DEMO = [
  {
    enseigne: 'La boutique de mode femme', univers: 'mode',
    titre: 'La maille col montant, la pièce de la saison',
    detail: 'Coupe ample, coloris crème, camel et noir profond. Celle qu’on voit partout cette année.',
    prix: 'à partir de 39,95 €', arrivage: 'En boutique depuis le 12 novembre', tendance: true
  },
  {
    enseigne: 'La parfumerie', univers: 'beaute',
    titre: 'Les coffrets parfum de fin d’année',
    detail: 'Les nouveaux coffrets des grandes maisons, avec le format voyage offert dans la plupart.',
    prix: 'à partir de 49 €', arrivage: 'Arrivage complet cette semaine', tendance: false
  },
  {
    enseigne: 'La bijouterie de la galerie', univers: 'bijoux',
    titre: 'La collection de charms étoilés',
    detail: 'Des breloques inédites en argent et pierres claires, pensées pour composer un bracelet cadeau.',
    prix: 'à partir de 39 €', arrivage: 'Nouvelle collection en vitrine', tendance: true
  },
  {
    enseigne: 'La boutique de sport', univers: 'sport',
    titre: 'La sneaker rétro qui revient partout',
    detail: 'Les silhouettes des années 90 reviennent en force, en cuir blanc cassé et daim beige.',
    prix: 'à partir de 89,99 €', arrivage: 'Nouvelles tailles reçues', tendance: true
  },
  {
    enseigne: 'Le magasin de jouets', univers: 'enfants',
    titre: 'Le rayon jouets de Noël au complet',
    detail: 'Toutes les nouveautés de l’année sont arrivées, avec un espace d’essai pour les enfants.',
    prix: '', arrivage: 'Rayon réassorti tous les matins', tendance: false
  },
  {
    enseigne: 'La boutique de mode homme', univers: 'mode',
    titre: 'Le chino confort, nouvelle coupe',
    detail: 'Une matière plus souple et une coupe droite revue, dans cinq coloris de saison.',
    prix: 'à partir de 45,99 €', arrivage: 'En rayon depuis le 5 novembre', tendance: false
  },
  {
    enseigne: 'Le vestiaire masculin', univers: 'mode',
    titre: 'La chemise en lin lavé',
    detail: 'Un lin doux qui se froisse joliment, idéal pour les repas de fêtes sous la chaleur.',
    prix: 'à partir de 35,99 €', arrivage: 'Nouvelle collection', tendance: false
  },
  {
    enseigne: 'L’institut beauté', univers: 'beaute',
    titre: 'La routine hydratation, formule revue',
    detail: 'Trois soins reformulés avec plus d’actifs d’origine végétale, et des flacons rechargeables.',
    prix: 'à partir de 12,90 €', arrivage: 'Lancement du mois', tendance: false
  },
  {
    enseigne: 'La boutique déco', univers: 'maison',
    titre: 'La déco de Noël, nouvelle collection',
    detail: 'Deux ambiances cette année, l’une or et blanc, l’autre rouge et bois naturel.',
    prix: 'à partir de 2,99 €', arrivage: 'Rayon installé', tendance: false
  },
  {
    enseigne: 'La boulangerie de la galerie', univers: 'gourmandise',
    titre: 'La bûche pâtissière de l’année',
    detail: 'Vanille de l’île et cœur praliné, à commander au comptoir jusqu’à la veille.',
    prix: 'à partir de 18,50 €', arrivage: 'Commandes ouvertes', tendance: true
  },
  {
    enseigne: 'Le supermarché de la galerie', univers: 'gourmandise',
    titre: 'Le rayon fêtes est installé',
    detail: 'Foie gras, saumon, chocolats et champagnes : tout le rayon de fin d’année est en place.',
    prix: '', arrivage: 'Depuis le 10 novembre', tendance: false
  }
];

// ATTENTION : ces nouveautés sont des EXEMPLES de démonstration. Les noms
// de boutiques sont GÉNÉRIQUES depuis le 25/08/2026, et les produits, les
// prix et les dates sont INVENTÉS : ils servent uniquement à montrer le
// rendu de l'écran. Rien de tout cela n'a été validé par un commerçant.
// Ne jamais réintroduire de vraie enseigne dans ce fichier, même pour une
// démonstration : ces écrans sont montrés à des foncières dont ce sont les
// locataires.
