module.exports = {
	name: 'removeBot',
	description: '',
	adminOnly: true,
	initRequiered: false,
	execute(msg, embedMessage, serversConfig) {
		let events = -1;
	  if (serversConfig.serversHasEventChannel(msg)) {
	    events = serversConfig.getEventChannel(msg.guild.id).messages.keyArray().length;
	  }
	  msg.reply(embedMessage.removeBot(events))
	    .then(requestMessage => {
	      serversConfig.userReactionConfirm(requestMessage, msg.author.id)
	        .then(b => {
	          if (b) {
	            const leaveGuild = () => {
	              // last embed message
	              msg.channel.send(embedMessage.goodbye())
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
