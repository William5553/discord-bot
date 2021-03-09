exports.run = (client, message, args) => {
  const sides = Number(args.slice(0).join(' ')) || 6;
  const roll = Math.floor(Math.random() * sides) + 1;
  message.reply('You rolled a ' + roll);
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: 0
};

exports.help = {
  name: 'roll',
  description: 'Rolls a die',
  usage: 'roll [dice sides]'
};
