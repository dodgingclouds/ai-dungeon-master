import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AdminWorld() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [json, setJson] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email === 'dodgingclouds@gmail.com') {
      setUser(session.user);

      const { data: worldData, error } = await supabase
        .from('world_state')
        .select('data')
        .eq('id', 'main')
        .single();

      if (error) {
        alert('Failed to load world: ' + error.message);
      } else {
        setJson(JSON.stringify(worldData.data, null, 2));
      }
    }
  };
  checkSession();
}, []);


  const handleLogin = async (e) => {
    e.preventDefault();
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert('Login failed: ' + error.message);
      return;
    }
    if (data.user.email === 'dodgingclouds@gmail.com') {
  setUser(data.user);

  const { data: worldData, error: loadError } = await supabase
    .from('world_state')
    .select('data')
    .eq('id', 'main')
    .single();

  if (loadError) {
    alert('Failed to load world: ' + loadError.message);
  } else {
    setJson(JSON.stringify(worldData.data, null, 2));
  }
} else {
  alert('Unauthorized account.');
}

  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const parsed = JSON.parse(json);
      const { error } = await supabase
        .from('world_state')
        .update({ data: parsed })
        .eq('id', 'main');
      if (error) {
        alert('Failed to save: ' + error.message);
      } else {
        alert('World saved!');
      }
    } catch (err) {
      alert('Invalid JSON: ' + err.message);
    }
    setSaving(false);
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded border border-gray-300">
        <h2 className="text-xl font-bold mb-4">Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full border px-3 py-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border px-3 py-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Log In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 bg-white border shadow">
      <h1 className="text-2xl font-bold mb-4">🛠️ World Editor</h1>
      <textarea
        className="w-full h-[600px] font-mono border p-4"
        value={json}
        onChange={(e) => setJson(e.target.value)}
        placeholder="Paste your world JSON here..."
      />
      <button
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : '💾 Save World'}
      </button>
    </div>
  );
}
