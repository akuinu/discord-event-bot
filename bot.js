const fs = require('fs');
const Discord = require('discord.js');
const client = new Discord.Client();
const { Servers, Types} = require('./dbObjects');
const config = require('./config.json');
const embedMessage = require('./embedMessage.js');

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}
const serversConfig = {};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
	embedMessage.avatar = client.user.displayAvatarURL;
  // starting up - checks all event channel for event messages
  client.guilds.forEach(guild => {
    if (serversConfig.isServerSetUp(guild.id)) {
      checkOldMessages(client.channels.get(serversConfig[guild.id].dataValues.eventChannelID));
    }
  });
});

client.on('message', msg => {
  if (!msg.author.bot){
    if (msg.guild){
      if (msg.content.startsWith("!")){
        const commandName = msg.content.substring(1).split(' ')[0];
				const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
				if (command){
					if (command.adminOnly){
						if (msg.member.hasPermission("ADMINISTRATOR")) {
							if (command.initRequiered) {
								if (serversConfig.isServerSetUp(msg.guild.id)) {
									command.execute(msg, embedMessage, serversConfig);
								} else {
									msg.reply(embedMessage.getInitRequieredMessage());
								}
							} else {
								command.execute(msg, embedMessage, serversConfig);
							}
						}	else {
							// ignore non admins doing admin commands
						}
					} else {
						if (command.initRequiered) {
							if(serversConfig.isAllowedToHostEvent(msg)) {
								if (serversConfig.inWatchlist(msg)) {
									command.execute(msg, embedMessage, serversConfig);
								} else {
									// should we tell people they are in wrong Channel?
								}
							} else {
								// should we tell people they don't have right to host events?
							}
						} else {
							command.execute(msg, embedMessage, serversConfig);
						}
					}
				}
      }
    }else{
			// handleing the DM's
      client.generateInvite(85056)
      .then(link => {
        msg.reply(embedMessage.invites(link));
      }).catch(console.error);
    }
  }
  // removing it from cache, we have no use for these
  msg.channel.messages.delete(msg.id);
});

client.on('messageReactionRemove', (reaction, user) => {
  if (serversConfig.isServerSetUp(reaction.message.guild.id)) {
    if (serversConfig[reaction.message.guild.id].dataValues.eventChannelID == reaction.message.channel.id) {
      if (embedMessage.isEventMessage(reaction.message)) {
        if(!((['📝','⏱','💌','📧','\u2702'].indexOf(reaction.emoji.name) > -1) && user.id == embedMessage.getEventCreator(reaction.message))) {
          serversConfig.updateParticipants(reaction.message);
        }
      }
    }
  }
});

client.on('guildCreate', guild => {
  if (guild.systemChannel) {
    guild.systemChannel.send(embedMessage.welcome());
  }
});

client.on('guildDelete', guild => {
	// delete sever info from DB
	serversConfig[guild.id].destroy();
	// delete sever info from active
	delete serversConfig[guild.id];
});

serversConfig.isServerSetUp = (id) => {
	return serversConfig.hasOwnProperty(id) && serversConfig[id].infoChannelID && serversConfig[id].eventChannelID;
}

serversConfig.isAllowedToHostEvent = (msg) => {
	return serversConfig.hasRightRoll(msg);
}

serversConfig.hasRightRoll = (msg) => {
  if (serversConfig.hasOwnProperty(msg.guild.id)) {
    if (serversConfig.isRoleRequiered(msg.guild.id)) {
      return msg.member.roles.has(serversConfig[msg.guild.id].dataValues.roleID);
    }
    return true;
  }
  return false;
}

serversConfig.isRoleRequiered = (guildID) => {
  return serversConfig[guildID].dataValues.roleID !== null;
}

serversConfig.inWatchlist = (msg) => {
	// maybe make a list of event creat channels
  if (serversConfig.hasOwnProperty(msg.guild.id)) {
    return serversConfig[msg.guild.id].dataValues.infoChannelID == msg.channel.id;
  }
  return false;
}

serversConfig.getEventChannel = (msg) => {
  return client.channels.get(serversConfig[msg.guild.id].dataValues.eventChannelID);
}

serversConfig.serversHasEventChannel = (msg) => {
  if (serversConfig.hasOwnProperty(msg.guild.id)) {
    return (serversConfig[msg.guild.id].dataValues.eventChannelID !== null);
  }
  return false;
}

serversConfig.getinfoChannel = (msg) => {
  return client.channels.get(serversConfig[msg.guild.id].dataValues.infoChannelID);
}

