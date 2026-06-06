import React from 'react';
import { motion } from 'framer-motion';
import { Play, SkipForward, Lightbulb, RotateCcw, X } from 'lucide-react';
import { message } from 'antd';
import { useGameStore } from '@/store/gameStore';

interface GameControlsProps {
  canPlay: boolean;
  canPass: boolean;
  onHint: () => void;
  disabled?: boolean;
  selectedCount: number;
}

export const GameControls: React.FC<GameControlsProps> = ({
  canPlay,
  canPass,
  onHint,
  disabled = false,
  selectedCount = 0,
}) => {
  const { playCards, pass, clearSelection, resetGame } = useGameStore();
  const [messageApi, contextHolder] = message.useMessage();

  const handlePlay = () => {
    if (disabled) return;
    if (selectedCount === 0) {
      messageApi.warning('请先选择要出的牌');
      return;
    }
    const success = playCards();
    if (!success) {
      messageApi.error('牌型不合法或无法压过对方的牌');
    }
  };

  const handlePass = () => {
    if (!canPass || disabled) {
      if (!canPass) {
        messageApi.info('首轮出牌不能不出');
      }
      return;
    }
    pass();
  };

  return (
    <>
      {contextHolder}
      <div className="flex items-center justify-center gap-4 py-4">
      <motion.button
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        onClick={() => !disabled && clearSelection()}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
          disabled
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-gray-700 text-white hover:bg-gray-600'
        }`}
        disabled={disabled}
      >
        <X size={18} />
        重选
      </motion.button>

      <motion.button
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        onClick={() => !disabled && onHint()}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
          disabled
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-500'
        }`}
        disabled={disabled}
      >
        <Lightbulb size={18} />
        提示
      </motion.button>

      <motion.button
        whileHover={!disabled && canPass ? { scale: 1.05 } : {}}
        whileTap={!disabled && canPass ? { scale: 0.95 } : {}}
        onClick={handlePass}
        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
          !canPass || disabled
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-orange-600 text-white hover:bg-orange-500'
        }`}
        disabled={!canPass || disabled}
      >
        <SkipForward size={18} />
        不出
      </motion.button>

      <motion.button
        whileHover={!disabled && selectedCount > 0 ? { scale: 1.05 } : {}}
        whileTap={!disabled && selectedCount > 0 ? { scale: 0.95 } : {}}
        onClick={handlePlay}
        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-lg transition-all ${
          disabled || selectedCount === 0
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : canPlay
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-400 hover:to-green-500 shadow-lg shadow-green-500/30'
              : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-400 hover:to-orange-500 shadow-lg shadow-orange-500/30'
        }`}
        disabled={disabled || selectedCount === 0}
      >
        <Play size={20} />
        出牌
        {selectedCount > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-sm">
            {selectedCount}张
          </span>
        )}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={resetGame}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold bg-red-600 text-white hover:bg-red-500 transition-all"
      >
        <RotateCcw size={18} />
        重开
      </motion.button>
    </div>
    </>
  );
};
