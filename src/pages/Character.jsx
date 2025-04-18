// src/pages/Character.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Character() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    race: 'Human',
    class: '',
    stats: { STR: 0, AGI: 0, INT: 0, CHA: 0 },
    inventory: [],
    background: '',
  });

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return alert('You must be logged in to create a character.');

    const { error } = await supabase.from('characters').insert({
      user_id: user.id,
      ...form,
    });

    if (error) alert(error.message);
    else navigate('/');
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Character Creation</h1>

      {step === 1 && (
        <div className="space-y-4">
          <label className="block">
            Name
            <input
              className="w-full border p-2 rounded"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
            />
          </label>
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleNext} disabled={!form.name}>
            Next: Choose Class
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <label className="block">
            Archetype / Class
            <select
              className="w-full border p-2 rounded"
              value={form.class}
              onChange={(e) => updateForm('class', e.target.value)}
            >
              <option value="">Select one</option>
              <option value="Artificer">Artificer</option>
              <option value="Mechanik">Mechanik</option>
              <option value="Alchemist">Alchemist</option>
              <option value="Soldier">Soldier</option>
            </select>
          </label>
          <div className="flex justify-between">
            <button onClick={handleBack} className="text-gray-500">Back</button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleNext} disabled={!form.class}>
              Next: Assign Stats
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Assign Stats (0–5 each)</h2>
          {Object.entries(form.stats).map(([key, val]) => (
            <label key={key} className="block">
              {key}
              <input
                type="number"
                min={0}
                max={5}
                className="w-full border p-2 rounded"
                value={val}
                onChange={(e) => setForm((f) => ({
                  ...f,
                  stats: { ...f.stats, [key]: Number(e.target.value) },
                }))}
              />
            </label>
          ))}
          <div className="flex justify-between">
            <button onClick={handleBack} className="text-gray-500">Back</button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleNext}>
              Next: Gear
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <label className="block">
            Starting Gear (comma-separated)
            <input
              className="w-full border p-2 rounded"
              value={form.inventory.join(', ')}
              onChange={(e) => updateForm('inventory', e.target.value.split(',').map((s) => s.trim()))}
            />
          </label>
          <div className="flex justify-between">
            <button onClick={handleBack} className="text-gray-500">Back</button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleNext}>
              Next: Background
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <label className="block">
            Character Background
            <textarea
              className="w-full border p-2 rounded"
              rows={4}
              value={form.background}
              onChange={(e) => updateForm('background', e.target.value)}
            />
          </label>
          <div className="flex justify-between">
            <button onClick={handleBack} className="text-gray-500">Back</button>
            <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleSubmit}>
              ✅ Finish and Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}