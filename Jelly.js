const express = require('express');
const axios = require('axios');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

console.log("Token do Discord:", process.env.DISCORD_TOKEN ? "Carregado" : "Não encontrado");

// =================== Servidor Express ===================

// Rota que recebe o ping e aciona o pong no servidor periódico
app.get('/ping', async (req, res) => {
  console.log("📩 Recebeu ping");

  try {
    // Enviando requisição para o servidor periódico
    const response = await axios.get('https://servidor-periodico.onrender.com/pong', {
      params: { server: `ServidorB-${PORT}` }
    });

    console.log(`✅ Requisição para /pong realizada com sucesso: ${response.data}`);
    res.send("Ping recebido e pong enviado com sucesso.");

  } catch (error) {
    console.error("❌ Erro ao enviar requisição para /pong:", error.message);
    res.status(500).send("Ping recebido, mas erro ao enviar pong.");
  }
});

// Inicializa o servidor Express
app.listen(PORT, () => {
  console.log(`🚀 Servidor web rodando na porta ${PORT}`);
});


// =================== Lógica do Discord Bot ===================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', message => {
  // Ignora mensagens do próprio bot para evitar loops
  if (message.author.bot) return;
  
  // Se a mensagem for "!ping" (ignora maiúsculas/minúsculas)
  if (message.content.toLowerCase() === '!ping') {
    console.log('🎾 Respondendo a !ping');
    message.reply('Pong! 🏓');
  }
});

// Login do bot no Discord
client.login(DISCORD_TOKEN).catch(err => {
  console.error("❌ Erro ao conectar o bot no Discord:", err.message);
});
