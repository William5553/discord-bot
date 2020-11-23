const settings = require('../settings.json');
exports.run = (client, message, args) => {
  if (!args[0]) {
    const commandNames = Array.from(client.commands.keys());
    const longest = commandNames.reduce((long, str) => Math.max(long, str.length), 0);
    let yes = `= Command List =\n\n[Use ${settings.prefix}help <commandname> for details]\n\n${client.commands.map(c => `${settings.prefix}${c.help.name}${' '.repeat(longest - c.help.name.length)} :: ${c.help.description}`).join('\n')}`;
    for (i = 0; i*1920 < yes.length; i++) { 
      yes = `${yes.substr(i*1920, i*1920+1920)}`;
      message.author.send(yes, {code: 'asciidoc'}).catch(err => {
        client.logger.error(err);
        message.author.send(err);
      });
    }
    message.channel.send('Help sent to your DMs! :mailbox_with_mail:');
  } else {
    let command = args[0];
    if (client.commands.has(command)) {
      command = client.commands.get(command);
      message.channel.send(`= ${command.help.name} = \n${command.help.description}\nusage :: ${command.help.usage}`, {code:'asciidoc'});
    }
  }
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: 0
};

exports.help = {
  name: 'help',
  description: 'Displays all the available commands for your permission level.',
  usage: 'help [command]'
};
