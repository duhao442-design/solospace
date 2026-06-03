import { create } from 'zustand';
import { GameState, Play, Difficulty } from '@/game/types';
import { initGame, handlePlay, handlePass, isCurrentPlayerHuman } from '@/game/gameEngine';
import { getCardType, canBeat } from '@/game/cardRules';

interface GameStore {
  state: GameState | null;
  selectedCards: string[];
  isProcessing: boolean;
  
  startGame: (playerCount: number, difficulty: Difficulty) => void;
  selectCard: (cardId: string) => void;
  clearSelection: () => void;
  playCards: () => boolean;
  pass: () => void;
  setProcessing: (processing: boolean) => void;
  resetGame: () => void;
  aiPlay: (play: Play) => void;
  aiPass: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  selectedCards: [],
  isProcessing: false,

  startGame: (playerCount: number, difficulty: Difficulty) => {
    const newState = initGame(playerCount, difficulty);
    set({ state: newState, selectedCards: [] });
  },

  selectCard: (cardId: string) => {
    set((state) => {
      const isSelected = state.selectedCards.includes(cardId);
      return {
        selectedCards: isSelected
          ? state.selectedCards.filter((id) => id !== cardId)
          : [...state.selectedCards, cardId],
      };
    });
  },

  clearSelection: () => {
    set({ selectedCards: [] });
  },

  playCards: () => {
    const { state, selectedCards } = get();
    if (!state || !isCurrentPlayerHuman(state)) return false;

    const player = state.players[state.currentPlayerIndex];
    const cardsToPlay = player.cards.filter((c) => selectedCards.includes(c.id));
    
    if (cardsToPlay.length === 0) return false;

    const play = getCardType(cardsToPlay);
    if (!play) return false;

    if (!canBeat(play, state.lastPlay)) return false;

    const newState = handlePlay(state, state.currentPlayerIndex, play);
    set({ state: newState, selectedCards: [] });
    return true;
  },

  pass: () => {
    const { state } = get();
    if (!state || !isCurrentPlayerHuman(state)) return;
    if (!state.lastPlay) return;

    const newState = handlePass(state, state.currentPlayerIndex);
    set({ state: newState, selectedCards: [] });
  },

  setProcessing: (processing: boolean) => {
    set({ isProcessing: processing });
  },

  resetGame: () => {
    set({ state: null, selectedCards: [], isProcessing: false });
  },

  aiPlay: (play: Play) => {
    const { state } = get();
    if (!state) return;

    const newState = handlePlay(state, state.currentPlayerIndex, play);
    set({ state: newState });
  },

  aiPass: () => {
    const { state } = get();
    if (!state) return;

    const newState = handlePass(state, state.currentPlayerIndex);
    set({ state: newState });
  },
}));
