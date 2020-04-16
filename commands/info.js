const {getHelpMessage} = require('.././embedHelper.js');
module.exports = {
  name: 'info',
  aliases: ['help'],
  description: 'Get info how to use Event bot',
  adminOnly: false,
  initRequiered: false,
  execute(msg, serversConfig) {
    Promise.all([
      serversConfig.getGuildPrefix(msg.guild.id),
      serversConfig.getTypeConfig(msg.guild.id),
      msg.member.hasPermission("ADMINISTRATOR"),
    ]).then(values => {
      msg.reply(getHelpMessage(values[0], values[1], (!msg.guild || values[2] ? true : false)))
        .then(m => m.delete(60000));
    })
  },
};
