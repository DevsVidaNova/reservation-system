const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        const { data, error } = await supabase.from('timeline').select('*').limit(1);
        if (error) {
            throw new Error(error.message);
        }
        console.log('Conexão bem-sucedida!');
        console.log('Dados recebidos:', data);
    } catch (err) {
        console.error('Erro ao conectar com o Supabase:', err.message);
    }
}

testConnection();

module.exports = supabase;
