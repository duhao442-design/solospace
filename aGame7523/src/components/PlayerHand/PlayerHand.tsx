import React from 'react';
import { motion } from 'framer-motion';
import { Card as CardType } from '@/game/types';
import { CardComponent } from '@/components/Card/Card';
import { useGameStore } from '@/store/gameStore';

interface PlayerHandProps {
  cards: CardType[];
  isCurrentPlayer: boolean;
  disabled?: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  isCurrentPlayer,
  disabled = false,
}) => {
  const { selectedCards, selectCard } = useGameStore();

  const cardCount = cards.length;
  const spreadAngle = Math.min(cardCount * 4, 60);
  const startAngle = -spreadAngle / 2;

  return (
    <div className="relative flex items-end justify-center h-36">
      {cards.map((card, index) => {
        const angle = startAngle + (spreadAngle / (cardCount - 1 || 1)) * index;
        const yOffset = Math.abs(angle) * 0.3;
        const isSelected = selectedCards.includes(card.id);

        return (
          <motion.div
            key={card.id}
            className="absolute"
            style={{
              transform: `rotate(${angle}deg) translateY(${yOffset}px)`,
              transformOrigin: 'bottom center',
              marginLeft: `${index * -20}px`,
              zIndex: index,
            }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <CardComponent
              card={card}
              selected={isSelected}
              onClick={() => isCurrentPlayer && !disabled && selectCard(card.id)}
              disabled={!isCurrentPlayer || disabled}
            />
          </motion.div>
        );
      })}
    </div>
  );
};
