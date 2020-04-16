const {getEventMessage} = require('.././embedHelper.js');
module.exports = {
	name: 'event',
	aliases: ['race', 'raid', 'visit'],
	description: 'make event',
	adminOnly: false,
	initRequiered: true,
	execute(msg, serversConfig) {
		if (msg.guild) {
			serversConfig.getTypeConfig(msg.guild.id).then(eventConfig => {
				serversConfig.getEventChannel(msg.guild.id).send(getEventMessage(msg, eventConfig))
				.then(message => serversConfig.addCollector(message))
				.catch(console.error);
			});
		}else {
			msg.reply("DEMO", getEventMessage(msg,
				{authorField: "Demo created for ",
	      footer: "Test powered by Event Bot",
	      participants: "Testers(do not work in DM's):"
	    }));
		}
	}
};
