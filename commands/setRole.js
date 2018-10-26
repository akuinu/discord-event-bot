module.exports = {
	name: 'setRole',
	description: '',
	adminOnly: true,
	initRequiered: true,
	execute(msg, embedMessage, serversConfig) {
		const id = msg.mentions.roles.firstKey();
		if (id) {
			serversConfig[msg.guild.id].roleID = id;
			serversConfig[msg.guild.id].save().then(()=>msg.reply(embedMessage.getSetRoleMessage(id)));
		} else {
			serversConfig[msg.guild.id].roleID = null;
			serversConfig[msg.guild.id].save().then(()=>msg.reply(embedMessage.getRemoveRoleMessage()));
		}
	},
};
