// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import App from './App';
import Session from './pages/Session';
import Admin from './pages/Admin';
import Join from './pages/Join';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // Home or dashboard
  },
  {
    path: '/session/:id',
    element: <Session />, // Main game UI
  },
  {
    path: '/admin',
    element: <Admin />, // Admin tools (optional)
  },
  {
    path: '/join',
    element: <Join />, // Player join screen
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);