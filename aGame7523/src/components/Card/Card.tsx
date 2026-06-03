import React from 'react';
import { motion } from 'framer-motion';
import { Card as CardType, SUIT_SYMBOLS, SUIT_COLORS } from '@/game/types';

interface CardProps {
  card: CardType;
  selected?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

const sizeStyles = {
  small: {
    width: '40px',
    height: '56px',
    fontSize: '12px',
    borderRadius: '4px',
  },
  medium: {
    width: '60px',
    height: '84px',
    fontSize: '16px',
    borderRadius: '6px',
  },
  large: {
    width: '80px',
    height: '112px',
    fontSize: '20px',
    borderRadius: '8px',
  },
};

export const CardComponent: React.FC<CardProps> = ({
  card,
  selected = false,
  onClick,
  faceDown = false,
  size = 'medium',
  disabled = false,
}) => {
  const style = sizeStyles[size];
  const color = SUIT_COLORS[card.suit];
  const suitSymbol = SUIT_SYMBOLS[card.suit];

  if (faceDown) {
    return (
      <motion.div
        className="relative flex items-center justify-center cursor-pointer select-none"
        style={{
          ...style,
          background: 'linear-gradient(135deg, #C41E3A 0%, #8B0000 100%)',
          border: '2px solid #FFD700',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
        whileHover={!disabled ? { scale: 1.05, y: -4 } : {}}
        onClick={disabled ? undefined : onClick}
      >
        <div className="absolute inset-2 border border-yellow-400 rounded opacity-50" />
        <div className="text-yellow-400 text-2xl">♠</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative flex flex-col items-center justify-between bg-white cursor-pointer select-none"
      style={{
        ...style,
        border: selected ? '3px solid #FFD700' : '1px solid #ccc',
        boxShadow: selected 
          ? '0 0 15px rgba(255, 215, 0, 0.6)' 
          : '0 2px 8px rgba(0,0,0,0.2)',
        transform: selected ? 'translateY(-16px)' : 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      whileHover={!disabled ? { scale: 1.05, y: selected ? -20 : -8 } : {}}
      onClick={disabled ? undefined : onClick}
    >
      <div 
        className="absolute top-1 left-1 flex flex-col items-center font-bold"
        style={{ color, fontSize: `calc(${style.fontSize} * 0.8)` }}
      >
        <span>{card.display}</span>
        <span style={{ fontSize: `calc(${style.fontSize} * 0.7)` }}>{suitSymbol}</span>
      </div>
      
      <div 
        className="text-3xl font-bold"
        style={{ color, fontSize: `calc(${style.fontSize} * 1.5)` }}
      >
        {suitSymbol || (card.rank === 'bigJoker' ? '🃏' : '🂿')}
      </div>
      
      <div 
        className="absolute bottom-1 right-1 flex flex-col items-center font-bold rotate-180"
        style={{ color, fontSize: `calc(${style.fontSize} * 0.8)` }}
      >
        <span>{card.display}</span>
        <span style={{ fontSize: `calc(${style.fontSize} * 0.7)` }}>{suitSymbol}</span>
      </div>

      {card.isPointCard && (
        <div className="absolute top-0 right-0 bg-yellow-400 text-black text-xs px-1 rounded-bl font-bold">
          {card.points}
        </div>
      )}
    </motion.div>
  );
};
