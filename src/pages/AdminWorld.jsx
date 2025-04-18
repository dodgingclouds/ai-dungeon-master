// src/pages/AdminWorld.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function AdminWorld() {
  const [user, setUser] = useState(null);
  const [worldData, setWorldData] = useState('{}');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const getUserAndWorld = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate('/');
        return;
      }

      setUser(session.user);

      const { data, error } = await supabase.from('world_state').select('data').eq('id', 'main').single();
      if (error) {
        console.error('Failed to load world data:', error.message);
        setStatus('Failed to load world data');
      } else {
        setWorldData(JSON.stringify(data.data, null, 2));
      }
    };

    getUserAndWorld();
  }, [navigate]);

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(worldData);
      const { error } = await supabase.from('world_state').upsert({ id: 'main', data: parsed });
      if (error) {
        setStatus('❌ Failed to save changes: ' + error.message);
      } else {
        setStatus('✅ Changes saved!');
      }
    } catch (err) {
      setStatus('❌ Invalid JSON');
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">World State Editor</h1>
      {status && <div className="mb-2 text-sm text-gray-600">{status}</div>}
      <textarea
        className="w-full h-[600px] border p-2 font-mono text-sm bg-yellow-50 text-amber-900"
        value={worldData}
        onChange={(e) => setWorldData(e.target.value)}
      />
      <div className="mt-2 flex gap-4">
        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded shadow">
          Save Changes
        </button>
        <button onClick={() => navigate('/')} className="text-sm text-gray-700 underline">
          Cancel
        </button>
      </div>
    </div>
  );
}
