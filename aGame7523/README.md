# 七王五二三 - 经典扑克牌游戏

一款基于 React + TypeScript + Vite 开发的七王五二三扑克牌游戏。

## 游戏规则

### 牌型大小
7 > 大王 > 小王 > 5 > 2 > 3 > A > K > Q > J > 10 > 9 > 8 > 6 > 4

### 花色大小
黑桃 > 红桃 > 梅花 > 方块

### 分牌
- 5: 5分
- 10: 10分  
- K: 10分
- 总分: 100分

### 支持牌型
- **单张**: 任意一张牌
- **对子**: 两张相同点数的牌
- **顺子**: 至少三张连续的牌（如: 345, 4567等）
- **三张**: 三张相同点数的牌
- **三带二**: 三张 + 一对
- **炸弹**: 四张相同点数的牌（可压任意牌型）
- **四带一**: 四张 + 单张

## 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Zustand** - 状态管理
- **Framer Motion** - 动画效果
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库
- **React Router** - 路由管理

## 功能特性

- 🎮 支持 2-5 名玩家（1名玩家 + 1-4名电脑）
- 🤖 三种难度级别（简单/中等/困难）
- 🎨 精美动画效果
- 💡 出牌提示功能
- 🏆 游戏结束统计排名

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 项目结构

```
src/
├── components/       # 组件
│   ├── Card/        # 扑克牌组件
│   ├── PlayerHand/  # 玩家手牌组件
│   ├── PlayerInfo/  # 玩家信息组件
│   ├── PlayArea/    # 出牌区域组件
│   └── GameControls/# 游戏控制组件
├── pages/           # 页面
│   ├── SettingPage.tsx
│   └── GamePage.tsx
├── game/            # 游戏逻辑
│   ├── types.ts     # 类型定义
│   ├── cardRules.ts # 牌型规则
│   ├── aiPlayer.ts  # AI逻辑
│   └── gameEngine.ts# 游戏引擎
├── store/           # 状态管理
│   └── gameStore.ts
├── styles/          # 样式
│   └── globals.css
├── App.tsx
├── main.tsx
└── router.tsx
```
