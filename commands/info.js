const {getHelpMessage} = require('.././embedHelper.js');
module.exports = {
	name: 'info',
	aliases: ['help'],
	description: 'Get info how to use Event bot',
	adminOnly: false,
	initRequiered: false,
	execute(msg, serversConfig) {
    msg.reply(getHelpMessage((msg.guild ? serversConfig.getGuildPrefix(msg.guild.id) : '!'), (!msg.guild || msg.member.hasPermission("ADMINISTRATOR")?true : false)))
      .then(m => m.delete(60000));
	},
};
