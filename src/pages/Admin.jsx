// src/pages/Session.jsx
import React from 'react';
import { useParams } from 'react-router-dom';

export default function Session() {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Game Session: {id}</h1>
      <p className="mt-4">This is where the player interacts with the AI DM.</p>
    </div>
  );
}
