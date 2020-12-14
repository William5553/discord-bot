const settings = require('../settings.json');
module.exports = (client, message) => {
  if (message.author.bot) return;
  const prefixMention = new RegExp(`^<@!?${client.user.id}>( |)$`);
  if (message.content.match(prefixMention))
    return message.reply(`my prefix on this guild is \`${settings.prefix}\``);
  if (!message.content.startsWith(settings.prefix)) return;
  const command = message.content.split(' ')[0].slice(settings.prefix.length).toLowerCase();
  const args = message.content.split(/ +/);.slice(1);
  let cmd;
  if (client.commands.has(command))
    cmd = client.commands.get(command);
  else if (client.aliases.has(command))
    cmd = client.commands.get(client.aliases.get(command));
  if (cmd) {
    if (!message.guild) {
      if (!cmd.conf.guildOnly) {
        if (cmd.conf.permLevel >= 10 && message.author.id !== settings.ownerid) return message.reply("you don't have the perms for that");
        return cmd.run(client, message, args, 4);
      }
      else if (cmd.conf.guildOnly)
        return message.reply('that command can only be used in a guild, get some friends.');
    }
    const perms = client.elevation(message);
    if (perms < cmd.conf.permLevel) return message.reply("you don't have the perms for that");
    cmd.run(client, message, args, perms);
  }
};
