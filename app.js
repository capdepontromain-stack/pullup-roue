// ============================================
// LA ROUE PULL UP : logique du jeu
// ============================================

const SUPABASE_URL = 'https://vincxrmtfjbenlzhjwby.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbmN4cm10ZmpiZW5semhqd2J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyOTI1MTksImV4cCI6MjA5Nzg2ODUxOX0.M9_ChGDlOIUKKZtbBHs1xn4cdy4FwUAQKN0aYyXefQY';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Nom de l'opération : le QR code peut pointer vers ?e=galerie-sud, ?e=nordev…
const EVENEMENT = new URLSearchParams(location.search).get('e') || 'test';

let modeDemo = false;

// --------------------------------------------
// CONTEXTE DE TEST : le verrou « une partie par jour »
// --------------------------------------------
// En production, un joueur ne joue qu'une fois par jour et par adresse
// mail : c'est le coeur de l'honnêteté du jeu, et ça ne se désactive
// jamais. Mais pour tester et pour faire une démonstration à un client,
// il faut pouvoir rejouer dix fois de suite avec la même adresse.
//
// La règle est automatique, personne n'a rien à réactiver : le verrou
// ne tombe QUE si la page est ouverte depuis une adresse de test, c'est
// à dire une adresse locale (localhost, 127.0.0.1) ou une adresse de
// réseau privé (192.168.x.x, 10.x.x.x, 172.16 à 172.31.x.x, un nom en
// .local, ou un fichier ouvert directement). Romain teste depuis son
// téléphone sur http://192.168.1.150:8766 : ce cas est couvert.
//
// Sur un vrai nom de domaine, aucune adresse, aucun paramètre dans le
// lien et aucun réglage en base ne peut faire tomber le verrou. C'est
// volontaire : un drapeau « démonstration » utilisable en production
// aurait été une porte dérobée qu'on aurait fini par oublier ouverte.
// Quand le verrou est désactivé, une mention le dit en bas de l'écran :
// personne ne peut croire que la protection est tombée en production.
function contexteDeTest() {
  const h = location.hostname;
  if (location.protocol === 'file:') return true;
  if (!h) return true;
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return true;
  if (h.endsWith('.local') || h.endsWith('.localhost')) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

const MODE_TEST = contexteDeTest();

// LA VERSION D'ESSAI EN LIGNE (26/08/2026)
// ----------------------------------------
// L'adresse de démonstration (GitHub Pages) n'est pas le vrai domaine
// du jeu : c'est la version qu'on envoie aux galeries pour qu'elles
// l'essaient. Là, on ne bloque personne au bout d'une partie, sinon
// personne ne peut montrer le jeu deux fois. Le joueur voit quand même
// l'écran « Pas si vite ! », pour comprendre qu'en vrai, c'est une
// partie par jour, et il repart d'un bouton.
// Le jour où le jeu vivra sur jeu.pullup.re, cette adresse ne
// correspondra plus et le verrou redeviendra strict tout seul : il n'y
// a aucun réglage, aucun paramètre d'URL, aucune porte dérobée.
function contexteEssai() {
  return /(^|\.)github\.io$/.test(location.hostname);
}
const VERSION_ESSAI = contexteEssai();
const PARTIES_ILLIMITEES = MODE_TEST || VERSION_ESSAI;

// « &demo=1 » sert UNIQUEMENT à masquer la mention pendant une
// démonstration client (partage d'écran en visio). Il ne désactive
// rien du tout : le verrou du jour dépend de l'adresse du site, jamais
// d'un paramètre. Sur un vrai nom de domaine, ce paramètre n'a donc
// aucun effet, puisqu'il n'y a de toute façon aucune mention à masquer
// et que le verrou s'applique.
const DEMO_SANS_MENTION = new URLSearchParams(location.search).get('demo') === '1';

function afficherMentionTest() {
  const el = document.getElementById('badge-test');
  if (el) {
    if (VERSION_ESSAI && !MODE_TEST) el.textContent = 'Version d’essai · parties illimitées';
    el.hidden = !PARTIES_ILLIMITEES || DEMO_SANS_MENTION;
  }
  if (PARTIES_ILLIMITEES && !DEMO_SANS_MENTION) document.body.classList.add('mode-test');
}

// --------------------------------------------
// OPÉRATION (habillage) : valeurs par défaut,
// remplacées par la table roue_operations
// --------------------------------------------
let OPERATION = {
  slug: EVENEMENT,
  nom: 'Le Grand Jeu de Noël',
  lieu: '',
  emoji: '🎪',
  accroche: 'Quelques questions, des jeux, et peut-être un cadeau à la clé.',
  theme: 'or',
  logo: '',
  // Quel jeu cette galerie utilise : 'roue', 'paquets', 'memory'.
  // Plusieurs séparés par des virgules = un jeu différent chaque jour.
  jeu: 'roue',
  // Le grand tirage au sort est abandonné (25/08/2026) : plus rien ne
  // l'affiche. La colonne reste ici pour ne pas casser la lecture de la
  // table roue_operations, mais elle n'est plus utilisée nulle part.
  texte_tirage: '',
  // Part de joueurs gagnants, en pourcentage (colonne taux_gagnants de
  // roue_operations). Laissé vide ici EXPRÈS : c'est ce qui déclenche
  // le repli sur TAUX_GAGNANTS_DEFAUT tant que la colonne n'existe pas
  // en base. Voir tauxGagnants().
  taux_gagnants: null,
  date_debut: null,
  date_fin: null,
  actif: true
};

// Habillages de secours si la base est injoignable (les vraies configs
// vivent dans la table roue_operations de Supabase)
const OPERATIONS_LOCALES = {
  'cap-sacre-coeur': {
    nom: 'La Hotte des Commerçants',
    lieu: 'Cap Sacré-Cœur',
    emoji: '🎁',
    accroche: 'Quelques questions, trois numéros sur la piste, et peut-être un cadeau offert par tes commerçants.',
    // L'UNIVERS DE DÉCEMBRE 2026 EST LE CIRQUE (Romain, 26/08/2026) :
    // Cap Sacré-Cœur décore sa galerie sur ce thème, le jeu suit. Le
    // Père Noël reste de la partie, en Monsieur Loyal.
    theme: 'circus',
    // Le logo de la galerie dans sa vraie couleur (26/08/2026, Romain :
    // « le logo Cap Sacré-Cœur est rouge sur internet, mets-le en rouge
    // et plus gros »). La version blanche reste dans le dossier pour un
    // support qui ne supporterait pas le rouge.
    logo: 'img/client/logo-csc-couleur.png',
    texte_tirage: '',
    // LES LOTS D'EXEMPLE, DICTÉS PAR ROMAIN LE 27/08/2026. Ce sont de
    // vraies enseignes de la galerie, données par lui pour la version
    // d'essai : elles remplacent les noms génériques. La « photo dans
    // la Hotte géante » a disparu : cette animation N'EXISTE PAS, ne
    // jamais la faire réapparaître, ni ici ni dans le programme.
    lots: [
      { nom: '5 samoussas offerts',     commercant: 'Taïlu',          poids: 12, perdant: false },
      { nom: 'Un cookie offert',        commercant: 'Madame Cookie',  poids: 12, perdant: false },
      { nom: "Bon d'achat de 5 €",      commercant: 'La galerie',     poids: 8,  perdant: false },
      { nom: 'Un maquillage flash',     commercant: 'Nocibé',         poids: 8,  perdant: false },
      { nom: 'Un bilan peau offert',    commercant: 'Avril',          poids: 8,  perdant: false },
      { nom: 'Une crêpe offerte',       commercant: "My Crep's",      poids: 12, perdant: false },
      { nom: 'Une glace offerte',       commercant: 'LGM',            poids: 12, perdant: false },
      { nom: 'Retente demain !',        commercant: '',               poids: 28, perdant: true }
    ]
  }
};

function appliquerOperation() {
  document.body.classList.toggle('theme-noel', OPERATION.theme === 'noel');
  // L'UNIVERS DU CIRQUE (décembre 2026) : rideau de velours, ampoules
  // de chapiteau, fanions. Tout est dans style.css, sous .theme-circus.
  document.body.classList.toggle('theme-circus', OPERATION.theme === 'circus');

  // LE MÉDAILLON D'ACCUEIL : le Père Noël, EN DESSIN.
  // 27/08/2026 : le médaillon montre LE CHAPITEAU, plus de Père Noël.
  // L'histoire, pour qu'on n'y revienne pas une quatrième fois : une
  // photographie détourée d'abord (« vous avez mis un Père Noël
  // noir… il n'est pas beau »), puis un Père Noël dessiné, écarté à
  // son tour (« il est vraiment pas beau, soit tu l'enlèves et tu
  // mets un chapiteau »). Le chapiteau règle le sujet : il dit
  // l'univers de décembre sans nommer personne, et il ne pose aucune
  // question de représentation.
  // Le nom de la classe (medaillon-pere-noel) n'a pas été changé
  // exprès : il est utilisé dans style.css et le renommer partout pour
  // une question de vocabulaire, à cette heure-ci, ne ferait que créer
  // une occasion de casser l'écran d'accueil. Il désigne « le
  // médaillon rond de l'accueil », quel que soit ce qu'il montre.
  const medaillon = document.getElementById('accueil-medaillon');
  if (medaillon) {
    medaillon.hidden = false;
    medaillon.classList.add('hero-photo', 'medaillon-pere-noel');
    medaillon.innerHTML = '';
  }

  // L'EN-TÊTE DE L'OPÉRATION, présent sur tous les écrans.
  // Romain, 25/08/2026 : « le nom du jeu ET celui de la galerie doivent
  // être rappelés en permanence, surtout en haut des questions ».
  // Deux niveaux construits depuis les données de l'opération :
  //   - le nom du jeu (colonne nom) en petites capitales dorées ;
  //   - la galerie (colonne lieu) juste en dessous, beaucoup plus
  //     grande : son logo quand la galerie en a un, sinon son nom
  //     écrit en Playfair. Le logo EST le nom : afficher les deux
  //     ferait doublon, puisqu'il contient déjà le mot.
  // LE PIED DE PAGE PORTE LE NOM DE LA GALERIE, PAS LE NÔTRE.
  // Romain, 26/08/2026 : « Pull Up doit apparaître très rarement, une
  // fois peut-être ». L'agence ne se nomme donc plus qu'à un seul
  // endroit de toute l'application : la mention légale de l'écran des
  // coordonnées, où le responsable du traitement des données DOIT être
  // identifié (RGPD). Partout ailleurs, c'est la galerie qui parle.
  const pied = document.getElementById('pied-marque');
  if (pied) pied.textContent = (OPERATION.lieu || OPERATION.nom || '').trim();

  const logo = document.getElementById('logo-client');
  const lieuEntete = document.getElementById('entete-lieu');
  const jeuEntete = document.getElementById('entete-jeu');
  if (jeuEntete) {
    jeuEntete.textContent = (OPERATION.nom || '').trim();
    jeuEntete.hidden = !jeuEntete.textContent;
  }
  if (OPERATION.logo) {
    logo.src = OPERATION.logo;
    logo.alt = OPERATION.lieu || '';
    logo.hidden = false;
    lieuEntete.hidden = true;
  } else {
    logo.hidden = true;
    lieuEntete.textContent = (OPERATION.lieu || OPERATION.nom || '').trim();
    lieuEntete.hidden = !lieuEntete.textContent;
  }
  const mots = OPERATION.nom.trim().split(' ');
  const dernier = mots.pop();
  document.querySelector('#ecran-accueil h1').innerHTML =
    `${echap(mots.join(' '))}<br><span class="or">${echap(dernier)}</span>`;
  document.querySelector('#ecran-accueil .sous-titre').textContent = OPERATION.accroche;
  // Le nombre de questions est annoncé dès l'accueil, et il est calculé
  // depuis la liste elle-même : il ne pourra jamais mentir, même si on
  // ajoute ou retire une question un jour.
  const compte = document.getElementById('accueil-compte');
  if (compte) {
    const n = QUESTIONS.length;
    compte.textContent = enLettres(n).charAt(0).toUpperCase() + enLettres(n).slice(1) +
      ' questions rapides';
  }
  const lieu = document.getElementById('accueil-lieu');
  lieu.textContent = OPERATION.lieu || '';
  lieu.hidden = !OPERATION.lieu;

  // Le ticket à gratter porte le nom de la galerie du jour. Il était écrit
  // en dur dans le HTML : chez Duparc ou Canabady, tous les joueurs
  // grattaient un ticket au nom de Cap Sacré-Cœur.
  const ticketMention = document.getElementById('ticket-mention');
  if (ticketMention) {
    // Sous le chapiteau, ce n'est plus un ticket mais un billet
    // d'entrée : le mot fait partie du décor.
    const mot = 'Ticket';
    ticketMention.textContent = OPERATION.lieu ? mot + ' · ' + OPERATION.lieu : mot + ' surprise';
    const titreGrattage = document.getElementById('grattage-titre');
    if (titreGrattage) {
      // Le ticket ne donne plus une place sous le chapiteau : il dit
      // si c'est gagné (27/08/2026). Son titre le dit aussi.
      titreGrattage.textContent = 'Ton ticket à gratter';
    }
  }

  document.title = OPERATION.nom + ' : tente ta chance';
}

// Ampoules de fête foraine autour de la roue (une seule fois)
function creerAmpoules() {
  const cadre = document.getElementById('roue-cadre');
  if (!cadre || cadre.querySelector('.ampoule')) return;
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI;
    const amp = document.createElement('div');
    amp.className = 'ampoule';
    amp.style.left = (50 + 51.5 * Math.cos(a)) + '%';
    amp.style.top = (50 + 51.5 * Math.sin(a)) + '%';
    cadre.appendChild(amp);
  }
}

