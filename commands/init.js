const {getServerInitMessage, getFailedCommandMessage} = require('.././embedHelper.js');
module.exports = {
	name: 'init',
	description: 'Set up server',
	adminOnly: true,
	initRequiered: false,
	execute(msg, serversConfig) {
		const server = {
	    serverID: msg.guild.id,
	    type: 1
	  }
	  const channelKeys = msg.mentions.channels.firstKey(2);
	  if (channelKeys.length == 2) {
	    server.infoChannelID = channelKeys[0];
	    server.eventChannelID = channelKeys[1];
	  }
	  if (msg.mentions.roles.firstKey()) {
	    server.roleID = msg.mentions.roles.firstKey();
	  }
	  if (msg.content.match(/race/i)) {
	    server.type = 2;
	  } else if (msg.content.match(/event/i)) {
	    server.type = 3;
	  }
		serversConfig.serverInit(server)
			.then(b => {
				if (b) {
					msg.reply(getServerInitMessage(server, serversConfig.isGuildConfigured(msg.guild.id)));
				}
			}).catch(e => msg.reply(getFailedCommandMessage(e)));
	},
};
