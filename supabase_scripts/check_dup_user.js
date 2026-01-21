
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkDup() {
    const email = 'trankhai11012000@gmail.com';
    console.log(`Checking duplicates for: ${email}`);

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);

    if (error) console.error(error);
    else {
        console.log(`Found ${data.length} records:`);
        data.forEach(u => console.log(`- ID: ${u.id}, Role: ${u.role}, Created: ${u.created_at}`));
    }
}

checkDup();
