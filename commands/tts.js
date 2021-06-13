const request = require('node-superfetch');
const { Readable } = require('stream');
const { MessageEmbed, Message, Permissions } = require('discord.js');

exports.run = async (client, message, args) => {
  const queue = client.queue.get(message.guild.id);
  if (queue) return message.reply("there's currently music playing");
  const text = args.join(' ');
  if (!text)
    return message.channel.send(`Usage: ${client.getPrefix(message)}${exports.help.usage}`);
  if (text.length > 1024)
    return message.reply('keep the message under 1024 characters man');
  if (!message.guild.me.voice || !message.guild.me.voice.connection) {
    const connection = await client.commands.get('join').run(client, message);
    if (connection instanceof Message) return;
  } else if (message.member.voice.channelID !== message.guild.me.voice.channelID)
    return message.reply("I'm already in a voice channel");
  try {
    const { body } = await request
      .get('http://tts.cyzon.us/tts')
      .query({ text });
    message.guild.me.voice.connection
      .play(Readable.from([body]))
      .on('finish', () => message.member.voice.channel.leave())
      .on('error', err => client.logger.error(err));
    if (message.channel.permissionsFor(client.user).has([Permissions.FLAGS.ADD_REACTIONS, Permissions.FLAGS.READ_MESSAGE_HISTORY]))
      message.react('🔉');
    return;
  } catch (err) {
    if (message.channel.permissionsFor(client.user).has([Permissions.FLAGS.ADD_REACTIONS, Permissions.FLAGS.READ_MESSAGE_HISTORY]))
      message.react('⚠️');
    return message.channel.send({embeds: [new MessageEmbed()
      .setColor('#FF0000')
      .setTimestamp()
      .setTitle('Please report this on GitHub')
      .setURL('https://github.com/william5553/triv/issues')
      .setDescription(`**Stack Trace:**\n\`\`\`${err.stack || err}\`\`\``)
      .addField('**Command:**', `${message.content}`)
    ]});
  }
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: 0,
  cooldown: 10000
};

exports.help = {
  name: 'tts',
  description: 'Text to speech.',
  usage: 'tts [text]',
  example: 'tts waffles'
};
