const fs = require('fs');
const Discord = require('discord.js');
const client = new Discord.Client();
const { Servers, Types} = require('./dbObjects');
const embedHelper = require('./embedHelper.js');

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}
const serverConfigHelper = require('./serverConfigHelper.js')(client, Servers);

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	let configuredCount = 0;
	let usersCount = 0;
  // starting up - checks all event channel for event messages
  client.guilds.forEach(guild => {
    if (serverConfigHelper.isGuildConfigured(guild.id)) {
			configuredCount++;
      checkOldMessages(serverConfigHelper.getEventChannel(guild.id));
    }
		usersCount += guild.members.size;
  });
	logToDiscord(embedHelper.getBotStartupMessage(client.guilds.size, configuredCount, usersCount, serverConfigHelper.dbCleanup()));
});

client.on('message', msg => {
  if (!msg.author.bot || process.env.test){
    if (msg.guild){
			let commandName = "";
			const prefix = serverConfigHelper.getGuildPrefix(msg.guild.id);
			if (msg.content.startsWith(prefix)){
        commandName = msg.content.substring(prefix.length).split(' ')[0];
				//msg.content = msg.content.substring(1 + commandName.length);
      } else if (msg.mentions.users.firstKey() == client.user.id) {
				commandName = msg.content.split(' ')[1];
				//msg.content = msg.content.substring(23 + commandName.length);
      }
			const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
			if (command){
				if (command.adminOnly){
					if (msg.member.hasPermission("ADMINISTRATOR")) {
						if (command.initRequiered) {
							if (serverConfigHelper.isGuildConfigured(msg.guild.id)) {
								command.execute(msg, serverConfigHelper);
							} else {
								msg.reply(embedHelper.getInitRequieredMessage());
							}
						} else {
							command.execute(msg, serverConfigHelper);
						}
					}	else {
						// ignore non admins doing admin commands
					}
				} else {
					if (command.initRequiered && serverConfigHelper.isGuildConfigured(msg.guild.id)) {
						if(serverConfigHelper.isAllowedToHostEvent(msg)) {
							if (serverConfigHelper.inWatchlist(msg)) {
								command.execute(msg, serverConfigHelper);
							} else {
								// should we tell people they are in wrong Channel?
							}
						} else {
							// should we tell people they don't have right to host events?
						}
					} else {
						command.execute(msg, serverConfigHelper);
					}
				}
			}
    }else{
			// handleing the DM's
			if (msg.content.startsWith("!demo")){
				client.commands.get("event").execute(msg, serverConfigHelper);
			} else if(msg.content.startsWith("!help")){
				client.commands.get("info").execute(msg, serverConfigHelper);
			} else {
				client.generateInvite(85056)
				.then(link => {
					msg.reply(embedHelper.getInvitesMessage(link));
				}).catch(console.error);
			}
    }
  }
  // removing it from cache, we have no use for these
  msg.channel.messages.delete(msg.id);
});

client.on('messageReactionRemove', (reaction, user) => {
  if (serverConfigHelper.isGuildConfigured(reaction.message.guild.id)) {
    if (serverConfigHelper.getEventChannelID(reaction.message.guild.id) == reaction.message.channel.id) {
      if (embedHelper.isEventMessage(reaction.message)) {
        if(!((['📝','⏱','💌','📧','\u2702'].indexOf(reaction.emoji.name) > -1) && user.id == embedHelper.getEventCreator(reaction.message))) {
          serverConfigHelper.updateParticipants(reaction.message);
        }
      }
    }
  }
});

client.on('guildCreate', guild => {
  if (guild.systemChannel) {
    guild.systemChannel.send(embedHelper.getWelcomeMessage());
  }
	logToDiscord(embedHelper.getGuildJoinMessage(guild));
});

client.on('guildDelete', guild => {
	serverConfigHelper.removeGuild(guild.id);
	logToDiscord(embedHelper.getGuildRemoveMessage(guild))
});

client.on('error', console.error);​

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
  if (embedHelper.isEventMessage(message)) {
		checkIfDeleateRequested(message);
		['📝','⏱','💌','📧','\u2702'].forEach(emote => removeCommandEmote(message, emote));
		serverConfigHelper.addCollector(message);
		serverConfigHelper.updateParticipants(message);
  } else {
		message.delete();
  }
}

function checkIfDeleateRequested(message){
  if (message.reactions.has('❌')) { // \u274C
    message.reactions.get('❌').fetchUsers().then( users =>{
      const creatorID = embedHelper.getEventCreator(message);
      const reducer = (user, bool) => bool || user.id == creatorID;
      if(users.reduce(reducer, false)){
        serverConfigHelper.sendDeletionPrompt(message, creatorID);
        message.reactions.get('❌').remove(creatorID).catch(console.log);;
      }
    }).catch(console.error);
  }
}

function removeCommandEmote(message, emoji){
  if (message.reactions.has(emoji)) {
    message.reactions.get(emoji).fetchUsers().then( users =>{
      const creatorID = embedHelper.getEventCreator(message);
      const reducer = (user, bool) => bool || user.id == creatorID;
      if(users.reduce(reducer, false)){
        message.reactions.get(emoji).remove(creatorID).catch(console.log);;
      }
    }).catch(console.error);
  }
}

function logToDiscord(message){
	client.channels.get(process.env.log).send(message);
}

console.log(`Starting up the database.`);
Servers.sync().then(() => {
  console.log("Loading servers config.");
  Servers.findAll().then(res => {
    res.forEach(s => {
      serverConfigHelper.addGuild(s);
    });
    console.log("Servers config loaded. \nStarting up discord connection.");
		client.login(process.env.TOKEN);
  });
});

// syncing types table
Types.sync();
