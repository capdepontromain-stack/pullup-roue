// ============================================================
// ICÔNES DU QUIZ
// Une par réponse, dessinées au trait dans la même grille de
// 100 x 100 que les icônes de la roue, et coloriées par le CSS
// (currentColor). Elles ne décorent pas : elles font qu'on lit
// une question de magazine au lieu de remplir un formulaire.
//
// RÈGLE DE DESSIN : une silhouette reconnaissable en 26 px de
// haut, tracé continu, jamais plus de six traits. Ce qui ne se
// reconnaît pas à cette taille n'a rien à faire ici.
// ============================================================

const ICONES_QUIZ = {

  // ---- Qui es-tu ----
  homme: `<circle cx="50" cy="32" r="15"/>
          <path d="M22 84 c0 -17 13 -28 28 -28 s28 11 28 28"/>`,

  femme: `<circle cx="50" cy="33" r="14"/>
          <path d="M36 26 c-6 -14 34 -14 28 0"/>
          <path d="M24 84 l14 -30 h24 l14 30"/>`,

  mystere: `<path d="M34 40 c0 -20 32 -20 32 0 c0 12 -16 12 -16 24"/>
            <circle cx="50" cy="76" r="4.5"/>`,

  // ---- Sur la piste ----
  acrobate: `<circle cx="50" cy="16" r="10"/>
             <path d="M50 26 v22"/>
             <path d="M50 31 L24 15"/><path d="M50 31 L76 15"/>
             <path d="M50 48 L27 82"/><path d="M50 48 L73 82"/>`,

  hautdeforme: `<path d="M32 30 h36 v34 h-36 z"/>
                <path d="M18 64 h64"/>
                <path d="M32 50 h36"/>`,

  paillettes: `<path d="M50 14 l6 16 l16 6 l-16 6 l-6 16 l-6 -16 l-16 -6 l16 -6 z"/>
               <path d="M78 56 l3.5 9 l9 3.5 l-9 3.5 l-3.5 9 l-3.5 -9 l-9 -3.5 l9 -3.5 z"/>
               <path d="M24 60 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 z"/>`,

  clown: `<circle cx="50" cy="60" r="24"/>
          <circle cx="50" cy="62" r="7.5"/>
          <circle cx="39" cy="50" r="2.6"/><circle cx="61" cy="50" r="2.6"/>
          <path d="M37 73 c8 7 18 7 26 0"/>
          <path d="M33 35 L50 7 L67 35"/>`,

  // ---- Les rayons de la galerie ----
  mode: `<path d="M50 26 a7 7 0 1 1 5 12 l0 6"/>
         <path d="M55 44 L84 68 c4 3 2 8 -3 8 h-62 c-5 0 -7 -5 -3 -8 L45 44 z"/>`,

  beaute: `<path d="M42 20 h16 v10 h-16 z"/>
           <path d="M38 30 h24 c6 6 8 14 8 22 v22 c0 5 -4 8 -8 8 h-24 c-4 0 -8 -3 -8 -8 v-22 c0 -8 2 -16 8 -22 z"/>
           <path d="M40 52 h20"/>`,

  bijoux: `<path d="M30 26 h40 l16 20 l-36 40 l-36 -40 z"/>
           <path d="M14 46 h72"/>
           <path d="M30 26 L50 86 L70 26"/>`,

  hightech: `<rect x="18" y="24" width="64" height="42" rx="5"/>
             <path d="M34 80 h32"/><path d="M50 66 v14"/>`,

  sport: `<path d="M22 44 h6 v12 h-6 z"/><path d="M72 44 h6 v12 h-6 z"/>
          <path d="M28 38 h10 v24 h-10 z"/><path d="M62 38 h10 v24 h-10 z"/>
          <path d="M38 50 h24"/>`,

  enfants: `<circle cx="50" cy="52" r="24"/>
            <circle cx="26" cy="30" r="10"/><circle cx="74" cy="30" r="10"/>
            <circle cx="42" cy="48" r="3"/><circle cx="58" cy="48" r="3"/>
            <path d="M42 62 c5 5 11 5 16 0"/>`,

  maison: `<path d="M18 50 L50 22 L82 50"/>
           <path d="M28 46 v34 h44 v-34"/>
           <path d="M42 80 v-20 h16 v20"/>`,

  // ---- Le samedi ----
  famille: `<circle cx="34" cy="30" r="11"/><circle cx="68" cy="34" r="9"/>
            <path d="M16 82 c0 -16 8 -26 18 -26 s18 10 18 26"/>
            <path d="M54 82 c0 -13 6 -21 14 -21 s14 8 14 21"/>`,

  amis: `<path d="M22 24 h24 l-4 26 c-1 6 -14 6 -15 0 z"/>
         <path d="M34 50 v24"/><path d="M24 78 h20"/>
         <path d="M54 24 h24 l-4 26 c-1 6 -14 6 -15 0 z"/>
         <path d="M66 50 v24"/><path d="M56 78 h20"/>`,

  dehors: `<circle cx="50" cy="34" r="13"/>
           <path d="M50 8 v8"/><path d="M50 52 v8"/>
           <path d="M24 34 h8"/><path d="M68 34 h8"/>
           <path d="M14 84 L38 58 L54 74 L66 62 L86 84 z"/>`,

  // ---- Le cadeau ----
  amoureux: `<path d="M50 84 C18 62 16 40 30 30 c10 -7 20 -1 20 8 c0 -9 10 -15 20 -8 c14 10 12 32 -20 54 z"/>`,

  moi: `<path d="M16 70 L24 26 L37 46 L50 20 L63 46 L76 26 L84 70 z"/>
        <path d="M16 70 h68"/>
        <circle cx="50" cy="54" r="3"/>`
};

// Le SVG complet d'une icône de quiz, prêt à être posé dans un bouton.
// Renvoie une chaîne vide si l'icône n'existe pas : une réponse sans
// dessin reste une réponse, elle ne doit jamais casser l'écran.
function iconeQuiz(nom) {
  const tracé = ICONES_QUIZ[nom];
  if (!tracé) return '';
  return '<svg class="option-icone" viewBox="0 0 100 100" fill="none" stroke="currentColor" ' +
         'stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
         tracé + '</svg>';
}