// Flocons discrets pour le thème Noël (une seule fois)
function creerFlocons() {
  const circus = document.body.classList.contains('theme-circus');
  if (!circus && !document.body.classList.contains('theme-noel')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const zone = document.getElementById('flocons');
  if (!zone || zone.childElementCount) return;
  for (let i = 0; i < 12; i++) {
    const f = document.createElement('span');
    f.className = 'flocon';
    // Sous le chapiteau, ce ne sont plus des flocons qui tombent mais
    // les paillettes dorées des projecteurs.
    f.textContent = circus ? '✦' : '❄';
    f.style.left = Math.random() * 100 + 'vw';
    f.style.fontSize = (8 + Math.random() * 10) + 'px';
    f.style.opacity = (0.25 + Math.random() * 0.4).toFixed(2);
    f.style.animationDuration = (11 + Math.random() * 14) + 's';
    f.style.animationDelay = (-Math.random() * 20) + 's';
    zone.appendChild(f);
  }
}

function operationOuverte() {
  if (!OPERATION.actif) return false;
  const aujourdhui = new Date().toISOString().slice(0, 10);
  if (OPERATION.date_debut && aujourdhui < OPERATION.date_debut) return false;
  if (OPERATION.date_fin && aujourdhui > OPERATION.date_fin) return false;
  return true;
}

// --------------------------------------------
// LOTS PAR DÉFAUT (remplacés par la table
// roue_lots de Supabase quand elle existe)
// --------------------------------------------
let LOTS = [
  { nom: "Bon d'achat 20 €",  emoji: '💶', poids: 4,  perdant: false },
  { nom: 'Place de cinéma',    emoji: '🎬', poids: 8,  perdant: false },
  { nom: 'Boisson offerte',    emoji: '🥤', poids: 22, perdant: false },
  { nom: 'Goodies de la galerie', emoji: '🧢', poids: 26, perdant: false },
  { nom: 'Surprise partenaire', emoji: '🎁', poids: 12, perdant: false },
  { nom: 'Retente demain !',   emoji: '🍀', poids: 28, perdant: true }
];

const COULEURS_SEGMENTS = ['#C9962E', '#F1ECE2', '#5A554B', '#E3B85A', '#8A8378', '#35302a'];

// --------------------------------------------
// QUESTIONS DU QUIZ (test de personnalité)
// --------------------------------------------
// Le joueur a l'impression de faire un petit test amusant sur lui-même.
// En coulisses, chaque réponse remplit les colonnes de
// roue_participations : c'est ce qui permettra d'envoyer à chacun les
// promotions de SES commerçants. La base n'a pas bougé d'un pouce.
//
// SIX ÉCRANS, LES MÊMES POUR TOUT LE MONDE (26/08/2026).
// Deux changements demandés par Romain après son essai :
//   1. plus aucune question, ni aucune proposition, ne change d'un
//      joueur à l'autre. Avant, le samedi idéal proposait six choix
//      choisis selon le genre : deux joueurs n'avaient donc pas le même
//      questionnaire, et les campagnes comparaient des réponses qui
//      n'avaient pas été posées à tout le monde ;
//   2. les réponses doivent SERVIR au commerce. Chaque trait de
//      caractère porte maintenant un rayon de boutique, et une nouvelle
//      question demande pour qui le joueur cherche un cadeau. Tout cela
//      se range dans la colonne univers (voir consoliderCiblage), sans
//      jamais poser de question commerciale à l'écran.
//
// TABLE DE CORRESPONDANCE (question à l'écran -> colonne(s) en base)
// ------------------------------------------------------------------
// 01  « Ton prénom ? »                        -> prenom
// 02  « Tu es… »                              -> genre
// 03  « Ton âge ? »                           -> age_tranche
//        ATTENTION : -18 force le consentement aux offres à « non ».
//        C'est la protection des mineurs, elle ne bouge jamais.
// 04  « Tes amis disent que tu es plutôt… »   -> style, frequence, univers
//        (plusieurs réponses) Chaque option porte un rayon :
//        élégant -> mode, coquet -> beauté, sportif -> sport,
//        gourmand -> gourmandise, curieux -> high-tech,
//        généreux -> bijoux, cocon -> maison.
//        frequence reçoit le tempérament de la PREMIÈRE réponse cochée
//        dans l'ordre de la liste (une seule valeur, c'est un
//        tempérament, pas une liste).
// 05  « Ton samedi idéal ? »                  -> univers ET enfants
//        (plusieurs réponses) LA question de ciblage : ses valeurs sont
//        les huit rayons des boutiques (mode, beaute, bijoux, sport,
//        hightech, enfants, gourmandise, maison). La réponse brute est
//        gardée dans « samedi », univers est recalculé par-dessus.
// 06  « Tu cherches un cadeau pour qui ? »    -> univers ET enfants
//        (plusieurs réponses) La question qui relie le jeu aux vitrines :
//        amoureux -> bijoux + beauté, enfants -> rayon enfants,
//        parents -> maison, amis -> gourmandise, moi -> mode.
//        « Mes enfants » remplit aussi la colonne enfants.
//        Sa colonne à elle n'existe pas en base : c'est voulu, tout
//        atterrit dans univers et enfants, rien à modifier dans Supabase.
const QUESTIONS = [
  {
    id: 'prenom', type: 'texte',
    titre: 'On t’appelle comment ?',
    soustitre: 'Ton prénom, ou ton nom de scène si tu préfères.',
    placeholder: 'Prénom ou pseudo'
  },
  {
    id: 'genre', type: 'choix',
    titre: 'Tu es…',
    options: [
      { v: 'homme', l: 'Un homme', ic: 'homme' },
      { v: 'femme', l: 'Une femme', ic: 'femme' },
      { v: 'autre', l: 'Je garde le mystère', ic: 'mystere' }
    ]
  },
  {
    // SIX TRANCHES, ET C'EST VOULU (27/08/2026, retour de Romain).
    // Elles avaient été ramenées à quatre la veille au soir pour
    // alléger l'écran. Romain a tranché en les revoyant : « je
    // préférais les tranches d'âge comme avant, même s'il y a plus
    // de choix, on s'y retrouvait mieux ». Il a raison sur le fond :
    // « 31 à 50 ans » mettait dans le même sac un jeune couple sans
    // enfant et un parent d'ados, alors que ce sont deux campagnes
    // différentes. Ne pas les réduire à nouveau.
    id: 'age_tranche', type: 'choix',
    titre: 'Ton âge ?',
    soustitre: 'Promis, on ne le dira à personne.',
    options: [
      { v: '-18',   l: 'Moins de 18 ans' },
      { v: '18-25', l: '18 à 25 ans' },
      { v: '26-35', l: '26 à 35 ans' },
      { v: '36-50', l: '36 à 50 ans' },
      { v: '51-65', l: '51 à 65 ans' },
      { v: '65+',   l: 'Plus de 65 ans' }
    ]
  },
  {
    // LE TEST DE PERSONNALITÉ, version chapiteau. Le joueur choisit son
    // rôle sur la piste ; en coulisses, chaque rôle porte un rayon de
    // boutique (champ « rayons »). Quatre rôles seulement : les deux
    // autres (le magicien, le régisseur) faisaient doublon avec les
    // rayons demandés juste après.
    id: 'style', type: 'multi',
    titre: 'Si tu montais sur la piste, tu serais…',
    soustitre: 'Plusieurs réponses possibles.',
    options: [
      { v: 'acrobate',   l: 'L’acrobate, toujours en mouvement',       ic: 'acrobate',    rayons: ['sport'],            aussi: { frequence: 'liste' } },
      { v: 'loyal',      l: 'Monsieur Loyal, tiré à quatre épingles',   ic: 'hautdeforme', rayons: ['mode'],             aussi: { frequence: 'flaner' } },
      { v: 'costumiere', l: 'La costumière, l’œil pour les paillettes', ic: 'paillettes',  rayons: ['beaute', 'bijoux'], aussi: { frequence: 'flaner' } },
      { v: 'clown',      l: 'Le clown, celui qui met l’ambiance',       ic: 'clown',       rayons: ['gourmandise'],      aussi: { frequence: 'famille' } }
    ]
  },
  {
    // LES 100 €, EN DEUX ÉCRANS DE QUATRE (26/08/2026, soirée).
    // Avant : une seule question et ses huit propositions, que personne
    // ne lisait jusqu'au bout. Maintenant deux questions courtes qui se
    // suivent comme une histoire (« et s'il t'en restait cent ? »).
    // Les huit rayons sont toujours couverts, et la PREMIÈRE case
    // cochée ici reste la priorité du joueur : c'est elle qui décide de
    // la première offre qu'on lui enverra (voir consoliderCiblage).
    id: 'envie1', type: 'multi',
    titre: 'On t’offre 100 € à dépenser dans la galerie.',
    soustitre: 'Tu files où en premier ? Plusieurs réponses possibles.',
    options: [
      { v: 'mode',        l: 'M’habiller de la tête aux pieds',  ic: 'mode',        rayons: ['mode'] },
      { v: 'beaute',      l: 'Coiffeur, institut, parfum',       ic: 'beaute',      rayons: ['beaute'] },
      { v: 'bijoux',      l: 'Un bijou, un vrai',                ic: 'bijoux',      rayons: ['bijoux'] },
      { v: 'gourmandise', l: 'Un festin, resto et gourmandises', ic: 'gourmandise', rayons: ['gourmandise'] }
    ]
  },
  {
    id: 'envie2', type: 'multi',
    titre: 'Il t’en reste 50 €.',
    soustitre: 'Tu craques sur quoi ?',
    options: [
      { v: 'hightech', l: 'Du high-tech qui fait envie',   ic: 'hightech', rayons: ['hightech'] },
      { v: 'sport',    l: 'De quoi bouger, du sport',      ic: 'sport',    rayons: ['sport'] },
      { v: 'enfants',  l: 'Des jouets pour les enfants',   ic: 'enfants',  rayons: ['enfants'] },
      { v: 'maison',   l: 'De quoi embellir la maison',    ic: 'maison',   rayons: ['maison'] }
    ]
  },
  {
    // Le samedi idéal ne redemande plus les huit rayons (les 100 €
    // viennent de le faire) : il dit avec QUI et OÙ se passe la journée.
    // C'est ce qui distingue une famille d'un couple qui flâne.
    id: 'samedi', type: 'multi',
    titre: 'Ton samedi idéal, c’est plutôt…',
    soustitre: 'Coche tout ce qui te tente.',
    options: [
      { v: 'enfants', l: 'En famille, avec les enfants', ic: 'famille', rayons: ['enfants'],     aussi: { frequence: 'famille' } },
      { v: 'mode',    l: 'Flâner entre amis',            ic: 'amis',    rayons: ['mode'] },
      { v: 'sport',   l: 'Dehors, à bouger',              ic: 'dehors',  rayons: ['sport'] },
      { v: 'maison',  l: 'Au calme, à la maison',         ic: 'maison',  rayons: ['maison'] }
    ]
  },
  // LA QUESTION « TU OFFRES UN CADEAU À QUI ? » A ÉTÉ RETIRÉE
  // (27/08/2026, Romain : « tu peux l'enlever maintenant »). Le quiz
  // tient donc en sept écrans. Le ciblage ne perd presque rien : les
  // rayons qu'elle apportait (bijoux, beauté, enfants, maison) sont
  // déjà couverts par les deux questions des 100 €. Seule la colonne
  // « enfants » repose maintenant sur le seul samedi idéal, ce qui
  // suffit : c'est la même information, dite autrement.
];

// LES COLONNES LIÉES D'UNE QUESTION À CHOIX MULTIPLE
// --------------------------------------------------
// Certaines réponses remplissent une deuxième colonne (champ « aussi »).
// RÈGLE : la PREMIÈRE réponse cochée dans l'ordre de la liste affichée
// fait foi. Elle est stable (elle ne dépend pas de l'ordre des doigts
// du joueur), elle se recalcule à l'identique quand on revient en
// arrière, et elle n'écrit qu'UNE valeur dans la colonne : le schéma de
// la base n'est pas touché.
function appliquerColonnesLiees(q) {
  if (!q || !q.options) return;
  const cochees = String(reponses[q.id] || '').split(',').filter(Boolean);
  if (!cochees.length) return;
  const premiere = q.options.filter(o => cochees.indexOf(o.v) !== -1)[0];
  if (premiere && premiere.aussi) {
    Object.keys(premiere.aussi).forEach(k => { reponses[k] = premiere.aussi[k]; });
  }
}

// LE CIBLAGE : ce que le joueur a dit de lui devient des rayons.
// -------------------------------------------------------------
// La colonne « univers » est la liste des rayons qui intéressent le
// joueur. Elle est nourrie par trois sources, dans cet ordre :
//   1. le samedi idéal (la question de ciblage elle-même) ;
//   2. les traits de caractère cochés (champ « rayons » des options) ;
//   3. les personnes pour qui il cherche un cadeau.
// Résultat : un joueur qui n'a jamais répondu à une question
// commerciale se voit quand même proposer les bonnes promotions.
// La première case cochée d'une question, dans l'ordre où les
// propositions sont affichées : une valeur stable, qui se recalcule à
// l'identique quand le joueur revient en arrière.
function premierRayonCoche(idQuestion) {
  const q = QUESTIONS.filter(x => x.id === idQuestion)[0];
  if (!q || !q.options) return '';
  const cochees = String(reponses[idQuestion] || '').split(',').filter(Boolean);
  if (!cochees.length) return '';
  const premiere = q.options.filter(o => cochees.indexOf(o.v) !== -1)[0];
  return premiere ? premiere.v : '';
}

function consoliderCiblage() {
  // On repart TOUJOURS des cases réellement cochées au samedi idéal :
  // ainsi, un joueur qui revient en arrière et décoche une réponse voit
  // le ciblage se recalculer, au lieu de garder un rayon fantôme.
  const rayons = new Set((reponses.samedi || '').split(',').filter(Boolean));
  QUESTIONS.forEach(q => {
    if (!q.options || q.id === 'samedi') return;
    const cochees = String(reponses[q.id] || '').split(',').filter(Boolean);
    if (!cochees.length) return;
    q.options.forEach(o => {
      if (o.rayons && cochees.indexOf(o.v) !== -1) o.rayons.forEach(r => rayons.add(r));
    });
  });
  // LA PRIORITÉ DU JOUEUR (26/08/2026, soirée).
  // Les 100 € tiennent maintenant sur deux écrans à cases à cocher.
  // La priorité, c'est la PREMIÈRE case cochée du premier écran (dans
  // l'ordre affiché, pas dans l'ordre des doigts), et à défaut celle du
  // second. Elle décide de la première offre qu'on enverra au joueur.
  reponses.envie = premierRayonCoche('envie1') || premierRayonCoche('envie2') || '';
  const priorite = reponses.envie;
  const liste = Array.from(rayons);
  if (priorite && liste.indexOf(priorite) > 0) {
    liste.splice(liste.indexOf(priorite), 1);
    liste.unshift(priorite);
  }
  reponses.univers = liste.join(',');
}

// Le foyer se déduit du samedi idéal : « en famille, avec les
// enfants ». La question des cadeaux, qui l'alimentait aussi, a été
// retirée le 27/08/2026.
function deduireFoyer() {
  const gouts = (reponses.samedi || '').split(',');
  reponses.enfants = gouts.indexOf('enfants') !== -1 ? 'oui' : 'non';
}

// --------------------------------------------
// ÉTAT
// --------------------------------------------
const reponses = {};
let questionActuelle = 0;
let lotGagne = null;
let codeLot = null;

// --------------------------------------------
// NAVIGATION ENTRE ÉCRANS
// --------------------------------------------
// L'écran arrive par la droite quand on avance dans le parcours,
// par la gauche quand on revient en arrière. Le joueur sent la
// direction du parcours sans qu'on ait besoin de la lui écrire.
function afficherEcran(id, sens) {
  document.querySelectorAll('.ecran').forEach(e => {
    e.classList.remove('actif', 'recule');
  });
  const ecran = document.getElementById(id);
  if (sens === 'arriere') ecran.classList.add('recule');
  ecran.classList.add('actif');
  // L'écran d'accueil porte déjà le nom du jeu en très grand : l'en-tête
  // n'y répète pas la ligne dorée, elle reviendra dès l'écran suivant.
  document.body.classList.toggle('sur-accueil', id === 'ecran-accueil');
  window.scrollTo(0, 0);
  // L'écran devient le point de lecture : les lecteurs d'écran suivent.
  const titre = ecran.querySelector('h1, h2');
  if (titre) {
    titre.setAttribute('tabindex', '-1');
    try { titre.focus({ preventScroll: true }); } catch (e) { /* sans importance */ }
  }
}

// --------------------------------------------
// QUIZ
// --------------------------------------------
// Les nombres en toutes lettres, pour les phrases du joueur. Ils sont
// toujours calculés depuis QUESTIONS.length : impossible d'annoncer un
// nombre de questions différent de celui qu'il y a vraiment.
const EN_LETTRES = ['zéro', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit'];

function enLettres(n) { return EN_LETTRES[n] || String(n); }

// Le décompte affiché en haut de l'écran de question.
function compteRebours() {
  const reste = QUESTIONS.length - questionActuelle;
  if (reste === 1) return '<strong>Dernière question</strong>';
  if (reste === 2) return 'Plus que <strong>2</strong> questions';
  if (reste === 3) return 'Plus que <strong>3</strong> questions';
  return 'Encore <strong>' + reste + '</strong> questions';
}

function afficherQuestion() {
  const q = QUESTIONS[questionActuelle];
  document.getElementById('barre-progression').style.width =
    Math.round(((questionActuelle + 1) / QUESTIONS.length) * 100) + '%';
  // Un décompte qui rassure au lieu d'informer : le joueur voit la fin
  // arriver. « 3 / 5 » ne disait rien à personne.
  document.getElementById('quiz-compteur').innerHTML = compteRebours();
  document.getElementById('btn-question-retour').disabled = questionActuelle === 0;
  document.getElementById('question-titre').textContent = q.titre;
  // Numéro de chapitre affiché en très grand à côté de la question (01, 02...)
  document.getElementById('question-titre')
    .setAttribute('data-num', String(questionActuelle + 1).padStart(2, '0'));
  document.getElementById('question-soustitre').textContent = q.soustitre || '';

  const zoneOptions = document.getElementById('question-options');
  const zoneTexte = document.getElementById('question-texte-zone');
  const zoneMulti = document.getElementById('question-multi-zone');
  zoneOptions.innerHTML = '';
  zoneMulti.hidden = true;

  if (q.type === 'texte') {
    zoneOptions.hidden = true;
    zoneTexte.hidden = false;
    zoneMulti.hidden = true;
    const input = document.getElementById('question-texte-input');
    input.value = reponses[q.id] || '';
    input.placeholder = q.placeholder || '';
    input.focus();
  } else {
    zoneTexte.hidden = true;
    zoneOptions.hidden = false;
    const multiple = q.type === 'multi';
    const choisies = multiple ? new Set((reponses[q.id] || '').split(',').filter(Boolean)) : null;

    q.options.forEach((opt, index) => {
      const btn = document.createElement('button');
      btn.className = 'option';
      const lettre = String.fromCharCode(65 + index);
      // L'ICÔNE DE LA RÉPONSE (26/08/2026)
      // Chaque proposition porte son petit dessin au trait : c'est ce
      // qui fait la différence entre un formulaire et un test de
      // magazine. Une réponse sans dessin (les tranches d'âge) garde
      // simplement sa lettre ou sa case, l'écran ne bouge pas.
      const dessin = (opt.ic && typeof iconeQuiz === 'function') ? iconeQuiz(opt.ic) : '';
      if (dessin) btn.classList.add('option-avec-icone');
      btn.innerHTML = multiple
        ? `<span class="coche" aria-hidden="true"></span>${dessin}<span>${opt.l}</span>`
        : `${dessin || `<span class="puce">${lettre}</span>`}<span>${opt.l}</span>`;
      if (multiple && choisies.has(opt.v)) btn.classList.add('choisie');
      // Retour en arrière : on remontre ce qui avait été répondu
      if (!multiple && reponses[q.id] === opt.v) btn.classList.add('choisie');

      btn.addEventListener('click', () => {
        if (multiple) {
          // On coche ou décoche, sans quitter la question
          if (choisies.has(opt.v)) { choisies.delete(opt.v); btn.classList.remove('choisie'); }
          else { choisies.add(opt.v); btn.classList.add('choisie'); }
          reponses[q.id] = Array.from(choisies).join(',');
          majBoutonMulti(choisies.size);
        } else {
          reponses[q.id] = opt.v;
          // Certaines réponses remplissent une deuxième colonne :
          // c'est ce qui permet de tenir en cinq questions.
          if (opt.aussi) Object.keys(opt.aussi).forEach(k => { reponses[k] = opt.aussi[k]; });
          btn.classList.add('choisie');
          setTimeout(questionSuivante, 220);
        }
      });
      btn.style.animationDelay = (0.10 + index * 0.055) + 's';
      zoneOptions.appendChild(btn);
    });

    zoneMulti.hidden = !multiple;
    if (multiple) majBoutonMulti(choisies.size);
  }
}

// Bouton de validation des questions à choix multiples
function majBoutonMulti(nombre) {
  const btn = document.getElementById('btn-multi-suivant');
  btn.disabled = nombre === 0;
  const q = QUESTIONS[questionActuelle];
  const total = q.options ? q.options.length : 0;
  if (nombre === 0) { btn.textContent = 'Choisis au moins une réponse'; return; }
  if (nombre === total) { btn.textContent = 'Carrément tout ? On continue'; return; }
  btn.textContent = nombre === 1 ? 'Continuer' : 'Continuer (' + nombre + ' choix)';
}

// Revenir sur la question précédente : personne ne doit rester coincé
// sur une réponse cochée par erreur.
function questionPrecedente() {
  if (questionActuelle === 0) return;
  questionActuelle--;
  document.getElementById('ecran-quiz').classList.add('recule');
  afficherQuestion();
  vibrer(12);
  setTimeout(() => document.getElementById('ecran-quiz').classList.remove('recule'), 500);
}
document.getElementById('btn-question-retour').addEventListener('click', questionPrecedente);

// Depuis l'écran des coordonnées, on peut revenir corriger sa dernière réponse
document.getElementById('btn-coordonnees-retour').addEventListener('click', () => {
  questionActuelle = QUESTIONS.length - 1;
  afficherEcran('ecran-quiz', 'arriere');
  afficherQuestion();
});

function questionSuivante() {
  // Chaque réponse peut porter un rayon de boutique : on recalcule le
  // ciblage à chaque pas, jamais en cumulant (voir consoliderCiblage).
  consoliderCiblage();
  deduireFoyer();
  questionActuelle++;
  if (questionActuelle < QUESTIONS.length) {
    afficherQuestion();
  } else {
    document.getElementById('barre-progression').style.width = '100%';
    adapterCoordonneesMineur();
    // LES BONS PLANS SE DEMANDENT ICI (26/08/2026, demande de Romain).
    // Avant, la question tombait après la saisie de l'adresse : le
    // joueur avait déjà donné son mail, il n'avait plus rien à gagner à
    // dire oui. Maintenant elle arrive juste après le test, quand il
    // vient de dire ce qu'il aime, et avant qu'on lui demande quoi que
    // ce soit. Un joueur mineur ne voit jamais cet écran.
    proposerLesOffres(() => afficherEcran('ecran-coordonnees'));
  }
}

// Les offres par e-mail sont réservées aux majeurs : pour un joueur
// mineur, la case offres est masquée et ne peut pas être cochée.
function adapterCoordonneesMineur() {
  // Les offres par e-mail ne sont proposées qu'aux majeurs, et
  // juste après cet écran, avant les jeux (voir proposerLesOffres).
  const mineur = reponses.age_tranche === '-18';
  if (mineur) reponses.consentement_marketing = false;

  // La mention d'information doit dire la vérité à chacun : un mineur ne
  // se verra jamais proposer les offres, la phrase qui les annonce n'a
  // donc pas à figurer sur son écran.
  const texte = document.getElementById('mention-donnees-texte');
  if (texte) {
    texte.textContent = mineur
      ? 'Tes réponses et ton e-mail sont utilisés par Pull Up Événements (Le Tampon) pour gérer le jeu et te remettre ton lot, rien d’autre. Tu ne recevras aucune offre par e-mail : c’est réservé aux joueurs majeurs. Données supprimées au plus tard un an après l’opération, jamais vendues.'
      : 'Tes réponses et ton e-mail sont utilisés par Pull Up Événements (Le Tampon) pour gérer le jeu et te remettre ton lot. Tu viens de choisir librement si tu voulais aussi recevoir les bons plans des commerçants : ce choix ne change rien à ta participation, et tu peux en changer quand tu veux. Données conservées un an après l’opération, ou trois ans si tu acceptes de recevoir les offres. Jamais vendues.';
  }
}

document.getElementById('btn-texte-suivant').addEventListener('click', () => {
  const q = QUESTIONS[questionActuelle];
  const val = document.getElementById('question-texte-input').value.trim();
  if (!val) return;
  reponses[q.id] = val;
  questionSuivante();
});
document.getElementById('btn-multi-suivant').addEventListener('click', () => {
  const q = QUESTIONS[questionActuelle];
  if (!reponses[q.id]) return;
  // Une réponse cochée peut remplir une deuxième colonne (le tempérament
  // derrière « tes amis disent que tu es plutôt… ») : c'est la première
  // cochée dans l'ordre de la liste qui fait foi. Voir la fonction.
  appliquerColonnesLiees(q);
  questionSuivante();
});

document.getElementById('question-texte-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-texte-suivant').click();
});

// --------------------------------------------
// TIRAGE DU LOT (pondéré)
// --------------------------------------------
// LE TAUX DE GAGNANTS : un seul chiffre, réglable par opération
// -------------------------------------------------------------
// Romain, 25/08/2026 : « il y aura beaucoup, beaucoup de joueurs et pas
// autant de cadeaux, il faudra souvent que ce soit perdant ».
//
// Avant, la part de gagnants était le résultat indirect des poids des
// lots : chez Cap Sacré-Cœur, 72 points de lots gagnants contre 28 de
// lot perdant, soit 72 % de gagnants. Personne ne pouvait le lire sans
// faire l'addition, et corriger le taux demandait de retoucher huit
// lignes de lots à la main.
//
// Désormais le tirage se fait en DEUX temps :
//   1. gagnant ou perdant, selon le seul taux de l'opération ;
//   2. quel lot, en pondérant à l'intérieur de la famille choisie.
// Les poids des lots gardent donc tout leur sens (une viennoiserie
// sort plus souvent qu'un bon de 10 €), mais ils ne décident plus du
// nombre de cadeaux distribués. Un seul chiffre le décide.
//
// EN BASE : colonne taux_gagnants de roue_operations (le SQL est à la
// fin de CREER-TABLES-ROUE.sql, il n'a PAS été exécuté). Tant que la
// colonne n'existe pas, le repli ci-dessous s'applique et rien ne
// casse.
//
// POURQUOI 25 % PAR DÉFAUT : un joueur sur quatre repart avec un
// cadeau. C'est le milieu de la fourchette demandée (20 à 30 %), c'est
// un chiffre que l'hôtesse peut annoncer sans mentir (« environ un sur
// quatre »), et c'est la limite basse à partir de laquelle l'attente
// reste crédible : en dessous de 20 %, la file d'attente voit trop de
// perdants d'affilée et le jeu s'essouffle tout seul.
const TAUX_GAGNANTS_DEFAUT = 25;

function tauxGagnants() {
  const brut = OPERATION.taux_gagnants;
  // Colonne absente, vide ou nulle : on ne suppose SURTOUT pas zéro,
  // ce serait une opération sans aucun cadeau sans que personne ne
  // l'ait demandé. On reprend le taux par défaut.
  if (brut === undefined || brut === null || brut === '') return TAUX_GAGNANTS_DEFAUT;
  const n = Number(brut);
  if (!isFinite(n) || n < 0 || n > 100) return TAUX_GAGNANTS_DEFAUT;
  return n;
}

