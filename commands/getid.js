exports.run = (client, message) => {
  const user = message.mentions.users.first();
  if (message.mentions.users.size < 1) return message.reply('Which user?');
  message.channel.send(user + `'s ID is ${user.id}`);

};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: 0
};

exports.help = {
  name: 'getid',
  description: 'Gets a user\'s ID',
  usage: 'getid [user]'
};