serversConfig.serversHasinfoChannel = (msg) => {
  if (serversConfig.hasOwnProperty(msg.guild.id)) {
    return (serversConfig[msg.guild.id].dataValues.infoChannelID !== null);
  }
  return false;
}

function checkOldMessages(channel){
  channel.fetchMessages()
    .then(messages =>{
      messages.forEach(message => {
        if (message.author.id == client.user.id) {
          message.channel.fetchMessage(message.id)
            .then(myMessage =>{
              oldMessageCheck(myMessage);
            }).catch(console.error);
        }else {
          // removing non interesting messages from cache
          message.channel.messages.delete(message.id);
        }
      });
    }).catch(console.error);
}

function oldMessageCheck(message){
  if (embedMessage.isEventMessage(message)) {
		checkIfDeleateRequested(message);
		['📝','⏱','💌','📧','\u2702'].forEach(emote => removeCommandEmote(message, emote));
		serversConfig.addCollector(message);
		serversConfig.updateParticipants(message);
  } else {
		message.delete();
  }
}

serversConfig.updateParticipants = (message) => {
  /*
    max of 46 runners = field 1024 chars, one user marker "<@Snowflake> " 22 chars
    using description with 2048 chars (2048 - "**Runners:** )/22 = 92
  */
  Promise.all(message.reactions.map(reaction => reaction.fetchUsers(reaction.count))).then(usersCollectionsArray => {
    const users = usersCollectionsArray.reduce( (accCol, curCol) => accCol.concat(curCol), new Discord.Collection());
    Promise.all(users.map(user => message.guild.fetchMember(user.id))).then(members => {
      if (serversConfig.isRoleRequiered(message.guild.id)){
        members = members.filter(member => member.roles.has(serversConfig[message.guild.id].dataValues.roleID));
      }
      const participants = members.reduce((accStr, curStr) => accStr + curStr + " ", "\u200B");
			const uptaded = embedMessage.getUpdatedParticipants(message, participants);
			if (uptaded) {
				message.edit("", uptaded);
			}
    }).catch(console.error);
  }).catch(console.error);
}

function checkIfDeleateRequested(message){
  if (message.reactions.has('❌')) { // \u274C
    message.reactions.get('❌').fetchUsers().then( users =>{
      const creatorID = embedMessage.getEventCreator(message);
      const reducer = (user, bool) => bool || user.id == creatorID;
      if(users.reduce(reducer, false)){
        sendDeletionPrompt(message, creatorID);
        message.reactions.get('❌').remove(creatorID).catch(console.log);;
      }
    }).catch(console.error);
  }
}

function removeCommandEmote(message, emoji){
  if (message.reactions.has(emoji)) {
    message.reactions.get(emoji).fetchUsers().then( users =>{
      const creatorID = embedMessage.getEventCreator(message);
      const reducer = (user, bool) => bool || user.id == creatorID;
      if(users.reduce(reducer, false)){
        message.reactions.get(emoji).remove(creatorID).catch(console.log);;
      }
    }).catch(console.error);
  }
}

serversConfig.userReactionConfirm = (msg, userID) => {
  return new Promise((resolve, reject) => {
    const filter = (reaction, user) => {
        return ['👍', '👎'].includes(reaction.emoji.name) && user.id == userID;
    };
    msg.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
      .then(collected => {
        const reaction = collected.first();
        if (reaction.emoji.name === '👍') {
          msg.delete();
          resolve(true);
        } else {
          msg.delete();
          resolve(false);
        }
      })
      .catch(collected => {
        msg.delete();
        resolve(false);
      });
    msg.react('👍').then(() => msg.react('👎'));
  });
}

function sendDeletionPrompt(message, creatorID){
  message.channel.send("<@"+creatorID+">", embedMessage.deletiongPrompt(message.url))
    .then(promptMessage => {
      serversConfig.userReactionConfirm(promptMessage,creatorID)
        .then(b => {
          if (b) message.delete();
        }).catch(console.error);
    }).catch(console.error);
}

function startCountdown(channel, time, tagged){
  channel.send(tagged,embedMessage.getTimerStartMessage(time));
  setTimeout(()=>channel.send(`**START**`),time*1000);
  for (var i = 1; i < 5; i++) {
    setTimeout((time)=>{
      channel.send(`Countdown: ${time}seconds`).then(ctm => ctm.delete(60000));
    }, (time-i)*1000,i);
  }
  if (Math.floor(time/5)>1) {
    for (var i = 1; i < Math.floor(time/5); i++) {
      setTimeout((timer)=>{
        channel.send(`Countdown: ${timer}seconds`).then(ctm => ctm.delete(60000));
      }, (time-i*5)*1000,i*5);
    }
  }
}

