
exports.run = (client, message) => {
  let options = ['pong', 'No! I say ping!', 'Can you say pong?', 'do I have to say pong?', 'can I say nothing?', 'Pongity Pow!', 'no!', 'meowwwww', 'erggggghhhh', `banned @${message.author}`];
  let pingmsg = `${options[Math.floor(Math.random() * options.length)]}`;
  message.channel.send('Ping?')
    .then(msg => {
      msg.edit(pingmsg + `(took: ${msg.createdTimestamp - message.createdTimestamp}ms)`);
    });
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: 0
};

exports.help = {
  name: 'ping',
  description: 'Ping command. I wonder what this does? *sarcasm*',
  usage: 'ping'
};
