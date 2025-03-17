require('dotenv').config();
const { Pool } = require('pg');

// Configuração da conexão com o banco de dados usando as variáveis do .env
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: {
    rejectUnauthorized: false, // Necessário para o Render
  },
});

// Função para criar a tabela global_history
async function createGlobalTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS global_history (
        id SERIAL PRIMARY KEY,
        nick VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        message TEXT NOT NULL
      );
    `;
    await pool.query(query);
    console.log('Tabela "global_history" criada com sucesso ou já existe!');
  } catch (error) {
    console.error('Erro ao criar a tabela "global_history":', error);
  } finally {
    await pool.end(); // Fecha a conexão após a execução
  }
}

// Executa a função
createGlobalTable();