// Tirage pondéré à l'intérieur d'une famille de lots
function tirerDansListe(liste) {
  const total = liste.reduce((s, l) => s + l.poids, 0);
  if (total <= 0) return liste[Math.floor(Math.random() * liste.length)];
  let r = Math.random() * total;
  for (let i = 0; i < liste.length; i++) {
    r -= liste[i].poids;
    if (r <= 0) return liste[i];
  }
  return liste[liste.length - 1];
}

// LE RÉSULTAT FORCÉ DES DÉMONSTRATIONS (27/08/2026, pour Mercialys) :
// « ?resultat=gagne » ou « ?resultat=perdu » dans le lien force le
// tirage de la page. UNIQUEMENT sur la version d'essai (github.io) :
// sur un vrai domaine, VERSION_ESSAI est faux, le paramètre est ignoré
// et c'est le serveur qui tire, comme toujours. Aucune triche possible
// en galerie.
function resultatForce() {
  if (!PARTIES_ILLIMITEES) return null;
  const v = new URLSearchParams(location.search).get('resultat');
  if (v === 'gagne') return true;
  if (v === 'perdu') return false;
  return null;
}

function tirerLot() {
  const actifs = LOTS.filter(l => l.poids > 0);
  const gagnants = actifs.filter(l => !l.perdant);
  const perdants = actifs.filter(l => l.perdant);

  const force = resultatForce();
  if (force === true && gagnants.length) {
    // La démonstration gagnante montre TOUJOURS le même lot : les
    // samoussas chez Taïlu (choix de Romain). Une démo doit être
    // prévisible. Si ce lot disparaît de la liste, le premier gagnant
    // prend le relais.
    const demo = gagnants.filter(l => l.commercant === 'Taïlu')[0];
    return demo || gagnants[0];
  }
  if (force === false && perdants.length) return tirerDansListe(perdants);

  // Filets : une opération mal remplie ne doit jamais planter.
  if (!gagnants.length) return perdants[0] || actifs[0] || LOTS[0];
  // Aucun lot perdant configuré : on ne peut pas faire perdre quelqu'un
  // sans lui montrer un segment de roue qui n'existe pas. Tout le monde
  // gagne, comme avant, et c'est à la galerie d'ajouter son lot perdant.
  if (!perdants.length) return tirerDansListe(gagnants);

  // Le taux de l'opération, et lui seul : aucun bonus ne le modifie
  // plus (voir le bloc « LE BILLET D'ENTRÉE N'INVENTE PLUS DE BONUS »).
  // Le tirage de la page doit donner exactement le même résultat que
  // celui du serveur, sinon les chiffres annoncés aux galeries sont faux.
  const taux = tauxGagnants();

  const gagne = Math.random() * 100 < taux;
  return tirerDansListe(gagne ? gagnants : perdants);
}

// Le code court du bon (PU-XXXXXX). Il sert aussi de clé pour retrouver
// la ligne du joueur en base : il ne doit donc être ni devinable, ni
// tomber deux fois sur la même valeur au cours de l'opération.
// 6 caractères sur 31 possibles = plus de 880 millions de combinaisons
// (contre 923 000 avec 4 caractères, où deux joueurs d'une même galerie
// finissaient statistiquement par partager le même code).
function genererCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const LONGUEUR = 6;
  let c = '';
  try {
    // Tirage cryptographique : impossible à rejouer en devinant la graine.
    const brut = new Uint32Array(LONGUEUR);
    crypto.getRandomValues(brut);
    for (let i = 0; i < LONGUEUR; i++) c += chars[brut[i] % chars.length];
  } catch (e) {
    // Très vieux navigateur : on retombe sur l'ancien tirage.
    for (let i = 0; i < LONGUEUR; i++) c += chars[Math.floor(Math.random() * chars.length)];
  }
  return 'PU-' + c;
}

// --------------------------------------------
// ENREGISTREMENT SUPABASE
// --------------------------------------------
// Le lot annoncé par le serveur remplace celui que la page avait tiré
// pour l'animation. On retrouve l'objet exact de la liste LOTS, car la
// roue et les autres jeux en ont besoin pour placer le bon segment.
function appliquerLotServeur(reponse) {
  let lot = LOTS.filter(l => l.nom === reponse.lot)[0];
  if (!lot) {
    // Filet : un lot ajouté en base pendant la partie. On l'ajoute à la
    // liste pour que l'animation puisse quand même le désigner.
    lot = {
      nom: reponse.lot,
      emoji: reponse.emoji || '🎁',
      poids: 0,
      perdant: !!reponse.perdant,
      commercant: commercantPresentable(reponse.commercant)
    };
    LOTS = LOTS.concat([lot]);
  }
  lotGagne = lot;
  codeLot = reponse.code;
}

// C'est le SERVEUR qui tire le lot et fabrique le code du bon.
// La page envoie seulement les réponses au quiz : elle ne décide plus
// de rien. Modifier une variable dans la console du navigateur change
// l'animation, plus jamais ce qui est écrit en base.
// Si le serveur ne répond pas (4G capricieuse en galerie, fonction pas
// encore installée), on retombe sur l'ancien chemin : la page garde le
// lot qu'elle avait tiré et l'enregistre elle-même. Le joueur n'est
// jamais bloqué.
async function tirageServeur() {
  try {
    const { data, error } = await sb.rpc('roue_jouer', {
      p_evenement: EVENEMENT,
      p_reponses: {
        prenom: reponses.prenom || '',
        genre: reponses.genre || '',
        age_tranche: reponses.age_tranche || '',
        enfants: reponses.enfants || '',
        style: reponses.style || '',
        univers: reponses.univers || '',
        frequence: reponses.frequence || '',
        email: reponses.email || '',
        telephone: reponses.telephone || ''
      }
    });
    if (error) {
      console.warn('Tirage serveur indisponible :', error.message || error);
      return null;
    }
    if (data && data.statut === 'ok') { appliquerLotServeur(data); return 'ok'; }
    if (data && data.statut === 'deja-joue') return 'deja-joue';
    // 'ferme', 'email', 'sans-lot' : on laisse l'ancien chemin décider
    return null;
  } catch (e) {
    console.warn('Tirage serveur injoignable :', e && e.message);
    return null;
  }
}

async function enregistrerParticipation() {
  // Résultat forcé (démonstration) : on ne passe PAS par le serveur.
  // Son tirage écraserait le résultat demandé, et une partie de
  // démonstration n'a rien à écrire dans la base.
  if (resultatForce() !== null) return null;

  // D'abord la porte unique du serveur. Elle fait tout : tirage, code,
  // verrou du jour, enregistrement.
  const cote_serveur = await tirageServeur();
  if (cote_serveur) return cote_serveur;

  // Repli : le serveur n'a pas répondu, la page enregistre elle-même
  // le lot qu'elle avait tiré (c'est aussi ce qui permet au filet
  // anti-panne réseau de continuer à fonctionner).
  const participation = {
    evenement: EVENEMENT,
    prenom: reponses.prenom || null,
    genre: reponses.genre || null,
    age_tranche: reponses.age_tranche || null,
    enfants: reponses.enfants || null,
    style: reponses.style || null,
    univers: reponses.univers || null,
    frequence: reponses.frequence || null,
    email: reponses.email,
    telephone: reponses.telephone || null,
    // Le consentement aux offres est demandé AVANT les jeux depuis le
    // 25/08/2026 : la vraie réponse du joueur part donc directement
    // dans cette ligne, au lieu d'un « non » par défaut rattrapé plus
    // tard par une fonction serveur qui n'existe pas encore.
    consentement_marketing: reponses.consentement_marketing === true,
    lot: lotGagne.nom,
    // Le code est TOUJOURS enregistre, gagnant ou non : c'est lui qui
    // sert de cle pour retrouver la ligne du joueur ensuite (reponse aux
    // offres, merci). Avant, les perdants avaient un code vide et leur
    // reponse aux offres n'etait jamais enregistree. C'est la colonne
    // gagnant qui distingue les deux cas, pas le code.
    code_lot: codeLot,
    gagnant: !lotGagne.perdant
  };

  let error;
  try {
    ({ error } = await sb.from('roue_participations').insert([participation]));
  } catch (e) {
    error = { message: String(e && e.message || e), reseau: true };
  }

  if (!error) return 'ok';
  if (error.code === '23505') return 'deja-joue';

  // Coupure réseau (4G capricieuse en galerie) : on garde la participation
  // sur le téléphone, elle sera renvoyée automatiquement plus tard.
  if (error.reseau || /fetch|network|load failed/i.test(error.message || '')) {
    mettreEnAttente(participation);
    return 'ok';
  }

  // Table pas encore créée (ou autre souci) : on laisse jouer en mode démo
  console.warn('Enregistrement impossible :', error);
  modeDemo = true;
  document.getElementById('badge-demo').hidden = false;
  // Les deux mentions se posent au même endroit : on remonte celle du
  // mode test pour qu'elles ne se chevauchent pas.
  const badgeTest = document.getElementById('badge-test');
  if (badgeTest) badgeTest.style.bottom = '48px';
  return 'demo';
}

// --------------------------------------------
// FILET ANTI-PANNE : participations en attente
// --------------------------------------------
// La 4G est capricieuse dans une galerie couverte. Quand l'enregistrement
// échoue, la participation est gardée sur le téléphone et renvoyée toute
// seule dès que le réseau revient. Le joueur ne voit rien : il a son lot,
// et son adresse n'est pas perdue pour autant.
const CLE_ATTENTE = 'roue_participations_attente';

// La date du jour telle que la base la calcule, au fuseau de La Réunion.
// Une participation renvoyée le lendemain doit garder SA date d'origine :
// sinon elle prendrait la date du renvoi, ce qui fausserait les comptages
// par journée et, plus grave, occuperait le verrou « une partie par jour »
// de la journée en cours, empêchant le joueur de rejouer ce jour-là.
function jourReunion(date) {
  const d = date || new Date();
  try {
    // en-CA donne directement le format aaaa-mm-jj attendu par la base.
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Indian/Reunion' }).format(d);
  } catch (e) {
    // Très vieux téléphone sans fuseaux : La Réunion est à UTC+4.
    return new Date(d.getTime() + 4 * 3600000).toISOString().slice(0, 10);
  }
}

function mettreEnAttente(participation) {
  try {
    const attente = purgerAttente(JSON.parse(localStorage.getItem(CLE_ATTENTE) || '[]'));
    attente.push(Object.assign({}, participation, {
      jour: jourReunion(),
      created_at: new Date().toISOString()
    }));
    localStorage.setItem(CLE_ATTENTE, JSON.stringify(attente.slice(-50)));
  } catch (e) { console.warn(e); }
  programmerRenvoi();
}

// LES DONNÉES D'UN JOUEUR NE DORMENT PAS SUR LE TÉLÉPHONE (26/08/2026)
// --------------------------------------------------------------------
// La file d'attente sert à ne perdre aucune participation quand la 4G
// lâche en galerie : elle garde donc, en clair, le prénom, l'adresse
// e-mail et parfois le téléphone du joueur. C'est acceptable le temps
// de la renvoyer ; ça ne l'est plus des semaines après, surtout sur une
// tablette d'hôtesse utilisée par des centaines de personnes.
// Au-delà de sept jours, une participation ne sera de toute façon plus
// acceptée (le verrou du jour porte sur sa date) : on l'efface.
const ATTENTE_JOURS_MAX = 7;

function purgerAttente(liste) {
  if (!Array.isArray(liste)) return [];
  const limite = Date.now() - ATTENTE_JOURS_MAX * 86400000;
  return liste.filter(p => {
    const t = Date.parse(p && p.created_at);
    return isNaN(t) ? false : t >= limite;
  });
}

// La base ne connaît pas encore une des colonnes envoyées : mieux vaut
// renvoyer la participation sans sa date d'origine que de la laisser
// prisonnière du téléphone.
function colonneInconnue(error) {
  if (!error) return false;
  if (error.code === '42703' || error.code === 'PGRST204') return true;
  return /column|could not find/i.test(error.message || '');
}

let renvoiEnCours = false;

async function renvoyerAttente() {
  if (renvoiEnCours) return;
  let attente;
  try { attente = purgerAttente(JSON.parse(localStorage.getItem(CLE_ATTENTE) || '[]')); }
  catch (e) { return; }
  if (!attente.length) {
    // La purge a pu vider la file : on nettoie aussi ce qui est écrit
    // sur le téléphone, au lieu d'y laisser des adresses périmées.
    try { localStorage.removeItem(CLE_ATTENTE); } catch (e) { /* sans importance */ }
    annulerRenvoi();
    return;
  }
  // Réseau coupé : inutile de réveiller la radio du téléphone pour rien,
  // on retentera au retour du réseau ou à la prochaine relance.
  if (navigator.onLine === false) { programmerRenvoi(); return; }

  renvoiEnCours = true;
  const restantes = [];
  try {
    for (const p of attente) {
      try {
        let reponse = await sb.from('roue_participations').insert([p]);
        if (reponse.error && colonneInconnue(reponse.error)) {
          const sansDate = Object.assign({}, p);
          delete sansDate.jour;
          delete sansDate.created_at;
          reponse = await sb.from('roue_participations').insert([sansDate]);
        }
        // Succès ou doublon (déjà comptée) : on la retire. Sinon on garde.
        if (reponse.error && reponse.error.code !== '23505') restantes.push(p);
      } catch (e) {
        restantes.push(p);
      }
    }
    try { localStorage.setItem(CLE_ATTENTE, JSON.stringify(restantes)); }
    catch (e) { console.warn(e); }
  } finally {
    renvoiEnCours = false;
  }

  if (restantes.length) programmerRenvoi();
  else annulerRenvoi();
}

// Tant qu'il reste quelque chose à envoyer, on retente, de plus en plus
// espacé : 20 s, 40 s, 1 min 20, 2 min 40, puis toutes les 5 minutes. Le
// joueur reste souvent plusieurs minutes sur l'écran de son lot, ce qui
// suffit largement à rattraper une coupure passagère.
const ATTENTE_RENVOI_DEPART = 20000;
const ATTENTE_RENVOI_MAX = 300000;
let minuterieRenvoi = null;
let attenteRenvoi = ATTENTE_RENVOI_DEPART;

function programmerRenvoi() {
  if (minuterieRenvoi) return;
  minuterieRenvoi = setTimeout(() => {
    minuterieRenvoi = null;
    attenteRenvoi = Math.min(attenteRenvoi * 2, ATTENTE_RENVOI_MAX);
    renvoyerAttente();
  }, attenteRenvoi);
}

function annulerRenvoi() {
  if (minuterieRenvoi) { clearTimeout(minuterieRenvoi); minuterieRenvoi = null; }
  attenteRenvoi = ATTENTE_RENVOI_DEPART;
}

// Le réseau revient : on tente tout de suite, sans attendre la relance.
window.addEventListener('online', () => { annulerRenvoi(); renvoyerAttente(); });
// Le joueur revient sur l'onglet (il était sorti chercher du réseau,
// ou le téléphone sortait de veille) : nouvelle tentative.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) renvoyerAttente();
});

// --------------------------------------------
// LE TICKET À GRATTER
// Premier jeu, avant la roue. Il révèle un bonus
// ou simplement le droit de faire tourner la roue.
// --------------------------------------------
// Les poids font 100 en tout. Le bonus « une entrée au grand tirage »
// (14 %) a disparu le 25/08/2026 avec le grand tirage lui-même : ses 14
// points ont été répartis sur les deux bonus qui restent, plutôt que
// LE BILLET D'ENTRÉE N'INVENTE PLUS DE BONUS (26/08/2026)
// ---------------------------------------------------------
// Ce que le ticket révélait jusqu'ici : « Chance doublée », pour un
// joueur sur quatre. Deux problèmes, tous les deux graves.
//
//   1. ÇA NE DOUBLAIT RIEN. Le bonus n'agissait que sur le tirage fait
//      par la page (tirerLot). Or, en service, c'est le SERVEUR qui
//      tire le lot (fonction roue_jouer), et il ne connaît pas ce
//      bonus : il applique le taux de l'opération, un point c'est tout.
//      Un quart des joueurs lisait donc une promesse sans effet, et le
//      taux réel annoncé aux galeries (31,5 %) était faux.
//   2. PERSONNE NE COMPRENAIT CE QU'IL GAGNAIT. Romain, en jouant le
//      26/08 : « le grattage fait gagner quelque chose, mais on ne sait
//      pas trop quoi ».
//
// Le billet dit maintenant la vérité, et rien d'autre : il donne une
// place sous le chapiteau et annonce le programme du joueur. Aucune
// promesse, donc aucune promesse à tenir.
//
// POUR REMETTRE UN VRAI BONUS UN JOUR : il faut que le SERVEUR le tire
// et l'applique, dans roue_jouer. Tant que ce n'est pas fait, aucun
// avantage annoncé ici n'aura le moindre effet sur les chances réelles.
// Ne pas retomber dans ce piège.

// LE TICKET DIT LE RÉSULTAT (27/08/2026, Romain)
// ----------------------------------------------
// Avant : un numéro de place et la liste des jeux à venir. Romain :
// « sur le ticket qu'on gratte, il faut juste savoir si c'est gagné ou
// perdu, avec un petit mot sympa », et « que ça n'annonce pas les jeux
// qu'il va y avoir ». Le ticket devient donc un petit jeu à lui tout
// seul : on gratte, on sait.
//
// CE QUE ÇA CHANGE POUR LA SUITE, et c'est voulu : les manches qui
// suivent ne décident plus de rien aux yeux du joueur, elles servent à
// découvrir CE QU'IL a gagné. Le lot, lui, était déjà tiré par le
// serveur avant le grattage : le ticket ne fait que lire un résultat
// écrit, il n'en invente aucun.
//
// Les phrases sont écrites pour que personne ne se sente puni : le
// perdant lit une invitation à revenir, jamais un reproche.
// LE TICKET PERD TOUJOURS (27/08/2026, Romain : « fais perdre
// toujours le ticket à gratter »). C'est le faux départ voulu de la
// soirée : le ticket dit non, et la partie rebondit aussitôt sur les
// cinq manches qui suivent. Le vrai résultat, lui, est déjà tiré par
// le serveur : c'est la DERNIÈRE manche qui le révèle.
// Les phrases sont écrites pour relancer, jamais pour clore : un
// ticket qui dirait « c'est fini » à un joueur qui va peut-être
// gagner serait un mensonge dans l'autre sens.
const MOTS_TICKET_PERDU = [
  'Le ticket dit non… mais la partie ne fait que commencer.',
  'Rien sous le doigt. Tout reste à jouer.',
  'Perdu pour le ticket. La suite se joue sur la piste.',
  'Ce ticket-là ne donne rien. Les jeux, eux, t’attendent.'
];

function motAuHasard(liste) {
  return liste[Math.floor(Math.random() * liste.length)];
}

function contenuDuBillet() {
  return {
    gagnant: false,
    texte: 'Perdu…',
    detail: motAuHasard(MOTS_TICKET_PERDU)
  };
}

let bonusGrattage = null;
let toursRestants = 1;

// Le contenu du billet est fabriqué avant la partie, comme l'était le
// bonus : il est prêt quand le joueur gratte, et il ne change plus.
function preparerBonus() {
  bonusGrattage = contenuDuBillet();
  toursRestants = 1;
}

