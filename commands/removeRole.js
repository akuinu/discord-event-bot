module.exports = {
	name: 'removeRole',
	description: '',
	adminOnly: true,
	initRequiered: true,
	execute(msg, embedMessage, serversConfig) {
    serversConfig[msg.guild.id].roleID = null;
    serversConfig[msg.guild.id].save().then(()=>msg.reply(embedMessage.getRemoveRoleMessage()));
	},
};
