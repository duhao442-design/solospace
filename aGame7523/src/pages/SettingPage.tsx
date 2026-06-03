import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Brain, Play } from 'lucide-react';
import { Difficulty } from '@/game/types';
import { useGameStore } from '@/store/gameStore';

export const SettingPage: React.FC = () => {
  const navigate = useNavigate();
  const { startGame } = useGameStore();
  const [playerCount, setPlayerCount] = useState(3);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const handleStart = () => {
    startGame(playerCount, difficulty);
    navigate('/game');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-table-dark via-table-green to-table-dark flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-10 shadow-2xl border-2 border-yellow-500/50 max-w-md w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2">
            七王五二三
          </h1>
          <p className="text-gray-400">经典扑克牌游戏</p>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <label className="flex items-center gap-2 text-white font-medium">
              <Users size={20} className="text-yellow-400" />
              玩家数量
            </label>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map((count) => (
                <motion.button
                  key={count}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPlayerCount(count)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                    playerCount === count
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 shadow-lg shadow-yellow-500/30'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {count}人
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <label className="flex items-center gap-2 text-white font-medium">
              <Brain size={20} className="text-yellow-400" />
              电脑难度
            </label>
            <div className="flex gap-2">
              {[
                { value: 'easy' as Difficulty, label: '简单' },
                { value: 'medium' as Difficulty, label: '中等' },
                { value: 'hard' as Difficulty, label: '困难' },
              ].map((level) => (
                <motion.button
                  key={level.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDifficulty(level.value)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                    difficulty === level.value
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 shadow-lg shadow-yellow-500/30'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {level.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-bold text-xl rounded-xl shadow-lg shadow-green-500/30 flex items-center justify-center gap-3 transition-all"
            >
              <Play size={24} />
              开始游戏
            </motion.button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 p-4 bg-gray-700/50 rounded-xl"
        >
          <h3 className="text-yellow-400 font-bold mb-2">游戏规则</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• 牌型大小: 7 > 大王 > 小王 > 5 > 2 > 3 > A > K > Q > J > 10 > 9 > 8 > 6 > 4</li>
            <li>• 分牌: 5(5分)、10(10分)、K(10分)</li>
            <li>• 支持牌型: 单张、对子、顺子、三张、三带二、炸弹、四带一</li>
            <li>• 率先出完所有牌并获得最高分者获胜</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
};