function preparerGrattage() {
  if (!bonusGrattage) preparerBonus();
  const zoneResultat = document.getElementById('ticket-resultat');
  zoneResultat.textContent = bonusGrattage.texte;
  // Le mot « Gagné » se lit en or, « Perdu » reste sobre : la couleur
  // dit déjà la nouvelle avant qu'on ait fini de lire.
  zoneResultat.classList.toggle('ticket-gagne', bonusGrattage.gagnant === true);
  zoneResultat.classList.toggle('ticket-perdu', bonusGrattage.gagnant === false);
  document.getElementById('ticket-detail').textContent = bonusGrattage.detail;
  document.getElementById('btn-grattage-suite').hidden = true;
  document.getElementById('grattage-consigne').textContent =
    'Gratte pour voir ce qu’il y a dessous.';

  const voile = document.getElementById('ticket-voile');
  voile.classList.remove('efface');
  const ctx = voile.getContext('2d');
  const L = voile.width, H = voile.height;

  // Le voile doré à gratter
  const fond = ctx.createLinearGradient(0, 0, L, H);
  fond.addColorStop(0, '#EFC368');
  fond.addColorStop(0.45, '#C9962E');
  fond.addColorStop(1, '#9a6f1c');
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = fond;
  ctx.fillRect(0, 0, L, H);

  // Métal brossé : de fines rayures obliques, comme sur un vrai ticket
  ctx.save();
  ctx.lineWidth = 1;
  for (let x = -H; x < L + H; x += 7) {
    ctx.strokeStyle = (x % 14 === 0) ? 'rgba(255,255,255,.10)' : 'rgba(90,58,8,.10)';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + H, H);
    ctx.stroke();
  }
  ctx.restore();

  // Le reflet qui glisse en travers de la dorure
  const reflet = ctx.createLinearGradient(L * 0.1, 0, L * 0.75, H);
  reflet.addColorStop(0, 'rgba(255,255,255,0)');
  reflet.addColorStop(0.42, 'rgba(255,252,240,.34)');
  reflet.addColorStop(0.58, 'rgba(255,252,240,.14)');
  reflet.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = reflet;
  ctx.fillRect(0, 0, L, H);

  // Grain fin : sans lui, la dorure reste une image de synthèse
  ctx.fillStyle = 'rgba(255,255,255,.07)';
  for (let i = 0; i < 1400; i++) {
    ctx.fillRect(Math.random() * L, Math.random() * H, 1.5, 1.5);
  }
  ctx.fillStyle = 'rgba(48,30,4,.10)';
  for (let i = 0; i < 900; i++) {
    ctx.fillRect(Math.random() * L, Math.random() * H, 1.5, 1.5);
  }

  // La consigne, en petites capitales : elle guide sans crier
  ctx.fillStyle = 'rgba(40,26,4,.62)';
  ctx.textAlign = 'center';
  ctx.font = '600 21px Jost, Arial, sans-serif';
  ctx.letterSpacing = '7px';
  ctx.fillText('GRATTE ICI', L / 2, H / 2 + 74);
  ctx.letterSpacing = '0px';

  installerGrattage(voile, ctx);
}

function installerGrattage(voile, ctx) {
  let gratte = false;
  let devoile = false;
  const ticket = document.getElementById('ticket');
  ticket.classList.remove('entame', 'devoile');

  function positionner(evenement) {
    const cadre = voile.getBoundingClientRect();
    const point = evenement.touches ? evenement.touches[0] : evenement;
    return {
      x: (point.clientX - cadre.left) * (voile.width / cadre.width),
      y: (point.clientY - cadre.top) * (voile.height / cadre.height)
    };
  }

  function creuser(evenement) {
    if (!gratte || devoile) return;
    evenement.preventDefault();
    // Le doigt qui montre le geste s'efface dès le premier contact
    ticket.classList.add('entame');
    const p = positionner(evenement);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 34, 0, Math.PI * 2);
    ctx.fill();
    if (partGrattee(ctx, voile) > 0.42) revelerTicket();
  }

  function revelerTicket() {
    devoile = true;
    ticket.classList.add('entame', 'devoile');
    voile.classList.add('efface');
    // La phrase de fin annonce la première manche. Si son fichier n'est
    // pas encore arrivé (4G capricieuse), on écrit d'abord une phrase
    // neutre, puis on la corrige dès qu'il est là.
    // LE TICKET N'ANNONCE PLUS LES JEUX (27/08/2026, Romain : « que ça
    // ne dise pas les jeux qu'il va y avoir »). Il dit ce que le
    // joueur vient d'apprendre, et la suite se découvre en jouant. Les
    // fichiers des jeux se chargent quand même en tâche de fond, comme
    // avant : ils sont prêts avant qu'on en ait besoin.
    const majSuite = () => {
      // Le ticket perd toujours : la consigne relance vers les manches.
      const combien = listeDesManches().length;
      document.getElementById('grattage-consigne').textContent =
        combien > 1 ? combien + ' manches pour te rattraper. Tout se joue à la dernière.'
                    : 'À toi de jouer.';
    };
    majSuite();
    chargerFichiersJeu().then(majSuite);
    document.getElementById('btn-grattage-suite').hidden = false;
    vibrer([30, 50, 30]);
  }

  voile.onpointerdown = e => { gratte = true; creuser(e); };
  voile.onpointermove = creuser;
  voile.onpointerup = () => { gratte = false; };
  voile.onpointerleave = () => { gratte = false; };
  // Filet de sécurité : au bout de 12 secondes, on révèle tout seul
  setTimeout(() => { if (!devoile) revelerTicket(); }, 12000);
  voile.revelerTicket = revelerTicket;
}

// Quelle proportion du voile a été grattée
function partGrattee(ctx, voile) {
  const pas = 16;
  const donnees = ctx.getImageData(0, 0, voile.width, voile.height).data;
  let vides = 0, total = 0;
  for (let i = 3; i < donnees.length; i += 4 * pas) {
    total++;
    if (donnees[i] < 40) vides++;
  }
  return total ? vides / total : 0;
}

document.getElementById('btn-grattage-suite').addEventListener('click', () => {
  // La chance doublée est déjà prise en compte : elle a été tirée
  // AVANT le lot (voir preparerBonus), c'était la seule façon qu'elle
  // change réellement quelque chose.
  lancerJeu(false);
});


// ============================================
// LE MOTEUR DE JEUX
// Chaque galerie choisit sa mécanique : la roue, les trois paquets,
// le memory… Le lot est toujours tiré AVANT (dans validerCoordonnees)
// et enregistré en base : le jeu ne fait que le révéler, joliment.
//
// Un jeu = un fichier dans jeux/, qui se déclare tout seul dans
// window.PullUpJeux avec : id, nom, mot, suite, styles, preparer(ctx).
// Voir LISEZ-MOI.md, section « Ajouter un jeu ».
// ============================================

// La roue est le jeu d'origine : elle a son propre écran dans index.html,
// on l'enveloppe simplement dans la même interface que les autres.
const JEU_ROUE = {
  id: 'roue',
  nom: 'La roue de la fortune',
  mot: 'la roue',
  suite: 'C’est parti pour la roue.',
  preparer(ctx) {
    dessinerRoue();
    const svg = document.getElementById('roue-svg');
    svg.classList.remove('tourne');
    svg.style.transform = 'rotate(0deg)';
    // Manche décisive : la roue s'arrête sur le vrai lot du joueur.
    // Manche d'avant : elle s'arrête sur la case « retente », qui est
    // la seule case qui ne promet rien. La montrer n'est pas un
    // mensonge, c'est le résultat de CETTE manche, et il en reste.
    cibleRoue = ctx.decisif
      ? lotGagne
      : (LOTS.filter(l => l.perdant && l.poids > 0)[0] || lotGagne);
    document.getElementById('roue-titre').textContent =
      ctx.secondTour ? 'Deuxième tour' : 'À toi de jouer';
    document.getElementById('btn-tourner').disabled = false;
    afficherEcran('ecran-roue');
  }
};

let jeuActuel = JEU_ROUE;
let cibleRoue = null;

// ============================================
// LE PARCOURS EN TROIS MANCHES (25/08/2026)
// --------------------------------------------
// Le joueur enchaîne trois jeux : le bandit manchot, la roue, puis
// les trois cadeaux pareils. Il n'y a toujours qu'UN SEUL lot par
// joueur et par jour : les manches ne multiplient pas les cadeaux,
// elles montent la tension autour d'un résultat tiré une seule fois,
// avant la première manche, selon le taux de gagnants de l'opération.
//
// La règle de mise en scène, la même pour tout le monde : il suffit
// de réussir UNE manche pour gagner, et c'est la DERNIÈRE qui tranche.
// Les manches d'avant se jouent donc toujours en « tout près ». Le
// gagnant rate les deux premières et emporte la troisième ; le
// perdant rate les trois, la dernière à un cheveu. Personne ne peut
// mieux jouer, et l'écran de chaque manche dit combien il en reste.
// LE PARCOURS PAR DÉFAUT (26/08/2026, soir)
// Le chamboule-tout entre dans le parcours : la machine à sous pour
// commencer, la planche de la fête foraine ensuite, la roue pour finir
// (c'est elle qui porte le nom du jeu, elle reste le clou). « Trois
// Cadeaux Pareils » n'est pas supprimé pour autant : il reste jouable,
// il suffit de l'écrire dans la colonne jeu de roue_operations.
// LE PARCOURS PAR DÉFAUT NE CHANGE QUE SUR DÉCISION DE ROMAIN
// (26/08/2026, remis en état en fin de soirée)
// Onze jeux existent maintenant dans jeux/, tous jouables par
// LE PARCOURS, DICTÉ PAR ROMAIN LE 27/08/2026 : « le ticket à
// gratter, la roue, le bandit manchot, le chamboule-tout, le trapèze
// volant et l'homme obus ». C'est SA décision, après avoir joué tous
// les jeux : ne pas y toucher sans lui. Le ticket perd toujours (voir
// contenuDuBillet), la roue ouvre la partie en passant la main, et
// c'est l'homme obus, en dernière manche, qui révèle le vrai lot.
const MANCHES_DEFAUT = ['roue', 'bandit', 'chamboule', 'trapeze', 'canon'];
let MANCHES = MANCHES_DEFAUT.slice();
let mancheActuelle = 0;
let mancheSecondTour = false;

// Quels jeux, dans quel ordre ?
// - `?jeu=bandit` dans le lien : une seule manche, pour montrer un jeu
//   à un client sans jouer tout le parcours ;
// - colonne `jeu` de roue_operations : la LISTE des manches, séparées
//   par des virgules. Une valeur seule (« roue ») est une ancienne
//   configuration d'avant le 25/08/2026 : on l'ignore et on joue le
//   parcours complet, sinon une galerie déjà enregistrée resterait
//   bloquée sur un seul jeu sans que personne l'ait demandé.
// LE PARCOURS D'ESSAI COMPLET (« ?jeu=tous »)
// -------------------------------------------
// Tous les jeux à la suite, dans une seule partie, pour les voir
// s'enchaîner et pouvoir en juger. La roue ferme la marche : c'est
// elle qui porte le nom du jeu, et c'est la dernière manche qui
// révèle le lot. Ce n'est PAS le parcours d'un visiteur : lui n'en
// joue que trois (voir MANCHES_DEFAUT).
// « Le Sapin de la Galerie » est sorti du parcours d'essai le
// 27/08/2026 : Romain l'a écarté après l'avoir joué. Le fichier
// jeux/sapin.js reste sur le disque et jouable par « ?jeu=sapin »,
// mais il n'est plus proposé nulle part.
// LES JEUX ÉCARTÉS PAR ROMAIN (27/08/2026, après les avoir joués) :
// le Sapin, la Hotte Géante, le Chapeau du Magicien, puis la Boutique
// Étoilée et Trois Pareils au second tri. Plus déclarés nulle part.
// Leurs fichiers restent dans jeux/ si un jour il change d'avis.
// Le parcours d'essai est désormais LE parcours : « ?jeu=tous » joue
// la même partie qu'un vrai visiteur.
const PARCOURS_COMPLET = MANCHES_DEFAUT.slice();

function listeDesManches() {
  // « ?jeu=bandit » force une manche unique, « ?jeu=bandit,sapin,roue »
  // les enchaîne dans l'ordre écrit, et « ?jeu=tous » les enchaîne
  // toutes. C'est la partie d'essai : elle sert à tout voir d'affilée
  // sans refaire le questionnaire dix fois. Un jeu inconnu est ignoré
  // au lieu de faire tomber le parcours sur la roue sans prévenir.
  const force = new URLSearchParams(location.search).get('jeu');
  if (force) {
    const demande = String(force).trim().toLowerCase();
    if (demande === 'tous') return PARCOURS_COMPLET.slice();
    // FICHIERS_JEUX est déclaré plus bas dans le fichier : on ne le
    // consulte que s'il existe déjà, sinon on accepte la liste telle
    // quelle (un fichier introuvable est de toute façon rattrapé au
    // chargement, qui repart sur la roue).
    const connu = nom => nom === 'roue' ||
      (typeof FICHIERS_JEUX === 'undefined') || !!FICHIERS_JEUX[nom];
    const liste = demande.split(',').map(s => s.trim()).filter(Boolean).filter(connu);
    if (liste.length) return liste;
  }
  const brut = String(OPERATION.jeu || '').trim();
  if (brut.indexOf(',') > 0) {
    const liste = brut.split(',').map(s => s.trim()).filter(Boolean);
    if (liste.length) return liste;
  }
  return MANCHES_DEFAUT.slice();
}

function jeuPourNom(nom) {
  if (nom === 'roue') return JEU_ROUE;
  return (window.PullUpJeux && window.PullUpJeux[nom]) || JEU_ROUE;
}

// --------------------------------------------
// LE FICHIER DU JEU SE CHARGE À LA DEMANDE
// --------------------------------------------
// Avant, les quatre jeux étaient téléchargés à l'ouverture de la page,
// soit 52 Ko dont le joueur n'utilisera qu'un seul. Maintenant, seul le
// jeu du jour est téléchargé, et pendant que le joueur répond aux
// questions : il est prêt bien avant qu'on en ait besoin. La roue, elle,
// vit dans app.js et n'a rien à charger.
//
// DEUX JEUX DÉBRANCHÉS LE 25/08/2026, à la demande de Romain :
//   - « Le Juste Prix des Commerçants » (jeux/justeprix.js) : abandonné.
//   - « Suis le Cadeau », les paquets qui se mélangent
//     (jeux/suis-le-cadeau.js, noms « suiscadeau » et « bonneteau ») :
//     remplacé par « Trois Cadeaux Pareils » (jeux/cartes.js), parce
//     que Romain n'aime pas les cadeaux qui se déplacent.
// Les deux fichiers restent dans jeux/ : on ne supprime rien ici. Ils
// ne sont simplement plus dans cette table, donc plus téléchargeables.
// Un nom de jeu absent de la table repart sur la roue tout seul, c'est
// le filet de sécurité d'origine : `&jeu=justeprix` ne casse rien, il
// fait tourner la roue.
// La version des fichiers de jeu : elle suit celle d'index.html. Sans
// elle, un téléphone qui a déjà joué garde l'ancien fichier en mémoire
// et ne voit jamais les corrections (constaté le 26/08/2026 sur le
// levier du bandit manchot).
const VERSION_JEUX = '27aout2026i';
// Les quatre jeux retenus par Romain le 27/08/2026 (la roue, elle,
// vit dans app.js et n'a rien à charger). Les écartés (sapin, hotte,
// chapeau, etoiles, cartes, pingouin, paquets, memory…) n'ont plus
// d'entrée ici : plus aucun chemin ne mène à eux, même par « ?jeu= ».
// Leurs fichiers restent dans jeux/ s'il change d'avis.
const FICHIERS_JEUX = {
  bandit:    'jeux/bandit.js?v=' + VERSION_JEUX,
  chamboule: 'jeux/chamboule.js?v=' + VERSION_JEUX,
  trapeze:   'jeux/trapeze.js?v=' + VERSION_JEUX,
  canon:     'jeux/canon.js?v=' + VERSION_JEUX
};
const chargements = {};

function chargerUnFichierJeu(nom) {
  if (!FICHIERS_JEUX[nom]) return Promise.resolve();
  if (window.PullUpJeux && window.PullUpJeux[nom]) return Promise.resolve();
  if (chargements[nom]) return chargements[nom];
  chargements[nom] = new Promise(resolve => {
    const s = document.createElement('script');
    s.src = FICHIERS_JEUX[nom];
    // Un fichier qui n'arrive pas ne bloque personne : l'application
    // repart sur la roue, comme pour un jeu qui plante.
    s.onload = () => resolve();
    s.onerror = () => {
      console.warn('Fichier du jeu introuvable, retour à la roue :', nom);
      resolve();
    };
    document.body.appendChild(s);
  });
  return chargements[nom];
}

// Les fichiers des manches partent tous en même temps, pendant que le
// joueur répond aux questions : ils sont là bien avant qu'on en ait
// besoin, et l'ouverture de la page ne télécharge toujours rien.
function chargerFichiersJeu() {
  return Promise.all(listeDesManches().map(chargerUnFichierJeu));
}

// Les styles d'un jeu voyagent avec son fichier : ils sont posés
// dans la page la première fois qu'on y joue, jamais deux fois.
function poserStylesJeu(jeu) {
  if (!jeu.styles) return;
  const id = 'styles-jeu-' + jeu.id;
  if (document.getElementById(id)) return;
  const balise = document.createElement('style');
  balise.id = id;
  balise.textContent = jeu.styles;
  document.head.appendChild(balise);
}

// Tout ce qu'un jeu a le droit de connaître du reste de l'application.
// `manche`, `manches` et `decisif` sont arrivés le 25/08/2026 avec le
// parcours en trois jeux : un jeu qui n'est pas décisif ne révèle
// jamais le lot, il se joue « tout près » et passe la main.
function contexteJeu(secondTour) {
  return {
    lot: lotGagne,
    lots: LOTS,
    zone: document.getElementById('jeu-zone'),
    secondTour: !!secondTour,
    sobre: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    icone: iconePourLot,
    icones: ICONES,
    libelle: libelleRoue,
    echap: echap,
    vibrer: vibrer,
    manche: mancheActuelle + 1,
    manches: MANCHES.length,
    decisif: mancheActuelle >= MANCHES.length - 1,
    terminer: finDeManche
  };
}

// Le bandeau de manche est posé par l'application, pas par les jeux :
// il est le même partout, y compris au-dessus de la roue.
function poserBandeauManche() {
  const numero = mancheActuelle + 1;
  const total = MANCHES.length;
  [['manche-jeu'], ['manche-roue']].forEach(([id]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (total < 2) { el.hidden = true; return; }
    let points = '';
    for (let i = 0; i < total; i++) {
      const classe = i < numero - 1 ? ' class="manche-faite"'
                   : (i === numero - 1 ? ' class="manche-encours"' : '');
      points += '<span' + classe + '></span>';
    }
    el.innerHTML =
      '<span class="manche-mot">Manche <strong>' + numero + '</strong> sur ' + total + '</span>' +
      '<span class="manche-points" role="img" aria-label="Manche ' + numero +
      ' sur ' + total + '">' + points + '</span>';
    el.hidden = false;
  });
}

// Le fichier du jeu est normalement déjà là (il se charge pendant le
// quiz). On s'en assure quand même avant de lancer la partie.
function lancerJeu(secondTour) {
  MANCHES = listeDesManches();
  // Aucune case « retente » dans cette opération : tout le monde gagne,
  // de toute façon (voir tirerLot). Faire rater deux manches avant un
  // gain certain n'aurait aucun sens, et la roue n'aurait aucune case
  // sur laquelle s'arrêter sans promettre un lot. On n'en joue qu'une.
  if (!LOTS.some(l => l.perdant && l.poids > 0)) MANCHES = MANCHES.slice(0, 1);
  mancheActuelle = 0;
  mancheSecondTour = !!secondTour;
  chargerFichiersJeu().then(() => lancerManche());
}

function finDeManche() {
  mancheActuelle++;
  if (mancheActuelle < MANCHES.length) { lancerManche(); return; }
  afficherResultat();
}

function lancerManche() {
  jeuActuel = jeuPourNom(MANCHES[mancheActuelle]);
  const ctx = contexteJeu(mancheSecondTour);
  poserBandeauManche();
  if (jeuActuel === JEU_ROUE) { jeuActuel.preparer(ctx); return; }

  poserStylesJeu(jeuActuel);
  try {
    ctx.zone.innerHTML = '';
    jeuActuel.preparer(ctx);
    afficherEcran('ecran-jeu');
  } catch (e) {
    // Un jeu qui casse ne doit jamais bloquer un joueur devant la borne :
    // on repart sur la roue, qui marche depuis le premier jour.
    console.warn('Jeu « ' + jeuActuel.id + ' » indisponible, retour à la roue :', e);
    jeuActuel = JEU_ROUE;
    JEU_ROUE.preparer(ctx);
  }
}

