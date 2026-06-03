import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from '@/game/types';
import { CardComponent } from '@/components/Card/Card';

interface PlayAreaProps {
  lastPlay: Play | null;
  message: string;
}

export const PlayArea: React.FC<PlayAreaProps> = ({ lastPlay, message }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-4 px-6 py-2 bg-black/50 rounded-full text-white font-bold text-lg"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative w-80 h-32 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {lastPlay && (
            <motion.div
              key={lastPlay.cards.map(c => c.id).join('-')}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex"
            >
              {lastPlay.cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ x: -50 * index, rotate: -10 }}
                  animate={{ x: -20 * index, rotate: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CardComponent card={card} size="medium" disabled />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {lastPlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 px-4 py-1 bg-yellow-400/80 rounded-full text-sm font-bold text-gray-900"
        >
          {getPlayTypeName(lastPlay.type)}
        </motion.div>
      )}
    </div>
  );
};

function getPlayTypeName(type: string): string {
  const names: Record<string, string> = {
    single: '单张',
    pair: '对子',
    triple: '三张',
    tripleWithPair: '三带二',
    straight: '顺子',
    bomb: '炸弹',
    bombWithSingle: '四带一',
  };
  return names[type] || type;
}
