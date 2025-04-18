// src/pages/Home.jsx (with Delete Character confirmation popup)
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useRef } from 'react';


export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [charToDelete, setCharToDelete] = useState(null);
  const navigate = useNavigate();
  const audioRef = useRef(null);


  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user);
        loadCharacters(data.session.user.id);
      }
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadCharacters(session.user.id);
      } else {
        setUser(null);
        setCharacters([]);
      }
    });
  }, []);

  const loadCharacters = async (userId) => {
    const { data } = await supabase.from('characters').select('*').eq('user_id', userId);
    if (data) setCharacters(data);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCharacters([]);
  };

  const handlePlay = (character) => {
    localStorage.setItem('playerName', character.name);
    localStorage.setItem('characterId', character.id);
    navigate('/join');
  };

  const confirmDelete = async () => {
    if (!charToDelete) return;
    await supabase.from('characters').delete().eq('id', charToDelete.id);
    setCharToDelete(null);
    if (user) loadCharacters(user.id);
  };


      if (!user) {
  return (
    <div>
      <audio autoPlay loop hidden>
        <source src="/hometheme.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      <div
        className="min-h-screen flex flex-col items-center pt-10 bg-yellow-50 font-serif text-amber-900"
        style={{
          backgroundImage: "url('/images/Revbegins.png')",
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center top',
        }}
      >
        <h1
          className="text-6xl font-serif mb-8 border-b-4 border-amber-700 pb-2 drop-shadow-md"
          style={{
            textShadow: '2px 2px 4px black',
            WebkitTextStroke: '1px black',
            color: '#f59e0b',
          }}
        >
          Welcome to the Revolution
        </h1>

        <div className="w-full max-w-sm px-4 bg-white rounded shadow-lg border border-amber-300 p-6">
          <form onSubmit={handleLogin} className="flex flex-col space-y-4">
            <input
              id="email"
              className="p-2 border border-amber-600 rounded bg-amber-50 placeholder-gray-700 text-black"
              placeholder="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              id="password"
              className="p-2 border border-amber-600 rounded bg-amber-50 placeholder-gray-700 text-black"
              placeholder="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded shadow-md transition duration-300"
              type="submit"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={handleSignup}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded shadow-md transition duration-300"
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}







  return (
    <>
      <div className="p-4 w-full flex flex-col items-center">
        <div className="mb-6 flex flex-col items-center text-center">
          <h1 className="text-4xl font-serif text-amber-900 border-b border-amber-700">
            {user?.email ? `Welcome, ${user.email}` : 'Welcome...'}
          </h1>
          <div className="flex gap-4">
            <button onClick={handleLogout} className="text-sm text-red-500 border border-red-500 px-3 py-1 rounded">
              Log Out
            </button>
            <button onClick={() => navigate('/create')} className="bg-green-600 text-white px-4 py-2 rounded">
              ➕ Create New Character
            </button>
          </div>
        </div>

        {characters.length === 0 ? (
          <p>No characters found.</p>
        ) : (
          <ul className="space-y-4 ml-10">
            {characters.map((char) => (
              <li
                key={char.id}
                className="p-4 border rounded shadow hover:bg-gray-50 relative"
              >
                <div className="flex items-center gap-6">
                  <h2 className="text-lg font-semibold">{char.name}</h2>
                  <p className="text-sm text-gray-600">{char.race} {char.class}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(char);
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Play
                  </button>
                  <button
                    onClick={() => setCharToDelete(char)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {charToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-sm w-full text-center">
            <h2 className="text-lg font-bold mb-4">Shed the mortal coil?</h2>
            <p className="mb-6">Delete <strong>{charToDelete.name}</strong> forever?</p>
            <div className="flex justify-around">
              <button
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={() => setCharToDelete(null)}
              >
                No
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={confirmDelete}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}