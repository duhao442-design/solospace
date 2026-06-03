import { Card, Play, Difficulty } from './types';
import { findAllValidPlays, comparePlays } from './cardRules';

interface GameContext {
  remainingDeckCount: number;
  otherPlayerCardCounts: number[];
  currentRoundPoints: number;
}

function getRandomItem<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function easyStrategy(validPlays: Play[]): Play | null {
  if (validPlays.length === 0) return null;
  const shouldPass = Math.random() < 0.3;
  if (shouldPass) return null;
  return getRandomItem(validPlays);
}

function mediumStrategy(validPlays: Play[]): Play | null {
  if (validPlays.length === 0) return null;
  
  const sorted = [...validPlays].sort((a, b) => comparePlays(a, b));
  
  const nonBombPlays = sorted.filter(p => p.type !== 'bomb');
  if (nonBombPlays.length > 0) {
    const midIndex = Math.floor(nonBombPlays.length / 3);
    return nonBombPlays[Math.min(midIndex, nonBombPlays.length - 1)];
  }
  
  if (Math.random() < 0.5) {
    return sorted[0];
  }
  
  return null;
}

function hardStrategy(
  validPlays: Play[],
  hand: Card[],
  lastPlay: Play | null,
  context: GameContext
): Play | null {
  if (validPlays.length === 0) return null;
  
  const sorted = [...validPlays].sort((a, b) => comparePlays(a, b));
  
  if (!lastPlay) {
    const pointCardsInHand = hand.filter(c => c.isPointCard);
    if (pointCardsInHand.length >= 3 && context.currentRoundPoints >= 30) {
      const strongPlay = sorted.filter(p => p.type === 'bomb' || p.mainValue >= 10);
      if (strongPlay.length > 0) {
        return strongPlay[0];
      }
    }
    
    const singlePlays = sorted.filter(p => p.type === 'single');
    if (singlePlays.length > 0) {
      const weakSingles = singlePlays.filter(p => p.mainValue <= 5);
      if (weakSingles.length > 0) {
        return weakSingles[0];
      }
    }
    
    return sorted[0];
  }
  
  const nonBombPlays = sorted.filter(p => p.type !== 'bomb');
  
  if (nonBombPlays.length > 0) {
    if (context.currentRoundPoints >= 20) {
      return nonBombPlays[Math.floor(nonBombPlays.length / 2)];
    }
    return nonBombPlays[0];
  }
  
  const bombPlays = sorted.filter(p => p.type === 'bomb');
  if (bombPlays.length > 0) {
    if (context.currentRoundPoints >= 30 || hand.length <= 5) {
      return bombPlays[0];
    }
  }
  
  return null;
}

export function aiChoosePlay(
  hand: Card[],
  lastPlay: Play | null,
  difficulty: Difficulty,
  context: GameContext
): Play | null {
  const validPlays = findAllValidPlays(hand, lastPlay);
  
  switch (difficulty) {
    case 'easy':
      return easyStrategy(validPlays);
    case 'medium':
      return mediumStrategy(validPlays);
    case 'hard':
      return hardStrategy(validPlays, hand, lastPlay, context);
    default:
      return easyStrategy(validPlays);
  }
}

export function getAIDelay(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':
      return 800 + Math.random() * 700;
    case 'medium':
      return 600 + Math.random() * 500;
    case 'hard':
      return 400 + Math.random() * 400;
    default:
      return 1000;
  }
}
