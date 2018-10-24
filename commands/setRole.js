module.exports = {
	name: 'setRole',
	description: '',
	execute(msg, embedMessage, serversConfig) {
    serversConfig[msg.guild.id].roleID = (msg.mentions.roles.firstKey() !== undefined) ? msg.mentions.roles.firstKey() : null;
    serversConfig[msg.guild.id].save().then(()=>msg.reply("role has been updated"));
	},
};
