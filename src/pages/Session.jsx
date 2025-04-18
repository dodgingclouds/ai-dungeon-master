
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useRef } from 'react';


export default function Session() {
  const { id } = useParams();
  console.log('🧭 session_id from URL:', id);

  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState(localStorage.getItem('playerName') || 'Unnamed Hero');
  const [character, setCharacter] = useState(null);
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [location, setLocation] = useState('');
  const [world, setWorld] = useState(null);

  useEffect(() => {
  const loadWorld = async () => {
    const response = await supabase.from('world_state').select('data').eq('id', 'main').single();
    if (response.error) {
      console.error('❌ Failed to load world state:', response.error.message);
      return;
    }

    const worldData = response.data?.data;
    setWorld(worldData);

    const gameTime = worldData?.time;
    if (gameTime) {
      console.log(`🕰️ Game time loaded: Day ${gameTime.day}, ${gameTime.hour}:${gameTime.minute.toString().padStart(2, '0')}`);
    }
  };

  loadWorld();
}, []);

  // ✅ Replace this effect in your Session.jsx to load character + location
useEffect(() => {
  console.log('✅ Session.jsx loaded and running!');
  const name = localStorage.getItem('playerName') || 'Unnamed Hero';
  setPlayerName(name);

  // Load character
  supabase.from('characters').select('*').eq('name', name).then(({ data }) => {
  if (data?.[0]) {
    setCharacter(data[0]);
    console.log('📍 Player location:', data[0].location);
  }
});


  // Load messages
  supabase.from('messages').select('*').eq('session_id', id).order('timestamp', { ascending: true }).then(({ data }) => {
    if (data) setMessages(data);
  });

  

  const sub = supabase
    .channel('room:messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(sub);
  };
}, [id]);
<div className="text-sm italic text-amber-800 mb-2">
  In-Game Time: {world?.time?.hour || 0}:{world?.time?.minute?.toString().padStart(2, '0') || '00'} —
  {world?.time?.day} {world?.time?.month}, {world?.time?.year} AR
</div>
function getEventMessagesForPlayer(playerLocation, world, radiusMap) {
  if (!world?.events) return [];

  return world.events.flatMap(event => {
    const eventRoom = world.rooms.find(r => r.name === event.origin);
    const playerRoom = world.rooms.find(r => r.name === playerLocation);

    if (!eventRoom || !playerRoom) return [];

    const distance = radiusMap?.[event.origin]?.[playerLocation];

    if (distance != null && distance <= event.radius) {
      const msg = event.messageByDistance?.[distance];
      return msg ? [msg] : [];
    }

    return [];
  });
}
function generateRadiusMap(rooms) {
  const map = {};
  for (const room of rooms) {
    map[room.name] = {};
    const visited = new Set();
    const queue = [{ name: room.name, dist: 0 }];

    while (queue.length) {
      const { name, dist } = queue.shift();
      if (visited.has(name)) continue;
      visited.add(name);
      map[room.name][name] = dist;

      const exits = rooms.find(r => r.name === name)?.exits || [];
      for (const exit of exits) {
        queue.push({ name: exit, dist: dist + 1 });
      }
    }
  }
  return map;
}


  const handleSend = async () => {
  if (!input.trim()) return;

  // 🧭 Try to extract new position
  const moveMatch = input.match(/^(go|walk|move|approach|head|run) (?:to |towards )?(.*)$/i);
  if (moveMatch) {
    const newPosition = moveMatch[2].trim().toLowerCase();
    await supabase.from('characters').update({ position: newPosition }).eq('id', character.id);
    console.log(`📍 Position updated to: ${newPosition}`);
    const { data: allCharacters } = await supabase.from('characters').select('*');

// 👥 Get all players in the same room
const roomPlayers = allCharacters.filter(c => c.location === character.location);

// 🧭 Filter for players in *close proximity*
const nearbyPlayers = roomPlayers.filter(c =>
  c.position && character.position && c.position === character.position
);
// 🎯 Generate a list of visible players near the character
const visiblePlayerNames = nearbyPlayers
  .filter(c => c.name !== character.name)
  .map(c => c.name)
  .join(', ');

const visibleString = visiblePlayerNames
  ? `You see: ${visiblePlayerNames}.`
  : 'You see no other players nearby.';


  }

    const { error } = await supabase.from('messages').insert({
  session_id: id,
  sender: playerName,
  text: input
});

if (!error) {
  setInput('');

  console.log('🧠 Sending to AI:', input);

  const currentRoom = world?.map?.[character?.location];
const roomDescription = currentRoom?.description || '';
const roomExits = currentRoom?.exits ? Object.keys(currentRoom.exits).join(', ') : '';

// 🧭 Check if message is a movement command
const movementRegex = /^(go|walk|move|enter|exit|leave)\s(.+)/i;
const moveMatch = input.match(movementRegex);

if (moveMatch) {
  const destination = moveMatch[2].trim();

  // Try to find a matching room in the world
  const rooms = world.rooms || [];
  const targetRoom = rooms.find(r => r.name.toLowerCase() === destination.toLowerCase());

  if (targetRoom) {
    // Update player location in Supabase
    await supabase.from('characters').update({ location: targetRoom.name }).eq('id', character.id);
    console.log(`📍 Moved ${character.name} to ${targetRoom.name}`);
  } else {
    console.warn('🚫 No matching room found for:', destination);
  }
}



// 🎭 Find players in the same room
const nearbyPlayers = players.filter(p => p.location === character.location && p.name !== character.name);

const nearbyText = nearbyPlayers.length
  ? ` Nearby, the following characters are present: ${nearbyPlayers.map(p => p.name).join(', ')}.`
  : ' You are alone in this area.';
  const radiusMap = generateRadiusMap(world.rooms);
const eventMessages = getEventMessagesForPlayer(character.location, world, radiusMap);
const playerPosition = character.position || 'center';
const visibleThings = currentRoom?.senses?.sight?.join(', ') || 'nothing notable';
const audibleThings = currentRoom?.senses?.sound?.join(', ') || 'no sounds';
const smellThings = currentRoom?.senses?.smell?.join(', ') || 'no smells';


// 🧠 AI Prompt
const systemPrompt = `You are a steampunk dungeon master narrating an American Revolution-era fantasy world.

Respond only with what the player perceives *based on their exact position and room*. Be vivid and brief (1–2 short sentences). Track time, danger, and consequences.
The player is currently in "${character.location}", specifically "${playerPosition}".
They can currently:
- See: ${visibleThings}
- Hear: ${audibleThings}
- Smell: ${smellThings}
Current location: "${character.location}" (${character.position})
Their position within the area is: "${character.position || 'unknown'}"
Room description: ${roomDescription}
Visible exits: ${roomExits}
Nearby players: ${nearbyPlayers.join(', ')}

Recent environmental effects:
${eventMessages.join('\n') || 'None'}
${visibleString}

Only describe what the player can currently see or hear. Do not describe events too far away unless the character can perceive them.`;






  try {
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input },
        ],
      }),
    });

    const data = await aiRes.json();
    console.log('🤖 AI responded:', data);

    const reply = data.choices?.[0]?.message?.content;
    if (reply) {
      const { error: aiInsertError } = await supabase.from('messages').insert({
  session_id: id,
  sender: 'AI DM',
  text: reply,
});

if (aiInsertError) {
  console.error('❌ Failed to save AI response to Supabase:', aiInsertError.message);
} else {
  console.log('✅ AI response saved to Supabase');
}

    }
  } catch (err) {
    console.error('❌ AI request failed:', err);
  }
}

  };

  // ✅ Modify logout to save location when the player leaves
