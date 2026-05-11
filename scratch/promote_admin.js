const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function promoteToAdmin(email) {
  try {
    // 1. Get user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) throw userError;

    const user = users.find(u => u.email === email);
    if (!user) {
      console.log(`User ${email} not found.`);
      return;
    }

    // 2. Update role in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id);

    if (profileError) throw profileError;

    console.log(`Successfully promoted ${email} to admin.`);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

promoteToAdmin('auditor@example.com');
