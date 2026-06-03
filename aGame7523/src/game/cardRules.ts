import { Card, Play, CardType, Rank, RANK_VALUES, STRAIGHT_RANK_ORDER } from './types';

function sortCardsByValue(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    if (b.value !== a.value) {
      return b.value - a.value;
    }
    return b.suitValue - a.suitValue;
  });
}

function groupByRank(cards: Card[]): Map<Rank, Card[]> {
  const groups = new Map<Rank, Card[]>();
  for (const card of cards) {
    const existing = groups.get(card.rank) || [];
    existing.push(card);
    groups.set(card.rank, existing);
  }
  return groups;
}

function isSingle(cards: Card[]): boolean {
  return cards.length === 1;
}

function isPair(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  return cards[0].rank === cards[1].rank && cards[0].rank !== 'bigJoker' && cards[0].rank !== 'smallJoker';
}

function isTriple(cards: Card[]): boolean {
  if (cards.length !== 3) return false;
  return cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank;
}

function isTripleWithPair(cards: Card[]): Play | null {
  if (cards.length !== 5) return null;
  
  const groups = groupByRank(cards);
  const ranks = Array.from(groups.keys());
  
  if (ranks.length !== 2) return null;
  
  let tripleRank: Rank | null = null;
  let pairRank: Rank | null = null;
  
  for (const rank of ranks) {
    const count = groups.get(rank)!.length;
    if (count === 3) tripleRank = rank;
    else if (count === 2) pairRank = rank;
  }
  
  if (tripleRank && pairRank) {
    const tripleCards = groups.get(tripleRank)!;
    const sorted = sortCardsByValue(tripleCards);
    return {
      cards,
      type: 'tripleWithPair',
      mainValue: RANK_VALUES[tripleRank],
      highestCard: sorted[0],
    };
  }
  
  return null;
}

function isBomb(cards: Card[]): boolean {
  if (cards.length !== 4) return false;
  return cards.every(c => c.rank === cards[0].rank);
}

function isBombWithSingle(cards: Card[]): Play | null {
  if (cards.length !== 5) return null;
  
  const groups = groupByRank(cards);
  const ranks = Array.from(groups.keys());
  
  if (ranks.length !== 2) return null;
  
  let bombRank: Rank | null = null;
  
  for (const rank of ranks) {
    if (groups.get(rank)!.length === 4) {
      bombRank = rank;
      break;
    }
  }
  
  if (bombRank) {
    const bombCards = groups.get(bombRank)!;
    const sorted = sortCardsByValue(bombCards);
    return {
      cards,
      type: 'bombWithSingle',
      mainValue: RANK_VALUES[bombRank],
      highestCard: sorted[0],
    };
  }
  
  return null;
}

function isStraight(cards: Card[]): Play | null {
  if (cards.length < 3) return null;
  
  const sorted = sortCardsByValue(cards);
  const uniqueRanks = [...new Set(sorted.map(c => c.rank))];
  
  if (uniqueRanks.length !== cards.length) return null;
  
  const straightIndex = (rank: Rank): number => {
    const idx = STRAIGHT_RANK_ORDER.indexOf(rank);
    return idx === -1 ? -1 : idx;
  };
  
  const indices = uniqueRanks.map(r => straightIndex(r)).sort((a, b) => a - b);
  
  if (indices.some(i => i === -1)) return null;
  
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] - indices[i - 1] !== 1) return null;
  }
  
  return {
    cards,
    type: 'straight',
    mainValue: RANK_VALUES[sorted[0].rank],
    highestCard: sorted[0],
  };
}

export function getCardType(cards: Card[]): Play | null {
  if (cards.length === 0) return null;
  
  const sorted = sortCardsByValue(cards);
  
  if (isSingle(cards)) {
    return {
      cards,
      type: 'single',
      mainValue: cards[0].value,
      highestCard: cards[0],
    };
  }
  
  if (isPair(cards)) {
    return {
      cards,
      type: 'pair',
      mainValue: sorted[0].value,
      highestCard: sorted[0],
    };
  }
  
  if (isTriple(cards)) {
    return {
      cards,
      type: 'triple',
      mainValue: sorted[0].value,
      highestCard: sorted[0],
    };
  }
  
  if (isBomb(cards)) {
    return {
      cards,
      type: 'bomb',
      mainValue: sorted[0].value,
      highestCard: sorted[0],
    };
  }
  
  const tripleWithPair = isTripleWithPair(cards);
  if (tripleWithPair) return tripleWithPair;
  
  const bombWithSingle = isBombWithSingle(cards);
  if (bombWithSingle) return bombWithSingle;
  
  const straight = isStraight(cards);
  if (straight) return straight;
  
  return null;
}

export function compareCards(card1: Card, card2: Card): number {
  if (card1.value !== card2.value) {
    return card1.value - card2.value;
  }
  return card1.suitValue - card2.suitValue;
}

export function comparePlays(play1: Play, play2: Play): number {
  if (play1.type !== play2.type && play1.type !== 'bomb' && play2.type !== 'bomb') {
    return -1;
  }
  
  if (play1.type === 'bomb' && play2.type !== 'bomb') {
    return 1;
  }
  if (play2.type === 'bomb' && play1.type !== 'bomb') {
    return -1;
  }
  
  if (play1.mainValue !== play2.mainValue) {
    return play1.mainValue - play2.mainValue;
  }
  
  return compareCards(play1.highestCard, play2.highestCard);
}

export function canBeat(newPlay: Play, lastPlay: Play | null): boolean {
  if (!lastPlay) return true;
  
  if (newPlay.type === 'bomb') {
    if (lastPlay.type === 'bomb') {
      return comparePlays(newPlay, lastPlay) > 0;
    }
    return true;
  }
  
  if (newPlay.cards.length !== lastPlay.cards.length) {
    return false;
  }
  
  if (newPlay.type !== lastPlay.type) {
    return false;
  }
  
  return comparePlays(newPlay, lastPlay) > 0;
}

export function sortHand(cards: Card[]): Card[] {
  return sortCardsByValue(cards).reverse();
}

function* generateCombinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) {
    yield [];
    return;
  }
  if (arr.length < k) return;
  
  for (let i = 0; i <= arr.length - k; i++) {
    const head = arr[i];
    for (const tail of generateCombinations(arr.slice(i + 1), k - 1)) {
      yield [head, ...tail];
    }
  }
}

export function findAllValidPlays(hand: Card[], lastPlay: Play | null): Play[] {
  const validPlays: Play[] = [];
  const maxLength = Math.min(hand.length, 5);
  
  if (!lastPlay) {
    for (let len = 1; len <= maxLength; len++) {
      for (const combo of generateCombinations(hand, len)) {
        const play = getCardType(combo);
        if (play) {
          validPlays.push(play);
        }
      }
    }
  } else {
    const targetLength = lastPlay.cards.length;
    if (targetLength <= hand.length) {
      for (const combo of generateCombinations(hand, targetLength)) {
        const play = getCardType(combo);
        if (play && canBeat(play, lastPlay)) {
          validPlays.push(play);
        }
      }
    }
    
    for (const combo of generateCombinations(hand, 4)) {
      const play = getCardType(combo);
      if (play && play.type === 'bomb' && canBeat(play, lastPlay)) {
        validPlays.push(play);
      }
    }
  }
  
  return validPlays.sort((a, b) => comparePlays(a, b));
}

export function findHintPlay(hand: Card[], lastPlay: Play | null): Play | null {
  const validPlays = findAllValidPlays(hand, lastPlay);
  if (validPlays.length === 0) return null;
  return validPlays[0];
}
