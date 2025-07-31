// 🌐 Webserver para mantener vivo el bot en Replit
const express = require('express');
const app = express();
app.get('/', (_, res) => res.send('Bot encendido'));
app.listen(3000, () => console.log('🌐 Web server activo para mantener vivo el bot'));

// 📦 Librerías necesarias
const { Client, GatewayIntentBits, Collection, Partials, Routes, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField } = require('discord.js');
const { REST } = require('@discordjs/rest');
const moment = require('moment');
require('moment/locale/es');
moment.locale('es');

// 🧠 Configuración
const TOKEN = 'MTM4MDk5NDkwMjU5NDQyMDg2Ng.G2Pc7W.sfeFZGcXMIv5fcISCO87EGJz5NsZYyPv9ZBf-8';
const CLIENT_ID = '1380994902594420866';
const GUILD_ID = '1258908635241775125';
const rolVerificadoId = '1389540641574228118';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

const commands = [
  new SlashCommandBuilder().setName('balance').setDescription('Muestra tu dinero'),
  new SlashCommandBuilder().setName('trabajar').setDescription('Trabaja para ganar dinero'),
  new SlashCommandBuilder().setName('collect').setDescription('Reclama tu recompensa diaria'),
  new SlashCommandBuilder().setName('add-money').setDescription('Añadir dinero a un usuario').addUserOption(opt => opt.setName('usuario').setDescription('Usuario').setRequired(true)).addIntegerOption(opt => opt.setName('cantidad').setDescription('Cantidad').setRequired(true)),
  new SlashCommandBuilder().setName('alerta-verde').setDescription('Enviar alerta verde'),
  new SlashCommandBuilder().setName('alerta-amarilla').setDescription('Enviar alerta amarilla'),
  new SlashCommandBuilder().setName('alerta-naranja').setDescription('Enviar alerta naranja'),
  new SlashCommandBuilder().setName('alerta-roja').setDescription('Enviar alerta roja'),
  new SlashCommandBuilder().setName('alerta-terrorista').setDescription('Enviar alerta terrorista'),
  new SlashCommandBuilder().setName('activity-check').setDescription('Enviar activity check'),
  new SlashCommandBuilder().setName('setup-verificar').setDescription('Configurar verificación'),
  new SlashCommandBuilder().setName('votaciones').setDescription('Crear una votación').addStringOption(opt => opt.setName('titulo').setDescription('Título de la votación').setRequired(true)),
  new SlashCommandBuilder().setName('ck').setDescription('Registrar un CK').addUserOption(opt => opt.setName('usuario').setDescription('Usuario CK').setRequired(true)),
  new SlashCommandBuilder().setName('multar').setDescription('Multar a un usuario').addUserOption(opt => opt.setName('usuario').setDescription('Usuario multado').setRequired(true)).addStringOption(opt => opt.setName('articulo').setDescription('Artículo infringido').setRequired(true)),
  new SlashCommandBuilder().setName('arrestar').setDescription('Arrestar a un usuario').addUserOption(opt => opt.setName('usuario').setDescription('Usuario arrestado').setRequired(true)).addStringOption(opt => opt.setName('motivo').setDescription('Motivo del arresto').setRequired(true))
];

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
  console.log('✅ Comandos registrados');
})();

const economia = new Map();
const cooldowns = new Map();

