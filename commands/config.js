const {getServerConfigMessage} = require('.././embedHelper.js');
module.exports = {
	name: 'config',
	description: 'Get info how Event Bot is set up',
	adminOnly: true,
	initRequiered: true,
	execute(msg, serversConfig) {
    msg.reply(getServerConfigMessage(serversConfig.getGuildObjc(msg.guild.id)));
	},
};
