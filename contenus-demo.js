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
// ⚠️ Les entrées « aujourdhui » ci-dessous sont un SECOURS DE
// DÉMONSTRATION : app.js les masque automatiquement dès que le jour
// de la visite a son vrai programme daté (donc pendant toute
// l'opération de décembre). Elles ne servent que pour montrer
// l'écran vivant avant le 9 décembre. Pas besoin de les retirer.
// La « photo dans la Hotte Géante » N'EXISTE PAS : ne jamais la
// remettre, ni ici, ni dans les lots, ni dans un texte du jeu.
const PROGRAMME_DEMO = [
  // LES EXEMPLES DU JOUR (secours d'avant décembre, masqués dès que le
  // jour de la visite a son vrai programme daté) : tirés du VRAI
  // programme ci-dessous, pour que la démo ressemble à la réalité.
  { jour: 'aujourdhui', heure: '7h', titre: 'Le Père Noël est dans la galerie', horaires: '7h à 14h30', detail: 'Viens à sa rencontre.', vedette: true },
  { jour: 'aujourdhui', heure: '10h30', titre: 'L’espace du lutin et la lettre au Père Noël', horaires: '10h30 à 17h30', detail: 'Écris ta lettre au Père Noël avec l’aide du lutin. Gratuit.' },
  { jour: 'aujourdhui', heure: '14h', titre: 'L’atelier déco parent-enfant', horaires: '14h à 17h30', detail: 'Création d’étiquettes cadeaux.' },
  { jour: 'aujourdhui', heure: '18h', titre: 'La chorale de Noël', horaires: '18h à 19h', detail: 'Vingt chanteurs dans la galerie.', vedette: true },
  { jour: 'aujourdhui', heure: '19h', titre: 'Chakti, l’animation enflammée', horaires: '19h à 20h', vedette: true },

  // LE VRAI PROGRAMME DE DÉCEMBRE 2026, donné par Romain le 29/08/2026
  // (export de son outil de planification, fichier
  // programme-noel-csc-2.json). Du mercredi 9 au jeudi 24 décembre ;
  // le dimanche 13, la galerie n'a pas d'animation programmée : le
  // jour n'apparaît pas, c'est voulu. JAMAIS de prix ici : l'export
  // d'origine en contient, ils ne concernent que Pull Up.

  // --- Mercredi 9 décembre ---
  { jour: 'Mercredi 9 décembre', heure: '7h', titre: 'Le Père Noël est dans la galerie', horaires: '7h à 14h30', detail: 'Avec distribution de bonbons.', vedette: true },
  { jour: 'Mercredi 9 décembre', heure: '10h30', titre: 'L’espace du lutin et la lettre au Père Noël', horaires: '10h30 à 17h30', detail: 'Écris ta lettre au Père Noël avec l’aide du lutin. Gratuit.' },
  { jour: 'Mercredi 9 décembre', heure: '14h', titre: 'L’atelier déco parent-enfant', horaires: '14h à 17h30', detail: 'Création d’étiquettes cadeaux.' },
  { jour: 'Mercredi 9 décembre', heure: '19h', titre: 'Chakti, l’animation enflammée', horaires: '19h à 20h', vedette: true },

  // --- Jeudi 10 décembre ---
  { jour: 'Jeudi 10 décembre', heure: '10h30', titre: 'L’espace du lutin et la lettre au Père Noël', horaires: '10h30 à 17h30', detail: 'Écris ta lettre au Père Noël avec l’aide du lutin. Gratuit.' },
  { jour: 'Jeudi 10 décembre', heure: '17h', titre: 'La chorale en déambulation, à quatre voix', horaires: '17h à 18h', vedette: true },

  // --- Vendredi 11 décembre ---
  { jour: 'Vendredi 11 décembre', heure: '10h30', titre: 'L’espace du lutin et la lettre au Père Noël', horaires: '10h30 à 17h30', detail: 'Écris ta lettre au Père Noël avec l’aide du lutin. Gratuit.' },
  { jour: 'Vendredi 11 décembre', heure: '15h', titre: 'La déambulation jonglage de Chakti', horaires: '15h à 16h', vedette: true },

  // --- Samedi 12 décembre ---
  { jour: 'Samedi 12 décembre', heure: '7h', titre: 'Le Père Noël est dans la galerie', horaires: '7h à 14h30', detail: 'Viens à sa rencontre.', vedette: true },
  { jour: 'Samedi 12 décembre', heure: '10h30', titre: 'L’espace du lutin et la lettre au Père Noël', horaires: '10h30 à 17h30', detail: 'Écris ta lettre au Père Noël avec l’aide du lutin. Gratuit.' },
  { jour: 'Samedi 12 décembre', heure: '14h', titre: 'L’atelier déco parent-enfant', horaires: '14h à 17h30', detail: 'Création de marque-places.' },
  { jour: 'Samedi 12 décembre', heure: '18h', titre: 'La chorale de Noël', horaires: '18h à 19h', detail: 'Vingt chanteurs dans la galerie.', vedette: true },

  // --- Lundi 14 décembre ---
  { jour: 'Lundi 14 décembre', heure: '10h30', titre: 'L’espace du lutin et la lettre au Père Noël', horaires: '10h30 à 17h30', detail: 'Écris ta lettre au Père Noël avec l’aide du lutin. Gratuit.' },
  { jour: 'Lundi 14 décembre', heure: '15h', titre: 'Le concours de dessin de Noël', horaires: '15h à 16h', detail: 'Résultats à 16h.', vedette: true },
  { jour: 'Lundi 14 décembre', titre: 'Contes et histoires de Noël', horaires: 'Plusieurs sessions dans la journée', vedette: true },

  // --- Mardi 15 décembre ---
  { jour: 'Mardi 15 décembre', heure: '10h30', titre: 'L’espace du lutin et la lettre au Père Noël', horaires: '10h30 à 17h30', detail: 'Écris ta lettre au Père Noël avec l’aide du lutin. Gratuit.' },
  { jour: 'Mardi 15 décembre', heure: '15h', titre: 'La déambulation jonglage de Chakti', horaires: '15h à 16h', vedette: true },

  // --- Mercredi 16 décembre ---
  { jour: 'Mercredi 16 décembre', heure: '7h', titre: 'Le Père Noël est dans la galerie', horaires: '7h à 14h30', detail: 'Viens à sa rencontre.', vedette: true },
  { jour: 'Mercredi 16 décembre', heure: '10h30', titre: 'L’espace du lutin et la lettre au Père Noël', horaires: '10h30 à 17h30', detail: 'Écris ta lettre au Père Noël avec l’aide du lutin. Gratuit.' },
  { jour: 'Mercredi 16 décembre', heure: '14h', titre: 'L’atelier déco parent-enfant', horaires: '14h à 17h30', detail: 'Création d’étiquettes cadeaux.' },
  { jour: 'Mercredi 16 décembre', heure: '19h', titre: 'Chakti, l’animation enflammée', horaires: '19h à 20h', vedette: true },

  // --- Jeudi 17 décembre ---
  { jour: 'Jeudi 17 décembre', heure: '10h30', titre: 'L’espace du lutin et la lettre au Père Noël', horaires: '10h30 à 17h30', detail: 'Écris ta lettre au Père Noël avec l’aide du lutin. Gratuit.' },
  { jour: 'Jeudi 17 décembre', heure: '15h', titre: 'Le concours de dessin de Noël', horaires: '15h à 16h', detail: 'Résultats à 16h.', vedette: true },
  { jour: 'Jeudi 17 décembre', heure: '16h', titre: 'Contes et histoires de Noël', horaires: 'Sessions à 16h', vedette: true },

  // --- Vendredi 18 décembre ---
  { jour: 'Vendredi 18 décembre', heure: '10h30', titre: 'L’espace du lutin et la lettre au Père Noël', horaires: '10h30 à 17h30', detail: 'Écris ta lettre au Père Noël avec l’aide du lutin. Gratuit.' },
  { jour: 'Vendredi 18 décembre', heure: '19h', titre: 'Chakti, le spectacle lumineux', horaires: '19h à 20h', vedette: true },

  // --- Samedi 19 décembre ---
  { jour: 'Samedi 19 décembre', heure: '7h', titre: 'Le Père Noël est dans la galerie', horaires: '7h à 14h30', detail: 'Viens à sa rencontre.', vedette: true },
  { jour: 'Samedi 19 décembre', heure: '10h30', titre: 'L’espace du lutin et la lettre au Père Noël', horaires: '10h30 à 17h30', detail: 'Écris ta lettre au Père Noël avec l’aide du lutin. Gratuit.' },
  { jour: 'Samedi 19 décembre', heure: '14h', titre: 'L’atelier déco parent-enfant', horaires: '14h à 17h30', detail: 'Création de marque-places.' },
  { jour: 'Samedi 19 décembre', heure: '15h', titre: 'La déambulation jonglage de Chakti', horaires: '15h à 16h', vedette: true },
  { jour: 'Samedi 19 décembre', heure: '18h', titre: 'La chorale de Noël', horaires: '18h à 19h', detail: 'Vingt chanteurs dans la galerie.', vedette: true },

  // --- Dimanche 20 décembre ---
  { jour: 'Dimanche 20 décembre', heure: 'Matin', titre: 'Le riz chauffé, petit-déjeuner créole', detail: 'Le petit-déjeuner lontan du dimanche de la Fèt Kaf.' },
  { jour: 'Dimanche 20 décembre', heure: '10h30', titre: 'L’espace du lutin et la lettre au Père Noël', horaires: '10h30 à 17h30', detail: 'Écris ta lettre au Père Noël avec l’aide du lutin. Gratuit.' },
  { jour: 'Dimanche 20 décembre', heure: '14h', titre: 'Le concert de Kaloubadya', horaires: '14h à 16h', detail: 'Le grand rendez-vous de la Fèt Kaf, en plein cœur de la galerie.', vedette: true },

  // --- Lundi 21 décembre ---
  { jour: 'Lundi 21 décembre', heure: '7h', titre: 'Le Père Noël est dans la galerie', horaires: '7h à 14h30', detail: 'Viens à sa rencontre.', vedette: true },
  { jour: 'Lundi 21 décembre', heure: '10h', titre: 'L’atelier parent-enfant', horaires: '10h à 18h', detail: 'Création d’étiquettes cadeaux.' },
  { jour: 'Lundi 21 décembre', heure: '10h30', titre: 'L’espace du lutin et la lettre au Père Noël', horaires: '10h30 à 17h30', detail: 'Écris ta lettre au Père Noël avec l’aide du lutin. Gratuit.' },

  // --- Mardi 22 décembre ---
  { jour: 'Mardi 22 décembre', heure: '7h', titre: 'Le Père Noël est dans la galerie', horaires: '7h à 14h30', detail: 'Viens à sa rencontre.', vedette: true },
  { jour: 'Mardi 22 décembre', heure: '10h30', titre: 'L’espace du lutin et la lettre au Père Noël', horaires: '10h30 à 17h30', detail: 'Écris ta lettre au Père Noël avec l’aide du lutin. Gratuit.' },
  { jour: 'Mardi 22 décembre', heure: '17h30', titre: 'L’animation micro en nocturne', horaires: '17h30 à 21h' },
  { jour: 'Mardi 22 décembre', heure: '19h', titre: 'Le spectacle de feu', horaires: '19h à 20h', vedette: true },

  // --- Mercredi 23 décembre ---
  { jour: 'Mercredi 23 décembre', heure: '7h', titre: 'Le Père Noël est dans la galerie', horaires: '7h à 14h30', detail: 'Viens à sa rencontre.', vedette: true },
  { jour: 'Mercredi 23 décembre', heure: '10h30', titre: 'L’espace du lutin et la lettre au Père Noël', horaires: '10h30 à 17h30', detail: 'Écris ta lettre au Père Noël avec l’aide du lutin. Gratuit.' },
  { jour: 'Mercredi 23 décembre', heure: '14h', titre: 'L’atelier déco parent-enfant', horaires: '14h à 17h30' },
  { jour: 'Mercredi 23 décembre', heure: '17h30', titre: 'L’animation micro en nocturne', horaires: '17h30 à 21h' },
  { jour: 'Mercredi 23 décembre', heure: '18h', titre: 'La chorale de Noël', horaires: '18h à 19h', detail: 'Vingt chanteurs dans la galerie.', vedette: true },
  { jour: 'Mercredi 23 décembre', heure: '19h', titre: 'Chakti, le spectacle lumineux', horaires: '19h à 20h', vedette: true },

  // --- Jeudi 24 décembre ---
  { jour: 'Jeudi 24 décembre', heure: '7h', titre: 'L’espace du lutin et la lettre au Père Noël', horaires: '7h à 14h30', detail: 'Dernier jour pour poster ta lettre au Père Noël. Gratuit.' },
  { jour: 'Jeudi 24 décembre', heure: '7h', titre: 'Le Père Noël est dans la galerie', horaires: '7h à 14h30', detail: 'Viens à sa rencontre.', vedette: true },
  { jour: 'Jeudi 24 décembre', heure: '7h', titre: 'Le petit-déjeuner des lutins', horaires: '7h à 11h' },
];


