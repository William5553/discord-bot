exports.run = (client, message, args) => {
  const Discord = require('discord.js');
  const feedbackid = '340924459026219009';
  const feedback = args.slice(0).join(' ');
  if (feedback.length < 1) return message.reply('we don\'t accept blank feedback!').catch(console.error);
  message.reply('Feedback sent.. :envelope:');

  const embed = new Discord.RichEmbed()
    .setColor(0x00AE86)
    .setTimestamp()
    .setDescription(`**Sent in by:** ${message.author.tag}\n\n**ID: ** ${message.author.id}\n\n**Feedback:** ` + feedback);
  return client.channels.get(feedbackid).send({embed});



};



exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: 0
};

exports.help = {
  name: 'feedback',
  description: 'Sends feedback, if you abuse this you will be blacklisted.',
  usage: 'feedback [feedback]'
};
