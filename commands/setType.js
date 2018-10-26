module.exports = {
	name: 'setType',
	description: '',
	adminOnly: true,
	initRequiered: true,
	execute(msg, embedMessage, serversConfig) {
    if (msg.content.match(/race/i)) {
      serversConfig[msg.guild.id].type = 2;
      serversConfig[msg.guild.id].save().then(()=>msg.reply("type has been updated"));
    } else if (msg.content.match(/event/i)) {
      serversConfig[msg.guild.id].dataValues.type = 3;
      serversConfig[msg.guild.id].save().then(()=>msg.reply("type has been updated"));
    } else {
			msg.reply(embedMessage.getFailedCommandMessage(`You need to add type that exists, for example \`!setType event\``));
    }
  }
};
