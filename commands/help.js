const ms = require('ms');

exports.run = (client, message, args, perms) => {
  if (!args[0]) {
    const longest = Array.from(client.commands.keys()).reduce((long, str) => Math.max(long, str.length), 0),
      fonk = client.commands
        .map(c => {
          if (perms < c.conf.permLevel)
            return null;
          else
            return `${client.settings.prefix}${c.help.name}${' '.repeat(longest - c.help.name.length)} :: ${c.help.description}`;
        })
        .filter(a => a !== null)
        .join('\n'),
      msg = `= Command List =\n\n[Use ${client.settings.prefix}help <commandname> for details]\n\n${fonk}`;
    let i;
    for (i = 0; i * 1980 <= msg.length; i++) {
      message.author
        .send(`${msg.substring(i * 1980, i * 1980 + 1980)}`, {
          code: 'asciidoc'
        })
        .catch(client.logger.error);
    }
    if (message.guild) message.channel.send('Help sent to your DMs! :mailbox_with_mail:');
  } else {
    let command = null;
    if (client.commands.has(args[0])) {
      command = client.commands.get(args[0]);
    } else if (client.aliases.has(args[0])) {
      command = client.commands.get(client.aliases.get(args[0]));
    }
    if (!command) return message.channel.send(`${args[0]} is not a valid command`);
    message.channel.send(
      `= ${command.help.name} = \n${command.help.description}\nusage    :: ${client.settings.prefix}${command.help.usage}\naliases  :: ${command.conf.aliases.join(', ') || 'none'}\nexample  :: ${command.help.example ? `${client.settings.prefix}${command.help.example}` : 'no example provided'}\ncooldown :: ${command.conf.cooldown ? ms(command.conf.cooldown) : '0s'}`,
      {
        code: 'asciidoc'
      }
    );
  }
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ['commands'],
  permLevel: 0
};

exports.help = {
  name: 'help',
  description: 'Displays all the available commands for your permission level in the current guild. If used in DMs, it shows all commands',
  usage: 'help [command]'
};
