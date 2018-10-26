module.exports = {
	name: 'setEvent',
	description: '',
	adminOnly: true,
	initRequiered: true,
	execute(msg, embedMessage, serversConfig) {
		// maybe check if they want to change and if we should deleate events...
		const id = msg.mentions.channels.firstKey()
    if (id !== undefined) {
      serversConfig[msg.guild.id].eventChannelID =id;
      serversConfig[msg.guild.id].save().then(()=>msg.reply(embedMessage.getSetEventMessage(id)));
    }else{
			msg.reply(embedMessage.getFailedCommandMessage(`You need to tag channel to make it work, for example \`!setEvent <channel>\``));
    }
  }
};
