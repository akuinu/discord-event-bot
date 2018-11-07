const {getSetEventMessage, getFailedCommandMessage, getEventChannelMoveConfirmMessage} = require('.././embedHelper.js');
module.exports = {
	name: 'setEvent',
	description: '',
	adminOnly: true,
	initRequiered: true,
	execute(msg, serversConfig) {
		let events = -1;
		if (serversConfig.serversHasEventChannel(msg.guild.id)) {
			events = serversConfig.getEventChannel(msg.guild.id).messages.keyArray().length;
		}
		const id = msg.mentions.channels.firstKey()
    if (id !== undefined) {
			const change = function(){
				serversConfig.getGuildObjc(msg.guild.id).eventChannelID = id;
				serversConfig.getGuildObjc(msg.guild.id).save().then(()=>msg.reply(getSetEventMessage(id)));
			}
			if (events > 0) {
				msg.reply(getEventChannelMoveConfirmMessage(events))
					.then(proptMessage =>{
						serversConfig.userReactionConfirm(proptMessage, msg.author.id)
			        .then(b => {
								if (b) {
									Promise.all(serversConfig.getEventChannel(msg.guild.id).messages.map(m => m.delete()))
									.then(() => change())
									.catch(console.error);
								}
							})
					}).catch(console.error);
			} else {
				change();
			}
    }else{
			msg.reply(getFailedCommandMessage(`You need to tag channel to make it work, for example \`!setEvent <channel>\``));
    }
  }
};
