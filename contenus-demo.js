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
// LE PROGRAMME DU JOUR (V2, 28/08/2026, demande de Romain : « à la
// fin, c'est les animations du jour, pas tout le programme »). Une
// visite = une journée : le joueur qui flashe voit ce qui se passe
// AUJOURD'HUI, et le contenu change chaque jour.
// Le mot-clé « aujourdhui » dans la colonne jour marque une entrée
// du jour courant, quelle que soit la date ; une vraie date en
// toutes lettres (« samedi 12 décembre ») marche aussi.
// La « photo dans la Hotte Géante » N'EXISTE PAS : ne jamais la
// remettre, ni ici, ni dans les lots, ni dans un texte du jeu.
const PROGRAMME_DEMO = [
  {
    jour: 'aujourdhui', heure: '10h30',
    titre: 'L’atelier ballons du lutin',
    lieu: 'Place centrale', horaires: '10h30 à 12h30',
    detail: 'Épée, fleur, petit chien : le lutin sculpte le ballon que l’enfant lui demande. Gratuit.'
  },
  {
    jour: 'aujourdhui', heure: '14h00',
    titre: 'La photo avec le Père Noël',
    lieu: 'Le trône, place centrale', horaires: '14h à 17h',
    detail: 'Le Père Noël reçoit les enfants sur son trône. Photo avec ton téléphone, gratuite et sans achat.',
    // La colonne `image` porte le visuel de l'animation, fourni par la
    // galerie (affiche, photo). Exemple ici avec la façade : à
    // remplacer par les vrais visuels de Cap Sacré-Cœur.
    image: 'img/client/facade-csc.jpg',
    vedette: true
  },
  {
    jour: 'aujourdhui', heure: '15h30',
    titre: 'La chorale de Noël',
    lieu: 'Allée principale', horaires: '30 minutes de chants'
  },
  {
    jour: 'aujourdhui', heure: '16h30',
    titre: 'Le spectacle du chapiteau',
    lieu: 'Place centrale', horaires: '45 minutes',
    detail: 'Jonglage, acrobaties et magie : le chapiteau ouvre sa piste au milieu de la galerie.'
  },
  {
    jour: 'aujourdhui', heure: '18h00',
    titre: 'Le cracheur de feu',
    lieu: 'Parvis de la galerie', horaires: 'À la tombée de la nuit',
    detail: 'Le grand final de la journée, dehors, à voir en famille.'
  },

  // ---- LE GRAND PROGRAMME DU 9 AU 24 DÉCEMBRE (28/08/2026, demande
  // de Romain : 3 à 4 animations par jour, dimanches ouverts compris).
  // Visible dans « tout le calendrier du mois », jamais sur l'écran du
  // jour. Les jours de la semaine sont ceux de décembre 2026. Le
  // dimanche 20 décembre est la Fèt Kaf : c'est la grande journée, avec
  // le concert de Kaloubadya. Exemples à faire valider par la galerie.

  // Mercredi 9 : ouverture de la quinzaine
  { jour: 'Mercredi 9 décembre', heure: '10h30', titre: 'L’atelier des petits chefs', lieu: 'Espace animation', horaires: '10h30 à 12h', detail: 'Les enfants décorent leurs sablés de Noël et repartent avec. Gratuit, dès 4 ans.' },
  { jour: 'Mercredi 9 décembre', heure: '14h00', titre: 'La photo avec le Père Noël', lieu: 'Le trône, place centrale', horaires: '14h à 17h', vedette: true },
  { jour: 'Mercredi 9 décembre', heure: '15h30', titre: 'L’atelier cirque des enfants', lieu: 'Place centrale', horaires: '15h30 à 17h', detail: 'Assiettes chinoises, foulards et équilibre : les artistes du chapiteau font essayer les enfants.' },
  { jour: 'Mercredi 9 décembre', heure: '17h30', titre: 'Les histoires du Père Noël', lieu: 'Coin lecture, espace animation', horaires: '30 minutes', detail: 'Un conte de Noël raconté aux petits, assis sur les coussins.' },

  // Jeudi 10
  { jour: 'Jeudi 10 décembre', heure: '10h30', titre: 'Le lutin sculpteur de ballons', lieu: 'En déambulation dans les allées', horaires: '10h30 à 12h30' },
  { jour: 'Jeudi 10 décembre', heure: '14h00', titre: 'La photo avec le Père Noël', lieu: 'Le trône, place centrale', horaires: '14h à 17h', vedette: true },
  { jour: 'Jeudi 10 décembre', heure: '16h00', titre: 'L’atelier gourmandises', lieu: 'Espace animation', horaires: '16h à 17h30', detail: 'Brochettes de bonbons et chocolats à décorer, à déguster sur place ou à offrir.' },

  // Vendredi 11
  { jour: 'Vendredi 11 décembre', heure: '10h30', titre: 'Le maquillage des enfants', lieu: 'Espace animation', horaires: '10h30 à 12h30', detail: 'Flocons, rennes et étoiles : une maquilleuse transforme les enfants.' },
  { jour: 'Vendredi 11 décembre', heure: '14h00', titre: 'La photo avec le Père Noël', lieu: 'Le trône, place centrale', horaires: '14h à 17h', vedette: true },
  { jour: 'Vendredi 11 décembre', heure: '16h30', titre: 'La chorale de Noël', lieu: 'Allée principale', horaires: '30 minutes de chants' },
  { jour: 'Vendredi 11 décembre', heure: '18h00', titre: 'Le cracheur de feu', lieu: 'Parvis de la galerie', horaires: 'À la tombée de la nuit', detail: 'Le grand final du vendredi, dehors, à voir en famille.' },

  // Samedi 12
  { jour: 'Samedi 12 décembre', heure: '10h00', titre: 'L’atelier des enfants', lieu: 'Espace animation', horaires: '10h à 12h', detail: 'Boules à décorer, cartes de vœux et couronnes. Gratuit, dès 3 ans.' },
  { jour: 'Samedi 12 décembre', heure: '14h00', titre: 'La photo avec le Père Noël', lieu: 'Le trône, place centrale', horaires: '14h à 17h', vedette: true },
  { jour: 'Samedi 12 décembre', heure: '16h30', titre: 'Le spectacle du chapiteau', lieu: 'Place centrale', horaires: '45 minutes', detail: 'Jonglage, acrobaties et magie : le chapiteau ouvre sa piste au milieu de la galerie.' },
  { jour: 'Samedi 12 décembre', heure: '18h00', titre: 'La parade lumineuse', lieu: 'Toutes les allées', horaires: '30 minutes', detail: 'Échassiers et costumes lumineux remontent la galerie en musique.' },

  // Dimanche 13 : ouvert !
  { jour: 'Dimanche 13 décembre', heure: '10h30', titre: 'Les histoires du Père Noël', lieu: 'Coin lecture, espace animation', horaires: '30 minutes' },
  { jour: 'Dimanche 13 décembre', heure: '14h00', titre: 'La photo avec le Père Noël', lieu: 'Le trône, place centrale', horaires: '14h à 17h', vedette: true },
  { jour: 'Dimanche 13 décembre', heure: '15h30', titre: 'L’atelier cirque des enfants', lieu: 'Place centrale', horaires: '15h30 à 17h' },

  // Lundi 14
  { jour: 'Lundi 14 décembre', heure: '10h30', titre: 'Le lutin sculpteur de ballons', lieu: 'En déambulation dans les allées', horaires: '10h30 à 12h30' },
  { jour: 'Lundi 14 décembre', heure: '14h00', titre: 'La photo avec le Père Noël', lieu: 'Le trône, place centrale', horaires: '14h à 17h', vedette: true },
  { jour: 'Lundi 14 décembre', heure: '16h00', titre: 'L’atelier gourmandises', lieu: 'Espace animation', horaires: '16h à 17h30' },

  // Mardi 15
  { jour: 'Mardi 15 décembre', heure: '10h30', titre: 'L’atelier des petits chefs', lieu: 'Espace animation', horaires: '10h30 à 12h', detail: 'Les enfants décorent leurs sablés de Noël et repartent avec. Gratuit, dès 4 ans.' },
  { jour: 'Mardi 15 décembre', heure: '14h00', titre: 'La photo avec le Père Noël', lieu: 'Le trône, place centrale', horaires: '14h à 17h', vedette: true },
  { jour: 'Mardi 15 décembre', heure: '16h30', titre: 'La chorale de Noël', lieu: 'Allée principale', horaires: '30 minutes de chants' },

  // Mercredi 16
  { jour: 'Mercredi 16 décembre', heure: '10h00', titre: 'L’atelier des enfants', lieu: 'Espace animation', horaires: '10h à 12h', detail: 'Boules à décorer, cartes de vœux et couronnes. Gratuit, dès 3 ans.' },
  { jour: 'Mercredi 16 décembre', heure: '14h00', titre: 'La photo avec le Père Noël', lieu: 'Le trône, place centrale', horaires: '14h à 17h', vedette: true },
  { jour: 'Mercredi 16 décembre', heure: '15h30', titre: 'L’atelier cirque des enfants', lieu: 'Place centrale', horaires: '15h30 à 17h' },
  { jour: 'Mercredi 16 décembre', heure: '17h30', titre: 'Les histoires du Père Noël', lieu: 'Coin lecture, espace animation', horaires: '30 minutes' },

  // Jeudi 17
  { jour: 'Jeudi 17 décembre', heure: '10h30', titre: 'Le maquillage des enfants', lieu: 'Espace animation', horaires: '10h30 à 12h30' },
  { jour: 'Jeudi 17 décembre', heure: '14h00', titre: 'La photo avec le Père Noël', lieu: 'Le trône, place centrale', horaires: '14h à 17h', vedette: true },
  { jour: 'Jeudi 17 décembre', heure: '16h00', titre: 'L’atelier gourmandises', lieu: 'Espace animation', horaires: '16h à 17h30' },

  // Vendredi 18
  { jour: 'Vendredi 18 décembre', heure: '10h30', titre: 'Le lutin sculpteur de ballons', lieu: 'En déambulation dans les allées', horaires: '10h30 à 12h30' },
  { jour: 'Vendredi 18 décembre', heure: '14h00', titre: 'La photo avec le Père Noël', lieu: 'Le trône, place centrale', horaires: '14h à 17h', vedette: true },
  { jour: 'Vendredi 18 décembre', heure: '16h30', titre: 'Le spectacle du chapiteau', lieu: 'Place centrale', horaires: '45 minutes' },
  { jour: 'Vendredi 18 décembre', heure: '18h00', titre: 'Le cracheur de feu', lieu: 'Parvis de la galerie', horaires: 'À la tombée de la nuit' },

  // Samedi 19
  { jour: 'Samedi 19 décembre', heure: '10h00', titre: 'L’atelier des petits chefs', lieu: 'Espace animation', horaires: '10h à 12h' },
  { jour: 'Samedi 19 décembre', heure: '14h00', titre: 'La photo avec le Père Noël', lieu: 'Le trône, place centrale', horaires: '14h à 17h', vedette: true },
  { jour: 'Samedi 19 décembre', heure: '15h00', titre: 'La brigade du Père Noël', lieu: 'En déambulation dans les allées', horaires: '15h à 18h', detail: 'Le Père Noël, la Mère Noël et leurs lutins remontent la galerie en musique.' },
  { jour: 'Samedi 19 décembre', heure: '18h00', titre: 'La parade lumineuse', lieu: 'Toutes les allées', horaires: '30 minutes' },

  // Dimanche 20 : la Fèt Kaf, la grande journée
  { jour: 'Dimanche 20 décembre', heure: '10h30', titre: 'L’atelier cirque des enfants', lieu: 'Place centrale', horaires: '10h30 à 12h' },
  { jour: 'Dimanche 20 décembre', heure: '14h00', titre: 'La photo avec le Père Noël', lieu: 'Le trône, place centrale', horaires: '14h à 16h' },
  { jour: 'Dimanche 20 décembre', heure: '16h00', titre: 'Le concert de Kaloubadya', lieu: 'Place centrale', horaires: 'Concert d’une heure', detail: 'Pour la Fèt Kaf, Kaloubadya fait chanter et danser toute la galerie. Le rendez-vous du 20 décembre.', vedette: true },
  { jour: 'Dimanche 20 décembre', heure: '17h30', titre: 'Le kabar du 20 décembre', lieu: 'Parvis de la galerie', horaires: 'Jusqu’à 18h30', detail: 'Percussions et danse pour clore la journée de la liberté.' },

  // Lundi 21 : la dernière ligne droite commence
  { jour: 'Lundi 21 décembre', heure: '10h30', titre: 'Le lutin sculpteur de ballons', lieu: 'En déambulation dans les allées', horaires: '10h30 à 12h30' },
  { jour: 'Lundi 21 décembre', heure: '14h00', titre: 'La photo avec le Père Noël', lieu: 'Le trône, place centrale', horaires: '14h à 17h', vedette: true },
  { jour: 'Lundi 21 décembre', heure: '16h00', titre: 'L’atelier gourmandises', lieu: 'Espace animation', horaires: '16h à 17h30' },

  // Mardi 22
  { jour: 'Mardi 22 décembre', heure: '10h30', titre: 'L’atelier des enfants', lieu: 'Espace animation', horaires: '10h30 à 12h' },
  { jour: 'Mardi 22 décembre', heure: '14h00', titre: 'La photo avec le Père Noël', lieu: 'Le trône, place centrale', horaires: '14h à 17h', vedette: true },
  { jour: 'Mardi 22 décembre', heure: '16h30', titre: 'La chorale de Noël', lieu: 'Allée principale', horaires: '30 minutes de chants' },
  { jour: 'Mardi 22 décembre', heure: '17h30', titre: 'Les histoires du Père Noël', lieu: 'Coin lecture, espace animation', horaires: '30 minutes' },

  // Mercredi 23
  { jour: 'Mercredi 23 décembre', heure: '10h30', titre: 'L’atelier des petits chefs', lieu: 'Espace animation', horaires: '10h30 à 12h' },
  { jour: 'Mercredi 23 décembre', heure: '14h00', titre: 'La photo avec le Père Noël', lieu: 'Le trône, place centrale', horaires: '14h à 17h', vedette: true },
  { jour: 'Mercredi 23 décembre', heure: '15h30', titre: 'Le maquillage des enfants', lieu: 'Espace animation', horaires: '15h30 à 17h30' },
  { jour: 'Mercredi 23 décembre', heure: '18h00', titre: 'Le cracheur de feu', lieu: 'Parvis de la galerie', horaires: 'À la tombée de la nuit' },

  // Jeudi 24 : le réveillon
  { jour: 'Jeudi 24 décembre', heure: '10h00', titre: 'La photo avec le Père Noël', lieu: 'Le trône, place centrale', horaires: '10h à 12h30, dernière séance avant sa tournée', vedette: true },
  { jour: 'Jeudi 24 décembre', heure: '11h00', titre: 'La chorale de Noël', lieu: 'Allée principale', horaires: '30 minutes de chants' },
  { jour: 'Jeudi 24 décembre', heure: '14h30', titre: 'La brigade du Père Noël', lieu: 'En déambulation dans les allées', horaires: '14h30 à 16h30', detail: 'Dernier tour de galerie avant le grand départ, distribution de papillotes.' },
  { jour: 'Jeudi 24 décembre', heure: '16h30', titre: 'Le départ du Père Noël', lieu: 'Parvis de la galerie', horaires: 'Le dernier au revoir', detail: 'Tout le monde dehors pour saluer le Père Noël avant sa grande nuit.' }
];


