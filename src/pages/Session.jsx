//import systemPrompt from '../systemPrompt';
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Session() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [playerName, setPlayerName] = useState(localStorage.getItem('playerName') || 'Unnamed Hero');
  const [character, setCharacter] = useState(null);
  const [messages, setMessages] = useState([]);
  const [location, setLocation] = useState('');
  const [input, setInput] = useState('');
  const [world, setWorld] = useState(null);
  const [roomPlayers, setRoomPlayers] = useState([]);

  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  const [messageOffset, setMessageOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const loadMoreMessages = async (initial = false) => {
  const limit = 50;
  const offset = initial ? 0 : messageOffset + limit;
  const [hasJoined, setHasJoined] = useState(false);

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', id)
    .order('id', { ascending: true }) // change to false if you want descending order
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('❌ Failed to load messages:', error.message);
    return;
  }

  if (data.length < limit) {
    setHasMoreMessages(false); // No more to load
  }

  if (initial) {
  setMessages(data);
  if (data.length > 0) {
    setOldestMessageId(data[0].id);
  }
  } else {
  setMessages(prev => [...data, ...prev]);
}


  setMessageOffset(offset);
};
const [systemPromptText, setSystemPromptText] = useState('');

const loadSystemPrompt = async () => {
  const { data, error } = await supabase.from('system_prompt').select('content').order('last_updated', { ascending: false }).limit(1).single();
  if (error) {
    console.error('❌ Failed to load system prompt:', error.message);
  } else {
    setSystemPromptText(data.content);
  }
};


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

  useEffect(() => {
      loadSystemPrompt();

    const name = localStorage.getItem('playerName') || 'Unnamed Hero';
    setPlayerName(name);

    supabase.from('characters').select('*').eq('name', name).then(async ({ data }) => {
      if (data?.[0]) {
        const loadedChar = data[0];

        if (!loadedChar.session_id) {
          await supabase.from('characters')
            .update({ session_id: id })
            .eq('id', loadedChar.id);
          console.log(`🔗 Assigned session_id "${id}" to character "${loadedChar.name}"`);
        }

        setCharacter({ ...loadedChar, session_id: id });
        setLocation(loadedChar.location);
        console.log('📍 Player location:', loadedChar.location);

        supabase.from('characters')
          .select('name, location')
          .then(({ data: allChars }) => {
            const othersInRoom = allChars?.filter(
              (c) => c.location === loadedChar.location && c.name !== loadedChar.name
            ) || [];
            setRoomPlayers(othersInRoom.map((c) => c.name));
          });
      }

    });


    const sub = supabase
      .channel('room:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [id]);

  const getEventMessagesForPlayer = (playerLocation, world, radiusMap) => {
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
  };

  const generateRadiusMap = (rooms) => {
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
        const exitsObj = rooms.find(r => r.name === name)?.exits || {};
        const exitNames = Object.values(exitsObj);
        for (const exit of exitNames) {
          queue.push({ name: exit, dist: dist + 1 });
        }
      }
    }
    return map;
  };
  const messageBoxRef = useRef(null);
const [oldestMessageId, setOldestMessageId] = useState(null);
const [loadingOlder, setLoadingOlder] = useState(false);

const loadOlderMessages = async () => {
  if (loadingOlder || !oldestMessageId) return;
  setLoadingOlder(true);

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', id)
    .lt('id', oldestMessageId)
    .order('id', { ascending: false })
    .limit(30);

  if (!error && data.length > 0) {
    setMessages(prev => [...data.reverse(), ...prev]);
    setOldestMessageId(data[0].id);
  }

  setLoadingOlder(false);
};

const handleScroll = () => {
  const container = messageBoxRef.current;
  if (!container) return;

  if (container.scrollTop < 50 && !loadingOlder) {
    loadOlderMessages();
  }
};

  const handleSend = async () => {
    if (!input.trim()) return;

    const { error } = await supabase.from('messages').insert({ session_id: id, sender: playerName, text: input });
    if (!error) {
      setInput('');

      const currentRoom = world?.map?.[character?.location];
      const roomDescription = currentRoom?.description || '';
      const roomExits = currentRoom?.exits ? Object.keys(currentRoom.exits).join(', ') : '';
      const rooms = Object.entries(world.map || {}).map(([name, data]) => ({ name, ...data }));
      const radiusMap = generateRadiusMap(rooms);
      const eventMessages = getEventMessagesForPlayer(character.location, world, radiusMap);
      const playerPosition = character.position || 'center';
      const visibleThings = currentRoom?.senses?.sight?.join(', ') || 'nothing notable';
      const audibleThings = currentRoom?.senses?.sound?.join(', ') || 'no sounds';
      const smellThings = currentRoom?.senses?.smell?.join(', ') || 'no smells';
      // ✨ NEW: Fetch NPCs in the same room
const { data: nearbyNpcsData, error: nearbyNpcsError } = await supabase
  .from('npcs')
  .select('*')
  .eq('current_location', character.location);

const nearbyNpcs = nearbyNpcsData || [];


      const filledPrompt = systemPromptText
  .replace('${character.location}', character.location)
  .replace('${playerPosition}', character.position || 'center')
  .replace('${roomDescription}', currentRoom?.description || '')
  .replace('${roomExits}', Object.keys(currentRoom?.exits || {}).join(', '))
  .replace('${visibleThings}', visibleThings)
  .replace('${audibleThings}', audibleThings)
  .replace('${smellThings}', smellThings)
  .replace('${eventMessages}', eventMessages.join('\n') || 'None')
  .replace('${npcsHere}', npcsHere); // npcsHere should be generated as before


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
              { role: 'system', content: filledPrompt },
              { role: 'user', content: input },
            ],
          }),
        });

        const data = await aiRes.json();
        const fullReply = data?.choices?.[0]?.message?.content || '';
        const [narration, jsonPart] = fullReply.split('\n').reduce(
          ([text, json], line) => {
            if (line.trim().startsWith('{')) return [text, line.trim()];
            return [text + line + '\n', json];
          },
          ['', null]
        );

        console.log('📖 AI narration:', narration.trim());
        console.log('📦 AI instructions:', jsonPart);

        if (jsonPart) {
          try {
            const parsed = JSON.parse(jsonPart);
            if (parsed.action === 'update_character' && parsed.updates) {
              await supabase.from('characters').update(parsed.updates).eq('id', character.id);
              console.log('✅ Character updated in Supabase:', parsed.updates);
              const { data: updatedChar } = await supabase
        .from('characters')
        .select('*')
        .eq('id', character.id)
        .single();
      if (updatedChar) {
        setCharacter(updatedChar);
        setLocation(updatedChar.location);
        console.log('♻️ Refreshed character after move:', updatedChar);
      }
            }
          } catch (e) {
            console.error('❌ Failed to parse AI action JSON:', e.message);
          }
        }

        const { error: aiInsertError } = await supabase.from('messages').insert({ session_id: id, sender: 'AI DM', text: narration.trim() });
        if (aiInsertError) {
          console.error('❌ Failed to save AI response to Supabase:', aiInsertError.message);
        } else {
          console.log('✅ AI response saved to Supabase');
        }
      } catch (err) {
        console.error('❌ AI request failed:', err);
      }
    }
  };

  const handleLogout = async () => {
    if (character?.id && location) {
      await supabase.from('characters').update({ location: character.location }).eq('id', character.id);
    }
    await supabase.auth.signOut();
    localStorage.removeItem('playerName');
    localStorage.removeItem('characterId');
    navigate('/');
  };
  useEffect(() => {
  if (id) {
    loadMoreMessages(true);
  }
}, [id]);
// Add this below your loadMoreMessages useEffect
useEffect(() => {
  if (!world) return;

  const tickInterval = setInterval(async () => {
    try {
      const newWorld = { ...world };

      if (!newWorld.time) {
        console.warn('🌎 No time found in world_state');
        return;
      }

      // Advance game clock: 2 game hours = 5 real hours → ~150 seconds = 1 game minute
      newWorld.time.minute += 10; // 10 in-game minutes every interval

      if (newWorld.time.minute >= 60) {
        newWorld.time.minute -= 60;
        newWorld.time.hour += 1;
      }
      if (newWorld.time.hour >= 24) {
        newWorld.time.hour = 0;
        newWorld.time.day += 1;
      }

      // Save to Supabase
      const { error } = await supabase
        .from('world_state')
        .update({ data: newWorld })
        .eq('id', 'main');

      if (error) {
        console.error('❌ Failed to update world time:', error.message);
      } else {
        console.log('🕰️ World time updated:', newWorld.time);
        setWorld(newWorld);
      }
    } catch (err) {
      console.error('❌ Error during world tick:', err);
    }
  }, 15000); // Every 15 seconds real time = 10 in-game minutes (adjust if you want slower)

  return () => clearInterval(tickInterval);
}, [world]);



  useEffect(() => {
    console.log('👀 Character:', character);
    console.log('📨 Messages:', messages);
  }, [character, messages]);
  useEffect(() => {
  const container = messageBoxRef.current;
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}, [messages]);


    
  return (
    <div className="min-h-screen bg-yellow-50 text-amber-900 font-serif" style={{ backgroundImage: "url('/images/Revbegins.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <header className="flex items-center justify-center relative p-4 border-b bg-white shadow">
        <button onClick={() => { if (audioRef.current) { audioRef.current.muted = !isMuted; setIsMuted(!isMuted); }}} className="absolute left-4 top-4 text" title={isMuted ? 'Unmute Music' : 'Mute Music'}>{isMuted ? '🔇' : '📻'}</button>
        <h1 className="text-3xl font-bold text-center w-full">Session: {id}</h1>
        <button onClick={handleLogout} className="absolute right-4 top-4 text-sm bg-red-600 text-white px-3 py-1 rounded">Logout</button>
        <audio ref={audioRef} autoPlay loop muted><source src="/hometheme.mp3" type="audio/mpeg" /></audio>
      </header>

      <div className="px-6 py-2 text-sm text-black">
        <strong>Players in this area:</strong> {roomPlayers.map(p => p.name).join(', ')} &nbsp;|&nbsp;
        <strong>You are at:</strong> {character?.location || 'Unknown'} &nbsp;|&nbsp;
        <strong>Time:</strong> {world?.time?.hour || 0}:{world?.time?.minute?.toString().padStart(2, '0') || '00'} &nbsp;
        <strong>Date:</strong> {world?.time?.day} {world?.time?.month}, {world?.time?.year} AR &nbsp;|&nbsp;
        <strong>Weather:</strong> {world?.weather || 'Unknown'}
      </div>

      <div className="flex w-full px-6 py-4 gap-4">
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

        <div className="w-2/5 h-[400px] mx-4 bg-amber-50 border-4 border-amber-700 rounded-lg shadow-lg p-4 flex flex-col">
  <div
  ref={messageBoxRef}
  onScroll={handleScroll}
  className="overflow-y-auto h-full mb-2 flex flex-col"
>

  {messages.map((msg, idx) => (
    <div key={idx} className="text-sm">
      <strong>{msg.sender}:</strong> {msg.text}
    </div>
  ))}
</div>

          <div className="flex">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); }}} className="flex-1 border px-2 py-1 rounded-l" placeholder="What do you do?" />
            <button onClick={handleSend} className="bg-blue-600 text-white px-4 rounded-r">Send</button>
          </div>
        </div>

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
