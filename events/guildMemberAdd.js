module.exports = (member) => {
  if (member.client.settings.get(member.guild.id).joinRoleID && member.guild.me.hasPermission('MANAGE_ROLES'))
    member.roles.add(member.client.settings.get(member.guild.id).joinRoleID, 'Default join role');
};
