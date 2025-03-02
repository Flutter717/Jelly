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

// Verifica se o listener de 'messageCreate' já foi registrado
if (!client.__messageCreateListenerRegistered) {
  client.on('messageCreate', message => {
    // Ignora mensagens do próprio bot para evitar loops
    if (message.author.bot) return;
    
    // Se a mensagem for "!ping" (ignora maiúsculas/minúsculas)
    if (message.content.toLowerCase() === '!ping') {
      console.log('Respondendo a !ping');
      message.reply('Pong! 🏓');
    }
  });
  // Marca que o listener já foi registrado
  client.__messageCreateListenerRegistered = true;
} else {
  console.log('Listener "messageCreate" já estava registrado.');
}

client.login(process.env.DISCORD_TOKEN);
