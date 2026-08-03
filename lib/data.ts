// NCERT class + subjects data model

export interface ClassInfo {
  id: string;
  label: string;
  grade: string;
  tint: string;
}

export interface Subject {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  accent: string;
}

export interface Chapter {
  id: string;
  title: string;
  summary: string;
}

export interface FormulaGroup {
  id: string;
  title: string;
  items: string[];
}

export interface Worksheet {
  id: string;
  title: string;
  pages: number;
}

export interface SubjectContent {
  chapters?: Chapter[];
  formulas?: FormulaGroup[];
  worksheets?: Worksheet[];
}

export interface NcertBook {
  title: string;
  url: string;
}

export const CLASSES: ClassInfo[] = [
  { id: '6', label: 'Class 6', grade: 'VI', tint: 'from-sky-400/20 to-cyan-500/10' },
  { id: '7', label: 'Class 7', grade: 'VII', tint: 'from-violet-400/20 to-purple-500/10' },
  { id: '8', label: 'Class 8', grade: 'VIII', tint: 'from-fuchsia-400/20 to-purple-500/10' },
  { id: '9', label: 'Class 9', grade: 'IX', tint: 'from-amber-400/20 to-orange-500/10' },
  { id: '10', label: 'Class 10', grade: 'X', tint: 'from-rose-400/20 to-pink-500/10' },
  { id: '11', label: 'Class 11', grade: 'XI', tint: 'from-indigo-400/20 to-blue-500/10' },
  { id: '12', label: 'Class 12', grade: 'XII', tint: 'from-violet-400/20 to-purple-600/10' },
];

export const SUBJECTS: Record<string, Subject> = {
  science: {
    id: 'science',
    name: 'Science',
    tagline: 'Deep-dive chapter notes',
    description: 'Structured, immersive notes covering Physics, Chemistry and Biology fundamentals.',
    icon: 'Atom',
    accent: 'from-cyan-400 to-blue-500',
  },
  sst: {
    id: 'sst',
    name: 'Social Studies',
    tagline: 'High-yield revision notes',
    description: 'Scannable revision cards for History, Geography, Civics and Economics.',
    icon: 'Globe2',
    accent: 'from-violet-400 to-purple-500',
  },
  english: {
    id: 'english',
    name: 'English',
    tagline: 'Distraction-free reading',
    description: 'Concise, elegant chapter summaries for effortless comprehension.',
    icon: 'BookOpen',
    accent: 'from-rose-400 to-pink-500',
  },
  mathematics: {
    id: 'mathematics',
    name: 'Mathematics',
    tagline: 'Formula & Theorem Vault',
    description: 'An elegant repository of every formula, plus curated practice worksheets.',
    icon: 'Sigma',
    accent: 'from-amber-400 to-orange-500',
  },
};

// Sample content per subject per class (concise MVP notes)
export const CONTENT: Record<string, SubjectContent> = {
  science: {
    chapters: [
      { id: 'ch1', title: 'Matter in Our Surroundings', summary: 'States of matter, phase changes, latent heat, evaporation & factors affecting it.' },
      { id: 'ch2', title: 'Is Matter Around Us Pure?', summary: 'Mixtures vs compounds, solutions, colloids, separation techniques.' },
      { id: 'ch3', title: 'Atoms and Molecules', summary: 'Laws of chemical combination, atomic mass, mole concept, molecular formulas.' },
      { id: 'ch4', title: 'Motion', summary: 'Distance vs displacement, velocity, acceleration, equations of motion, graphs.' },
      { id: 'ch5', title: 'Force and Laws of Motion', summary: 'Newton\u2019s three laws, inertia, momentum, conservation of momentum.' },
      { id: 'ch6', title: 'The Fundamental Unit of Life', summary: 'Cell theory, prokaryotic vs eukaryotic, organelles, cell division basics.' },
    ],
  },
  sst: {
    chapters: [
      { id: 'ch1', title: 'The French Revolution', summary: 'Causes, Estates system, rise of Napoleon, legacy of liberty & equality.' },
      { id: 'ch2', title: 'Socialism in Europe & Russian Revolution', summary: 'Tsarist rule, October Revolution, Stalinism, global impact.' },
      { id: 'ch3', title: 'India — Size and Location', summary: 'Latitudinal/longitudinal extent, neighbors, standard meridian at 82.5°E.' },
      { id: 'ch4', title: 'Democracy in the Contemporary World', summary: 'Wave of democracy, Chile, Poland — features of democratic government.' },
      { id: 'ch5', title: 'The Story of Village Palampur', summary: 'Factors of production, land, labour, capital, farming vs non-farming activities.' },
    ],
  },
  english: {
    chapters: [
      { id: 'ch1', title: 'The Fun They Had', summary: 'Isaac Asimov envisions a future where children learn from mechanical teachers.' },
      { id: 'ch2', title: 'The Sound of Music', summary: 'Evelyn Glennie\u2019s triumph over deafness and Bismillah Khan\u2019s shehnai legacy.' },
      { id: 'ch3', title: 'The Little Girl', summary: 'Kezia realises her stern father truly loves her — a delicate emotional arc.' },
      { id: 'ch4', title: 'A Truly Beautiful Mind', summary: 'Einstein\u2019s life, from a slow-talking child to Nobel laureate & pacifist.' },
      { id: 'ch5', title: 'The Snake and the Mirror', summary: 'A doctor\u2019s brush with a snake teaches humility and self-perception.' },
    ],
  },
  mathematics: {
    formulas: [
      { id: 'algebra', title: 'Algebraic Identities', items: [
        '(a+b)² = a² + 2ab + b²',
        '(a\u2212b)² = a² \u2212 2ab + b²',
        'a² \u2212 b² = (a+b)(a\u2212b)',
        '(a+b)³ = a³ + 3a²b + 3ab² + b³',
        'a³ + b³ = (a+b)(a² \u2212 ab + b²)',
      ]},
      { id: 'geometry', title: 'Geometry & Mensuration', items: [
        'Area of triangle = ½ × base × height',
        'Heron\u2019s formula: √(s(s\u2212a)(s\u2212b)(s\u2212c))',
        'Volume of sphere = (4/3)πr³',
        'Surface area of cylinder = 2πr(h+r)',
        'Area of trapezium = ½ × (a+b) × h',
      ]},
      { id: 'trigonometry', title: 'Trigonometric Ratios', items: [
        'sin²θ + cos²θ = 1',
        '1 + tan²θ = sec²θ',
        '1 + cot²θ = cosec²θ',
        'sin(A+B) = sinA·cosB + cosA·sinB',
        'cos(2θ) = 1 \u2212 2sin²θ',
      ]},
      { id: 'statistics', title: 'Statistics', items: [
        'Mean = Σx / n',
        'Median (odd n) = ((n+1)/2)th term',
        'Mode = value with highest frequency',
        'Range = Max \u2212 Min',
      ]},
    ],
    worksheets: [
      { id: 'w1', title: 'Number Systems — Practice Set 1', pages: 4 },
      { id: 'w2', title: 'Polynomials — Mastery Sheet', pages: 6 },
      { id: 'w3', title: 'Coordinate Geometry Drills', pages: 3 },
      { id: 'w4', title: 'Statistics & Probability', pages: 5 },
    ],
  },
};

