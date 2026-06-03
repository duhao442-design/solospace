export type Suit = 'spade' | 'heart' | 'club' | 'diamond' | 'joker';

export type Rank = '7' | 'bigJoker' | 'smallJoker' | '5' | '2' | '3' | 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '6' | '4';

export type CardType = 'single' | 'pair' | 'straight' | 'triple' | 'tripleWithPair' | 'bomb' | 'bombWithSingle';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type GamePhase = 'setting' | 'dealing' | 'playing' | 'roundEnd' | 'gameOver';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
  suitValue: number;
  isPointCard: boolean;
  points: number;
  display: string;
}

export interface Play {
  cards: Card[];
  type: CardType;
  mainValue: number;
  highestCard: Card;
}

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  cards: Card[];
  score: number;
  position: number;
  avatar: string;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  lastPlay: Play | null;
  lastPlayerIndex: number | null;
  deck: Card[];
  roundCount: number;
  passCount: number;
  difficulty: Difficulty;
  playerCount: number;
  tableCards: Card[];
  message: string;
}

export interface GameSettings {
  playerCount: number;
  difficulty: Difficulty;
}

export const RANK_VALUES: Record<Rank, number> = {
  '7': 14,
  'bigJoker': 13,
  'smallJoker': 12,
  '5': 11,
  '2': 10,
  '3': 9,
  'A': 8,
  'K': 7,
  'Q': 6,
  'J': 5,
  '10': 4,
  '9': 3,
  '8': 2,
  '6': 1,
  '4': 0,
};

export const SUIT_VALUES: Record<Suit, number> = {
  'spade': 3,
  'heart': 2,
  'club': 1,
  'diamond': 0,
  'joker': 4,
};

export const STRAIGHT_RANK_ORDER: Rank[] = ['4', '6', '8', '9', '10', 'J', 'Q', 'K', 'A', '3', '2', '5'];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  'spade': '♠',
  'heart': '♥',
  'club': '♣',
  'diamond': '♦',
  'joker': '',
};

export const SUIT_COLORS: Record<Suit, string> = {
  'spade': '#000000',
  'heart': '#C41E3A',
  'club': '#000000',
  'diamond': '#C41E3A',
  'joker': '#C41E3A',
};

export const PLAYER_AVATARS = [
  '👨',
  '🤖',
  '👩',
  '👴',
  '👵',
];

export const PLAYER_NAMES = [
  '玩家',
  '电脑甲',
  '电脑乙',
  '电脑丙',
  '电脑丁',
];
