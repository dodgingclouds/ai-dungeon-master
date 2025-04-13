// src/pages/Session.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
// TEST: Supabase ping
supabase
  .from('messages')
  .select('*')
  .limit(1)
  .then(({ error }) => {
    if (error) console.error('Supabase connection failed:', error.message);
    else console.log('✅ Supabase connection is working');
  });

export default function Session() {
  console.log('🔄 Session.jsx mounted');
  const { id } = useParams();
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [gmInput, setGmInput] = useState('');

  const isGM = playerName.toLowerCase() === 'gm';
  const fetchPlayers = async () => {
  const { data, error } = await supabase
    .from('players')
    .select('name')
    .eq('session_id', id);

  if (!error && data) {
    const names = [...new Set(data.map((p) => p.name))];
    setPlayers(names);
  }
};


  useEffect(() => {
  const name = localStorage.getItem('playerName') || 'Unnamed Hero';
  setPlayerName(name);

  // Insert this player into Supabase
  const insertPlayer = async () => {
    const { error } = await supabase.from('players').insert({
      session_id: id,
      name,
    });
    if (error) console.error('⚠️ Failed to insert player:', error.message);
  };
  insertPlayer();

  // Fetch initial players
  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('name')
      .eq('session_id', id);

    if (!error && data) {
      const names = [...new Set(data.map((p) => p.name))];
      setPlayers(names);
    }
  };
  fetchPlayers();

  // Fetch initial messages
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    if (!error) setMessages(data);
  };
  fetchMessages();

  // Subscribe to players + messages in one channel
  const channel = supabase.channel('room:session-' + id);

  channel
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'players' },
      (payload) => {
        const newPlayer = payload.new;
        if (newPlayer.session_id === id) {
          fetchPlayers();
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        const newMessage = payload.new;
        console.log('📥 New message from Supabase:', newMessage);
        if (newMessage.session_id === id) {
          setMessages((prev) => [...prev, newMessage]);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [id]);



  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    if (!error) setMessages(data);
  };

  const sendMessage = async (sender, text) => {
    await supabase.from('messages').insert([
      {
        session_id: id,
        sender,
        text,
      },
    ]);
  };

  const handlePlayerSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    await sendMessage(playerName, input);
    setInput('');

    setTimeout(async () => {
      const aiReply = await mockAIResponse(input);
      await sendMessage('AI DM', aiReply);
    }, 1500);
  };

  const handleGMSubmit = async (e) => {
    e.preventDefault();
    if (!gmInput.trim()) return;

    await sendMessage('GM', gmInput);
    setGmInput('');
  };

  const mockAIResponse = async (input) => {
    const systemPrompt = `You are a dungeon master narrating an interactive story in a fantasy world. Keep your responses immersive and concise.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
        temperature: 0.9
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "The AI didn't respond.";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-gray-800 p-4 shadow flex justify-between items-center">
        <h1 className="text-xl font-bold">Session: {id}</h1>
        <p className="text-sm text-gray-300">Player: {playerName}</p>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-gray-800 p-4 border-r border-gray-700 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2">Players</h2>
          <ul className="space-y-1">
            {players.map((p, i) => (
              <li
                key={i}
                className={`px-3 py-1 rounded ${
                  p === playerName ? 'bg-blue-700 font-bold' : 'bg-gray-700'
                }`}
              >
                {p}
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex-1 p-6 space-y-3 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-md max-w-xl ${
                msg.sender === playerName
                  ? 'bg-blue-600 self-end ml-auto'
                  : msg.sender === 'GM'
                  ? 'bg-red-700'
                  : msg.sender === 'AI DM'
                  ? 'bg-purple-700'
                  : 'bg-gray-700 text-sm italic'
              }`}
            >
              <strong>{msg.sender}:</strong> {msg.text}
            </div>
          ))}
        </main>
      </div>

      {!isGM ? (
        <form
          onSubmit={handlePlayerSubmit}
          className="bg-gray-800 p-4 flex gap-2 border-t border-gray-700"
        >
          <input
            type="text"
            className="flex-1 bg-gray-700 text-white p-2 rounded-md"
            placeholder="What do you do?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md"
          >
            Send
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleGMSubmit}
          className="bg-gray-900 p-4 flex gap-2 border-t border-red-800"
        >
          <input
            type="text"
            className="flex-1 bg-red-800 text-white p-2 rounded-md"
            placeholder="GM response..."
            value={gmInput}
            onChange={(e) => setGmInput(e.target.value)}
          />
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-md"
          >
            Respond
          </button>
        </form>
      )}
    </div>
  );
}
