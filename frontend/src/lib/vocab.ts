export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface WordPair {
  id:      string;
  spanish: string;
  english: string;
  level:   Level;
}

// 20 pairs per level, 60 total
const vocab: WordPair[] = [
  // ── Beginner ──────────────────────────────────────────────────────────────
  { id: 'b01', spanish: 'hola',       english: 'hello',      level: 'beginner' },
  { id: 'b02', spanish: 'gracias',    english: 'thank you',  level: 'beginner' },
  { id: 'b03', spanish: 'por favor',  english: 'please',     level: 'beginner' },
  { id: 'b04', spanish: 'sí',         english: 'yes',        level: 'beginner' },
  { id: 'b05', spanish: 'no',         english: 'no',         level: 'beginner' },
  { id: 'b06', spanish: 'casa',       english: 'house',      level: 'beginner' },
  { id: 'b07', spanish: 'agua',       english: 'water',      level: 'beginner' },
  { id: 'b08', spanish: 'comida',     english: 'food',       level: 'beginner' },
  { id: 'b09', spanish: 'rojo',       english: 'red',        level: 'beginner' },
  { id: 'b10', spanish: 'azul',       english: 'blue',       level: 'beginner' },
  { id: 'b11', spanish: 'verde',      english: 'green',      level: 'beginner' },
  { id: 'b12', spanish: 'perro',      english: 'dog',        level: 'beginner' },
  { id: 'b13', spanish: 'gato',       english: 'cat',        level: 'beginner' },
  { id: 'b14', spanish: 'libro',      english: 'book',       level: 'beginner' },
  { id: 'b15', spanish: 'escuela',    english: 'school',     level: 'beginner' },
  { id: 'b16', spanish: 'amigo',      english: 'friend',     level: 'beginner' },
  { id: 'b17', spanish: 'familia',    english: 'family',     level: 'beginner' },
  { id: 'b18', spanish: 'día',        english: 'day',        level: 'beginner' },
  { id: 'b19', spanish: 'noche',      english: 'night',      level: 'beginner' },
  { id: 'b20', spanish: 'tiempo',     english: 'time/weather', level: 'beginner' },

  // ── Intermediate ──────────────────────────────────────────────────────────
  { id: 'i01', spanish: 'aprender',   english: 'to learn',   level: 'intermediate' },
  { id: 'i02', spanish: 'trabajar',   english: 'to work',    level: 'intermediate' },
  { id: 'i03', spanish: 'entender',   english: 'to understand', level: 'intermediate' },
  { id: 'i04', spanish: 'conocer',    english: 'to know (a person)', level: 'intermediate' },
  { id: 'i05', spanish: 'saber',      english: 'to know (a fact)', level: 'intermediate' },
  { id: 'i06', spanish: 'ciudad',     english: 'city',       level: 'intermediate' },
  { id: 'i07', spanish: 'mercado',    english: 'market',     level: 'intermediate' },
  { id: 'i08', spanish: 'viaje',      english: 'trip/journey', level: 'intermediate' },
  { id: 'i09', spanish: 'olvidar',    english: 'to forget',  level: 'intermediate' },
  { id: 'i10', spanish: 'recordar',   english: 'to remember', level: 'intermediate' },
  { id: 'i11', spanish: 'cansado',    english: 'tired',      level: 'intermediate' },
  { id: 'i12', spanish: 'orgulloso',  english: 'proud',      level: 'intermediate' },
  { id: 'i13', spanish: 'aunque',     english: 'although',   level: 'intermediate' },
  { id: 'i14', spanish: 'sin embargo', english: 'however',   level: 'intermediate' },
  { id: 'i15', spanish: 'además',     english: 'furthermore', level: 'intermediate' },
  { id: 'i16', spanish: 'empezar',    english: 'to begin',   level: 'intermediate' },
  { id: 'i17', spanish: 'terminar',   english: 'to finish',  level: 'intermediate' },
  { id: 'i18', spanish: 'buscar',     english: 'to search',  level: 'intermediate' },
  { id: 'i19', spanish: 'encontrar',  english: 'to find',    level: 'intermediate' },
  { id: 'i20', spanish: 'pregunta',   english: 'question',   level: 'intermediate' },

  // ── Advanced ──────────────────────────────────────────────────────────────
  { id: 'a01', spanish: 'madrugada',  english: 'early morning (1–5 am)', level: 'advanced' },
  { id: 'a02', spanish: 'trasnochar', english: 'to stay up all night',   level: 'advanced' },
  { id: 'a03', spanish: 'añoranza',   english: 'longing/nostalgia',      level: 'advanced' },
  { id: 'a04', spanish: 'antojo',     english: 'craving/whim',           level: 'advanced' },
  { id: 'a05', spanish: 'sobremesa',  english: 'time after eating at table', level: 'advanced' },
  { id: 'a06', spanish: 'madrugar',   english: 'to get up very early',   level: 'advanced' },
  { id: 'a07', spanish: 'vergüenza',  english: 'shame/embarrassment',    level: 'advanced' },
  { id: 'a08', spanish: 'cotidiano',  english: 'everyday/mundane',       level: 'advanced' },
  { id: 'a09', spanish: 'desafío',    english: 'challenge',              level: 'advanced' },
  { id: 'a10', spanish: 'imprescindible', english: 'indispensable',      level: 'advanced' },
  { id: 'a11', spanish: 'desenvolverse', english: 'to manage/get by',    level: 'advanced' },
  { id: 'a12', spanish: 'conllevar',  english: 'to entail',              level: 'advanced' },
  { id: 'a13', spanish: 'pese a',     english: 'despite',                level: 'advanced' },
  { id: 'a14', spanish: 'a raíz de',  english: 'as a result of',         level: 'advanced' },
  { id: 'a15', spanish: 'en cuanto a', english: 'regarding',             level: 'advanced' },
  { id: 'a16', spanish: 'salvaje',    english: 'wild/savage',            level: 'advanced' },
  { id: 'a17', spanish: 'extrañar',   english: 'to miss (someone)',      level: 'advanced' },
  { id: 'a18', spanish: 'cariño',     english: 'affection/dear',         level: 'advanced' },
  { id: 'a19', spanish: 'inesperado', english: 'unexpected',             level: 'advanced' },
  { id: 'a20', spanish: 'asombro',    english: 'amazement',              level: 'advanced' },
];

export function getWordsByLevel(level: Level, count = 8): WordPair[] {
  const pool = vocab.filter((w) => w.level === level);
  return shuffle(pool).slice(0, count);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Board Card ───────────────────────────────────────────────────────────────
// Each word pair produces two cards (Spanish + English) shuffled together
export interface BoardCard {
  uid:     string;   // unique on the board
  pairId:  string;   // matching id
  face:    'spanish' | 'english';
  text:    string;
  matched: boolean;
  flipped: boolean;
}

export function buildBoard(pairs: WordPair[]): BoardCard[] {
  const cards: BoardCard[] = pairs.flatMap((p) => [
    { uid: `${p.id}-es`, pairId: p.id, face: 'spanish', text: p.spanish, matched: false, flipped: false },
    { uid: `${p.id}-en`, pairId: p.id, face: 'english', text: p.english, matched: false, flipped: false },
  ]);
  return shuffle(cards);
}