// --------------------------------------------
// ROUE (SVG)
// --------------------------------------------
// Un nom de lot tient rarement sur un segment de roue. On en garde
// l'essentiel : le montant s'il y en a un, sinon les premiers mots
// jusqu'au complément (« Coupe chez le coiffeur… » devient « Coupe »).
// Un libellé sur mesure peut toujours être imposé par le champ « court ».
const LIAISONS_ROUE = /^(chez|au|aux|à|a|dans|de|du|des|d'|pour|avec|en|sur|par|le|la|les|et|offert|offerte|offerts|offertes|gratuit|gratuite)$/i;

function libelleRoue(lot) {
  if (lot && lot.court) return String(lot.court);
  let t = String((lot && lot.nom) || '').replace(/\s*!+\s*$/, '').trim();
  if (!t) return '';
  // Les cases « retente » sont nombreuses depuis l'alternance : un seul
  // mot suffit, et il laisse respirer les cases voisines.
  if (lot && lot.perdant) return 'Retente';
  const montant = t.match(/(\d+)\s*€/);
  if (montant) return montant[1] + ' €';
  t = t.replace(/^(un|une|le|la|les|des|du)\s+/i, '');

  const mots = t.split(/\s+/);
  const gardes = [mots[0]];
  for (let i = 1; i < mots.length; i++) {
    if (LIAISONS_ROUE.test(mots[i])) break;
    if ((gardes.join(' ') + ' ' + mots[i]).length > 12) break;
    gardes.push(mots[i]);
  }
  t = gardes.join(' ').slice(0, 12).trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// LA ROUE QUI A L'AIR D'UNE VRAIE ROUE (26/08/2026)
// --------------------------------------------------
// Romain, en jouant : « une seule case perdante sur huit, personne n'y
// croit ». Il a raison : une roue de fête foraine alterne les cases
// pleines et les cases vides, c'est ce qui la rend crédible. Elle
// alterne donc maintenant, un lot puis une case « retente », tout
// autour du cercle.
//
// CE QUE ÇA CHANGE, ET CE QUE ÇA NE CHANGE PAS. Le lot du joueur est
// tiré AVANT la roue, par le serveur, selon le taux de gagnants de
// l'opération : la roue ne décide de rien, elle révèle. Le nombre de
// cases affichées n'a donc aucun effet sur les chances réelles, qui
// restent celles du tirage (environ 7 joueurs sur 10 repartent avec un
// lot). L'affichage annonce moins que la réalité, jamais l'inverse :
// c'est le sens prudent. Les vraies chances doivent être écrites au
// règlement, c'est là qu'elles font foi.
let SEGMENTS = [];

function construireSegments() {
  const gagnants = LOTS.filter(l => !l.perdant);
  const perdant = LOTS.filter(l => l.perdant)[0];
  // Pas de case perdante configurée, ou trop peu de lots : on garde la
  // roue telle quelle, on n'invente pas de case.
  if (!perdant || gagnants.length < 2) return LOTS.slice();
  const segments = [];
  gagnants.forEach(lot => { segments.push(lot); segments.push(perdant); });
  return segments;
}

function dessinerRoue() {
  creerAmpoules();
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('roue-svg');
  svg.innerHTML = '';
  SEGMENTS = construireSegments();
  const n = SEGMENTS.length;
  const angle = 360 / n;
  const cx = 150, cy = 150, r = 148;

  // Dégradés : un segment sur deux clair, pour le contraste
  // Sous le chapiteau, la roue prend les couleurs de la piste : une case
  // dorée, une case velours rouge. Ailleurs, elle garde l'or et le brun.
  const circus = document.body.classList.contains('theme-circus');
  const defs = document.createElementNS(NS, 'defs');
  defs.innerHTML = circus
    ? `<radialGradient id="seg-sombre" cx="50%" cy="50%" r="75%">
         <stop offset="0%" stop-color="#8E1A1E"/><stop offset="100%" stop-color="#57090C"/>
       </radialGradient>
       <radialGradient id="seg-or" cx="50%" cy="50%" r="75%">
         <stop offset="0%" stop-color="#F7E6C4"/><stop offset="100%" stop-color="#D9A93F"/>
       </radialGradient>`
    : `<radialGradient id="seg-sombre" cx="50%" cy="50%" r="75%">
         <stop offset="0%" stop-color="#3a2c15"/><stop offset="100%" stop-color="#1b1409"/>
       </radialGradient>
       <radialGradient id="seg-or" cx="50%" cy="50%" r="75%">
         <stop offset="0%" stop-color="#F0D08C"/><stop offset="100%" stop-color="#C9962E"/>
       </radialGradient>`;
  svg.appendChild(defs);

  SEGMENTS.forEach((lot, i) => {
    const pair = i % 2 === 0;
    const a0 = (i * angle - 90) * Math.PI / 180;
    const a1 = ((i + 1) * angle - 90) * Math.PI / 180;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);

    const part = document.createElementNS(NS, 'path');
    part.setAttribute('d', `M${cx},${cy} L${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1} Z`);
    part.setAttribute('fill', pair ? 'url(#seg-or)' : 'url(#seg-sombre)');
    part.setAttribute('stroke', '#0f0b05');
    part.setAttribute('stroke-width', '1.6');
    part.setAttribute('data-segment', i);
    svg.appendChild(part);

    // Icône dessinée au trait, au milieu du segment
    const amDeg = i * angle + angle / 2 - 90;
    const am = amDeg * Math.PI / 180;
    const ix = cx + r * 0.55 * Math.cos(am);
    const iy = cy + r * 0.55 * Math.sin(am);
    const echelle = n > 10 ? 0.30 : 0.40;
    const groupe = document.createElementNS(NS, 'g');
    groupe.setAttribute('transform',
      `translate(${ix} ${iy}) rotate(${i * angle + angle / 2}) scale(${echelle}) translate(-50 -50)`);
    groupe.setAttribute('fill', 'none');
    groupe.setAttribute('stroke', pair ? '#2a1d08' : '#EFC368');
    groupe.setAttribute('stroke-width', '4.5');
    groupe.setAttribute('stroke-linecap', 'round');
    groupe.setAttribute('stroke-linejoin', 'round');
    groupe.innerHTML = iconePourLot(lot.nom);
    svg.appendChild(groupe);

    // Le nom du lot, écrit le long du bord : le joueur voit enfin
    // ce qu'il peut gagner avant même d'avoir lancé la roue.
    const tx = cx + r * 0.855 * Math.cos(am);
    const ty = cy + r * 0.855 * Math.sin(am);
    const texte = document.createElementNS(NS, 'text');
    // Dans la moitié basse de la roue, le texte se retrouverait tête en bas :
    // on le retourne pour qu'il reste lisible tout autour du cercle.
    const angleNormalise = ((amDeg % 360) + 360) % 360;
    const teteEnBas = angleNormalise > 0 && angleNormalise < 180;
    const rotationTexte = teteEnBas ? amDeg - 90 : amDeg + 90;
    texte.setAttribute('transform', `translate(${tx} ${ty}) rotate(${rotationTexte})`);
    texte.setAttribute('text-anchor', 'middle');
    texte.setAttribute('dominant-baseline', 'middle');
    texte.setAttribute('font-family', "'Jost', Arial, sans-serif");
    texte.setAttribute('font-size', n > 10 ? '9.4' : '11.5');
    texte.setAttribute('font-weight', '600');
    texte.setAttribute('letter-spacing', '.2');
    texte.setAttribute('fill', pair ? '#241804' : '#F2D9A2');
    texte.textContent = libelleRoue(lot);
    svg.appendChild(texte);
  });

  // Cercle intérieur, pour poser le centre
  const anneau = document.createElementNS(NS, 'circle');
  anneau.setAttribute('cx', cx); anneau.setAttribute('cy', cy); anneau.setAttribute('r', 40);
  anneau.setAttribute('fill', 'none');
  anneau.setAttribute('stroke', 'rgba(239,195,104,.35)');
  anneau.setAttribute('stroke-width', '1.2');
  svg.appendChild(anneau);
}


// Combien de temps la roue tourne, et comment.
const ROUE_DUREE = 5400;      // millisecondes de rotation
const ROUE_ARRACHE = 0.11;    // part du temps passée à prendre de la vitesse
const ROUE_REBOND = 950;      // le cliquet qui fait revenir la roue en fin de course
const ROUE_DEPASSEMENT = 7;   // degrés dépassés avant le retour
let filetRoue = null;         // sécurité si le téléphone met le jeu en pause
let roueTerminee = false;     // pour n'annoncer le résultat qu'une seule fois

// Le mouvement d'une vraie roue : elle est lancée à la main (elle prend
// de la vitesse), puis la friction la ralentit longuement, et le cliquet
// la fait osciller avant de la caler. Trois gestes, une seule courbe.
function courbeRoue(p) {
  const a = ROUE_ARRACHE;
  // 1. arrachage : la vitesse part de zéro et monte
  const lance = p < a ? (p * p) / (2 * a) : p - a / 2;
  const t = lance / (1 - a / 2);
  // 2. friction : très longue décélération, le suspense est à la fin
  return 1 - Math.pow(1 - t, 4);
}

function lancerRoue() {
  const svg = document.getElementById('roue-svg');
  const cadre = document.getElementById('roue-cadre');
  const zone = document.querySelector('#ecran-roue .roue-zone');
  const pointeur = document.querySelector('.roue-pointeur');
  if (!SEGMENTS.length) SEGMENTS = construireSegments();
  const n = SEGMENTS.length;
  const angle = 360 / n;
  // La cible est posée par JEU_ROUE.preparer : le vrai lot si la roue
  // est la manche décisive, la case « retente » sinon. Un même lot peut
  // occuper plusieurs cases (les « retente ») : on en choisit une au
  // hasard, sinon la roue s'arrêterait toujours au même endroit.
  const cases = [];
  SEGMENTS.forEach((lot, i) => { if (lot === (cibleRoue || lotGagne)) cases.push(i); });
  const index = cases.length
    ? cases[Math.floor(Math.random() * cases.length)]
    : Math.max(0, SEGMENTS.indexOf(cibleRoue || lotGagne));
  // Angle pour amener le milieu du segment gagnant sous le pointeur (en haut)
  const cible = 360 - (index * angle + angle / 2);
  // On ne s'arrête jamais pile au milieu : ce serait trop régulier
  const decalage = (Math.random() - 0.5) * angle * 0.55;
  const tours = 5 + Math.floor(Math.random() * 2);
  const arrivee = tours * 360 + cible + decalage;

  roueTerminee = false;
  document.getElementById('btn-tourner').disabled = true;
  document.getElementById('roue-titre').textContent = 'Ça tourne…';
  if (zone) zone.classList.add('suspense');
  cadre.classList.add('emballe');
  vibrer(40);

  // Téléphone réglé sur « moins d'animations » : on abrège franchement.
  const sobre = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (sobre) {
    svg.style.transform = `rotate(${cible + decalage}deg)`;
    cadre.classList.remove('emballe');
    if (zone) zone.classList.remove('suspense');
    setTimeout(afficherResultat, 900);
    return;
  }

  svg.classList.remove('tourne');
  svg.style.transition = 'none';

  const depart = performance.now();
  const duree = ROUE_DUREE;
  let dernierTic = -1;
  let dernierTemps = 0;

  // Filet de sécurité : si le joueur quitte l'application pendant la
  // rotation, le téléphone met l'animation en pause. À son retour, ou
  // au pire après ce délai, le résultat s'affiche quand même.
  clearTimeout(filetRoue);
  filetRoue = setTimeout(() => {
    if (document.querySelector('.ecran.actif').id !== 'ecran-roue') return;
    svg.style.transform = `rotate(${arrivee}deg)`;
    cadre.classList.remove('emballe');
    finirRoue(zone, index);
  }, ROUE_DUREE + ROUE_REBOND + 2500);

  function frame(maintenant) {
    const p = Math.min(1, (maintenant - depart) / duree);
    const parcouru = courbeRoue(p) * (arrivee + ROUE_DEPASSEMENT);
    svg.style.transform = `rotate(${parcouru}deg)`;

    // Le pointeur claque à chaque segment qui passe dessous, comme un
    // vrai cliquet. Il ne fait plus qu'un bruit sourd quand ça ralentit.
    const tic = Math.floor(parcouru / angle);
    if (tic !== dernierTic) {
      dernierTic = tic;
      if (pointeur) {
        pointeur.classList.remove('claque');
        void pointeur.offsetWidth;
        pointeur.classList.add('claque');
      }
      // On ne fait vibrer le téléphone que quand les segments s'espacent,
      // sinon la vibration deviendrait un bourdonnement continu.
      if (maintenant - dernierTemps > 110) vibrer(9);
      dernierTemps = maintenant;
    }

    if (p < 1) { requestAnimationFrame(frame); return; }
    reboudirRoue(svg, cadre, zone, arrivee, index, angle);
  }
  requestAnimationFrame(frame);
}

// Le cliquet retient la roue puis la relâche : elle oscille et se cale.
function reboudirRoue(svg, cadre, zone, arrivee, index, angle) {
  const depart = performance.now();
  cadre.classList.remove('emballe');

  function frame(maintenant) {
    const t = (maintenant - depart) / ROUE_REBOND;
    if (t < 1) {
      // Oscillation qui s'éteint : deux allers-retours de plus en plus courts
      const amorti = Math.cos(t * Math.PI * 2.1) * Math.exp(-4.6 * t);
      svg.style.transform = `rotate(${arrivee + ROUE_DEPASSEMENT * amorti}deg)`;
      requestAnimationFrame(frame);
      return;
    }
    svg.style.transform = `rotate(${arrivee}deg)`;
    finirRoue(zone, index);
  }
  requestAnimationFrame(frame);
}

// Le battement de silence : la case gagnante s'allume, on laisse le
// joueur la lire, et seulement après on ouvre l'écran du résultat.
function finirRoue(zone, index) {
  if (roueTerminee) return;      // le filet de sécurité a pu passer avant
  roueTerminee = true;
  clearTimeout(filetRoue);
  const part = document.querySelector(`#roue-svg [data-segment="${index}"]`);
  if (part) part.classList.add('segment-gagnant');
  // La même phrase que le joueur gagne ou non : deux phrases différentes
  // lui apprenaient à lire son résultat avant la fin de l'animation, et
  // faisaient perdre au jeu tout son suspense au bout de trois parties.
  // En manche non décisive, la roue ne choisit rien du tout : elle dit
  // simplement qu'il reste des manches, sans jamais parler du lot.
  const decisif = mancheActuelle >= MANCHES.length - 1;
  const restantes = MANCHES.length - 1 - mancheActuelle;
  document.getElementById('roue-titre').textContent = decisif
    ? 'Et la roue a choisi…'
    : (restantes === 1 ? 'La roue passe la main. Il reste une manche.'
                       : 'La roue passe la main. Il reste ' + restantes + ' manches.');
  vibrer([18, 60, 26]);
  setTimeout(finDeManche, decisif ? 1150 : 1600);
}

// --------------------------------------------
// RÉSULTAT
// --------------------------------------------
// L'ÉCRAN DE RÉSULTAT EST NU DEPUIS LE 25/08/2026.
// Il arrive à la toute fin du parcours, après les trois manches, et il
// ne dit qu'une chose. Romain : « rien d'autre sur cette page, aucun
// autre indice, aucune distraction, juste le résultat et un bouton
// Continuer. » Les quatre formulations tirées au hasard ont donc été
// remplacées par un message unique de chaque côté : à ce moment-là, le
// joueur a besoin de comprendre en une seconde, pas d'être surpris.
// {prenom} et {lot} sont remplacés à l'affichage.
const MESSAGES_GAGNE = [
  { titre: 'Bravo {prenom}, tu as gagné.', texte: '<strong>{lot}</strong>' }
];

const MESSAGES_PERDU = [
  { titre: 'Pas de cadeau aujourd’hui.', texte: 'Le rideau retombe pour cette fois. Reviens demain, {prenom}, la piste rouvre chaque matin.' }
];

function messageAleatoire(liste) {
  const m = liste[Math.floor(Math.random() * liste.length)];
  const prenom = echap(reponses.prenom || 'toi');
  const lot = lotGagne ? echap(lotGagne.nom) : '';
  const jeu = (jeuActuel && jeuActuel.mot) || 'la chance';
  const Jeu = jeu.charAt(0).toUpperCase() + jeu.slice(1);
  const remplacer = t => t
    .split('{prenom}').join(prenom)
    .split('{lot}').join(lot)
    .split('{Jeu}').join(Jeu)
    .split('{jeu}').join(jeu);
  return { titre: remplacer(m.titre), texte: remplacer(m.texte) };
}

// Petite vibration du téléphone quand le navigateur le permet
function vibrer(motif) {
  try {
    if (navigator.vibrate) navigator.vibrate(motif);
  } catch (e) { /* tant pis, pas de vibration */ }
}

// Enveloppe une icône dans un SVG doré pour le médaillon
function medaillonIcone(trace, taille) {
  const px = taille || 52;
  return `<svg viewBox="0 0 100 100" width="${px}" height="${px}" aria-hidden="true"
       fill="none" stroke="#EFC368" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
       ${trace}</svg>`;
}

function afficherResultat() {
  const emoji = document.getElementById('resultat-emoji');
  emoji.classList.remove('hero-photo');
  // Le médaillon se pose comme un cachet de cire
  emoji.classList.remove('estampe');
  void emoji.offsetWidth;
  emoji.classList.add('estampe');
  const titre = document.getElementById('resultat-titre');
  const texte = document.getElementById('resultat-texte');
  const codeBloc = document.getElementById('resultat-code-bloc');
  const mention = document.getElementById('resultat-mention');

  const bandeauCommercant = document.getElementById('resultat-commercant');
  if (lotGagne.commercant) {
    bandeauCommercant.textContent = nommerCommercant(lotGagne.commercant);
    bandeauCommercant.hidden = false;
  } else {
    bandeauCommercant.hidden = true;
  }

  // Le bloc de non-gain : ouvert au perdant, refermé au gagnant.
  // Avec un taux de gagnants à 25 %, c'est l'écran que voient trois
  // joueurs sur quatre : il porte à lui seul l'image de l'opération
  // en galerie, il n'a pas le droit d'être une porte fermée.
  const consolation = null;   // le bloc consolation a été retiré (27/08/2026)
  const boutonGalerie = document.getElementById('btn-voir-promos');

  if (lotGagne.perdant) {
    const msg = messageAleatoire(MESSAGES_PERDU);
    emoji.innerHTML = medaillonIcone(ICONES.etoile);
    titre.innerHTML = msg.titre;
    texte.innerHTML = msg.texte;
    codeBloc.hidden = true;
    if (consolation) consolation.hidden = false;
    // Le bouton doré ne dit plus « découvrir », mot d'accueil : il dit
    // ce que le joueur va vraiment y trouver, tout de suite.
    if (boutonGalerie) boutonGalerie.textContent = 'Voir les promos du jour';
    const suitePerdue = document.getElementById('btn-resultat-continuer');
    if (suitePerdue) suitePerdue.textContent = 'Voir la galerie';
    // Écran nu : le perdant ne lit que son résultat et le bouton.
    mention.textContent = '';
    mention.hidden = true;
    vibrer(120);
  } else {
    if (consolation) consolation.hidden = true;
    if (boutonGalerie) boutonGalerie.textContent = 'Découvrir la galerie';
    const suite = document.getElementById('btn-resultat-continuer');
    if (suite) suite.textContent = 'Obtenir mon cadeau';
    const msg = messageAleatoire(MESSAGES_GAGNE);
    emoji.innerHTML = medaillonIcone(iconePourLot(lotGagne.nom));
    titre.innerHTML = msg.titre;
    texte.innerHTML = msg.texte;
    let fete = true;
    // LE CODE N'EST PLUS SUR CET ÉCRAN (27/08/2026, Romain : « ça ne
    // sert à rien de mettre le numéro, ni de dire de noter le code,
    // c'est le commerçant qui dit que le bon est utilisé »). L'écran
    // de résultat annonce le gain, rien d'autre. Le code, lui, vit sur
    // le ticket de « Mes cadeaux », là où le commerçant le lit et le
    // valide. Le bloc reste dans la page (d'autres écrans s'en
    // servent), il est simplement refermé ici.
    ecrireCode(document.getElementById('resultat-code'), codeLot);
    codeBloc.hidden = true;
    // Rappel de l'article 5 du règlement au seul joueur concerné.
    const rappelMineur = document.getElementById('resultat-mineur');
    if (rappelMineur) rappelMineur.hidden = reponses.age_tranche !== '-18';
    document.getElementById('bon-valide').hidden = true;
    document.getElementById('confirme-utilisation').hidden = true;
    document.getElementById('btn-utiliser').disabled = false;
    const dejaUtilise = bonsUtilises()[codeLot];
    if (dejaUtilise) {
      afficherBonUtilise(dejaUtilise.lot, dejaUtilise.date);
      fete = false;   // rien à célébrer : le bon a déjà servi
    }
    // La date de validité vient de l'opération quand la galerie l'a
    // tranchée (colonne validite_bons). Tant qu'elle ne l'a pas fait, on
    // s'en tient à la durée de l'opération, comme le règlement.
    const validite = (OPERATION.validite_bons || '').trim();
    mention.hidden = false;
    mention.textContent = validite
      ? 'Ton bon est valable jusqu’au ' + validite + '.'
      : 'Ton bon est valable pendant toute la durée de l’opération.';

    // LE BON ENTRE DANS LE PORTEFEUILLE (26/08/2026)
    // Sans ça, le joueur qui quitte cet écran n'a plus aucun endroit où
    // retrouver son code, dix minutes plus tard, devant la caisse.
    if (window.PullUpBons) {
      window.PullUpBons.ajouter({
        code: codeLot,
        lot: lotGagne.nom,
        commercant: lotGagne.commercant || '',
        source: 'jeu',
        validite: validite
      });
      rafraichirOngletBons();
    }

    // Envoi du bon par e-mail. Volontairement sans await : si le
    // service d'envoi est lent ou en panne, le joueur ne le voit
    // même pas. Voir envoi-mails/envoi-client.js
    // L'e-mail n'est annoncé au joueur qu'une fois réellement parti :
    // un gagnant qui compte sur un mail qui n'arrive pas perd son lot.
    if (window.PullUpMails) {
      const infoCode = document.getElementById('resultat-code-info');
      Promise.resolve(
        window.PullUpMails.enregistrerEtEnvoyer(lotGagne, codeLot, reponses.email, reponses.prenom)
      ).then(envoye => {
        if (envoye && infoCode) {
          infoCode.textContent = 'Tu le retrouves aussi dans ta boîte mail.';
        }
      }).catch(() => {});
    }

    if (fete) confettis();
    vibrer([90, 60, 90, 60, 220]);
  }
  document.getElementById('btn-rejouer-bonus').hidden = toursRestants <= 1;

  // Le grand tirage au sort a été abandonné le 25/08/2026 (décision de
  // Romain) : plus aucun écran n'en parle. La colonne texte_tirage reste
  // en base mais l'application ne la lit plus.
  afficherEcran('ecran-resultat');
}

// « Chez » ne va pas devant un nom qui commence déjà par un article :
// on n'écrit pas « Chez La boulangerie de la galerie ». Dans ce cas, le
// nom se suffit à lui-même.
function nommerCommercant(nom) {
  const propre = String(nom || '').trim();
  if (!propre) return '';
  // L'espace après l'article est obligatoire : sans lui, une enseigne
  // comme « Lego » serait prise pour un nom commençant par « le » et
  // perdrait son « Chez ».
  const commenceParUnArticle = /^(les|le|la)\s+/i.test(propre) || /^l['’]/i.test(propre);
  return commenceParUnArticle ? propre : 'Chez ' + propre;
}

// Le code du bon s'inscrit caractère par caractère, comme une machine
// qui imprime le ticket. Le joueur regarde son code se fabriquer.
function ecrireCode(element, code) {
  const texte = String(code || '');
  element.textContent = '';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    element.textContent = texte;
    return;
  }
  element.setAttribute('aria-label', texte);
  for (let i = 0; i < texte.length; i++) {
    const lettre = document.createElement('span');
    lettre.className = 'code-lettre';
    lettre.textContent = texte[i];
    lettre.style.animationDelay = (0.42 + i * 0.075) + 's';
    element.appendChild(lettre);
  }
}

// Révèle un bloc en le faisant entrer, au lieu de le faire surgir.
// Réutilisable partout : confirmation, bon validé, message d'erreur.
function reveler(element) {
  if (!element) return;
  element.classList.remove('apparait');
  void element.offsetWidth;
  element.hidden = false;
  element.classList.add('apparait');
}

// L'ONDE AU TOUCHER (26/08/2026)
// -----------------------------
// Un seul écouteur pour toute l'application, posé sur le document :
// chaque fois qu'un doigt (ou une souris) se pose sur un élément que
// l'on touche, une onde dorée part du point de contact. Rien n'est
// ajouté au HTML des écrans, rien n'est à brancher dans les jeux : ils
// en héritent tous, y compris ceux qui seront écrits plus tard.
//
// L'onde est purement décorative : elle ne bloque aucun clic
// (pointer-events: none), elle se retire toute seule, et elle
// disparaît si le téléphone demande moins d'animations.
const TOUCHABLES = '.btn, .option, .carte-univers, .promo, .bandit-levier, .ch-place, .btn-mini';

function poserOnde(evenement) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cible = evenement.target && evenement.target.closest && evenement.target.closest(TOUCHABLES);
  if (!cible || cible.disabled) return;
  const boite = cible.getBoundingClientRect();
  if (!boite.width) return;
  const onde = document.createElement('span');
  onde.className = 'onde';
  onde.style.setProperty('--x', (evenement.clientX - boite.left) + 'px');
  onde.style.setProperty('--y', (evenement.clientY - boite.top) + 'px');
  cible.appendChild(onde);
  setTimeout(() => onde.remove(), 620);
}
document.addEventListener('pointerdown', poserOnde, { passive: true });

