const {getFailedCommandMessage} = require('.././embedHelper.js');
module.exports = {
  name: 'setType',
  description: '',
  adminOnly: true,
  initRequiered: true,
  execute(msg, serversConfig) {
    if (msg.content.match(/race/i)) {
      serversConfig.getGuildObjc(msg.guild.id).type = 2;
      serversConfig.getGuildObjc(msg.guild.id).save().then(() => msg.reply("type has been updated"));
    } else if (msg.content.match(/event/i)) {
      serversConfig.getGuildObjc(msg.guild.id).type = 3;
      serversConfig.getGuildObjc(msg.guild.id).save().then(() => msg.reply("type has been updated"));
    } else if (msg.content.match(/visit/i)) {
      serversConfig.getGuildObjc(msg.guild.id).type = 4;
      serversConfig.getGuildObjc(msg.guild.id).save().then(() => msg.reply("type has been updated"));
    } else {
      msg.reply(getFailedCommandMessage(`You need to add type that exists, for example \`!setType event\``));
    }
  }
};