// LES OFFRES D'EXEMPLE, DICTÉES PAR ROMAIN (27/08/2026). Ce sont de
// vraies enseignes de la galerie, données par lui pour la version
// d'essai. Chaque offre EST un bon : quelque chose à présenter au
// commerçant, jamais une simple annonce.
const OFFRES_DEMO = [
  // LES CONDITIONS COLLENT À LA RÉALITÉ (28/08/2026, Romain : « le
  // commerçant ne se retrouvera pas, on se rapproche de la réalité »).
  // Chaque bon demande un achat à la hauteur du cadeau offert.
  {
    enseigne: 'L’igloo', univers: 'gourmandise',
    titre: 'Une boisson offerte pour l’achat de deux glaces',
    detail: 'Sur présentation de ce bon, deux glaces achetées et la boisson est offerte.',
    valable_jusqu_au: '31 décembre', bon: 'Une boisson offerte pour l’achat de deux glaces'
  },
  {
    enseigne: 'Jina', univers: 'mode',
    titre: '10 % sur toute la boutique',
    detail: 'Sur présentation de ce bon, 10 % de remise sur tout, même les nouveautés.',
    valable_jusqu_au: '31 décembre', bon: '10 % sur toute la boutique'
  },
  {
    enseigne: 'Taïlu', univers: 'gourmandise',
    titre: 'Le sixième samoussa offert',
    detail: 'Cinq samoussas achetés, le sixième est offert, tous parfums.',
    valable_jusqu_au: '31 décembre', bon: 'Le sixième samoussa offert'
  },
  {
    enseigne: 'Madame Cookie', univers: 'gourmandise',
    titre: 'Un cookie offert dès trois achetés',
    detail: 'Trois cookies achetés, le quatrième est offert, à choisir dans toute la vitrine.',
    valable_jusqu_au: '31 décembre', bon: 'Un cookie offert dès trois achetés'
  },
  {
    enseigne: 'Nocibé', univers: 'beaute',
    titre: 'Un maquillage flash offert',
    detail: 'Dix minutes avec une conseillère, sans rendez-vous et sans obligation d’achat.',
    valable_jusqu_au: '24 décembre', bon: 'Un maquillage flash offert'
  },
  {
    enseigne: 'Avril', univers: 'beaute',
    titre: 'Un bilan peau offert',
    detail: 'Un diagnostic complet et un échantillon adapté à ta peau.',
    valable_jusqu_au: '31 décembre', bon: 'Un bilan peau offert'
  },
  {
    enseigne: "My Crep's", univers: 'gourmandise',
    titre: 'La crêpe sucre offerte dès 25 € d’achat',
    detail: 'Pour toute commande de 25 € ou plus, la crêpe au sucre est offerte.',
    valable_jusqu_au: '31 décembre', bon: 'La crêpe sucre offerte dès 25 € d’achat'
  },
  {
    enseigne: 'LGM', univers: 'gourmandise',
    titre: 'La troisième glace offerte pour l’achat de deux',
    detail: 'Deux glaces achetées, la troisième est offerte, en cornet ou en pot.',
    valable_jusqu_au: '31 décembre', bon: 'La troisième glace offerte pour l’achat de deux'
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