// LES OFFRES D'EXEMPLE, DICTÉES PAR ROMAIN (27/08/2026).
// (Le champ valable_jusqu_au a été retiré le 29/08/2026 : rien ne le
// lisait, et il contredisait la règle réelle, écrite dans app.js et
// bons.js : un bon d'offre du jour vaut le jour même, point.) Ce sont de
// vraies enseignes de la galerie, données par lui pour la version
// d'essai. Chaque offre EST un bon : quelque chose à présenter au
// commerçant, jamais une simple annonce.
const OFFRES_DEMO = [
  // LES CONDITIONS COLLENT À LA RÉALITÉ (28/08/2026, Romain : « le
  // commerçant ne se retrouvera pas, on se rapproche de la réalité »).
  // Chaque bon demande un achat à la hauteur du cadeau offert, SAUF
  // les deux découvertes beauté (Nocibé, Avril) : sans obligation
  // d'achat, assumées comme générateurs de trafic en boutique.
  {
    enseigne: 'L’igloo', univers: 'gourmandise',
    titre: 'Une boisson offerte pour l’achat de deux glaces',
    detail: 'Sur présentation de ce bon, deux glaces achetées et la boisson est offerte.',
    bon: 'Une boisson offerte pour l’achat de deux glaces'
  },
  {
    enseigne: 'Jina', univers: 'mode',
    titre: '10 % sur toute la boutique',
    detail: 'Sur présentation de ce bon, 10 % de remise sur tout, même les nouveautés.',
    bon: '10 % sur toute la boutique'
  },
  {
    enseigne: 'Taïlu', univers: 'gourmandise',
    titre: 'Le sixième samoussa offert',
    detail: 'Cinq samoussas achetés, le sixième est offert, toutes les variétés.',
    bon: 'Le sixième samoussa offert'
  },
  {
    enseigne: 'Madame Cookie', univers: 'gourmandise',
    titre: 'Un cookie offert dès trois achetés',
    detail: 'Trois cookies achetés, le quatrième est offert, à choisir dans toute la vitrine.',
    bon: 'Un cookie offert dès trois achetés'
  },
  {
    enseigne: 'Nocibé', univers: 'beaute',
    titre: 'Un maquillage flash offert',
    detail: 'Dix minutes avec une conseillère, sans rendez-vous et sans obligation d’achat.',
    bon: 'Un maquillage flash offert'
  },
  {
    enseigne: 'Avril', univers: 'beaute',
    titre: 'Un bilan peau offert',
    detail: 'Un diagnostic complet et un échantillon adapté à ta peau.',
    bon: 'Un bilan peau offert'
  },
  {
    enseigne: "My Crep's", univers: 'gourmandise',
    titre: 'La crêpe au sucre offerte dès 25 € d’achat',
    detail: 'Pour toute commande de 25 € ou plus, la crêpe au sucre est offerte.',
    bon: 'La crêpe au sucre offerte dès 25 € d’achat'
  },
  {
    enseigne: 'LGM', univers: 'gourmandise',
    titre: 'La troisième glace offerte pour l’achat de deux',
    detail: 'Deux glaces achetées, la troisième est offerte, en cornet ou en pot.',
    bon: 'La troisième glace offerte pour l’achat de deux'
  }
];

// ATTENTION : ces offres sont des EXEMPLES de démonstration. Elles
// citent de VRAIES enseignes de Cap Sacré-Cœur, dictées par Romain le
// 27/08/2026 avec les conditions qu'il a données : c'est SA décision,
// qui fait exception à la règle générale « jamais d'enseigne réelle
// sans engagement signé » (toujours valable pour tout ce que Romain
// n'a pas dicté lui-même, et pour les NOUVEAUTÉS ci-dessous, restées
// génériques). Ces exemples sont remplacés automatiquement par les
// vraies offres dès que les commerçants les saisissent en base.


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
