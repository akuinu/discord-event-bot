module.exports = {
	name: 'removeRole',
	description: '',
	execute(msg, embedMessage, serversConfig) {
    serversConfig[msg.guild.id].roleID = null;
    serversConfig[msg.guild.id].save().then(()=>msg.reply("role has been updated"));
	},
};
