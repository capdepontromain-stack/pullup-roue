// ============================================
// ICÔNES DE LA ROUE — dessinées au trait fin,
// style joaillerie. Aucune émoticône système.
// Chaque icône est un tracé SVG dans une grille
// de 100 x 100, coloré par la roue.
// ============================================

const ICONES = {
  // La hotte magique : le sac du Père Noël, col ouvert, d'où s'échappe
  // une étoile. C'est l'emblème de l'opération (26/08/2026).
  hotte: `<path d="M28 36 c-9 13 -16 26 -16 38 a38 21 0 0 0 76 0 c0 -12 -7 -25 -16 -38" />
          <path d="M24 34 c9 -7 43 -7 52 0 c-9 7 -43 7 -52 0 z" />
          <path d="M37 40 c-5 16 -5 34 -1 48" />
          <path d="M63 40 c5 16 5 34 1 48" />
          <path d="M63 4 l4.6 9.6 l10.4 1.5 l-7.5 7.2 l1.8 10.4 l-9.3 -4.9 l-9.3 4.9 l1.8 -10.4 l-7.5 -7.2 l10.4 -1.5 z" />`,

  // Bon d'achat : étiquette avec symbole euro
  bon: `<path d="M18 34 L58 34 L82 58 L58 82 L18 82 Z" />
        <circle cx="30" cy="46" r="3.5" />
        <path d="M54 50 h14 M52 60 h14 M64 44 a10 10 0 1 0 0 22" />`,

  // Casquette
  casquette: `<path d="M22 56 a22 20 0 0 1 40 -11" />
              <path d="M22 56 h40 v-11" />
              <path d="M22 56 c14 4 34 5 48 -1 c6 -2 10 -5 12 -9 c-8 -3 -18 -4 -28 -3" />
              <circle cx="41" cy="37" r="2.5" />`,

  // Restaurant : cloche de service
  repas: `<path d="M34 20 v26 a8 8 0 0 1 -16 0 v-26" />
          <path d="M26 20 v26" /><path d="M26 46 v34" />
          <path d="M70 20 c10 0 12 10 12 18 c0 6 -4 10 -8 11 v31" />
          <path d="M74 49 h-4" />`,

  // Coiffeur : ciseaux
  ciseaux: `<path d="M32 26 L68 70" /><path d="M68 26 L32 70" />
            <circle cx="30" cy="76" r="8" /><circle cx="70" cy="76" r="8" />`,

  // Gourmandise : bonbon
  gourmandise: `<rect x="34" y="38" width="32" height="24" rx="6" />
                <path d="M34 42 L20 34 v32 l14 -8 z" />
                <path d="M66 42 L80 34 v32 l-14 -8 z" />`,

  // Photo : appareil
  photo: `<rect x="16" y="34" width="68" height="46" rx="8" />
          <circle cx="50" cy="57" r="15" /><circle cx="50" cy="57" r="7" />
          <path d="M36 34 l6 -10 h16 l6 10" /><circle cx="72" cy="45" r="2.5" />`,

  // Cadeau surprise : boîte et ruban
  cadeau: `<rect x="20" y="46" width="60" height="38" rx="4" />
           <path d="M14 34 h72 v12 h-72 z" /><path d="M50 34 v50" />
           <path d="M50 34 c-14 0 -20 -18 -8 -18 c8 0 8 12 8 18 z" />
           <path d="M50 34 c14 0 20 -18 8 -18 c-8 0 -8 12 -8 18 z" />`,

  // Retente demain : étoile filante
  etoile: `<path d="M56 22 l7 18 l19 2 l-14 13 l4 19 l-16 -10 l-16 10 l4 -19 l-14 -13 l19 -2 z" />
           <path d="M28 30 h-14 M24 44 h-12 M30 58 h-10" />`,

  // Icônes complémentaires pour les autres opérations
  cinema: `<rect x="16" y="38" width="68" height="42" rx="6" />
           <path d="M16 52 h68" /><path d="M28 38 l10 14 M46 38 l10 14 M64 38 l10 14" />`,
  boisson: `<path d="M32 32 h36 l-5 50 h-26 z" /><path d="M30 44 h40" />
            <path d="M58 32 l8 -14" />`,
  sapin: `<path d="M50 18 L30 46 h12 L26 70 h48 L58 46 h12 z" />
          <rect x="45" y="70" width="10" height="12" />`,
  trefle: `<circle cx="38" cy="42" r="12" /><circle cx="62" cy="42" r="12" />
           <circle cx="38" cy="62" r="12" /><circle cx="62" cy="62" r="12" />
           <path d="M50 66 v18" />`
};

// Associe un lot à son icône, d'après son nom.
// Sans correspondance : le cadeau générique.
function iconePourLot(nom) {
  const t = (nom || '').toLowerCase();
  if (/bon d|bon d'achat|euro|€/.test(t)) return ICONES.bon;
  if (/casquette|goodies|textile/.test(t)) return ICONES.casquette;
  if (/repas|restaurant|menu|déjeuner/.test(t)) return ICONES.repas;
  if (/coiffeur|coupe|brushing|coiffure/.test(t)) return ICONES.ciseaux;
  if (/gourmandise|chocolat|bonbon|confiserie|douceur/.test(t)) return ICONES.gourmandise;
  if (/photo|cliché|portrait/.test(t)) return ICONES.photo;
  if (/cinéma|cinema|film/.test(t)) return ICONES.cinema;
  if (/boisson|café|thé|jus/.test(t)) return ICONES.boisson;
  if (/noël|noel|sapin|fête/.test(t)) return ICONES.sapin;
  if (/retente|demain|chance|perdu/.test(t)) return ICONES.etoile;
  return ICONES.cadeau;
}
