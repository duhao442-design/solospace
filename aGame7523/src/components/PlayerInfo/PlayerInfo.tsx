import React from 'react';
import { motion } from 'framer-motion';
import { Player } from '@/game/types';

interface PlayerInfoProps {
  player: Player;
  isCurrentPlayer: boolean;
  position: 'bottom' | 'top' | 'left' | 'right';
}

const positionStyles = {
  bottom: 'bottom-36 left-1/2 -translate-x-1/2',
  top: 'top-4 left-1/2 -translate-x-1/2',
  left: 'left-6 top-1/2 -translate-y-1/2',
  right: 'right-6 top-1/2 -translate-y-1/2',
};

export const PlayerInfo: React.FC<PlayerInfoProps> = ({
  player,
  isCurrentPlayer,
  position,
}) => {
  const isHorizontal = position === 'left' || position === 'right';

  return (
    <motion.div
      className={`absolute ${positionStyles[position]} z-10`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 ${
          isCurrentPlayer
            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-400/50'
            : 'bg-gradient-to-br from-gray-700 to-gray-900/90 shadow-lg backdrop-blur-sm'
        }`}
      >
        <div
          className={`text-2xl ${isCurrentPlayer ? 'animate-bounce' : ''}`}
        >
          {player.avatar}
        </div>
        <div className="flex flex-col">
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
            {player.score}分 | {player.cards.length}张
          </div>
        </div>
        {isCurrentPlayer && (
          <div className="ml-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>
    </motion.div>
  );
};
