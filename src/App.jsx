// src/App.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <nav className="bg-white shadow-md p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">AI Dungeon Master</h1>
        <div className="space-x-4">
          <Link to="/" className="text-blue-600 hover:underline">
            Home
          </Link>
          <Link to="/join" className="text-blue-600 hover:underline">
            Join
          </Link>
          <Link to="/admin" className="text-blue-600 hover:underline">
            Admin
          </Link>
          <Link to="/session/test123" className="text-blue-600 hover:underline">
            Join Test Session
          </Link>
        </div>
      </nav>

      <main className="p-6">
        <h2 className="text-2xl font-semibold">Welcome to AI Dungeon Master</h2>
        <p className="mt-4">Choose an option from the menu above to begin.</p>
      </main>
    </div>
  );
}
