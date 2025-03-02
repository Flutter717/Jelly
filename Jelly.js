const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Rota que recebe o ping e aciona o pong no servidor periódico
app.get('/ping', async (req, res) => {
  console.log("Recebeu ping");
  res.send("Ping recebido. Enviando pong para o servidor periódico...");
  
  try {
    const response = await axios.get('https://servidor-periodico.onrender.com/pong');
    console.log(`Requisição para /pong realizada com sucesso: ${response.data}`);
  } catch (error) {
    console.error("Erro ao enviar requisição para /pong:", error.message);
  }
});

// Inicializa o servidor Express
app.listen(PORT, () => {
  console.log(`Servidor web rodando na porta ${PORT}`);
});


/* =================== Lógica do Discord Bot =================== */
const { Client, GatewayIntentBits } = require('discord.js');
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

// Registra o listener 'messageCreate' se ainda não estiver registrado
if (!client.__messageCreateListenerRegistered) {
  client.on('messageCreate', message => {
    // Ignora mensagens do próprio bot para evitar loops
    if (message.author.bot) return;
    
    // Se a mensagem for "!ping" (independente de maiúsculas/minúsculas)
    if (message.content.toLowerCase() === '!ping') {
      console.log('Respondendo a !ping');
      message.reply('Pong! 🏓');
    }
  });
  client.__messageCreateListenerRegistered = true;
} else {
  console.log('Listener "messageCreate" já estava registrado.');
}

client.login(process.env.DISCORD_TOKEN);