function echap(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function confettis() {
  const zone = document.getElementById('confettis');
  const couleurs = ['#C9962E', '#E3B85A', '#F1ECE2', '#E77C6C', '#7CB7E7'];
  for (let i = 0; i < 84; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    // Des tailles, des formes et des dérives différentes : une pluie
    // parfaitement régulière se voit tout de suite comme une machine.
    const large = 5 + Math.random() * 7;
    c.style.width = large + 'px';
    c.style.height = (large * (0.9 + Math.random() * 1.4)) + 'px';
    if (Math.random() < 0.28) c.style.borderRadius = '50%';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = couleurs[Math.floor(Math.random() * couleurs.length)];
    c.style.setProperty('--derive', ((Math.random() - 0.5) * 26).toFixed(1) + 'vw');
    c.style.setProperty('--vrille', (360 + Math.random() * 900).toFixed(0) + 'deg');
    c.style.animationDuration = (2.4 + Math.random() * 2.8).toFixed(2) + 's';
    c.style.animationDelay = (Math.random() * 1.1).toFixed(2) + 's';
    zone.appendChild(c);
  }
  setTimeout(() => { zone.innerHTML = ''; }, 7000);
}

// --------------------------------------------
// QUALITÉ DES ADRESSES E-MAIL
// Une adresse mal tapée = un joueur perdu pour la base
// et un lot impossible à confirmer. On nettoie les
// scories du clavier mobile et on propose gentiment
// la correction quand le domaine ressemble à une faute.
// --------------------------------------------
const DOMAINES_COURANTS = [
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.fr', 'outlook.com',
  'outlook.fr', 'live.fr', 'live.com', 'msn.com', 'yahoo.fr', 'yahoo.com',
  'orange.fr', 'wanadoo.fr', 'free.fr', 'sfr.fr', 'neuf.fr', 'laposte.net',
  'icloud.com', 'me.com', 'bbox.fr', 'gmx.fr', 'aol.com', 'protonmail.com',
  'proton.me', 'numericable.fr', 'zeop.re', 'canl.re'
];

function nettoyerEmail(valeur) {
  let e = String(valeur || '').trim().toLowerCase();
  e = e.replace(/\s+/g, '');        // espaces glissés par le clavier
  e = e.replace(/[.,;:]+$/, '');    // ponctuation collée à la fin
  e = e.replace(/,/g, '.');         // virgule tapée à la place du point
  e = e.replace(/@{2,}/g, '@');
  e = e.replace(/\.{2,}/g, '.');
  return e;
}

// Distance d'édition (Levenshtein), version courte et sans dépendance
function distanceMots(a, b) {
  const m = a.length, n = b.length;
  let ligne = new Array(n + 1);
  for (let j = 0; j <= n; j++) ligne[j] = j;
  for (let i = 1; i <= m; i++) {
    let precedent = ligne[0];
    ligne[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = ligne[j];
      const cout = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      ligne[j] = Math.min(ligne[j] + 1, ligne[j - 1] + 1, precedent + cout);
      precedent = temp;
    }
  }
  return ligne[n];
}

// Renvoie l'adresse corrigée si le domaine ressemble de très près
// à un domaine connu, sinon null (aucune suggestion).
function suggererEmail(email) {
  const coupe = email.split('@');
  if (coupe.length !== 2) return null;
  const domaine = coupe[1];
  if (domaine.length < 5 || DOMAINES_COURANTS.indexOf(domaine) !== -1) return null;
  let meilleur = null, meilleureDistance = 3;
  for (const connu of DOMAINES_COURANTS) {
    const d = distanceMots(domaine, connu);
    if (d < meilleureDistance) { meilleureDistance = d; meilleur = connu; }
  }
  // Distance 2 acceptée seulement sur les domaines assez longs,
  // pour éviter de corriger une adresse professionnelle valide.
  if (!meilleur) return null;
  if (meilleureDistance === 2 && domaine.length < 8) return null;
  return coupe[0] + '@' + meilleur;
}

let emailConfirme = false;

function masquerSuggestion() {
  document.getElementById('suggestion-email').hidden = true;
}

function proposerCorrection(suggestion) {
  document.getElementById('suggestion-valeur').textContent = suggestion;
  reveler(document.getElementById('suggestion-email'));
}

document.getElementById('input-email').addEventListener('input', () => {
  emailConfirme = false;
  masquerSuggestion();
});

document.getElementById('btn-suggestion-oui').addEventListener('click', () => {
  document.getElementById('input-email').value =
    document.getElementById('suggestion-valeur').textContent;
  emailConfirme = true;
  masquerSuggestion();
  validerCoordonnees();
});

document.getElementById('btn-suggestion-non').addEventListener('click', () => {
  emailConfirme = true;
  masquerSuggestion();
  validerCoordonnees();
});

// --------------------------------------------
// COORDONNÉES + VALIDATION
// --------------------------------------------
async function validerCoordonnees() {
  const champEmail = document.getElementById('input-email');
  const email = nettoyerEmail(champEmail.value);
  if (email !== champEmail.value) champEmail.value = email;
  const tel = document.getElementById('input-tel').value.trim();
  const reglement = document.getElementById('check-reglement').checked;
  const erreur = document.getElementById('erreur-coordonnees');
  erreur.hidden = true;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    erreur.textContent = 'Cette adresse e-mail ne semble pas valide.';
    reveler(erreur);
    return;
  }
  if (!reglement) {
    erreur.textContent = 'Il faut cocher la première case pour participer.';
    reveler(erreur);
    return;
  }

  // Domaine qui ressemble à une faute de frappe : on demande une
  // confirmation, une seule fois, sans jamais bloquer le joueur.
  if (!emailConfirme) {
    const suggestion = suggererEmail(email);
    if (suggestion) {
      proposerCorrection(suggestion);
      return;
    }
  }
  masquerSuggestion();

  reponses.email = email;
  reponses.telephone = tel || null;

  // La question des bons plans a déjà été posée, juste après le test :
  // sa réponse part dans la même ligne que la participation.
  lancerLaPartie();
}

async function lancerLaPartie() {
  if (PARTIES_ILLIMITEES && window.PullUpBons && window.PullUpBons.toutEffacer) {
    window.PullUpBons.toutEffacer();
  }
  // Le bonus du ticket est tiré ICI, avant le lot : c'est ce qui permet
  // à « Chance doublée » de vraiment doubler les chances du joueur.
  // Le ticket, plus tard, ne fait que révéler cette carte.
  preparerBonus();

  // Tirage local, qui ne sert que de repli si le serveur ne répond pas :
  // en marche normale, enregistrerParticipation() remplace ces deux
  // valeurs par celles que le serveur a tirées lui-même.
  lotGagne = tirerLot();
  codeLot = genererCode();

  const btn = document.getElementById('btn-valider');
  btn.disabled = true;
  btn.classList.add('travaille');
  btn.setAttribute('aria-busy', 'true');

  const statut = await enregistrerParticipation();

  // LE OUI DU JOUEUR DOIT ARRIVER JUSQU'EN BASE (corrigé le 26/08/2026).
  // Quand c'est le serveur qui enregistre la participation (fonction
  // roue_jouer), il écrit consentement_marketing = false en dur : la
  // réponse du joueur était donc perdue, et la base d'abonnés se
  // remplissait de « non » alors que des gens avaient dit oui. On la
  // renvoie ici par la porte prévue pour ça, qui ne touche que cette
  // seule colonne. Un mineur n'a jamais pu dire oui (protection en
  // amont, plus un garde-fou dans la base).
  if (statut === 'ok' && codeLot && reponses.consentement_marketing === true) {
    try {
      await sb.rpc('roue_enregistrer_consentement', { p_code: codeLot, p_accepte: true });
    } catch (e) {
      console.warn('Consentement non remonté :', e);
    }
  }

  btn.disabled = false;
  btn.classList.remove('travaille');
  btn.removeAttribute('aria-busy');

  if (statut === 'deja-joue') {
    // Le verrou de la base, lui, ne bouge JAMAIS : la partie qui suit
    // se déroule avec le lot tiré par la page, elle n'est simplement
    // pas réenregistrée.
    afficherEcran('ecran-deja-joue');
    const bloc = document.getElementById('deja-joue-essai');
    if (bloc) bloc.hidden = !PARTIES_ILLIMITEES;
    return;
  }

  preparerGrattage();
  afficherEcran('ecran-grattage');
}

document.getElementById('btn-valider').addEventListener('click', validerCoordonnees);

// « Rejouer quand même » : n'existe que sur la version d'essai. La
// partie se joue avec le lot tiré par la page, et elle n'est pas
// réenregistrée (le verrou de la base n'est pas contourné).
const btnRejouerEssai = document.getElementById('btn-rejouer-essai');
if (btnRejouerEssai) {
  btnRejouerEssai.addEventListener('click', () => {
    if (!PARTIES_ILLIMITEES) return;
    // La partie d'essai repart de ZÉRO (27/08/2026, Romain) : les bons
    // gagnés aux parties précédentes sont effacés, l'expérience
    // redevient vierge. Uniquement sur la version d'essai : chez une
    // vraie galerie, les bons d'un joueur ne s'effacent jamais.
    if (window.PullUpBons && window.PullUpBons.toutEffacer) window.PullUpBons.toutEffacer();
    lotGagne = tirerLot();
    codeLot = genererCode();
    preparerBonus();
    preparerGrattage();
    afficherEcran('ecran-grattage');
  });
}

// --------------------------------------------
// CHARGEMENT OPÉRATION + LOTS DEPUIS SUPABASE
// --------------------------------------------
async function chargerOperation() {
  if (OPERATIONS_LOCALES[EVENEMENT]) {
    OPERATION = { ...OPERATION, ...OPERATIONS_LOCALES[EVENEMENT] };
    // L'habillage de secours est posé TOUT DE SUITE, sans attendre la
    // base : le joueur voit le nom de sa galerie dès la première image
    // de l'écran, au lieu de voir « La Roue Pull Up » pendant une
    // seconde puis le titre changer sous ses yeux. La base corrige
    // ensuite, si elle dit autre chose.
    appliquerOperation();
    creerFlocons();
  }
  try {
    const { data, error } = await sb
      .from('roue_operations')
      .select('*')
      .eq('slug', EVENEMENT)
      .maybeSingle();
    if (!error && data) {
      OPERATION = { ...OPERATION, ...data };
      // CE QUI EST GRAPHIQUE RESTE DÉCIDÉ ICI (26/08/2026).
      // La table roue_operations n'a pas de colonne logo, et sa colonne
      // theme porte encore l'ancien univers (« noel ») : si on la
      // laissait gagner, le thème du cirque tomberait dès que la base
      // répond. Le nom, le lieu, les dates et l'ouverture, eux,
      // continuent de venir de la base.
      const local = OPERATIONS_LOCALES[EVENEMENT];
      if (local) {
        ['theme', 'logo', 'accroche'].forEach(cle => {
          if (local[cle]) OPERATION[cle] = local[cle];
        });
      }
    }
  } catch (e) {
    console.warn('Habillage par défaut utilisé :', e);
  }
  appliquerOperation();
  creerFlocons();
  if (!operationOuverte()) afficherEcran('ecran-ferme');
}

// FILET : AUCUNE VRAIE ENSEIGNE À L'ÉCRAN TANT QU'ELLE N'A PAS SIGNÉ
// ------------------------------------------------------------------
// Constaté le 25/08/2026 en jouant une partie gagnante : l'écran de
// résultat affichait « Chez Brioche Dorée ». La base porte encore six
// noms de vraies enseignes (Carrefour, Celio, Big Fernand, Saint
// Algue, Brioche Dorée, Yves Rocher) : le fichier
// CORRIGER-AVANT-LA-DEMO.sql, écrit pour ça, n'a pas encore été
// exécuté par Romain.
//
// Montrer ces noms à Mercialys, la foncière qui loue justement à ces
// enseignes, serait le genre de détail qui fait dérailler un rendez
// -vous, et un juriste y verrait un usage de marque sans accord.
// Cette table remplace donc les noms à l'affichage, en attendant que
// la base soit corrigée. Elle ne modifie RIEN en base.
//
// À RETIRER le jour où CORRIGER-AVANT-LA-DEMO.sql aura été lancé (elle
// ne fera alors plus rien, puisque les noms seront déjà génériques).
const COMMERCANTS_A_NEUTRALISER = {
  'carrefour':     'Le supermarché de la galerie',
  'celio':         'La boutique de mode homme',
  'big fernand':   'Le comptoir à burgers',
  'saint algue':   'Le salon de coiffure',
  'brioche dorée': 'La boulangerie de la galerie',
  'brioche doree': 'La boulangerie de la galerie',
  'yves rocher':   'L’institut beauté'
};

