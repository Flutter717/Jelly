require('dotenv').config(); // Carrega as variáveis do arquivo .env

const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', message => {
    // Ignora mensagens do próprio bot para evitar loops
    if (message.author.bot) return;

    // Verifica se a mensagem é "!Ping" (case insensitive)
    if (message.content.toLowerCase() === '!ping') {
        message.reply('Pong! 🏓');
    }
});

client.login(process.env.DISCORD_TOKEN); // Usa a variável de ambiente
