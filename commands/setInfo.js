const {getSetInfoMessage, getFailedCommandMessage} = require('.././embedHelper.js');
module.exports = {
	name: 'setInfo',
	description: '',
	adminOnly: true,
	initRequiered: true,
	execute(msg, serversConfig) {
		const id = msg.mentions.channels.firstKey();
    if (id) {
      serversConfig.getGuildObjc(msg.guild.id).infoChannelID = id;
      serversConfig.getGuildObjc(msg.guild.id).save().then(()=>msg.reply(getSetInfoMessage(id)));
    }else{
      msg.reply(getFailedCommandMessage(`You need to tag channel to make it work, for example \`!setInfo <channel>\``));
    }
  }
};
