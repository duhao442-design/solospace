import { createBrowserRouter } from 'react-router-dom';
import { SettingPage } from '@/pages/SettingPage';
import { GamePage } from '@/pages/GamePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <SettingPage />,
  },
  {
    path: '/game',
    element: <GamePage />,
  },
]);