// La comparaison ignore la casse, les accents et les espaces en trop :
// « BRIOCHE DOREE » et « Brioche  Dorée » doivent être reconnus comme
// une seule et même enseigne.
function cleEnseigne(nom) {
  return String(nom || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function commercantPresentable(nom) {
  const propre = String(nom || '').trim();
  const generique = COMMERCANTS_A_NEUTRALISER[cleEnseigne(propre)];
  if (!generique) return propre;
  console.warn('Enseigne réelle remplacée à l’écran : « ' + propre +
    ' ». Lancer CORRIGER-AVANT-LA-DEMO.sql dans Supabase.');
  return generique;
}

// Le filet ne servait qu'aux lots. Les bons plans et les nouveautés
// portent eux aussi un nom d'enseigne, et leurs tables sont vides
// aujourd'hui : le jour où une galerie les remplira, le même risque
// reviendra par cette porte-là. On les fait donc passer par le filet.
function neutraliserEnseignes(liste) {
  if (!Array.isArray(liste)) return liste;
  return liste.map(item => {
    if (!item || !item.enseigne) return item;
    const presentable = commercantPresentable(item.enseigne);
    return presentable === item.enseigne ? item : { ...item, enseigne: presentable };
  });
}

async function chargerLots() {
  const secours = OPERATIONS_LOCALES[EVENEMENT];
  if (secours && secours.lots) LOTS = secours.lots;
  // SUR LA VERSION D'ESSAI, LES LOTS LOCAUX PRIMENT (27/08/2026).
  // La table roue_lots porte encore les anciens noms génériques
  // (« Bon d'achat 10 € », « la boulangerie de la galerie »...) : la
  // démonstration montrait ces lots-là au lieu de ceux dictés par
  // Romain (samoussas Taïlu, cookie Madame Cookie...). Même logique
  // que pour le thème et le logo : en essai, l'habillage local fait
  // foi. En vraie galerie, c'est la base qui commande, comme toujours.
  if (PARTIES_ILLIMITEES && secours && secours.lots) return;
  try {
    const { data, error } = await sb
      .from('roue_lots')
      .select('nom, emoji, poids, perdant, commercant')
      .eq('actif', true)
      .eq('operation', EVENEMENT)
      .order('ordre');
    if (!error && data && data.length >= 2) {
      LOTS = data.map(l => ({
        nom: l.nom,
        emoji: l.emoji || '🎁',
        poids: l.poids ?? 10,
        perdant: !!l.perdant,
        commercant: commercantPresentable(l.commercant)
      }));
    }
  } catch (e) {
    console.warn('Lots par défaut utilisés :', e);
  }
}

// --------------------------------------------
// DÉMARRAGE
// --------------------------------------------
document.getElementById('btn-jouer').addEventListener('click', () => {
  questionActuelle = 0;
  afficherEcran('ecran-quiz');
  afficherQuestion();
  // Les jeux des manches se téléchargent pendant que le joueur répond :
  // ils seront prêts bien avant le ticket à gratter.
  chargerFichiersJeu();
});
// --------------------------------------------
// UTILISATION DU BON CHEZ LE COMMERÇANT
// Le client appuie devant le commerçant. L'écran
// qui suit affiche une horloge qui tourne en direct :
// une capture d'écran ne peut pas la reproduire,
// et le bon est brûlé une fois pour toutes.
// --------------------------------------------
const CLE_BONS = 'roue_bons_utilises';
let horlogeValidation = null;

function bonsUtilises() {
  try { return JSON.parse(localStorage.getItem(CLE_BONS) || '{}'); }
  catch (e) { return {}; }
}

function marquerBonUtilise(code, lot) {
  const bons = bonsUtilises();
  bons[code] = { lot: lot, date: new Date().toISOString() };
  try { localStorage.setItem(CLE_BONS, JSON.stringify(bons)); } catch (e) { /* espace plein */ }
}

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const deuxChiffres = n => String(n).padStart(2, '0');

function dateLisible(d) {
  return JOURS[d.getDay()] + ' ' + d.getDate() + ' à ' +
         deuxChiffres(d.getHours()) + 'h' + deuxChiffres(d.getMinutes());
}

// Validation EN DIRECT : la seconde défile sous les yeux du commerçant.
// Une capture d'écran est figée, donc elle ne trompe personne.
function demarrerHorloge() {
  const zone = document.getElementById('valide-horloge');
  const debut = new Date();
  function battre() {
    // Séparateur cohérent avec les minutes : « 11h10min20 » et non
    // « 11h10:20 », qui mélangeait deux façons d'écrire l'heure.
    zone.textContent = dateLisible(debut) + 'min' + deuxChiffres(new Date().getSeconds()) + 's';
  }
  battre();
  clearInterval(horlogeValidation);
  horlogeValidation = setInterval(battre, 1000);
}

// depuis = null : le bon vient d'être utilisé, à l'instant, devant le commerçant.
// depuis = une date : le bon avait déjà été utilisé, on l'affiche figé et barré.
function afficherBonUtilise(lot, depuis) {
  const bloc = document.getElementById('bon-valide');
  const horloge = document.getElementById('valide-horloge');
  document.getElementById('resultat-code-bloc').hidden = true;
  document.getElementById('confirme-utilisation').hidden = true;
  document.getElementById('valide-lot').textContent = lot || '';
  bloc.classList.remove('bon-perime');
  bloc.hidden = false;

  if (depuis) {
    clearInterval(horlogeValidation);
    bloc.classList.add('bon-perime');
    document.querySelector('.valide-titre').textContent = 'Bon déjà utilisé';
    horloge.textContent = 'Le ' + dateLisible(new Date(depuis));
    document.querySelector('.valide-mention').textContent =
      'Ce bon a déjà servi. Rejoue demain pour en gagner un autre.';
  } else {
    bloc.classList.remove('bon-perime');
    const btnMerci = document.getElementById('btn-merci');
    btnMerci.textContent = 'Merci beaucoup !';
    btnMerci.classList.remove('envoye');
    document.querySelector('.valide-titre').textContent = 'Bon utilisé';
    document.querySelector('.valide-mention').textContent =
      'Cet écran est la preuve. Le bon ne peut plus servir.';
    demarrerHorloge();
    vibrer([40, 60, 40]);
  }
}

document.getElementById('btn-utiliser').addEventListener('click', () => {
  document.getElementById('confirme-detail').innerHTML =
    'Lot à remettre&nbsp;: <strong>' + echap(lotGagne ? lotGagne.nom : '') + '</strong>';
  reveler(document.getElementById('confirme-utilisation'));
  document.getElementById('btn-utiliser').disabled = true;
});

document.getElementById('btn-confirme-non').addEventListener('click', () => {
  document.getElementById('confirme-utilisation').hidden = true;
  document.getElementById('btn-utiliser').disabled = false;
});

document.getElementById('btn-confirme-oui').addEventListener('click', async (evt) => {
  const code = codeLot;
  const lot = lotGagne ? lotGagne.nom : '';
  const bouton = evt.currentTarget;
  bouton.disabled = true;

  // C'est le SERVEUR qui dit si le bon était encore neuf. Avant, l'écran
  // de validation s'affichait sans attendre sa réponse : il suffisait de
  // vider les données du site pour retrouver un bon d'apparence neuve et
  // se faire servir deux fois.
  //
  // Trois réponses possibles :
  //   - le bon vient d'être brûlé      -> écran vert « Bon utilisé »
  //   - le bon avait déjà servi        -> écran ROUGE « Bon déjà utilisé »
  //   - le serveur ne connaît pas le code (participation encore en attente
  //     d'envoi, réseau coupé) -> on fait confiance au joueur. Refuser un
  //     vrai gagnant parce que la 4G est capricieuse coûterait plus cher,
  //     en image, que la fraude évitée.
  let dejaUtiliseLe = null;
  try {
    const { data, error } = await sb.rpc('roue_bon_etat', { p_code: code });
    if (!error && data && data.trouve && data.deja_utilise) {
      dejaUtiliseLe = data.utilise_le || new Date().toISOString();
    }
  } catch (e) {
    console.warn('Utilisation non remontée :', e);
  }

  bouton.disabled = false;
  marquerBonUtilise(code, lot);
  afficherBonUtilise(lot, dejaUtiliseLe);

  // Et on brûle le bon côté serveur : il ne pourra plus resservir
  // depuis le lien reçu par e-mail, même sur un autre téléphone.
  if (window.PullUpMails) {
    window.PullUpMails.marquerUtilise(window.PullUpMails.jetonCourant);
  }
});

// --------------------------------------------
// RETOUR SUR SON BON DEPUIS LE LIEN DE L'E-MAIL
// (...?e=cap-sacre-coeur&bon=JETON)
// Le bon reste utilisable, avec le même verrou :
// une fois validé chez le commerçant, il est brûlé.
// --------------------------------------------
window.roueAfficherBonRetrouve = function (bon) {
  lotGagne = { nom: bon.lot, commercant: bon.commercant || '', perdant: false };
  codeLot = bon.code;
  reponses.prenom = bon.prenom || reponses.prenom;
  // Le consentement aux offres a déjà été demandé le jour du jeu
  reponses.consentement_marketing = null;

  const emoji = document.getElementById('resultat-emoji');
  emoji.classList.remove('hero-photo');
  emoji.innerHTML = medaillonIcone(iconePourLot(bon.lot));
  document.getElementById('resultat-titre').textContent = 'Ton bon cadeau';
  document.getElementById('resultat-texte').textContent =
    (bon.prenom ? bon.prenom + ', te' : 'Te') + ' voilà de retour. Ton cadeau t’attend.';

  const bandeau = document.getElementById('resultat-commercant');
  if (bon.commercant) {
    bandeau.textContent = nommerCommercant(bon.commercant);
    bandeau.hidden = false;
  } else {
    bandeau.hidden = true;
  }

  document.getElementById('resultat-code').textContent = bon.code;
  document.getElementById('resultat-code-info').textContent =
    'Montre cet écran au commerçant, il valide lui-même.';
  document.getElementById('resultat-code-bloc').hidden = false;
  document.getElementById('bon-valide').hidden = true;
  document.getElementById('confirme-utilisation').hidden = true;
  document.getElementById('btn-utiliser').disabled = false;
  document.getElementById('btn-rejouer-bonus').hidden = true;
  // Le joueur revient sur un bon gagné : le bloc de non-gain n'a rien
  // à faire là.
  const consolationRetour = document.getElementById('resultat-consolation');
  if (consolationRetour) consolationRetour.hidden = true;
  // La mention est masquée sur l'écran d'un perdant : on la rouvre ici,
  // sinon un joueur qui revient sur son bon ne lirait plus la règle.
  document.getElementById('resultat-mention').hidden = false;
  document.getElementById('resultat-mention').textContent =
    'Ce bon ne peut être utilisé qu’une seule fois.';

  if (bon.utilise_le) afficherBonUtilise(bon.lot, bon.utilise_le);

  afficherEcran('ecran-resultat');
};

document.getElementById('btn-garder-bon').addEventListener('click', () => {
  proposerLesOffres();
});

// Le joueur peut remercier son commerçant d'un geste
document.getElementById('btn-merci').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  btn.textContent = 'Merci envoyé';
  btn.classList.add('envoye');
  vibrer(30);
  try {
    await sb.rpc('roue_dire_merci', { p_code: codeLot });
  } catch (err) {
    console.warn('Merci non remonté :', err);
  }
});

// --------------------------------------------
// APRÈS LE JEU : bons plans et retour
// --------------------------------------------
// Second tour offert par le ticket à gratter (quel que soit le jeu)
document.getElementById('btn-rejouer-bonus').addEventListener('click', async (e) => {
  const bouton = e.currentTarget;
  bouton.disabled = true;
  toursRestants--;
  const codePrecedent = codeLot;
  // Repli local, remplacé juste après si le serveur répond.
  lotGagne = tirerLot();
  codeLot = genererCode();
  // Le second tour est lui aussi tiré par le serveur, et il remplace
  // le lot de la première partie en base : le joueur ne repart qu'avec
  // un seul bon, celui qu'il voit à l'écran.
  try {
    const { data, error } = await sb.rpc('roue_rejouer', { p_code: codePrecedent });
    if (!error && data && data.statut === 'ok') appliquerLotServeur(data);
  } catch (err) {
    console.warn('Second tour non remonté :', err && err.message);
  }
  bouton.disabled = false;
  lancerJeu(true);
});

document.getElementById('btn-voir-promos').addEventListener('click', proposerLesOffres);

// « Continuer » : le seul bouton de l'écran de résultat. C'est lui qui
// ouvre la galerie, les promos et le programme, une fois que le joueur
// a lu son résultat et rien d'autre.
// APRÈS LE RÉSULTAT, ON VA CHERCHER SON CADEAU (27/08/2026, Romain :
// « au lieu de continuer, il faut basculer sur la page » des cadeaux
// gagnés). Le gagnant part donc droit sur ses bons ; celui qui n'a
// rien gagné continue vers la galerie, comme avant.
document.getElementById('btn-resultat-continuer').addEventListener('click', () => {
  const gagnant = lotGagne && !lotGagne.perdant;
  proposerLesOffres(gagnant ? afficherMesBons : afficherDecouverte);
});
document.getElementById('btn-promos-retour').addEventListener('click', () => afficherDecouverte());
document.getElementById('btn-retour-accueil').addEventListener('click', () => afficherEcran('ecran-accueil', 'arriere'));

// Offres du moment : celles de l'opération, filtrées sur le profil du joueur
// Le contenu qui arrive est dessiné en creux, avec un reflet qui le
// balaye : on montre la forme de ce qui vient, jamais « Un instant… ».
function squelettes(nombre) {
  let html = '';
  for (let i = 0; i < nombre; i++) {
    html += '<div class="squelette-carte" aria-hidden="true">' +
              '<span class="squelette squelette-ligne courte"></span>' +
              '<span class="squelette squelette-ligne large"></span>' +
              '<span class="squelette squelette-ligne moyenne"></span>' +
            '</div>';
  }
  return '<div class="squelettes" role="status" aria-label="Chargement en cours">' + html + '</div>';
}

async function afficherPromos() {
  const liste = document.getElementById('promos-liste');
  const soustitre = document.getElementById('promos-soustitre');
  liste.innerHTML = squelettes(3);
  activerOnglet('promos');
  afficherEcran('ecran-promos');

  let offres = [];
  try {
    const { data, error } = await sb
      .from('roue_offres')
      .select('enseigne, titre, detail, univers, valable_jusqu_au, bon')
      .eq('operation', EVENEMENT)
      .eq('actif', true)
      .order('ordre');
    if (!error && data && data.length) offres = data;
  } catch (e) {
    console.warn('Offres indisponibles :', e);
  }

  // Rien en base : on montre les exemples de démonstration
  if (!offres.length && typeof OFFRES_DEMO !== 'undefined') offres = OFFRES_DEMO;
  offres = neutraliserEnseignes(offres);

  if (!offres.length) {
    liste.innerHTML = '<p class="promo-vide">Les bons plans arrivent très bientôt.<br>Reviens jouer demain pour les découvrir.</p>';
    return;
  }

  // Les univers cochés par le joueur passent en tête
  const gouts = (reponses.univers || '').split(',').filter(Boolean);
  if (gouts.length) {
    offres = offres.slice().sort((a, b) =>
      (gouts.indexOf(a.univers) === -1 ? 1 : 0) - (gouts.indexOf(b.univers) === -1 ? 1 : 0));
    soustitre.textContent = 'Toutes les offres de la galerie, en commençant par ce que tu aimes.';
  }

  liste.innerHTML = '';

  // LE RAPPEL DES BONS DÉJÀ EN POCHE (26/08/2026)
  // Le joueur qui a déjà un bon arrive ici pour en prendre d'autres. Sans
  // ce rappel, rien ne lui dit qu'il en a un qui l'attend, et il ressort
  // de la galerie sans l'utiliser. Une ligne, cliquable, qui mène droit
  // au portefeuille.
  if (window.PullUpBons) {
    const enPoche = window.PullUpBons.combienValables();
    if (enPoche > 0) {
      const rappel = document.createElement('button');
      rappel.type = 'button';
      rappel.className = 'rappel-bons';
      rappel.innerHTML =
        '<span class="rappel-bons-mot">' +
          (enPoche > 1 ? 'Tu as déjà <strong>' + enPoche + ' bons</strong> à utiliser'
                       : 'Tu as déjà <strong>un bon</strong> à utiliser') +
        '</span><span class="rappel-bons-lien">Les voir</span>';
      rappel.addEventListener('click', function () { afficherMesBons(); });
      liste.appendChild(rappel);
    }
  }

  offres.forEach((o, index) => {
    const pourToi = gouts.indexOf(o.univers) !== -1;
    const carte = document.createElement('article');
    carte.className = 'promo';
    carte.style.animationDelay = (0.06 + Math.min(index, 8) * 0.06) + 's';
    carte.innerHTML =
      `<div class="promo-haut">
         <div class="promo-enseigne">${echap(o.enseigne || '')}</div>
         ${pourToi ? '<span class="promo-pour-toi">Pour toi</span>' : ''}
       </div>
       <div class="promo-titre">${echap(o.titre || '')}</div>
       <div class="promo-detail">${echap(o.detail || '')}</div>
       ${o.valable_jusqu_au ? `<span class="promo-fin">Valable jusqu'au ${echap(o.valable_jusqu_au)}</span>` : ''}`;

    if (o.bon) {
      const btn = document.createElement('button');
      btn.addEventListener('click', function () { retourDuBonPromo = 'promos'; });
      // La clé d'un bon de promotion est SON CODE, pas sa position dans
      // la liste : les offres sont triées selon les goûts du joueur, donc
      // la position change d'une visite à l'autre. Avec l'ancienne clé,
      // un bon déjà utilisé pouvait réapparaître comme neuf sur une autre
      // carte, et un bon neuf s'afficher comme déjà utilisé.
      const deja = bonsUtilises()[codePromo(o.enseigne, index)];
      btn.className = 'btn btn-or promo-bon' + (deja ? ' obtenu' : '');
      btn.textContent = deja ? 'Bon déjà utilisé' : 'Obtenir mon bon';
      btn.addEventListener('click', () => ouvrirBonPromo(o, index));
      carte.appendChild(btn);
    } else {
      // Pas de bon à retirer : c'est une offre qui s'applique
      // directement en boutique. Sans cette ligne, la carte s'arrête
      // sans dire quoi faire, et le joueur cherche un bouton qui
      // n'existe pas.
      const mention = document.createElement('span');
      mention.className = 'promo-directe';
      mention.textContent = 'Offre valable directement en boutique, sans code.';
      carte.appendChild(mention);
    }
    liste.appendChild(carte);
  });
}

// --------------------------------------------
// BON OBTENU DEPUIS UNE PROMOTION
// Même principe que le bon de la roue : le
// commerçant valide, l'horloge fait la preuve.
// --------------------------------------------
let promoEnCours = null;
// L'écran du bon de promotion s'ouvre depuis deux endroits : la liste
// des promos, et le portefeuille « Mes bons ». Le bouton de retour doit
// ramener d'où l'on vient, pas toujours au même endroit.
let retourDuBonPromo = 'promos';

function ouvrirBonPromo(offre, index) {
  // `offre.codeFige` arrive quand on rouvre un bon depuis « Mes bons » :
  // le code doit être celui qui a été donné au joueur, pas un code
  // recalculé depuis une position dans une liste qui a pu bouger.
  const code = offre.codeFige || codePromo(offre.enseigne, index);
  promoEnCours = { offre: offre, cle: code, code: code };
  document.getElementById('bon-promo-medaillon').innerHTML = medaillonIcone(iconePourLot(offre.titre));
  document.getElementById('bon-promo-medaillon').classList.remove('hero-photo');
  document.getElementById('bon-promo-enseigne').textContent = offre.enseigne || '';
  document.getElementById('bon-promo-code').textContent = promoEnCours.code;
  document.getElementById('bon-promo-detail').textContent = offre.bon || '';
  document.getElementById('confirme-promo').hidden = true;
  document.getElementById('btn-promo-utiliser').disabled = false;
  const retour = document.getElementById('btn-bon-promo-retour');
  if (retour) retour.textContent = retourDuBonPromo === 'mesbons' ? 'Retour à mes bons' : 'Retour aux promos';

  // Le bon entre dans le portefeuille dès qu'il est pris : c'est là que
  // le joueur le considère comme sien.
  if (window.PullUpBons) {
    window.PullUpBons.ajouter({
      code: promoEnCours.code,
      lot: offre.titre || '',
      commercant: offre.enseigne || '',
      detail: offre.bon || '',
      source: 'promo',
      validite: offre.valable_jusqu_au || ''
    });
    rafraichirOngletBons();
  }

  const deja = bonsUtilises()[promoEnCours.cle];
  const bloc = document.getElementById('bon-promo-valide');
  if (deja) {
    afficherBonPromoUtilise(deja.lot, deja.date);
  } else {
    bloc.hidden = true;
    document.querySelector('#ecran-bon-promo .code-bloc').hidden = false;
  }
  afficherEcran('ecran-bon-promo');
}

// Code lisible, stable pour une même offre
function codePromo(enseigne, index) {
  const lettres = (enseigne || 'PU').replace(/[^A-Za-zÀ-ÿ]/g, '').toUpperCase().slice(0, 3) || 'PU';
  return lettres + '-' + String(1000 + index * 137 % 9000);
}

function afficherBonPromoUtilise(lot, depuis) {
  const bloc = document.getElementById('bon-promo-valide');
  document.querySelector('#ecran-bon-promo .code-bloc').hidden = true;
  document.getElementById('confirme-promo').hidden = true;
  document.getElementById('bon-promo-valide-lot').textContent = lot || '';
  bloc.hidden = false;
  const horloge = document.getElementById('bon-promo-horloge');

  if (depuis) {
    clearInterval(horlogeValidation);
    bloc.classList.add('bon-perime');
    document.getElementById('bon-promo-valide-titre').textContent = 'Bon déjà utilisé';
    horloge.textContent = 'Le ' + dateLisible(new Date(depuis));
    document.getElementById('bon-promo-valide-mention').textContent = 'Ce bon a déjà servi.';
  } else {
    bloc.classList.remove('bon-perime');
    document.getElementById('bon-promo-valide-titre').textContent = 'Bon utilisé';
    document.getElementById('bon-promo-valide-mention').textContent = 'Cet écran est la preuve. Le bon ne peut plus servir.';
    const debut = new Date();
    function battre() {
      horloge.textContent = dateLisible(debut) + 'min' + deuxChiffres(new Date().getSeconds()) + 's';
    }
    battre();
    clearInterval(horlogeValidation);
    horlogeValidation = setInterval(battre, 1000);
    vibrer([40, 60, 40]);
  }
}

document.getElementById('btn-promo-utiliser').addEventListener('click', () => {
  document.getElementById('confirme-promo-detail').innerHTML =
    'À remettre&nbsp;: <strong>' + echap(promoEnCours.offre.bon || '') + '</strong>';
  reveler(document.getElementById('confirme-promo'));
  document.getElementById('btn-promo-utiliser').disabled = true;
});
document.getElementById('btn-promo-confirme-non').addEventListener('click', () => {
  document.getElementById('confirme-promo').hidden = true;
  document.getElementById('btn-promo-utiliser').disabled = false;
});
document.getElementById('btn-promo-confirme-oui').addEventListener('click', () => {
  marquerBonUtilise(promoEnCours.cle, promoEnCours.offre.bon);
  afficherBonPromoUtilise(promoEnCours.offre.bon, null);
});
document.getElementById('btn-bon-promo-retour').addEventListener('click', function () {
  if (retourDuBonPromo === 'mesbons') { afficherMesBons(); return; }
  afficherPromos();
});

// --------------------------------------------
// LES BONS PLANS
// L'écran est passé AVANT les jeux le 25/08/2026 : il arrive juste
// après les coordonnées, quand le joueur vient de dire ce qu'il aime.
// Il garde son bouton d'accès depuis l'espace découverte, pour celui
// qui a d'abord dit non et change d'avis.
//
// RGPD : le consentement doit rester libre et éclairé. On explique donc
// exactement ce qui sera envoyé, à quelle fréquence, et on écrit noir
// sur blanc que le choix ne change RIEN à la partie ni au lot. Aucun
// avantage n'est promis en échange d'un oui : un consentement acheté
// n'est pas un consentement libre, et il ne vaudrait rien devant un
// contrôle. Les moins de 18 ans ne voient jamais cet écran, leur
// réponse est forcée à non en amont (voir adapterCoordonneesMineur).
// --------------------------------------------
let suiteApresOffres = null;

