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
import Home from './pages/Home';
import Character from './pages/Character';
import LayoutTest from './pages/LayoutTest';
import AdminWorld from './pages/AdminWorld';



const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/join', element: <Join /> },
  { path: '/session/:id', element: <Session /> },
  { path: '/admin/:id', element: <Admin /> },
  { path: '/character', element: <Character /> },
  { path: '/create', element: <Character /> },
  { path: '/test', element: <LayoutTest /> },
  { path: '/admin/world', element: <AdminWorld /> },

]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);