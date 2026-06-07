import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltam as variáveis de ambiente do Supabase no arquivo .env ou no painel da Vercel.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
const connectDB = async () => {
  try {
    const { error } = await supabase.from('usuarios').select('id').limit(1);

    if (error && error.code !== '42P01' && error.code !== 'PGRST116') {
      throw error;
    }

    console.log("Comunicação com a API do Supabase configurada com sucesso!");
  } catch (err) {
    console.error(`Erro ao testar comunicação com o Supabase: ${err}`);
    process.exit(1);
  }
};

export { connectDB };