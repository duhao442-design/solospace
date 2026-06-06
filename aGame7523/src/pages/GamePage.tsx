import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Home } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { PlayerInfo } from '@/components/PlayerInfo/PlayerInfo';
import { PlayArea } from '@/components/PlayArea/PlayArea';
import { PlayerHand } from '@/components/PlayerHand/PlayerHand';
import { GameControls } from '@/components/GameControls/GameControls';
import { isCurrentPlayerHuman } from '@/game/gameEngine';
import { aiChoosePlay, getAIDelay } from '@/game/aiPlayer';
import { getCardType, canBeat, findHintPlay } from '@/game/cardRules';

const getPlayerPosition = (index: number, total: number): 'bottom' | 'top' | 'left' | 'right' => {
  if (index === 0) return 'bottom';
  if (total === 2) return 'top';
  if (index === 1) return 'right';
  if (index === 2) return 'top';
  return 'left';
};

export const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const { state, selectedCards, aiPlay, aiPass, setProcessing, isProcessing, resetGame } = useGameStore();

  useEffect(() => {
    if (!state) {
      navigate('/');
    }
  }, [state, navigate]);

  const handleAI = useCallback(() => {
    if (!state || state.phase === 'gameOver') return;
    if (isCurrentPlayerHuman(state)) return;
    if (isProcessing) return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    const otherPlayerCardCounts = state.players
      .filter((_, i) => i !== state.currentPlayerIndex)
      .map(p => p.cards.length);
    
    const currentRoundPoints = state.tableCards.reduce((sum, c) => sum + c.points, 0);
    
    const context = {
      remainingDeckCount: state.deck.length,
      otherPlayerCardCounts,
      currentRoundPoints,
    };

    const aiDecision = aiChoosePlay(
      currentPlayer.cards,
      state.lastPlay,
      state.difficulty,
      context
    );

    setProcessing(true);
    const delay = getAIDelay(state.difficulty);

    setTimeout(() => {
      if (aiDecision) {
        aiPlay(aiDecision);
      } else {
        aiPass();
      }
      setProcessing(false);
    }, delay);
  }, [state, isProcessing, aiPlay, aiPass, setProcessing]);

  useEffect(() => {
    if (state && !isCurrentPlayerHuman(state) && state.phase !== 'gameOver') {
      handleAI();
    }
  }, [state?.currentPlayerIndex, state?.phase, handleAI, state]);

  const handleHint = () => {
    if (!state || !isCurrentPlayerHuman(state)) return;
    
    const player = state.players[state.currentPlayerIndex];
    const hint = findHintPlay(player.cards, state.lastPlay);
    
    if (hint) {
      useGameStore.getState().clearSelection();
      hint.cards.forEach(card => useGameStore.getState().selectCard(card.id));
    }
  };

  const canPlay = (): boolean => {
    if (!state || !isCurrentPlayerHuman(state)) return false;
    if (selectedCards.length === 0) return false;

    const player = state.players[state.currentPlayerIndex];
    const cardsToPlay = player.cards.filter((c) => selectedCards.includes(c.id));
    const play = getCardType(cardsToPlay);
    
    if (!play) return false;
    return canBeat(play, state.lastPlay);
  };

  const canPass = (): boolean => {
    if (!state || !isCurrentPlayerHuman(state)) return false;
    return state.lastPlay !== null;
  };

  const handleBackToMenu = () => {
    resetGame();
    navigate('/');
  };

  if (!state) return null;

  const isGameOver = state.phase === 'gameOver';
  const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
  const isHumanTurn = isCurrentPlayerHuman(state);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-table-dark via-table-green to-table-dark relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, #FFD700 0%, transparent 50%)',
        }} />
      </div>

      <div className="relative z-20 flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackToMenu}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 rounded-lg text-white hover:bg-gray-700 transition-all backdrop-blur-sm"
          >
            <Home size={18} />
            返回
          </motion.button>
        </div>
        <div className="bg-gray-800/80 rounded-lg px-5 py-2 text-white backdrop-blur-sm">
          <span className="text-yellow-400 font-bold">第 {state.roundCount} 轮</span>
          <span className="mx-3 text-gray-400">|</span>
          <span>剩余牌: {state.deck.length}</span>
        </div>
        <div className="w-24"></div>
      </div>

      <div className="flex-1 relative min-h-0">
        {state.players.map((player, index) => {
          if (index === 0) return null;
          const position = getPlayerPosition(index, state.playerCount);
          const isCurrent = index === state.currentPlayerIndex;
          return (
            <PlayerInfo
              key={player.id}
              player={player}
              isCurrentPlayer={isCurrent}
              position={position}
            />
          );
        })}

        <div className="absolute inset-0 flex items-center justify-center">
          <PlayArea lastPlay={state.lastPlay} message={state.message} />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center pb-4">
        <PlayerHand
          cards={state.players[0].cards}
          isCurrentPlayer={isHumanTurn}
          disabled={!isHumanTurn || isProcessing || isGameOver}
        />
        
        <GameControls
          canPlay={canPlay()}
          canPass={canPass()}
          onHint={handleHint}
          disabled={!isHumanTurn || isProcessing || isGameOver}
        />
      </div>

      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 max-w-lg w-full mx-4 border-2 border-yellow-500/50"
            >
              <div className="text-center mb-6">
                <Trophy className="w-20 h-20 mx-auto text-yellow-400 mb-4" />
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                  游戏结束
                </h2>
              </div>

              <div className="space-y-3 mb-8">
                {sortedPlayers.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      index === 0
                        ? 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border border-yellow-500/50'
                        : 'bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-yellow-400">
                        {index === 0 ? '👑' : `${index + 1}`}
                      </span>
                      <span className="text-3xl">{player.avatar}</span>
                      <span className={`font-bold ${player.isHuman ? 'text-green-400' : 'text-white'}`}>
                        {player.name}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-yellow-400">
                      {player.score} 分
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBackToMenu}
                  className="flex-1 py-3 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-600 transition-all"
                >
                  返回菜单
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const { playerCount, difficulty } = state;
                    resetGame();
                    setTimeout(() => {
                      useGameStore.getState().startGame(playerCount, difficulty);
                    }, 100);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-400 hover:to-green-500 transition-all"
                >
                  再来一局
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
