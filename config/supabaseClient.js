import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('As variáveis SUPABASE_URL e SUPABASE_KEY não estão definidas.');
    process.exit(1); 
  }
  
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        const { data, error } = await supabase.from('timelines').select('*').limit(1);
        if (error) {
            throw new Error(error.message);
        }
        console.log('Conexão com Supabase bem-sucedida!');
    } catch (err) {
        console.error('Erro ao conectar com o Supabase:', err.message);
    }
}

testConnection();

export default supabase;
