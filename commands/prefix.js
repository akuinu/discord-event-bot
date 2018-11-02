const {getCurrentPrefixMessage, getPrefixSetMessage} = require('.././embedHelper.js');
module.exports = {
	name: 'prefix',
	aliases: ['setPrefix'],
	description: 'Get prefix of Event bot',
	adminOnly: false,
	initRequiered: true,
	execute(msg, serversConfig) {
    if (msg.member.hasPermission("ADMINISTRATOR")) {
			var myRegexp = /prefix (\S+)/g;
			var found = myRegexp.exec( msg.content);
			if (found) {
				serversConfig.setGuildPrefix(msg.guild.id, found[1]);
				msg.reply(getPrefixSetMessage(serversConfig.getGuildPrefix(msg.guild.id)));
			} else {
				msg.reply(getCurrentPrefixMessage(serversConfig.getGuildPrefix(msg.guild.id)));
			}
    } else {
			msg.reply(getCurrentPrefixMessage(serversConfig.getGuildPrefix(msg.guild.id)));
		}
	},
};
