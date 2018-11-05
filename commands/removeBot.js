const {getBotRemoveConfirmMessage, getGoodbyeMessage} = require('.././embedHelper.js');
module.exports = {
	name: 'removeBot',
	description: '',
	adminOnly: true,
	initRequiered: false,
	execute(msg, serversConfig) {
		let events = -1;
	  if (serversConfig.serversHasEventChannel(msg.guild.id)) {
	    events = serversConfig.getEventChannel(msg.guild.id).messages.keyArray().length;
	  }
	  msg.reply(getBotRemoveConfirmMessage(events))
	    .then(requestMessage => {
	      serversConfig.userReactionConfirm(requestMessage, msg.author.id)
	        .then(b => {
	          if (b) {
	            const leaveGuild = () => {
	              // last embed message
	              msg.channel.send(getGoodbyeMessage())
	                // leave server
	                .then(()=>msg.guild.leave());
	            }
	            if (serversConfig.serversHasEventChannel(msg.guild.id)) {
	              // deleteing all messages
	              Promise.all(serversConfig.getEventChannel(msg.guild.id).messages.map(m => m.delete()))
	              .then(() => leaveGuild()).catch(console.error);
	            } else {
	              leaveGuild();
	            }
	          }
	    });
	  }).catch(console.error);
  }
};
