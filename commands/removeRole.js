const {getRemoveRoleMessage} = require('.././embedHelper.js');
module.exports = {
	name: 'removeRole',
	description: '',
	adminOnly: true,
	initRequiered: true,
	execute(msg, serversConfig) {
    serversConfig.getGuildObjc(msg.guild.id).roleID = null;
    serversConfig.getGuildObjc(msg.guild.id).save().then(()=>msg.reply(getRemoveRoleMessage()));
	},
};
