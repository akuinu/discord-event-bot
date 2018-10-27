module.exports = {
	name: 'info',
	aliases: ['help'],
	description: 'Get info how to use Event bot',
	adminOnly: false,
	initRequiered: false,
	execute(msg, embedMessage, serversConfig) {
    msg.reply(embedMessage.help((!msg.guild || msg.member.hasPermission("ADMINISTRATOR")?true : false)))
      .then(m => m.delete(60000));
	},
};