const sendInfoRequestPrompt = (infoChannel, user, requestSr) => {
  return new Promise((resolve, reject) => {
    infoChannel.send(user, embedMessage.getUserInputPrompt(requestSr)).then( requestMessage =>{
      const filter = m => user.id === m.author.id;
      infoChannel.awaitMessages(filter, { time: 60000, maxMatches: 1, errors: ['time'] })
      .then(messages => {
        const userMessage = messages.first();
        userMessage.reply(embedMessage.userInputRecived(userMessage.content, requestSr)).then(m => m.delete(60000));
        resolve(userMessage.content);
      })
      .catch((e) => {
        console.log(e);
        infoChannel.send(user, embedMessage.getFailedCommandMessage("Time to enter input is over."));
        reject(Error("Edit window is over."));
      });
    }).catch((e) => {
      console.log(e);
      reject(Error(`It broke: ${e}`));
    });

  });
};

serversConfig.addCollector = (message) => {
  const filter = (reaction, user) =>{
    if (user.id == embedMessage.getEventCreator(message)) {
      if (reaction.emoji.name == '❌') {
        sendDeletionPrompt(reaction.message, user.id);
        reaction.remove(user.id).catch(console.log);;
        return false;
      } else {
        if (!serversConfig.serversHasinfoChannel(message)) {
          message.reply("Some admins have managed to get bot to this awkward state of having events and no info channel.").then(m => m.delete(60000));
        } else {
          const infoChannel = serversConfig.getinfoChannel(message);
          switch (reaction.emoji.name) {
            case '📝':
              sendInfoRequestPrompt(infoChannel, user, `Please enter edits, no prefix needed\n for example: \`--seed 31337\``)
                .then(userStr => message.edit("", embedMessage.addAttitionalFields(message, userStr)))
                .catch(console.error);

              reaction.remove(user.id).catch(console.log);;
              return false;
              break;
            case '\u2702': //✂
							const fields = embedMessage.getEnumeratedUserFields(message);
							if (fields) {
								sendInfoRequestPrompt(infoChannel, user, `Please enter numbers what fields you want to remove \n${fields}`)
									.then(userStr => message.edit("", embedMessage.removeFields(message, userStr)))
									.catch(console.log);
							} else {
								infoChannel.send(embedMessage.getFailedCommandMessage(`${user} no field to remove`));
							}
              reaction.remove(user.id).catch(console.log);;
              return false;
              break;
            case '⏱':
              sendInfoRequestPrompt(infoChannel, user, `Please enter numbers of seconds for countdown. \n  min 5, max 30 seconds`)
                .then(userStr => {
                  const t = parseInt(userStr.match(/\d+/), 10);
                  if (5 <= t && t <= 30 ) {
                    startCountdown(infoChannel, t, embedMessage.getParticipants(message));
                  } else {
                    infoChannel.send(embedMessage.getFailedCommandMessage("Value has to be between 5 and 30 seconds."));
                  }
                }).catch(console.error);
              reaction.remove(user.id).catch(console.log);;
              return false;
              break;
            case '💌':
            case '📧':
              sendInfoRequestPrompt(infoChannel, user, `Please enter your message.`)
                .then(userStr => {
                  const participants = embedMessage.getParticipants(message);
                  infoChannel.send(participants, embedMessage.userMessage(user.username, participants, userStr, message.url));
                }).catch(console.error);
              reaction.remove(user.id).catch(console.log);;
              return false;
              break;
          }
        }
      }
    }
    return true;
  }
  const collector = message.createReactionCollector(filter);
  collector.on('collect', reaction => {
    serversConfig.updateParticipants(reaction.message);
    });
  //collector.on('remove', (reaction, user) => editEventParticipants(reaction)); not a thing in curret API
}

serversConfig.serverInit = (server) => {
	return new Promise((resolve, reject) => {
		// maybe check if thoes are channels we can type in
		Servers
			.findOrCreate({where: { serverID: server.serverID }, defaults: server})
			.spread((serverNew, created) => {
				if (created) {
					addToServerConfig(serverNew);
				} else {
					serverNew.update(server).then(updatedServer =>{
						addToServerConfig(updatedServer);
					});
				}
				resolve(true);
		});
	});
}

function addToServerConfig(s) {
  serversConfig[s.dataValues.serverID] = s;
}

console.log(`Starting up the database.`);
Servers.sync().then(() => {
  console.log("Loading servers config.");
  Servers.findAll().then(res => {
    res.forEach(s => {
      addToServerConfig(s);
    });
    console.log("Servers config loaded. \nStarting up discord connection.");
    client.login(config.discord_token);
  });
});

// syncing types table
Types.sync();
