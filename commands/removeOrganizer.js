const {getRemoveOrganizerMessage} = require('.././embedHelper.js');
module.exports = {
	name: 'removeOrganizer',
	description: '',
	adminOnly: true,
	initRequiered: true,
	execute(msg, serversConfig) {
		serversConfig.getGuildObjc(msg.guild.id).organizerID = null;
		serversConfig.getGuildObjc(msg.guild.id).save().then(()=>msg.reply(getRemoveOrganizerMessage(serversConfig.getParticipationRole(msg.guild.id))));
	},
};
