// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Session from './pages/Session';
import AdminWorld from './pages/AdminWorld';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 text-gray-900">
        <nav className="bg-white shadow-md p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">AI Dungeon Master</h1>
          <div className="space-x-4">
            <Link to="/" className="text-blue-600 hover:underline">Home</Link>
            <Link to="/join" className="text-blue-600 hover:underline">Join</Link>
            <Link to="/admin/world" className="text-blue-600 hover:underline">World Editor</Link>
            <Link to="/session/test123" className="text-blue-600 hover:underline">Join Test Session</Link>
          </div>
        </nav>

        <main className="p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/join" element={<Session />} />
            <Route path="/session/:id" element={<Session />} />
            <Route path="/admin/world" element={<AdminWorld />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