// Real NCERT PDF root — full textbooks per class
export const NCERT_BOOKS: Record<string, NcertBook[]> = {
  '6': [
    { title: 'Honeysuckle — English', url: 'https://ncert.nic.in/textbook/pdf/fehs1dd.zip' },
    { title: 'Ganita Prakash — Mathematics', url: 'https://ncert.nic.in/textbook/pdf/fegp1dd.zip' },
    { title: 'Curiosity — Science', url: 'https://ncert.nic.in/textbook/pdf/fesc1dd.zip' },
    { title: 'Exploring Society — Social Science', url: 'https://ncert.nic.in/textbook/pdf/fess1dd.zip' },
  ],
  '7': [
    { title: 'Honeycomb — English', url: 'https://ncert.nic.in/textbook/pdf/gehc1dd.zip' },
    { title: 'Mathematics', url: 'https://ncert.nic.in/textbook/pdf/gemh1dd.zip' },
    { title: 'Science', url: 'https://ncert.nic.in/textbook/pdf/gesc1dd.zip' },
    { title: 'Our Past II — History', url: 'https://ncert.nic.in/textbook/pdf/gess3dd.zip' },
  ],
  '8': [
    { title: 'Honeydew — English', url: 'https://ncert.nic.in/textbook/pdf/hehd1dd.zip' },
    { title: 'Mathematics', url: 'https://ncert.nic.in/textbook/pdf/hemh1dd.zip' },
    { title: 'Science', url: 'https://ncert.nic.in/textbook/pdf/hesc1dd.zip' },
    { title: 'Our Pasts III — History', url: 'https://ncert.nic.in/textbook/pdf/hess3dd.zip' },
  ],
  '9': [
    { title: 'Beehive — English', url: 'https://ncert.nic.in/textbook/pdf/iebe1dd.zip' },
    { title: 'Mathematics', url: 'https://ncert.nic.in/textbook/pdf/iemh1dd.zip' },
    { title: 'Science', url: 'https://ncert.nic.in/textbook/pdf/iesc1dd.zip' },
    { title: 'India & Contemporary World — History', url: 'https://ncert.nic.in/textbook/pdf/iess3dd.zip' },
  ],
  '10': [
    { title: 'First Flight — English', url: 'https://ncert.nic.in/textbook/pdf/jeff1dd.zip' },
    { title: 'Mathematics', url: 'https://ncert.nic.in/textbook/pdf/jemh1dd.zip' },
    { title: 'Science', url: 'https://ncert.nic.in/textbook/pdf/jesc1dd.zip' },
    { title: 'India & Contemporary World II — History', url: 'https://ncert.nic.in/textbook/pdf/jess3dd.zip' },
  ],
  '11': [
    { title: 'Hornbill — English', url: 'https://ncert.nic.in/textbook/pdf/kehb1dd.zip' },
    { title: 'Mathematics Part 1', url: 'https://ncert.nic.in/textbook/pdf/kemh1dd.zip' },
    { title: 'Physics Part 1', url: 'https://ncert.nic.in/textbook/pdf/keph1dd.zip' },
    { title: 'Chemistry Part 1', url: 'https://ncert.nic.in/textbook/pdf/kech1dd.zip' },
  ],
  '12': [
    { title: 'Flamingo — English', url: 'https://ncert.nic.in/textbook/pdf/lefl1dd.zip' },
    { title: 'Mathematics Part 1', url: 'https://ncert.nic.in/textbook/pdf/lemh1dd.zip' },
    { title: 'Physics Part 1', url: 'https://ncert.nic.in/textbook/pdf/leph1dd.zip' },
    { title: 'Chemistry Part 1', url: 'https://ncert.nic.in/textbook/pdf/lech1dd.zip' },
  ],
};