client.once('ready', () => console.log(`✅ Bot conectado como ${client.user.tag}`));

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const { commandName, options, member, user, guild } = interaction;
    const usuario = user.id;
    if (!economia.has(usuario)) economia.set(usuario, { dinero: 0, recolectado: false });

    if (commandName === 'votaciones') {
      const titulo = options.getString('titulo');
      const embed = new EmbedBuilder()
        .setTitle('🗳️ Votación Abierta')
        .setDescription(`**${titulo}**\n\nSi quieres unirte por favor vota los siguientes botones,\n\nCódigo del servidor: \`MALLORP\``)
        .setColor('Blue')
        .setThumbnail(client.user.displayAvatarURL())
        .setFooter({ text: 'Mallorca Rp | Administración ejecutiva' });

      const botones = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('me-uno').setLabel('Me uno').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('mas-tarde').setLabel('Más tarde').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('moderador').setLabel('Moderador').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('no-me-uno').setLabel('No me uno').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('cancelar-votacion').setLabel('Cancelar').setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({ embeds: [embed], components: [botones] });
      return;
    }

    // ECONOMÍA
    if (!economia.has(usuario)) economia.set(usuario, { dinero: 0, recolectado: false });

    if (commandName === 'balance') {
      const dinero = economia.get(usuario).dinero;
      return interaction.reply(`💰 Tienes ${dinero}€`);
    }

    if (commandName === 'trabajar') {
      const ganancia = Math.floor(Math.random() * 200) + 100;
      economia.get(usuario).dinero += ganancia;
      return interaction.reply(`\uD83C\uDFEA Has trabajado y ganado ${ganancia}€`);
    }

    if (commandName === 'collect') {
      const usuarioData = economia.get(usuario);
      if (usuarioData.recolectado) {
        return interaction.reply({ content: '🕒 Ya reclamaste tu recompensa diaria. Vuelve mañana.', ephemeral: true });
      }

      const roles = interaction.member.roles.cache;
      let cantidad = 0;

      const bonificaciones = {
        '1258913281859387506': 1000,
        '1258913275580514377': 1570,
        '1258913256358019166': 2500,
        '1258913266298650644': 2700,
        '1390681770198040748': 1400,
        '1398342739766149213': 2400,
        '1398342389529182239': 2970
      };

      for (const [id, dinero] of Object.entries(bonificaciones)) {
        if (roles.has(id)) cantidad += dinero;
      }

      if (cantidad === 0) return interaction.reply('❌ No tienes roles válidos para recoger dinero.');
      usuarioData.dinero += cantidad;
      usuarioData.recolectado = true;

      setTimeout(() => { usuarioData.recolectado = false; }, 24 * 60 * 60 * 1000); // 24h

      return interaction.reply(`✅ Has recolectado ${cantidad}€ por tus trabajos`);
    }

    if (commandName === 'add-money') {
      if (!member.permissions.has('Administrator')) return interaction.reply({ content: '❌ No tienes permisos.', ephemeral: true });
      const objetivo = options.getUser('usuario');
      const cantidad = options.getInteger('cantidad');

      if (!economia.has(objetivo.id)) economia.set(objetivo.id, { dinero: 0, recolectado: false });
      economia.get(objetivo.id).dinero += cantidad;
      return interaction.reply(`💸 Se añadió ${cantidad}€ a ${objetivo.username}`);
    }

    // ALERTAS
    const alertas = {
      'alerta-verde': { titulo: '✅ Alerta Verde', color: 'Green' },
      'alerta-amarilla': { titulo: '⚠️ Alerta Amarilla', color: 'Yellow' },
      'alerta-naranja': { titulo: '🟧 Alerta Naranja', color: 'Orange' },
      'alerta-roja': { titulo: '🚨 Alerta Roja', color: 'Red' },
      'alerta-terrorista': { titulo: '☠️ Alerta Terrorista', color: 'DarkRed' }
    };

    if (alertas[commandName]) {
      const alerta = alertas[commandName];
      const embed = new EmbedBuilder()
        .setTitle(alerta.titulo)
        .setColor(alerta.color)
        .setDescription('Se ha activado esta alerta de seguridad.')
        .setThumbnail(client.user.displayAvatarURL());

      return interaction.reply({ content: '@everyone', embeds: [embed] });
    }

    if (commandName === 'activity-check') {
      const canal = client.channels.cache.get('1398325911614652456');
      if (!canal) return interaction.reply('❌ Canal no encontrado.');
      await canal.send({ content: '@everyone', embeds: [new EmbedBuilder().setTitle('📋 Activity Check').setDescription('Confirma tu actividad respondiendo aquí.')] });
      return interaction.reply({ content: '✅ Enviado.', ephemeral: true });
    }

    if (commandName === 'setup-verificar') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('aceptar').setLabel('✅ Aceptar').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('rechazar').setLabel('❌ Rechazar').setStyle(ButtonStyle.Danger)
      );
      await interaction.user.send({ content: '¿Aceptas las normas?', components: [row] }).catch(() => {
        return interaction.reply({ content: '❌ No se pudo enviar DM al usuario.', ephemeral: true });
      });
      return interaction.reply({ content: '✅ Proceso de verificación iniciado.', ephemeral: true });
    }

    // CK / MULTAR / ARRESTAR
    if (commandName === 'ck') {
      const objetivo = options.getUser('usuario');
      const embed = new EmbedBuilder()
        .setTitle('☠️ CK Registrado')
        .setColor('Red')
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
          { name: '👤 Usuario', value: `${objetivo}`, inline: true },
          { name: '👮 Oficial', value: `${member}`, inline: true },
          { name: '📅 Fecha', value: moment().format('LLLL') }
        );
      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'multar') {
      const objetivo = options.getUser('usuario');
      const articulo = options.getString('articulo');
      const embed = new EmbedBuilder()
        .setTitle('📑 Multa')
        .setColor('Orange')
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
          { name: '👤 Usuario', value: `${objetivo}`, inline: true },
          { name: '📜 Artículos', value: `${articulo}`, inline: true },
          { name: '👮 Oficial', value: `${member}`, inline: true },
          { name: '📅 Fecha', value: moment().format('LLLL') }
        );
      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'arrestar') {
      const objetivo = options.getUser('usuario');
      const motivo = options.getString('motivo');
      const embed = new EmbedBuilder()
        .setTitle('🚓 Arresto')
        .setColor('DarkBlue')
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
          { name: '👤 Usuario', value: `${objetivo}`, inline: true },
          { name: '📝 Motivo', value: motivo, inline: true },
          { name: '👮 Oficial', value: `${member}`, inline: true },
          { name: '📅 Fecha', value: moment().format('LLLL') }
        );
      return interaction.reply({ embeds: [embed] });
    }

  }

  if (interaction.isButton()) {
    const { customId, user, message } = interaction;
    
    if (['me-uno', 'mas-tarde', 'moderador', 'no-me-uno', 'cancelar-votacion'].includes(customId)) {
      // Get existing embed
      const embed = message.embeds[0];
      let description = embed.description;
      
      // Remove user from all vote categories first
      const userId = `<@${user.id}>`;
      description = description.replace(new RegExp(`\\n🟢 Me uno:.*${userId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*`, 'g'), '');
      description = description.replace(new RegExp(`\\n🟡 Más tarde:.*${userId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*`, 'g'), '');
      description = description.replace(new RegExp(`\\n🔵 Moderador:.*${userId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*`, 'g'), '');
      description = description.replace(new RegExp(`\\n🔴 No me uno:.*${userId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*`, 'g'), '');
      
      // Clean up empty vote lines
      description = description.replace(/\n🟢 Me uno:\s*\n/g, '\n');
      description = description.replace(/\n🟡 Más tarde:\s*\n/g, '\n');
      description = description.replace(/\n🔵 Moderador:\s*\n/g, '\n');
      description = description.replace(/\n🔴 No me uno:\s*\n/g, '\n');
      
      if (customId === 'cancelar-votacion') {
        const newEmbed = new EmbedBuilder()
          .setTitle('🗳️ Votación Cancelada')
          .setDescription('Esta votación ha sido cancelada.')
          .setColor('Grey')
          .setThumbnail(client.user.displayAvatarURL())
          .setFooter({ text: 'Mallorca Rp | Administración ejecutiva' });
        
        await interaction.update({ embeds: [newEmbed], components: [] });
        return;
      }
      
      // Add user to appropriate category
      let voteEmoji = '';
      let voteText = '';
      
      switch (customId) {
        case 'me-uno':
          voteEmoji = '🟢';
          voteText = 'Me uno';
          break;
        case 'mas-tarde':
          voteEmoji = '🟡';
          voteText = 'Más tarde';
          break;
        case 'moderador':
          voteEmoji = '🔵';
          voteText = 'Moderador';
          break;
        case 'no-me-uno':
          voteEmoji = '🔴';
          voteText = 'No me uno';
          break;
      }
      
      // Check if vote category already exists in description
      const categoryRegex = new RegExp(`\\n${voteEmoji} ${voteText}:(.*)`, 'g');
      const match = categoryRegex.exec(description);
      
      if (match) {
        // Category exists, add user to it
        const existingUsers = match[1].trim();
        const newUsers = existingUsers ? `${existingUsers} ${userId}` : userId;
        description = description.replace(`${voteEmoji} ${voteText}:${match[1]}`, `${voteEmoji} ${voteText}: ${newUsers}`);
      } else {
        // Category doesn't exist, create it
        description += `\n\n${voteEmoji} ${voteText}: ${userId}`;
      }
      
      const updatedEmbed = new EmbedBuilder()
        .setTitle(embed.title)
        .setDescription(description)
        .setColor(embed.color)
        .setThumbnail(embed.thumbnail?.url)
        .setFooter(embed.footer);
      
      await interaction.update({ embeds: [updatedEmbed], components: message.components });
    }
  }
});

client.login(TOKEN);

function exampleFunction(arg1, arg2) {
  console.log(arg1, arg2);
}
exampleFunction("Hello", "World"); // Make sure this call has matching parentheses