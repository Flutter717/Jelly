// ====================================================
// Dependências
// ====================================================
const express = require('express');
const axios = require('axios');
const { Client, GatewayIntentBits } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Pool } = require('pg');
require('dotenv').config();  // Carrega variáveis do .env

// ====================================================
// Configuração do Servidor Express
// ====================================================
const app = express();
const PORT = process.env.PORT || 3000;

console.log("Token do Discord:", process.env.DISCORD_TOKEN ? "Carregado" : "Não encontrado");

// =================== Servidor Express ===================

// Rota que recebe o ping e aciona o pong no servidor periódico
app.get('/ping', async (req, res) => {
  console.log("📩 Recebeu ping");
  try {
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor web rodando na porta ${PORT}`);
});

// ====================================================
// Configuração do Banco de Dados (PostgreSQL)
// ====================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ====================================================
// Funções Auxiliares
// ====================================================

// Garante que o usuário esteja cadastrado no banco de dados.
// Se o usuário não existir, cadastra-o com saldo 0.
async function ensureUserExists(userId) {
  const result = await pool.query('SELECT balance FROM Users WHERE id = $1', [userId]);
  if (result.rows.length > 0) {
    return parseFloat(result.rows[0].balance);
  } else {
    await pool.query('INSERT INTO Users (id, balance) VALUES ($1, 0.00)', [userId]);
    return 0.00;
  }
}

// ====================================================
// Configuração do Bot do Discord
// ====================================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ====================================================
// Registro de Comandos Slash
// ====================================================
client.once('ready', async () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);

    const commands = [
        new SlashCommandBuilder()
            .setName('banco')
            .setDescription('Verifica o saldo da sua conta'),
        new SlashCommandBuilder()
            .setName('depositar')
            .setDescription('Deposita uma quantia na sua conta')
            .addNumberOption(option =>
                option.setName('quantia')
                    .setDescription('Quantia a ser depositada')
                    .setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName('debitar')
            .setDescription('Debita uma quantia da sua conta')
            .addNumberOption(option =>
                option.setName('quantia')
                    .setDescription('Quantia a ser debitada')
                    .setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName('categoria')
            .setDescription('Recebe uma mensagem aleatória sobre suas habilidades')
    ];

    try {
        await Promise.all(commands.map(command => client.application.commands.create(command)));
        console.log("✅ Comandos registrados com sucesso.");
    } catch (error) {
        console.error("❌ Erro ao registrar comandos:", error);
    }
});

// ====================================================
// Lógica dos Comandos
// ====================================================
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  const userId = interaction.user.id;

  // Lógica do comando /banco
  if (interaction.commandName === 'banco') {
    try {
      const balance = await ensureUserExists(userId);
      await interaction.reply({
        content: balance > 0
          ? `💰 Seu saldo é **R$${balance.toFixed(2)}**`
          : '💸 Você ainda não tem dinheiro na conta.',
        ephemeral: true
      });
    } catch (error) {
      console.error('❌ Erro ao buscar saldo:', error);
      await interaction.reply({
        content: '❌ Ocorreu um erro ao acessar o banco de dados.',
        ephemeral: true
      });
    }
  }
  
  // Lógica do comando /depositar
  else if (interaction.commandName === 'depositar') {
    const quantia = interaction.options.getNumber('quantia');

    if (quantia <= 0) {
      return interaction.reply({
        content: '❌ A quantia precisa ser maior que zero.',
        ephemeral: true
      });
    }

    try {
      const currentBalance = await ensureUserExists(userId);
      const newBalance = currentBalance + quantia;
      await pool.query('UPDATE Users SET balance = $1 WHERE id = $2', [newBalance, userId]);
      await interaction.reply({
        content: `✅ Você depositou R$${quantia.toFixed(2)}. Seu novo saldo é R$${newBalance.toFixed(2)}.`,
        ephemeral: true
      });
    } catch (error) {
      console.error('❌ Erro ao depositar quantia:', error);
      await interaction.reply({
        content: '❌ Ocorreu um erro ao realizar o depósito.',
        ephemeral: true
      });
    }
  }

// Lógica do comando /categoria
else if (interaction.commandName === 'categoria') {
  const messages = [
`‚★ 𝗘xtraordinário <@${interaction.user.id}>! Você dominou a arte do 𝗘𝗺𝗶𝘀𝘀𝗼𝗿 !

،★ 𝗦ua energia agora corta o ar como lâminas invisíveis ou explode como tempestades avassaladoras. Nenhum inimigo pode se esconder do seu alcance, pois seu Focus se projeta como uma força imparável, alcançando o impossível !

https://cdn.discordapp.com/attachments/1330169663270682777/1345859505795240087/image0.gif?ex=67c614d7&is=67c4c357&hm=85b3028be3faf14a354d514c1d36c74bebe8001e55a456db004abdb94d1d1bbf&`,

//----------------------------------------------//

`،★ 𝗜mpensável <@${interaction.user.id}>! Você desbloqueou o poder absoluto de um 𝗧𝗿𝗮𝗻𝘀𝗳𝗼𝗿𝗺𝗮𝗱𝗼𝗿 !

،★ 𝗦ua existência é uma metamorfose constante, seu corpo e suas habilidades evoluem diante dos olhos atônitos de seus inimigos. Uma lâmina de fogo ? Punhos de trovão ? Nenhuma forma está além do seu alcance, pois você é a própria mudança !

https://cdn.discordapp.com/attachments/1330169663270682777/1345860235159539783/image0.gif?ex=67c61584&is=67c4c404&hm=84e6495525258d7831caea6d8284ee211e0bfb12b3efc33f642541ef5c540d22&`,

//----------------------------------------------//

`،★ 𝗣arabéns <@${interaction.user.id}>! Você 𝗱𝗲𝘀𝗽𝗲𝗿𝘁𝗼𝘂 o verdadeiro poder de um 𝗙𝗼𝗿𝘁𝗶𝗳𝗶𝗰𝗮𝗱𝗼𝗿 !

،★ 𝗦eu corpo agora é um bastião de força e resistência, capaz de esmagar montanhas e resistir aos golpes mais brutais. Sua presença em batalha é uma força imparável, um verdadeiro colosso que domina o campo de guerra

https://cdn.discordapp.com/attachments/1330169663270682777/1345859457640431687/image0.gif?ex=67c614cb&is=67c4c34b&hm=8129d44864393de7ad18a0184b9bc24bca11d3c1ad7706c97ca61baeb2d45ed3&`,

//----------------------------------------------//

`،★ 𝗜ncrível <@${interaction.user.id}>! Você se tornou um verdadeiro 𝗠𝗮𝗻𝗶𝗽𝘂𝗹𝗮𝗱𝗼𝗿 !

،★ 𝗔gora, nada escapa ao seu controle. Objetos, seres e até mesmo o próprio campo de batalha dançam conforme sua vontade. Seus inimigos não lutam apenas contra você, mas contra o próprio mundo que molda ao seu favor !

https://cdn.discordapp.com/attachments/1330169663270682777/1345859690369908796/image0.gif?ex=67c61503&is=67c4c383&hm=29d847d02934bc4dc01569bd8cbe455b961b6301187fedcba8ea89869db9e178&`,

//----------------------------------------------//

`،★ 𝗙e-no-me-nal <@${interaction.user.id}>! Você alcançou o ápice do 𝗖𝗼𝗻𝗷𝘂𝗿𝗮𝗱𝗼𝗿 !

،★ 𝗦uas criações energéticas transcendem a imaginação, forjando armas, armaduras e ferramentas que superam até mesmo o aço mais resistente. Cada objeto que materializa é uma extensão da sua própria alma, tornando-se um arsenal sem limites !

https://cdn.discordapp.com/attachments/1330169663270682777/1345859926408560800/image0.gif?ex=67c6153b&is=67c4c3bb&hm=9f9faff45c5fbe1a1ccabf260c9ab21c0c37851cafda797b3f0fc22e6ee756d4&`,

//----------------------------------------------//

`،،★ 𝗜mpressionante <@${interaction.user.id}>! Você é um 𝗘𝘀𝗽𝗲𝗰𝗶𝗮𝗹𝗶𝘀𝘁𝗮 além da compreensão !

،★ 𝗦eu Focus transcende as barreiras do convencional, moldando-se em algo único e incomparável. Você não apenas domina uma habilidade, você cria um novo caminho, tornando-se uma lenda viva entre os guerreiros !

https://cdn.discordapp.com/attachments/1344688217953271820/1345864191919128606/1316804965620252812.gif?ex=67cab674&is=67c964f4&hm=6fb2caacccecb706538d3e66af3ff411bbdbefdd42c8970463117bc067f9b12b&`,

//----------------------------------------------//

  ];

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  await interaction.reply({
      content: randomMessage,
      ephemeral: false
  });
}
  
  // Lógica do comando /debitar
  else if (interaction.commandName === 'debitar') {
    const quantia = interaction.options.getNumber('quantia');

    if (quantia <= 0) {
      return interaction.reply({
        content: '❌ A quantia precisa ser maior que zero.',
        ephemeral: true
      });
    }

    try {
      const currentBalance = await ensureUserExists(userId);

      if (currentBalance < quantia) {
        return interaction.reply({
          content: '❌ Saldo insuficiente para debitar esse valor.',
          ephemeral: true
        });
      }

      const newBalance = currentBalance - quantia;
      await pool.query('UPDATE Users SET balance = $1 WHERE id = $2', [newBalance, userId]);
      await interaction.reply({
        content: `✅ Foi debitado R$${quantia.toFixed(2)} da sua conta. Seu novo saldo é R$${newBalance.toFixed(2)}.`,
        ephemeral: true
      });
    } catch (error) {
      console.error('❌ Erro ao debitar quantia:', error);
      await interaction.reply({
        content: '❌ Ocorreu um erro ao debitar o valor.',
        ephemeral: true
      });
    }
  }
});

// Comando adicional via mensagem para teste
client.on('messageCreate', message => {
  if (message.author.bot) return;
  if (message.content.toLowerCase() === '!ping') {
    console.log('🎾 Respondendo a !ping');
    message.reply('Pong! 🏓');
  }
});

// ====================================================
// Login do Bot do Discord
// ====================================================
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error("❌ Erro ao conectar o bot no Discord:", err.message);
});
