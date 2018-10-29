const {getSetOrganizerMessage, getRemoveOrganizerMessage} = require('.././embedHelper.js');
module.exports = {
	name: 'setOrganizer',
	description: '',
	adminOnly: true,
	initRequiered: true,
	execute(msg, serversConfig) {
		const id = msg.mentions.roles.firstKey();
		if (id) {
			serversConfig.getGuildObjc(msg.guild.id).organizerID = id;
			serversConfig.getGuildObjc(msg.guild.id).save().then(()=>msg.reply(getSetOrganizerMessage(id)));
		} else {
			serversConfig.getGuildObjc(msg.guild.id).organizerID = null;
			serversConfig.getGuildObjc(msg.guild.id).save().then(()=>msg.reply(getRemoveOrganizerMessage(serversConfig.getParticipationRole(msg.guild.id))));
		}
	},
};
