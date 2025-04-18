// src/utils/worldState.js
import { supabase } from '../supabaseClient';

// ✅ Fetch world state JSON from Supabase
export const fetchWorldState = async () => {
  const { data, error } = await supabase
    .from('world_state')
    .select('data')
    .eq('id', 'main')
    .single();

  if (error) {
    console.error('❌ Failed to fetch world state:', error.message);
    return null;
  }

  return data?.data; // world state JSON
};

// ✅ Update the world state JSON in Supabase
export const updateWorldState = async (newData) => {
  const { error } = await supabase
    .from('world_state')
    .update({
      data: newData,
      last_updated: new Date().toISOString(),
    })
    .eq('id', 'main');

  if (error) {
    console.error('❌ Failed to update world state:', error.message);
  } else {
    console.log('✅ World state updated.');
  }
};
