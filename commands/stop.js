const { canModifyQueue } = require('../util/Util');

exports.run = (client, message) => {
  if (!message.guild.me.voice.channel) return message.reply("I'm not in a voice channel moron");
  const queue = client.queue.get(message.guild.id);

  if (canModifyQueue(message.member) != true) return message.delete();
  if (queue && queue.connection) {
    queue.songs = [];
    queue.connection.dispatcher.end();
    queue.textChannel.send(`${message.author} ⏹ stopped the music!`).catch(client.logger.error);
    if (queue.stream) queue.stream.destroy();
  } else {
    if (!message.channel.permissionsFor(message.author).has('MOVE_MEMBERS') && message.guild.me.voice.connection.channel.members.size > 2)
      return message.reply('you need the **MOVE MEMBERS** permission');
    message.member.voice.channel.leave();
  }
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['leave', 'cease'],
  permLevel: 0,
  cooldown: 2500
};

exports.help = {
  name: 'stop',
  description: 'Stops the music',
  usage: 'stop',
  example: 'stop'
};
