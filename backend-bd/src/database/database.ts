import pg from 'pg';

const { Pool }  = pg;

export const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '11631021',
  database: 'postgres',
  idleTimeoutMillis: 30000
})

const connectDB =  async () => {
  try {
    const client = await pool.connect();
    console.log("Conectado ao Banco de Dados com sucesso!");
    client.release();
  } catch (err) {
    console.error(`Erro ao conectar ao banco da dados: ${err}`)
    process.exit(1)
  }
}

export { connectDB }