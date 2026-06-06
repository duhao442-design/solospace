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
  const cardWidth = 60;
  const visibleWidth = 36;
  const totalWidth = (cardCount - 1) * visibleWidth + cardWidth;

  return (
    <div 
      className="relative h-36 mx-auto"
      style={{ width: `${totalWidth}px` }}
    >
      {cards.map((card, index) => {
        const isSelected = selectedCards.includes(card.id);
        const left = index * visibleWidth;

        return (
          <motion.div
            key={card.id}
            className="absolute cursor-pointer"
            style={{
              left: `${left}px`,
              bottom: 0,
              zIndex: isSelected ? 100 : index,
            }}
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{
              opacity: 1,
              y: isSelected ? -28 : 0,
              scale: 1,
            }}
            transition={{
              delay: index * 0.04,
              duration: 0.25,
            }}
            whileHover={isCurrentPlayer && !disabled ? {
              y: isSelected ? -36 : -12,
              zIndex: 99,
            } : {}}
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
