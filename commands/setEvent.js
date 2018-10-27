const {getSetEventMessage, getFailedCommandMessage} = require('.././embedHelper.js');
module.exports = {
	name: 'setEvent',
	description: '',
	adminOnly: true,
	initRequiered: true,
	execute(msg, serversConfig) {
		// maybe check if they want to change and if we should deleate events...
		const id = msg.mentions.channels.firstKey()
    if (id !== undefined) {
      serversConfig.getGuildObjc(msg.guild.id).eventChannelID =id;
      serversConfig.getGuildObjc(msg.guild.id).save().then(()=>msg.reply(getSetEventMessage(id)));
    }else{
			msg.reply(getFailedCommandMessage(`You need to tag channel to make it work, for example \`!setEvent <channel>\``));
    }
  }
};
