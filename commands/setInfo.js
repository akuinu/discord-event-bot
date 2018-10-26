module.exports = {
	name: 'setInfo',
	description: '',
	adminOnly: true,
	initRequiered: true,
	execute(msg, embedMessage, serversConfig) {
		const id = msg.mentions.channels.firstKey();
    if (id) {
      serversConfig[msg.guild.id].infoChannelID = id;
      serversConfig[msg.guild.id].save().then(()=>msg.reply(embedMessage.getSetInfoMessage(id)));
    }else{
      msg.reply(embedMessage.getFailedCommandMessage(`You need to tag channel to make it work, for example \`!setInfo <channel>\``));
    }
  }
};
