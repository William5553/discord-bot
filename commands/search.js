const { MessageEmbed } = require('discord.js');
const YouTubeAPI = require('simple-youtube-api');

exports.run = async (client, message, args) => {
  if (!process.env.google_api_key) return message.reply('the bot owner has not set up this command yet');
  const youtube = new YouTubeAPI(process.env.google_api_key);
  if (!args.length) return message.reply(`${process.env.prefix}${exports.help.usage}`).catch(client.logger.error);
  if (message.channel.activeCollector) return message.reply('a message collector is already active in this channel.');
  if (!message.member.voice.channel)
    return message.reply('you need to join a voice channel first!').catch(client.logger.error);

  const search = args.join(' ');
  const resultsEmbed = new MessageEmbed()
    .setTitle('**Reply with the song number you want to play**')
    .setDescription(`Results for: ${search}`)
    .setColor('#F8AA2A');

  try {
    const results = await youtube.searchVideos(search, 10);
    results.map((video, index) => resultsEmbed.addField(video.shortURL, `${index + 1}. ${video.title}`));

    const resultsMessage = await message.channel.send(resultsEmbed);

    message.channel.activeCollector = true;
    const response = await message.channel.awaitMessages(filter, {
      max: 1,
      time: 30000,
      errors: ['time']
    });
    const choice = resultsEmbed.fields[parseInt(response.first()) - 1].name;

    message.channel.activeCollector = false;
    client.commands.get('play').run(client, message, [choice]);
    if (resultsMessage)
      resultsMessage.delete().catch(client.logger.error);
  } catch (error) {
    client.logger.error(error);
    message.channel.activeCollector = false;
  }
};

function filter(msg) {
  const pattern = /(^[1-9][0-9]{0,1}$)/g;
  return pattern.test(msg.content) && parseInt(msg.content.match(pattern)[0]) <= 10;
}

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: 0
};

exports.help = {
  name: 'search',
  description: 'Search and select videos to listen to',
  usage: 'search [video name]'
};