function proposerLesOffres(suite) {
  suiteApresOffres = (typeof suite === 'function') ? suite : afficherDecouverte;
  // Déjà répondu, ou joueur mineur : on ne repose pas la question
  if (reponses.consentement_marketing !== undefined || reponses.age_tranche === '-18') {
    if (reponses.age_tranche === '-18') {
      reponses.consentement_marketing = false;
      document.getElementById('offres-mineurs').hidden = false;
    }
    suiteApresOffres();
    return;
  }
  document.getElementById('offres-medaillon').innerHTML = medaillonIcone(ICONES.bon);
  document.getElementById('offres-medaillon').classList.remove('hero-photo');
  habillerLesOffres();
  reposerLesOffres();          // la relance d'un passage précédent se replie
  afficherEcran('ecran-offres');
}

// L'ÉCRAN DES BONS PLANS : TROIS LIGNES, PAS UNE DE PLUS
// ------------------------------------------------------
// 26/08/2026, Romain : « il y a trop d'informations ». L'écran portait
// l'aperçu de l'e-mail du jeudi et quatre promesses détaillées ; il
// tient maintenant en un titre, une phrase et la question. Ce qui est
// promis reste vrai : un seul envoi par semaine, et le refus est au
// même endroit qu'avant.
function habillerLesOffres() {
  const prenom = (reponses.prenom || '').trim();
  const rayon = (reponses.univers || '').split(',').filter(Boolean)[0] || '';
  const titre = document.getElementById('offres-titre');
  const sousTitre = document.getElementById('offres-soustitre');

  if (titre) {
    titre.textContent = prenom
      ? prenom + ', tes bons plans t’attendent chaque jeudi.'
      : 'Les bons plans de la galerie, chaque jeudi.';
  }
  if (sousTitre) {
    // Le rayon préféré du joueur se glisse dans la phrase, sans
    // l'allonger : « côté mode », « côté gourmandise ».
    sousTitre.textContent = MOT_DU_RAYON[rayon]
      ? 'Chaque jeudi, reçois un mail avec les cadeaux, les promos et les nouveautés, côté ' +
        MOT_DU_RAYON[rayon] + ' en premier. Un seul mail par semaine, promis.'
      : 'Chaque jeudi, reçois un mail avec les cadeaux, les promos et les nouvelles collections. Un seul mail par semaine, promis.';
  }
}

// Le nom lisible d'un rayon, pour parler au joueur dans sa langue.
const MOT_DU_RAYON = {
  mode: 'mode', beaute: 'beauté', bijoux: 'bijoux', hightech: 'high-tech',
  sport: 'sport', gourmandise: 'gourmandise', enfants: 'enfants', maison: 'maison'
};

async function repondreOffres(accepte) {
  reponses.consentement_marketing = accepte;
  // Si la participation est déjà en base (le joueur revient sur la
  // question depuis l'espace découverte), on tente la mise à jour par
  // la fonction serveur. Dans le parcours normal, la réponse est
  // simplement embarquée dans l'enregistrement qui suit.
  if (codeLot) {
    try {
      await sb.rpc('roue_enregistrer_consentement', { p_code: codeLot, p_accepte: accepte });
    } catch (e) {
      console.warn('Consentement non remonté :', e);
    }
  }
  const suite = suiteApresOffres || afficherDecouverte;
  suiteApresOffres = null;
  suite();
}

document.getElementById('btn-offres-oui').addEventListener('click', () => repondreOffres(true));

// LA RELANCE DU PREMIER « NON » (27/08/2026, Romain) : on repose la
// question UNE fois, autrement. Le premier bouton s'efface, la relance
// prend sa place. Le deuxième « non » est définitif : repondreOffres
// enregistre le refus et la partie continue, personne n'insiste.
document.getElementById('btn-offres-non').addEventListener('click', () => {
  const relance = document.getElementById('offres-relance');
  const premierNon = document.getElementById('btn-offres-non');
  if (relance) {
    relance.hidden = false;
    premierNon.hidden = true;
    // La relance arrive sous les yeux, pas hors de l'écran.
    relance.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    repondreOffres(false);
  }
});
document.getElementById('btn-offres-oui2').addEventListener('click', () => repondreOffres(true));
document.getElementById('btn-offres-non2').addEventListener('click', () => repondreOffres(false));

// L'écran des offres peut resservir (retour en arrière, nouvelle
// partie d'essai) : la relance se replie à chaque affichage.
function reposerLesOffres() {
  const relance = document.getElementById('offres-relance');
  const premierNon = document.getElementById('btn-offres-non');
  if (relance) relance.hidden = true;
  if (premierNon) premierNon.hidden = false;
}

// --------------------------------------------
// L'ESPACE DÉCOUVERTE
// Après le jeu, le joueur ne tombe plus d'office
// sur les promos : on lui demande ce qu'il veut
// voir. Deux grandes cartes en photo, et un accès
// discret au programme des animations.
// --------------------------------------------
function afficherDecouverte() {
  const prenom = (reponses.prenom || '').trim();
  document.getElementById('decouverte-titre').textContent =
    prenom ? 'Et maintenant, ' + prenom + ' ?' : 'Et maintenant ?';

  // Si le joueur a coché des rayons, on le lui rappelle : le contenu
  // qu'il va voir est trié pour lui, autant le dire.
  const gouts = (reponses.univers || '').split(',').filter(Boolean);
  document.getElementById('decouverte-soustitre').textContent = gouts.length
    ? 'Choisis ton univers, on classe tout selon ce que tu aimes.'
    : 'Qu’est-ce que tu as envie de voir dans la galerie ?';

  // La carte « Mes bons » n'apparaît que si le joueur a quelque chose à
  // présenter. Elle est recalculée à chaque passage : un bon utilisé
  // entre-temps doit la faire disparaître.
  rafraichirOngletBons();

  afficherEcran('ecran-decouverte');
}

// --------------------------------------------
// LA BARRE D'ONGLETS
// Une fois dans la galerie, on passe d'un univers
// à l'autre sans jamais revenir en arrière.
// --------------------------------------------
const VUES_GALERIE = [
  // PLUS D'ONGLET POUR LES BONS (27/08/2026, Romain : « il n'y aura pas
  // les bons, il y aura juste promos, nouveautés et programme »). On y
  // accède par la grande carte « Obtenir mes cadeaux » de l'écran de
  // découverte, et par le bouton de fin de partie : deux portes larges
  // valent mieux qu'un quatrième onglet qui serre les trois autres.
  { cle: 'promos',     libelle: 'Réductions', ouvrir: function () { afficherPromos(); } },
  { cle: 'nouveautes', libelle: 'Nouveautés', ouvrir: function () { afficherNouveautes(); } },
  { cle: 'programme',  libelle: 'Programme',  ouvrir: function () { afficherProgramme(); } }
];
let vueCourante = null;

function installerOnglets() {
  document.querySelectorAll('.onglets-zone').forEach(function (zone) {
    const nav = document.createElement('nav');
    nav.className = 'onglets';
    nav.setAttribute('aria-label', 'Les univers de la galerie');
    VUES_GALERIE.forEach(function (vue) {
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'onglet';
      bouton.dataset.vue = vue.cle;
      bouton.textContent = vue.libelle;
      bouton.addEventListener('click', function () {
        if (vueCourante === vue.cle) return;
        vue.ouvrir();
      });
      nav.appendChild(bouton);
    });
    zone.appendChild(nav);
  });
}

function activerOnglet(cle) {
  vueCourante = cle;
  document.querySelectorAll('.onglet').forEach(function (bouton) {
    const actif = bouton.dataset.vue === cle;
    bouton.classList.toggle('actif', actif);
    bouton.setAttribute('aria-current', actif ? 'true' : 'false');
  });
}

// --------------------------------------------
// MES BONS (26/08/2026)
// --------------------------------------------
// Tout ce que le joueur peut présenter à un commerçant, réuni : le lot
// gagné en jouant et les bons pris sur les promotions. La liste et les
// tickets sont dessinés par bons.js ; ici, on ne fait que l'ouvrir et
// brancher le bouton de validation sur l'écran de confirmation qui
// existe déjà.
function afficherMesBons() {
  const liste = document.getElementById('mes-bons-liste');
  const soustitre = document.getElementById('mesbons-soustitre');
  activerOnglet('mesbons');
  afficherEcran('ecran-mes-bons');
  if (!window.PullUpBons || !liste) return;

  const valables = window.PullUpBons.combienValables();
  if (soustitre) {
    soustitre.textContent = valables > 1
      ? 'Présente le code du bon que tu utilises. Un bon ne sert qu’une fois.'
      : 'Présente ton code au commerçant. Un bon ne sert qu’une fois.';
  }

  window.PullUpBons.rendre(liste, function (bon) {
    // Le bon du jeu et les bons de promotion n'ont pas le même écran de
    // validation : chacun a le sien depuis toujours, avec son horloge et
    // sa preuve. On renvoie donc le joueur sur le bon des deux, plutôt
    // que d'en fabriquer un troisième qui dirait la même chose.
    if (bon.source === 'promo') {
      retourDuBonPromo = 'mesbons';
      ouvrirBonPromo({
        enseigne: bon.commercant,
        titre: bon.lot,
        bon: bon.detail,
        codeFige: bon.code
      }, null);
    } else {
      afficherResultat();
    }
  });
}

// L'onglet et la carte « Mes bons » n'existent que quand il y a un bon.
// Appelé après chaque gain et après chaque bon pris sur une promotion.
function rafraichirOngletBons() {
  const combien = window.PullUpBons ? window.PullUpBons.combienValables() : 0;
  const total = window.PullUpBons ? window.PullUpBons.liste().length : 0;

  // L'onglet des bons n'existe plus (27/08/2026) : s'il traîne encore
  // dans une page mise en cache, on le referme au lieu de le laisser
  // ouvrir une vue qui n'est plus dans la barre.
  document.querySelectorAll('.onglet[data-vue="mesbons"]').forEach(function (b) {
    b.hidden = true;
  });

  // La carte, elle, est la porte principale : elle porte le mot
  // « cadeaux », celui que le joueur a en tête en sortant du jeu.
  const carte = document.getElementById('carte-mesbons');
  if (carte) {
    carte.hidden = total === 0;
    const titre = document.getElementById('carte-mesbons-titre');
    if (titre) titre.textContent = combien > 1 ? 'Obtenir mes cadeaux' : 'Obtenir mon cadeau';
  }
}

// --------------------------------------------
// LES NOUVEAUTÉS ET LES TENDANCES
// Même principe que les promos, mais c'est de
// l'envie, pas de la bonne affaire : pas de bon
// à consommer, juste ce qui vient d'arriver.
// --------------------------------------------
async function afficherNouveautes() {
  const liste = document.getElementById('nouveautes-liste');
  const soustitre = document.getElementById('nouveautes-soustitre');
  liste.innerHTML = squelettes(3);
  activerOnglet('nouveautes');
  afficherEcran('ecran-nouveautes');

  let articles = [];
  try {
    const { data, error } = await sb
      .from('roue_nouveautes')
      .select('enseigne, titre, detail, univers, prix, arrivage, tendance')
      .eq('operation', EVENEMENT)
      .eq('actif', true)
      .order('ordre');
    if (!error && data && data.length) articles = data;
  } catch (e) {
    console.warn('Nouveautés indisponibles :', e);
  }

  // Rien en base : on montre les exemples de démonstration
  if (!articles.length && typeof NOUVEAUTES_DEMO !== 'undefined') articles = NOUVEAUTES_DEMO;
  articles = neutraliserEnseignes(articles);

  if (!articles.length) {
    liste.innerHTML = '<p class="promo-vide">Les nouveautés arrivent très bientôt.<br>Reviens jouer demain pour les découvrir.</p>';
    return;
  }

  // Les rayons cochés par le joueur passent en tête
  const gouts = (reponses.univers || '').split(',').filter(Boolean);
  if (gouts.length) {
    articles = articles.slice().sort(function (a, b) {
      return (gouts.indexOf(a.univers) === -1 ? 1 : 0) - (gouts.indexOf(b.univers) === -1 ? 1 : 0);
    });
    soustitre.textContent = 'Ce qui vient d’arriver, en commençant par ce que tu aimes.';
  }

  liste.innerHTML = '';
  articles.forEach(function (n) {
    const pourToi = gouts.indexOf(n.univers) !== -1;
    const carte = document.createElement('article');
    carte.className = 'nouveaute' + (n.tendance ? ' tendance' : '');
    carte.innerHTML =
      '<div class="nouveaute-haut">' +
        '<span class="nouveaute-enseigne">' + echap(n.enseigne || '') + '</span>' +
        '<span class="nouveaute-marque">' + (n.tendance ? 'Tendance' : 'Nouveau') + '</span>' +
      '</div>' +
      '<div class="nouveaute-titre">' + echap(n.titre || '') + '</div>' +
      '<div class="nouveaute-detail">' + echap(n.detail || '') + '</div>' +
      (n.arrivage ? '<span class="nouveaute-arrivage">' + echap(n.arrivage) + '</span>' : '') +
      (n.prix || pourToi
        ? '<div class="nouveaute-pied">' +
            (n.prix ? '<span class="nouveaute-prix">' + echap(n.prix) + '</span>' : '<span></span>') +
            (pourToi ? '<span class="promo-pour-toi">Pour toi</span>' : '') +
          '</div>'
        : '');
    liste.appendChild(carte);
  });
}

document.getElementById('carte-mesbons').addEventListener('click', function () { afficherMesBons(); });
document.getElementById('btn-mes-bons-retour').addEventListener('click', function () { afficherDecouverte(); });
document.getElementById('carte-promos').addEventListener('click', function () { afficherPromos(); });
document.getElementById('carte-nouveautes').addEventListener('click', function () { afficherNouveautes(); });
document.getElementById('btn-decouverte-programme').addEventListener('click', function () { afficherProgramme(); });
document.getElementById('btn-decouverte-retour').addEventListener('click', function () {
  afficherEcran('ecran-resultat', 'arriere');
});
document.getElementById('btn-nouveautes-retour').addEventListener('click', function () {
  afficherDecouverte();
});

installerOnglets();
// L'onglet « Mes bons » est caché tant qu'il n'y a rien dedans. Au
// chargement, il peut déjà y avoir un bon : celui d'hier, resté dans le
// téléphone et encore valable.
rafraichirOngletBons();

// --------------------------------------------
// PROGRAMME DES ANIMATIONS
// --------------------------------------------
// LE PROGRAMME, PRÉSENTÉ COMME UN AGENDA (26/08/2026)
// ----------------------------------------------------
// Avant : une pile de cartes, toutes du même poids, où le joueur ne
// voyait pas ce qui se passait aujourd'hui. Maintenant :
//   - en haut, ce qui a lieu TOUS LES JOURS (les rendez-vous sans jour) ;
//   - en dessous, une journée après l'autre, chaque rendez-vous accroché
//     à son heure, sur un fil vertical doré.
// Les colonnes jour et heure sont facultatives : un programme rempli à
// l'ancienne (titre, lieu, horaires) s'affiche exactement comme avant,
// sous « Tous les jours ». Le select ne nomme plus les colonnes une à
// une, pour que l'écran continue de fonctionner que la base ait reçu ou
// non les deux nouvelles colonnes.
async function afficherProgramme() {
  const liste = document.getElementById('programme-liste');
  liste.innerHTML = squelettes(3);
  activerOnglet('programme');
  afficherEcran('ecran-programme');

  let evenements = [];
  try {
    const { data, error } = await sb
      .from('roue_programme')
      .select('*')
      .eq('operation', EVENEMENT)
      .eq('actif', true)
      .order('ordre');
    if (!error && data && data.length) evenements = data;
  } catch (e) {
    console.warn('Programme indisponible :', e);
  }
  if (!evenements.length && typeof PROGRAMME_DEMO !== 'undefined') evenements = PROGRAMME_DEMO;

  if (!evenements.length) {
    liste.innerHTML = '<p class="promo-vide">Le programme arrive très bientôt.</p>';
    return;
  }

  liste.innerHTML = '';
  let retard = 0;                 // pour que les lignes arrivent en cascade

  // 1. LES RENDEZ-VOUS DE TOUS LES JOURS
  const permanents = evenements.filter(ev => !String(ev.jour || '').trim());
  if (permanents.length) {
    liste.appendChild(titreDeJournee('Tous les jours', 'Pendant toute l’opération'));
    permanents.forEach(ev => {
      liste.appendChild(ligneAgenda(ev, retard++, true));
    });
  }

  // 2. LES JOURNÉES, DANS L'ORDRE OÙ ELLES ARRIVENT DANS LA LISTE
  const journees = [];
  evenements.forEach(ev => {
    const jour = String(ev.jour || '').trim();
    if (!jour) return;
    let bloc = journees.filter(j => j.jour === jour)[0];
    if (!bloc) { bloc = { jour: jour, evenements: [] }; journees.push(bloc); }
    bloc.evenements.push(ev);
  });

  journees.forEach(bloc => {
    liste.appendChild(titreDeJournee(bloc.jour, ''));
    const fil = document.createElement('div');
    fil.className = 'agenda-fil';
    bloc.evenements.forEach(ev => {
      fil.appendChild(ligneAgenda(ev, retard++, false));
    });
    liste.appendChild(fil);
  });
}

// L'intitulé d'une journée : un filet doré, la date, et au besoin une
// précision (« Pendant toute l'opération »).
function titreDeJournee(jour, precision) {
  const bloc = document.createElement('div');
  bloc.className = 'agenda-jour';
  bloc.innerHTML =
    `<span class="agenda-jour-nom">${echap(jour)}</span>` +
    (precision ? `<span class="agenda-jour-precision">${echap(precision)}</span>` : '');
  return bloc;
}

// Une ligne d'agenda : l'heure à gauche, le rendez-vous à droite.
// Les rendez-vous permanents n'ont pas d'heure : leur colonne de gauche
// porte alors une étoile, et la ligne s'écrit en pleine largeur.
function ligneAgenda(ev, index, permanent) {
  const ligne = document.createElement('article');
  ligne.className = 'agenda-ligne' +
    (ev.vedette ? ' vedette' : '') +
    (permanent ? ' permanent' : '');
  ligne.style.animationDelay = (0.05 + Math.min(index, 10) * 0.05) + 's';

  const gratuit = /gratuit/i.test(ev.detail || '')
    ? '<span class="evenement-gratuit">Gratuit, sans achat</span>' : '';
  const heure = String(ev.heure || '').trim();

  ligne.innerHTML =
    `<div class="agenda-heure">${heure ? echap(heure) : '<span class="agenda-puce" aria-hidden="true"></span>'}</div>
     <div class="agenda-corps">
       <div class="agenda-titre">${echap(ev.titre || '')}</div>
       ${ev.lieu ? `<div class="agenda-lieu">${echap(ev.lieu)}</div>` : ''}
       ${ev.horaires ? `<span class="agenda-duree">${echap(ev.horaires)}</span>` : ''}
       ${ev.detail ? `<div class="agenda-detail">${echap(ev.detail)}</div>` : ''}
       ${gratuit}
     </div>`;
  return ligne;
}

document.getElementById('btn-voir-programme').addEventListener('click', afficherProgramme);
document.getElementById('btn-programme-retour').addEventListener('click', () => afficherDecouverte());

document.getElementById('btn-tourner').addEventListener('click', lancerRoue);

// LE RIDEAU D'OUVERTURE
// ---------------------
// Il ne se joue qu'une fois par visite : au deuxième écran, plus
// personne n'a envie de rouvrir le rideau. Le JavaScript ne l'ouvre
// pas (c'est l'affaire du CSS, voir .rideau), il ne fait que deux
// choses : le retirer de la page une fois le spectacle passé, et le
// sauter d'emblée si le joueur revient dans la même session.
(function rideauDOuverture() {
  const rideau = document.getElementById('rideau');
  if (!rideau) return;
  let dejaVu = false;
  try { dejaVu = sessionStorage.getItem('rideau-vu') === '1'; } catch (e) { /* navigation privée */ }
  if (dejaVu) { rideau.classList.add('parti'); return; }
  try { sessionStorage.setItem('rideau-vu', '1'); } catch (e) { /* sans importance */ }
  // 2,2 s : le temps de l'ouverture (1,45 s) plus son attente de départ.
  setTimeout(() => rideau.classList.add('parti'), 2200);
})();

// L'écran d'accueil est déjà à l'écran au chargement : afficherEcran()
// n'est pas encore passé, on pose l'état de départ à la main.
document.body.classList.add('sur-accueil');
afficherMentionTest();
chargerOperation().then(() => {
  // Le joueur revient sur son bon depuis le lien reçu par e-mail ?
  // On le fait après l'habillage, pour que l'écran soit déjà aux
  // bonnes couleurs.
  if (window.PullUpMails) window.PullUpMails.retrouverDepuisLien();
});
chargerLots();
renvoyerAttente();
