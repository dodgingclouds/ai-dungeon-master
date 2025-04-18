// src/pages/Join.jsx (character selection added)
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Join() {
  const [sessionId, setSessionId] = useState('');
  const [characters, setCharacters] = useState([]);
  const [selectedCharId, setSelectedCharId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadCharacters = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) return;

      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', session.user.id);

      if (!error && data) {
        setCharacters(data);
      }
    };

    loadCharacters();
  }, []);

  const handleJoin = () => {
    const selectedChar = characters.find((c) => c.id === selectedCharId);
    if (!selectedChar || !sessionId) return;

    localStorage.setItem('playerName', selectedChar.name);
    localStorage.setItem('characterId', selectedChar.id);
    navigate(`/session/${sessionId}`);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Join a Session</h1>
      <input
        className="w-full p-2 border rounded mb-4"
        placeholder="Session ID"
        value={sessionId}
        onChange={(e) => setSessionId(e.target.value)}
      />
      <select
        className="w-full p-2 border rounded mb-4"
        value={selectedCharId}
        onChange={(e) => setSelectedCharId(e.target.value)}
      >
        <option value="">Select your character</option>
        {characters.map((char) => (
          <option key={char.id} value={char.id}>
            {char.name} the {char.race} {char.class}
          </option>
        ))}
      </select>
      <button
        className="w-full bg-green-600 text-white p-2 rounded"
        disabled={!selectedCharId || !sessionId}
        onClick={handleJoin}
      >
        Enter Session
      </button>
    </div>
  );
}