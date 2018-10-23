const Discord = require('discord.js');
const client = new Discord.Client();
const { Servers, Types} = require('./dbObjects');
const config = require('./config.json');
const embedMessage = require('./embedMessage.js');

const serversConfig = {};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  // starting up - checks all event channel for event messages
  client.guilds.forEach(guild => {
    if (serversConfig.hasOwnProperty(guild.id)) {
      if(serversConfig[guild.id].dataValues.eventChannelID !== null){
        checkOldMessages(client.channels.get(serversConfig[guild.id].dataValues.eventChannelID));
        }
      }
  });
});

client.on('message', msg => {
  if (!msg.author.bot){
    if (msg.guild){
      if (msg.content.startsWith("!")){
        const command = msg.content.substring(1).split(' ')[0];
        /*
        // no command uses !command arg1 arg2 ... format
        let args = msg.content.substring(1).split(' ');
        var cmd = args.shift();
        */
        // TODO: add proper keyword support
        if (msg.member.hasPermission("ADMINISTRATOR")) {
          if (command == 'init'){
            initServerConfig(msg);
          } else if (command == 'removeBot'){
            // one does not need to set up bot to have right to remove it with commands
            removeBot(msg);
          } else {
            if (serversConfig.hasOwnProperty(msg.guild.id)) {
              switch(command) {
                case 'setRole':     setRole(msg);           break;
                case 'removeRole':  removeRole(msg);        break;
                case 'setType':     setType(msg);           break;
                case 'setInfo':     setInfo(msg);           break;
                case 'setEvent':    setEvent(msg);          break;
              }
            } else {
              msg.reply("Use !init, can't change if noting has yet set up.\nExample: `!init <info Channel> <event Channel>`");
            }
          }
        }
        if(isAllowedToHostEvent(msg) && inWatchlist(msg)) {
          switch(command) {
            // TODO: add proper keyword support
            case 'event':
            case 'race':
            case 'raid':
            createEvent(msg);
            break;
            case 'help':
            case 'info':
            sendHelp(msg);
            break;
          }
        }
      }
    }else{
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
  if (serversConfig.hasOwnProperty(reaction.message.guild.id)) {
    if(serversConfig[reaction.message.guild.id].dataValues.eventChannelID !== null){
      if (serversConfig[reaction.message.guild.id].dataValues.eventChannelID == reaction.message.channel.id) {
        if (new Discord.RichEmbed(reaction.message.embeds[0]).fields.length > 2) {
          if(!((['📝','⏱','💌','📧','\u2702'].indexOf(reaction.emoji.name) > -1) && user.id == getEventCreator(reaction.message))) {
            updateParticipants(reaction.message);
          }
        }
      }
    }
  }
});

client.on('guildCreate', guild => {
  if (guild.systemChannel) {
    guild.systemChannel.send(embedMessage.welcome(client.user.displayAvatarURL));
  }
});

client.on('guildDelete', guild => {
  forgetGuild(guild.id);
});

function createEvent(msg) {
  serversConfig[msg.guild.id].getTypeConfig().then(eventConfig => {
    eventConfig = eventConfig[0];
    const embed = new Discord.RichEmbed()
      .setColor(0xFF0000)
      .setAuthor(eventConfig.authorField +  msg.author.username,  msg.author.displayAvatarURL)
      .setFooter(eventConfig.footer, client.user.displayAvatarURL)
      .setTimestamp(new Date);

    embed.createFields(msg.content.substring(6));
    embed.addField(eventConfig.participants, '\u200B')
    .addBlankField()
    .addField("React to join.", `If have any questions feel free to ask in ${msg.channel} or contact ${msg.author}`);
    if (serversHaseventChannelID(msg)) {
      geteventChannelID(msg).send(embed)
      .then(message => addCollector(message))
      .catch(console.error);
    } else {
      msg.reply("No event channel set up. Can not make event.");
    }
  });
}

function sendHelp(msg) {
  msg.reply(embedMessage.help())
    .then(message => {
      message.delete(60000);
      }
    );
}

Discord.RichEmbed.prototype.createFields = function(command) {
  const options = command.split('--');
  options.forEach(option => {
    const args = option.split(' ');
    switch(args.shift()) {
      case 'type':
        this.addField("Race type:", trimOptions(option), true);
      break;
      case 'date':
        this.addField("Date:", trimOptions(option), true);
      break;
      case 'time':
        this.addField("Time:", trimOptions(option), true);
      break;
      case 'rules':
        this.addField("Rules:", trimOptions(option), true);
      break;
      case 'seed':
        this.addField("Seed:", trimOptions(option), true);
      break;
      case 'location':
        this.addField("Location:", trimOptions(option), true);
      break;
      case 'icon':
        this.setThumbnail(args.shift());
      break;
      case 'img':
        this.setImage(args.shift());
      break;
      case 'color':
      case 'colour': // fall through
        this.setColor(args.shift());
      break;
    }
  });
};

function isAllowedToHostEvent(msg){
  // maybe had other restrictions like not have more than X events active or something
  return hasRightRoll(msg);
}

function hasRightRoll(msg) {
  if (serversConfig.hasOwnProperty(msg.guild.id)) {
    if (isRoleRequiered(msg.guild.id)) {
      return msg.member.roles.has(serversConfig[msg.guild.id].dataValues.roleID);
    }
    return true;
  }
  return false;
}

function isRoleRequiered(guildID){
  return serversConfig[guildID].dataValues.roleID !== null;
}

function inWatchlist(msg){
  if (serversConfig.hasOwnProperty(msg.guild.id)) {
    return serversConfig[msg.guild.id].dataValues.infoChannelID == msg.channel.id;
  }
  return false;
}

function geteventChannelID(msg){
  return client.channels.get(serversConfig[msg.guild.id].dataValues.eventChannelID);
}

function serversHaseventChannelID(msg) {
  if (serversConfig.hasOwnProperty(msg.guild.id)) {
    return (serversConfig[msg.guild.id].dataValues.eventChannelID !== null);
  }
  return false;
}

function getinfoChannel(msg){
  return client.channels.get(serversConfig[msg.guild.id].dataValues.infoChannelID);
}

function serversHasinfoChannel(msg) {
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
  const embed = new Discord.RichEmbed(message.embeds[0]);
  if (embed.fields.length <= 2) {
    message.delete();
  } else {
    checkIfDeleateRequested(message);
    ['📝','⏱','💌','📧','\u2702'].forEach(emote => removeCommandEmote(message, emote));
    addCollector(message);
    updateParticipants(message);
  }
}

function updateParticipants(message) {
  /*
    max of 46 runners = field 1024 chars, one user marker "<@Snowflake> " 22 chars
    using description with 2048 chars (2048 - "**Runners:** )/22 = 92
  */
  const embed = new Discord.RichEmbed(message.embeds[0]);
  Promise.all(message.reactions.map(reaction => reaction.fetchUsers(reaction.count))).then(usersCollectionsArray => {
    const users = usersCollectionsArray.reduce( (accCol, curCol) => accCol.concat(curCol), new Discord.Collection());
    Promise.all(users.map(user => message.guild.fetchMember(user.id))).then(members => {
      if (isRoleRequiered(message.guild.id)){
        members = members.filter(member => member.roles.has(serversConfig[message.guild.id].dataValues.roleID));
      }
      const participants = members.reduce((accStr, curStr) => accStr + curStr + " ", "\u200B");
      if (embed.fields[embed.fields.length-3].value !== participants) {
        embed.fields[embed.fields.length-3].value = participants;
        message.edit("", embed);
      }
    }).catch(console.error);
  }).catch(console.error);
}

function addAttitionalFields(message, text) {
  const embed = new Discord.RichEmbed(message.embeds[0]);
  const tempEmbedFields = embed.fields.splice(embed.fields.length-3, 3);
  embed.createFields(text);
  while (tempEmbedFields.length > 0) {
    embed.fields.splice(embed.fields.length, 0,  tempEmbedFields.shift());
  }
  message.edit("", embed);
}

function removeFields(message, text) {
  const embed = new Discord.RichEmbed(message.embeds[0]);
  let remouvals = text.split(/,?\s+/).map(function(item) {return parseInt(item, 10) - 1;});
  remouvals = [...new Set(remouvals)];
  remouvals.sort((a, b) => a - b);
  if (remouvals[0] >= 0 && remouvals[remouvals.length-1] <  embed.fields.length - 3) {
    for (var i = 0; i < remouvals.length; i++) {
      embed.fields.splice(remouvals[i]-i, 1);
    }
    message.edit("", embed);
  }
}

function trimOptions(str){
  const n = str.split(" ")[0].length;
  return str.substring(n).trim().replace("\\n","\n")
}

function getEventCreator(message){
  const embed = new Discord.RichEmbed(message.embeds[0]);
  const parts = embed.fields[embed.fields.length-1].value.split(' ');
  const userTag = parts[parts.length -1];
  return userTag.substring(2,userTag.length -1);
}

function checkIfDeleateRequested(message){
  if (message.reactions.has('❌')) { // \u274C
    message.reactions.get('❌').fetchUsers().then( users =>{
      const creatorID = getEventCreator(message);
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
      const creatorID = getEventCreator(message);
      const reducer = (user, bool) => bool || user.id == creatorID;
      if(users.reduce(reducer, false)){
        message.reactions.get(emoji).remove(creatorID).catch(console.log);;
      }
    }).catch(console.error);
  }
}

const userReactionConfirm = (msg, userID) => {
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
      userReactionConfirm(promptMessage,creatorID)
        .then(b => {
          if (b) {
            message.delete();
          } else {
            message.reactions.get('❌').remove(creatorID).catch(console.log);
          }
        }).catch(console.error);
    }).catch(console.error);
}

