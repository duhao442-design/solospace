import React from 'react';
import { motion } from 'framer-motion';
import { Player } from '@/game/types';

interface PlayerInfoProps {
  player: Player;
  isCurrentPlayer: boolean;
  position: 'bottom' | 'top' | 'left' | 'right';
}

const positionStyles = {
  bottom: 'bottom-4 left-1/2 -translate-x-1/2',
  top: 'top-4 left-1/2 -translate-x-1/2',
  left: 'left-4 top-1/2 -translate-y-1/2',
  right: 'right-4 top-1/2 -translate-y-1/2',
};

export const PlayerInfo: React.FC<PlayerInfoProps> = ({
  player,
  isCurrentPlayer,
  position,
}) => {
  return (
    <motion.div
      className={`absolute ${positionStyles[position]} z-10`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={`flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${
          isCurrentPlayer
            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-400/50'
            : 'bg-gradient-to-br from-gray-700 to-gray-900 shadow-lg'
        }`}
      >
        <div
          className={`text-4xl mb-1 ${
            isCurrentPlayer ? 'animate-bounce' : ''
          }`}
        >
          {player.avatar}
        </div>
        <div
          className={`text-sm font-bold ${
            isCurrentPlayer ? 'text-gray-900' : 'text-white'
          }`}
        >
          {player.name}
        </div>
        <div
          className={`text-xs ${
            isCurrentPlayer ? 'text-gray-700' : 'text-gray-300'
          }`}
        >
          分数: {player.score}
        </div>
        <div
          className={`text-xs ${
            isCurrentPlayer ? 'text-gray-700' : 'text-gray-300'
          }`}
        >
          手牌: {player.cards.length}
        </div>
        {isCurrentPlayer && (
          <div className="mt-1 text-xs font-bold text-red-600 animate-pulse">
            出牌中
          </div>
        )}
      </div>
    </motion.div>
  );
};
