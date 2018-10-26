module.exports = {
	name: 'event',
	aliases: ['race', 'raid'],
	description: 'make event',
	adminOnly: false,
	initRequiered: true,
	execute(msg, embedMessage, serversConfig) {
		serversConfig.getTypeConfig(msg.guild.id).then(eventConfig => {
			serversConfig.getEventChannel(msg.guild.id).send(embedMessage.eventMessage(msg, eventConfig[0]))
				.then(message => serversConfig.addCollector(message))
				.catch(console.error);
		});
	}
};
