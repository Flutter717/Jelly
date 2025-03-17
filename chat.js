require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Pool } = require('pg');

// Carrega as variáveis de ambiente
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const API_IA = process.env.API_IA;
const CLIENT_ID = process.env.CLIENT_ID;

// Inicializa a API do Google Generative AI
const genAI = new GoogleGenerativeAI(API_IA);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Configuração da conexão com o banco de dados
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: {
    rejectUnauthorized: false, // Necessário para serviços como Render
  },
});

// Configura o cliente do Discord com as intents necessárias
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// Evento para quando o bot estiver online
client.once('ready', async () => {
  console.log(`Bot está online como ${client.user.tag}`);

  // Registra os comandos no Discord ao iniciar
  const commands = [
    {
      name: 'conversar',
      description: 'Inicia uma conversa com o chatbot',
      options: [
        {
          name: 'mensagem',
          type: 3, // Tipo STRING
          description: 'Sua mensagem para o chatbot',
          required: true,
        },
      ],
    },
  ];

  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

  try {
    console.log('Registrando comandos...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Comandos registrados com sucesso.');
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
});

// Função para salvar mensagens no banco de dados
async function saveMessage(nick, userId, message) {
  try {
    // Insere a nova mensagem
    const insertQuery = `
      INSERT INTO global_history (nick, user_id, message)
      VALUES ($1, $2, $3)
    `;
    await pool.query(insertQuery, [nick, userId, message]);

    // Remove mensagens antigas, mantendo apenas as últimas 20
    const deleteQuery = `
      DELETE FROM global_history
      WHERE id NOT IN (
        SELECT id FROM global_history
        ORDER BY id DESC
        LIMIT 20
      )
    `;
    await pool.query(deleteQuery);
  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
  }
}

// Função para recuperar o contexto do banco de dados
async function getContext() {
  try {
    const query = `
      SELECT nick, message
      FROM global_history
      ORDER BY id ASC
      LIMIT 20
    `;
    const res = await pool.query(query);
    return res.rows;
  } catch (error) {
    console.error('Erro ao recuperar contexto:', error);
    return [];
  }
}

// Prompt explicativo para o bot
const explanatoryPrompt = `
Você é Jelly, um chatbot aguá-viva engraçado e carioca, você deve evitar respostas longas e vicios de linguagem ou repetição, voce pode dar apelidos aos usuarios se quiser
Abaixo está o histórico das últimas 20 mensagens do servidor, que você pode usar como contexto para entender melhor a conversa.
Sua tarefa é responder à mensagem mais recente do usuário, que está destacada no final.

Histórico de mensagens:
`;

const finalInstruction = `
Agora, responda à seguinte mensagem do usuário:
`;

// Função para enviar mensagens à API e obter respostas com contexto
async function getAIResponse(userMessage, nick) {
  try {
    // Recupera o contexto das últimas 20 mensagens
    const context = await getContext();
    const contextText = context.map(msg => `${msg.nick}: ${msg.message}`).join('\n');

    // Monta o prompt completo
    const fullPrompt = `
      ${explanatoryPrompt}
      ${contextText}
      ${finalInstruction}
      ${nick}: ${userMessage}
    `;

    // Chama a API
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  } catch (error) {
    console.error('Erro ao chamar a API:', error);
    return 'Desculpe, ocorreu um erro ao processar sua solicitação.';
  }
}

// Handler para o comando /conversar
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'conversar') {
    const userMessage = interaction.options.getString('mensagem');
    const nick = interaction.user.username;
    const userId = interaction.user.id;

    // Salva a mensagem do usuário
    await saveMessage(nick, userId, userMessage);

    // Obtém a resposta da API
    const aiResponse = await getAIResponse(userMessage, nick);

    // Salva a resposta do bot
    await saveMessage('Jelly', client.user.id, aiResponse);

    // Responde ao usuário
    await interaction.reply(aiResponse);
  }
});

// Handler para mensagens (menções ou respostas ao bot)
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const isMentioned = message.mentions.has(client.user);
  const isReplyToBot = message.reference && (await message.fetchReference()).author.id === client.user.id;

  if (isMentioned || isReplyToBot) {
    const userMessage = message.content.replace(`<@${client.user.id}>`, '').trim();
    const nick = message.author.username;
    const userId = message.author.id;

    // Salva a mensagem do usuário
    await saveMessage(nick, userId, userMessage);

    // Obtém a resposta da API
    const aiResponse = await getAIResponse(userMessage, nick);

    // Salva a resposta do bot
    await saveMessage('Jelly', client.user.id, aiResponse);

    // Responde ao usuário
    await message.reply(aiResponse);
  }
});

// Inicia o bot
client.login(DISCORD_TOKEN);