// src/pages/Join.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Join() {
  const [name, setName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();

    if (!name.trim() || !sessionId.trim()) return;

    // Store player name
    localStorage.setItem('playerName', name);

    // Get current players for this session
    const key = `players:${sessionId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');

    // Add this player if not already there
    if (!existing.includes(name)) {
      localStorage.setItem(key, JSON.stringify([...existing, name]));
    }

    navigate(`/session/${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-6">Join a Game</h1>
      <form onSubmit={handleJoin} className="space-y-4 w-full max-w-md">
        <input
          type="text"
          placeholder="Your name"
          className="w-full p-3 rounded-md bg-gray-800 text-white"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Session ID"
          className="w-full p-3 rounded-md bg-gray-800 text-white"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 p-3 rounded-md font-semibold"
        >
          Join Session
        </button>
      </form>
    </div>
  );
}
