const {getSetRoleMessage, getRemoveRoleMessage} = require('.././embedHelper.js');
module.exports = {
	name: 'setRole',
	description: '',
	adminOnly: true,
	initRequiered: true,
	execute(msg, serversConfig) {
		const id = msg.mentions.roles.firstKey();
		if (id) {
			serversConfig.getGuildObjc(msg.guild.id).roleID = id;
			serversConfig.getGuildObjc(msg.guild.id).save().then(()=>msg.reply(getSetRoleMessage(id)));
		} else {
			serversConfig.getGuildObjc(msg.guild.id).roleID = null;
			serversConfig.getGuildObjc(msg.guild.id).save().then(()=>msg.reply(getRemoveRoleMessage()));
		}
	},
};
