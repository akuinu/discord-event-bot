module.exports = {
	name: 'event',
	description: 'make event',
	execute(msg, embedMessage, serversConfig) {
		serversConfig[msg.guild.id].getTypeConfig().then(eventConfig => {
			if (serversConfig.serversHasEventChannel(msg)) {
				serversConfig.getEventChannel(msg).send(embedMessage.eventMessage(msg, eventConfig[0]))
				.then(message => serversConfig.addCollector(message))
				.catch(console.error);
			} else {
				msg.reply("No event channel set up. Can not make event.");
			}
		});
	}
};