const handleLogout = async () => {
  if (character?.id && location) {
    await supabase.from('characters').update({ location }).eq('id', character.id);
  }
  await supabase.auth.signOut();
  localStorage.removeItem('playerName');
  localStorage.removeItem('characterId');
  navigate('/');
};
 useEffect(() => {
  console.log('👀 Character:', character);
  console.log('📨 Messages:', messages);
}, [character, messages]);

  return (
    <div
  className="min-h-screen bg-yellow-50 text-amber-900 font-serif"
  style={{
    backgroundImage: "url('C:\Users\dodgi\ai-dm-frontend\public\images\Revbegins.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }}
>

     <header className="flex items-center justify-center relative p-4 border-b bg-white shadow">

  {/* 🎵 Steampunk Gramophone Icon Button */}
  <button
    onClick={() => {
      if (audioRef.current) {
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    }}
    className="absolute left-4 top-4 text"
    title={isMuted ? 'Unmute Music' : 'Mute Music'}
  >
    {isMuted ? '🔇' : '📻'} {/* You can replace this emoji with a custom gramophone icon if you like */}
  </button>

  <h1 className="text-3xl font-bold text-center w-full">Session: {id}</h1>

  <button
    onClick={handleLogout}
    className="absolute right-4 top-4 text-sm bg-red-600 text-white px-3 py-1 rounded"
  >
    Logout
  </button>

  {/* 🎶 Hidden looping audio element */}
  <audio ref={audioRef} autoPlay loop muted>
    <source src="/hometheme.mp3" type="audio/mpeg" />
    Your browser does not support the audio element.
  </audio>

</header>


      <div className="px-6 py-2 text-sm">
        <strong>Players:</strong> {players.join(', ')} &nbsp;
        <strong>Location:</strong> Greywater Docks &nbsp;
        <strong>Date:</strong> 3 Rainfall, 142 AR &nbsp;
        <strong>Time:</strong> Late Afternoon &nbsp;
        <strong>Weather:</strong> Chilly, light rain
      </div>

      <div className="flex w-full px-6 py-4 gap-4">

        {/* Left Panel - Character Info */}
       <div className="w-1/5 h-[400px] bg-amber-100 border-4 border-amber-700 rounded-lg shadow-lg p-4 text-left overflow-auto">


          <h2 className="font-bold text-lg mb-2">Character Info</h2>
          {character && (
            <>
              <p><strong>Name:</strong> {character.name}</p>
              <p><strong>Class:</strong> {character.class}</p>
              <p><strong>Level:</strong> {character.level}</p>
              <p><strong>HP:</strong> {character.hp}</p>
              <div className="mt-2">
                <p className="font-semibold">Stats:</p>
                <ul className="list-disc list-inside text-sm">
                  {character.stats && Object.entries(character.stats).map(([key, val]) => (
                    <li key={key}><strong>{key.toUpperCase()}:</strong> {val}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Center Log Panel */}
       <div className="w-2/5 h-[400px] mx-4 bg-amber-50 border-4 border-amber-700 rounded-lg shadow-lg p-4 flex flex-col justify-between">



          <div className="overflow-y-auto h-full mb-2 flex flex-col justify-end">
  {messages.map((msg, idx) => (
    <div key={idx} className="text-sm"><strong>{msg.sender}:</strong> {msg.text}</div>
  ))}
</div>

          <div className="flex">
            <input
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  }}
  className="flex-1 border px-2 py-1 rounded-l"
  placeholder="What do you do?"
/>


            <button onClick={handleSend} className="bg-blue-600 text-white px-4 rounded-r">Send</button>
            <button
  onClick={async () => {
    if (!character) return;
    await supabase
      .from('characters')
      .update({ location: 'Marketplace' })
      .eq('id', character.id);
    console.log('📦 Location updated to Marketplace');
  }}
  className="ml-2 text-sm bg-green-600 text-white px-2 py-1 rounded"
>
  Go to Marketplace
</button>

          </div>
        </div>

        {/* Right Panel - Inventory */}
        <div className="w-1/5 h-[400px] bg-amber-100 border-4 border-amber-700 rounded-lg shadow-lg p-4 text-left overflow-auto">


          <h2 className="font-bold text-lg mb-2">Inventory</h2>
          <ul className="list-disc list-inside text-sm">
            {character?.inventory?.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
