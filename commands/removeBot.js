module.exports = {
	name: 'removeBot',
	description: '',
	execute(msg, embedMessage, serversConfig) {
		let events = -1;
	  if (serversConfig.serversHasEventChannel(msg)) {
	    events = serversConfig.getEventChannel(msg).messages.keyArray().length;
	  }
	  msg.reply(embedMessage.removeBot(events))
	    .then(requestMessage => {
	      serversConfig.userReactionConfirm(requestMessage, msg.author.id)
	        .then(b => {
	          if (b) {
	            const leaveServer = () => {
	              // last embed message
	              msg.channel.send(embedMessage.goodbye())
	                // leave server
	                .then(()=>msg.guild.leave());
	            }
	            if (serversConfig.serversHasEventChannel(msg)) {
	              // deleteing all messages
	              Promise.all(serversConfig.getEventChannel(msg).messages.map(m => m.delete()))
	              .then(() => leaveServer()).catch(console.error);
	            } else {
	              leaveServer();
	            }
	          }
	    });
	  }).catch(console.error);
  }
};