function startCountdown(channel, time, tagged){
  channel.send(`${tagged}\n Countdown has started for ${time}seconds`);
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
    infoChannel.send(`${user} ${requestSr}`).then( requestMessage =>{
      const filter = m => user.id === m.author.id;
      infoChannel.awaitMessages(filter, { time: 60000, maxMatches: 1, errors: ['time'] })
      .then(messages => {
        const userMessage = messages.first();
        userMessage.reply(embedMessage.userInputRecived(userMessage.content, requestSr)).then(m => m.delete(60000));
        resolve(userMessage.content);
      })
      .catch((e) => {
        console.log(e);
        infoChannel.send("Edit window is over.");
        reject(Error("Edit window is over."));
      });
    }).catch((e) => {
      console.log(e);
      reject(Error(`It broke: ${e}`));
    });

  });
};

function addCollector(message){
  const filter = (reaction, user) =>{
    if (user.id == getEventCreator(message)) {
      if (reaction.emoji.name == '❌') {
        sendDeletionPrompt(reaction.message, user.id);
        reaction.remove(user.id).catch(console.log);;
        return false;
      } else {
        if (!serversHasinfoChannel(message)) {
          message.reply("Some admins have managed to get bot to this awkward state of having events and no info channel.").then(m => m.delete(60000));
        } else {
          const infoChannel = getinfoChannel(message);
          switch (reaction.emoji.name) {
            case '📝':
              sendInfoRequestPrompt(infoChannel, user, `Please enter edits, no prefix needed\n for example: \`--seed 31337\``)
                .then(userStr => addAttitionalFields(message, userStr))
                .catch(console.error);

              reaction.remove(user.id).catch(console.log);;
              return false;
              break;
            case '\u2702': //✂
              const embed = new Discord.RichEmbed(message.embeds[0]);
              let fields = "";
              if (embed.fields.length -3 > 0) {
                for (var i = 0; i < embed.fields.length -3; i++) {
                  fields += `${i + 1} - ${embed.fields[i].name} \n`;
                }
                sendInfoRequestPrompt(infoChannel, user, `Please enter numbers what fields you want to remove \n${fields}`)
                  .then(userStr => removeFields(message, userStr))
                  .catch((e) => {
                    console.log(e);
                  });
              } else {
                infoChannel.send(`${user} no field to remove`);
              }
              reaction.remove(user.id).catch(console.log);;
              return false;
              break;
            case '⏱':
              sendInfoRequestPrompt(infoChannel, user, `Please enter numbers of seconds for countdown. \n  min 5, max 30 seconds`)
                .then(userStr => {
                  const t = parseInt(userStr.match(/\d+/), 10);
                  if (5 <= t && t <= 30 ) {
                    const embed = new Discord.RichEmbed(message.embeds[0]);
                    const participants = embed.fields[embed.fields.length-3].value
                    startCountdown(infoChannel, t, participants);
                  } else {
                    infoChannel.send("Value has to be between 5 and 30 seconds.")
                  }
                }).catch(console.error);
              reaction.remove(user.id).catch(console.log);;
              return false;
              break;
            case '💌':
            case '📧':
              sendInfoRequestPrompt(infoChannel, user, `Please enter your message.`)
                .then(userStr => {
                  const embed = new Discord.RichEmbed(message.embeds[0]);
                  const participants = embed.fields[embed.fields.length-3].value
                  infoChannel.send(participants, embedMessage.userMessage(user.username, participants, userStr, message.url));
                }).catch(console.error);
              reaction.remove(user.id).catch(console.log);;
              return false;
              break;
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
    updateParticipants(reaction.message);
    });
  //collector.on('remove', (reaction, user) => editEventParticipants(reaction)); not a thing in curret API
}

function initServerConfig(msg) {
  const server = {
    serverID: msg.guild.id,
    type: 1
  }
  const channelKeys = msg.mentions.channels.firstKey(2);
  if (channelKeys.length == 2) {
    server.infoChannelID = channelKeys[0];
    server.eventChannelID = channelKeys[1];
  }
  if (msg.mentions.roles.firstKey() !== undefined) {
    server.roleID = msg.mentions.roles.firstKey();
  }
  if (msg.content.match(/race/i)) {
    server.type = 2;
  } else if (msg.content.match(/event/i)) {
    server.type = 3;
  }
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
  });
}

function setInfo(msg) {
  if (msg.mentions.channels.firstKey() !== undefined) {
    serversConfig[msg.guild.id].infoChannelID = msg.mentions.channels.firstKey();
    serversConfig[msg.guild.id].save().then(()=>msg.reply("event annoucment channel has been updated"));
  }else{
    msg.reply(`"you need to tag channel to make it work, for example \`!setEvent <channel>\``);
  }
}

function setEvent(msg) {
  if (msg.mentions.channels.firstKey() !== undefined) {
    serversConfig[msg.guild.id].eventChannelID = msg.mentions.channels.firstKey();
    serversConfig[msg.guild.id].save().then(()=>msg.reply("event annoucment channel has been updated"));
  }else{
    msg.reply(`"you need to tag channel to make it work, for example \`!setEvent <channel>\``);
  }
}

function removeRole(msg) {
  serversConfig[msg.guild.id].roleID = null;
  serversConfig[msg.guild.id].save().then(()=>msg.reply("role has been updated"));
}

function setRole(msg) {
  serversConfig[msg.guild.id].roleID = (msg.mentions.roles.firstKey() !== undefined) ? msg.mentions.roles.firstKey() : null;
  serversConfig[msg.guild.id].save().then(()=>msg.reply("role has been updated"));
}

function setType(msg) {
  if (msg.content.match(/race/i)) {
    server.type = 2;
    serversConfig[msg.guild.id].type = 2;
    serversConfig[msg.guild.id].save().then(()=>msg.reply("type has been updated"));
  } else if (msg.content.match(/event/i)) {
    serversConfig[msg.guild.id].dataValues.type = 3;
    serversConfig[msg.guild.id].save().then(()=>msg.reply("type has been updated"));
  } else {
    msg.reply("non vaild type.")
  }
}

function removeBot(msg) {
  let events = -1;
  if (serversHaseventChannelID(msg)) {
    events = geteventChannelID(msg).messages.keyArray().lengt;
  }
  msg.reply(embedMessage.removeBot(events,client.user.displayAvatarURL))
    .then(requestMessage => {
      userReactionConfirm(requestMessage, msg.author.id)
        .then(b => {
          if (b) {
            const leaveServer = () => {
              forgetGuild(msg.guild.id);
              // last embed message
              msg.channel.send(embedMessage.goodbye(client.user.displayAvatarURL))
                // leave server
                .then(()=>msg.guild.leave());
            }
            if (serversHaseventChannelID(msg)) {
              // deleteing all messages
              Promise.all(geteventChannelID(msg).messages.map(m => m.delete()))
              .then(() => leaveServer()).catch(console.error);
            } else {
              leaveServer();
            }
          }
    });
  }).catch(console.error);
}

function forgetGuild(guildID){
  // delete sever info from DB
  serversConfig[guildID].destroy();
  // delete sever info from active
  delete serversConfig[guildID];
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
