const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDebug() {
  try {
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    console.log('Profiles:', JSON.stringify(profiles, null, 2));

    const { data: activities, error: aError } = await supabase.from('activities').select('*').limit(5);
    console.log('Recent Activities:', JSON.stringify(activities, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkDebug();
