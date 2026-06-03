import {
  Card,
  Suit,
  Rank,
  Player,
  GameState,
  Play,
  Difficulty,
  GamePhase,
  RANK_VALUES,
  SUIT_VALUES,
  PLAYER_AVATARS,
  PLAYER_NAMES,
} from './types';
import { sortHand } from './cardRules';

function createCard(suit: Suit, rank: Rank, id: string): Card {
  const isPointCard = rank === '5' || rank === '10' || rank === 'K';
  let points = 0;
  if (rank === '5') points = 5;
  else if (rank === '10' || rank === 'K') points = 10;

  let display = '';
  if (rank === 'bigJoker') {
    display = '大王';
  } else if (rank === 'smallJoker') {
    display = '小王';
  } else {
    display = rank;
  }

  return {
    id,
    suit,
    rank,
    value: RANK_VALUES[rank],
    suitValue: SUIT_VALUES[suit],
    isPointCard,
    points,
    display,
  };
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  const suits: Suit[] = ['spade', 'heart', 'club', 'diamond'];
  const ranks: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
  let id = 0;

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(createCard(suit, rank, `card-${id++}`));
    }
  }

  deck.push(createCard('joker', 'smallJoker', `card-${id++}`));
  deck.push(createCard('joker', 'bigJoker', `card-${id++}`));

  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createPlayers(count: number): Player[] {
  const players: Player[] = [];
  for (let i = 0; i < count; i++) {
    players.push({
      id: `player-${i}`,
      name: PLAYER_NAMES[i] || `玩家${i + 1}`,
      isHuman: i === 0,
      cards: [],
      score: 0,
      position: i,
      avatar: PLAYER_AVATARS[i] || '👤',
    });
  }
  return players;
}

export function dealCards(deck: Card[], players: Player[]): { deck: Card[]; players: Player[] } {
  const newDeck = [...deck];
  const newPlayers = players.map(p => ({ ...p, cards: [] as Card[] }));

  for (let i = 0; i < 5; i++) {
    for (const player of newPlayers) {
      if (newDeck.length > 0) {
        const card = newDeck.pop()!;
        player.cards.push(card);
      }
    }
  }

  for (const player of newPlayers) {
    player.cards = sortHand(player.cards);
  }

  return { deck: newDeck, players: newPlayers };
}

export function findFirstPlayer(players: Player[]): number {
  let minCard: Card | null = null;
  let minPlayerIndex = 0;

  for (let i = 0; i < players.length; i++) {
    for (const card of players[i].cards) {
      if (!minCard || card.value < minCard.value || 
          (card.value === minCard.value && card.suitValue < minCard.suitValue)) {
        minCard = card;
        minPlayerIndex = i;
      }
    }
  }

  return minPlayerIndex;
}

export function initGame(playerCount: number, difficulty: Difficulty): GameState {
  const deck = shuffleDeck(createDeck());
  const players = createPlayers(playerCount);
  const { deck: remainingDeck, players: playersWithCards } = dealCards(deck, players);
  const firstPlayerIndex = findFirstPlayer(playersWithCards);

  return {
    phase: 'playing',
    players: playersWithCards,
    currentPlayerIndex: firstPlayerIndex,
    lastPlay: null,
    lastPlayerIndex: null,
    deck: remainingDeck,
    roundCount: 1,
    passCount: 0,
    difficulty,
    playerCount,
    tableCards: [],
    message: `${playersWithCards[firstPlayerIndex].name} 先出牌`,
  };
}

export function removeCardsFromHand(hand: Card[], cardsToRemove: Card[]): Card[] {
  const idsToRemove = new Set(cardsToRemove.map(c => c.id));
  return hand.filter(c => !idsToRemove.has(c.id));
}

export function handlePlay(state: GameState, playerIndex: number, play: Play): GameState {
  const newPlayers = [...state.players];
  const player = { ...newPlayers[playerIndex] };
  player.cards = sortHand(removeCardsFromHand(player.cards, play.cards));
  newPlayers[playerIndex] = player;

  const newTableCards = [...state.tableCards, ...play.cards];

  const nextPlayerIndex = (playerIndex + 1) % state.playerCount;

  return {
    ...state,
    players: newPlayers,
    currentPlayerIndex: nextPlayerIndex,
    lastPlay: play,
    lastPlayerIndex: playerIndex,
    tableCards: newTableCards,
    passCount: 0,
    message: `${player.name} 出牌`,
  };
}

export function handlePass(state: GameState, playerIndex: number): GameState {
  const newPassCount = state.passCount + 1;
  const nextPlayerIndex = (playerIndex + 1) % state.playerCount;
  const player = state.players[playerIndex];

  if (newPassCount >= state.playerCount - 1) {
    return endRound(state);
  }

  return {
    ...state,
    currentPlayerIndex: nextPlayerIndex,
    passCount: newPassCount,
    message: `${player.name} 不出`,
  };
}

export function endRound(state: GameState): GameState {
  if (state.lastPlayerIndex === null) {
    return state;
  }

  const winnerIndex = state.lastPlayerIndex;
  const roundPoints = state.tableCards.reduce((sum, card) => sum + card.points, 0);

  const newPlayers = [...state.players];
  const winner = { ...newPlayers[winnerIndex] };
  winner.score += roundPoints;
  newPlayers[winnerIndex] = winner;

  let newDeck = [...state.deck];
  for (let i = 0; i < state.playerCount; i++) {
    const idx = (winnerIndex + i) % state.playerCount;
    const player = { ...newPlayers[idx] };
    while (player.cards.length < 5 && newDeck.length > 0) {
      const card = newDeck.pop()!;
      player.cards.push(card);
    }
    player.cards = sortHand(player.cards);
    newPlayers[idx] = player;
  }

  const gameOver = newDeck.length === 0 && newPlayers.every(p => p.cards.length === 0);

  if (gameOver) {
    return {
      ...state,
      phase: 'gameOver',
      players: newPlayers,
      deck: newDeck,
      currentPlayerIndex: winnerIndex,
      lastPlay: null,
      lastPlayerIndex: null,
      tableCards: [],
      passCount: 0,
      roundCount: state.roundCount + 1,
      message: '游戏结束！',
    };
  }

  return {
    ...state,
    phase: 'playing',
    players: newPlayers,
    deck: newDeck,
    currentPlayerIndex: winnerIndex,
    lastPlay: null,
    lastPlayerIndex: null,
    tableCards: [],
    passCount: 0,
    roundCount: state.roundCount + 1,
    message: `${winner.name} 获得 ${roundPoints} 分`,
  };
}

export function isCurrentPlayerHuman(state: GameState): boolean {
  return state.players[state.currentPlayerIndex].isHuman;
}
