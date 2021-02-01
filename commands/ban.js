const { MessageEmbed } = require('discord.js'),
  { caseNumber } = require('../util/caseNumber.js'),
  { parseUser } = require('../util/parseUser.js');
exports.run = async (client, message, args) => {
  if (!message.member.permissions.has('BAN_MEMBERS'))
    return message.reply("you don't have the permission **BAN MEMBERS**");
  const userr = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.find(r => r.user.username.toLowerCase() === args[0].toLowerCase()) || message.guild.members.cache.find(r => r.displayName.toLowerCase() === args[0].toLowerCase());
  if (!userr) return message.reply('you must mention someone to ban them.').catch(client.logger.error);
  if (userr.permissions.has('BAN_MEMBERS'))
    return message.reply('the person you tried to ban is too op (they also have the ban members permission)');
  const botlog = message.guild.channels.cache.find(channel => channel.name === 'bot-logs');
  if (userr.user.id === client.settings.owner_id)
    return message.reply('no!');
  if (userr.user.id === client.user.id)
    return message.reply('bruh');
  if (parseUser(message, userr) !== true) return;
  const caseNum = await caseNumber(client, botlog);
  if (message.guild.me.hasPermission('MANAGE_CHANNELS') && !botlog)
    message.guild.channels.create('bot-logs', { type: 'text' });
  else if (!botlog) return message.reply('I cannot find a channel named bot-logs');
  if (!userr.bannable) return message.reply("I can't ban that user");
  const reason = args.splice(1).join(' ') || `Awaiting moderator's input. Use ${client.settings.prefix}reason ${caseNum} <reason>.`;
  await userr.user.send(`you've been banned from ${message.channel.guild.name} by ${message.author}`).catch(client.logger.error);
  message.guild.members.ban(userr, { days: 0, reason: reason });
  message.channel.send(`Banned ${userr.user}`);
  return botlog.send(new MessageEmbed()
    .setColor(0x00ae86)
    .setTimestamp()
    .setDescription(
      `**Action:** Ban\n**Target:** ${userr.user.tag}\n**Moderator:** ${message.author.tag}\n**Reason:** ${reason}\n**User ID:** ${userr.user.id}`
    )
    .setFooter(`ID ${caseNum} | User ID: ${userr.user.id}`)
  );
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: 2
};

exports.help = {
  name: 'ban',
  description: 'Bans the mentioned user.',
  usage: 'ban [mention] [reason]'
};
