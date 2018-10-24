module.exports = {
	name: 'info',
	description: 'Get info how to use Event bot',
	execute(msg, embedMessage, serversConfig) {
    msg.reply(embedMessage.help())
      .then(m => m.delete(60000));
	},
};
