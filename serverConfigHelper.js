const {Collection} = require('discord.js');
const embedHelper = require('./embedHelper.js');
const guilds = new Map();

module.exports = (c, s) => {
  const client = c;
  const Servers = s;
  return {
    addGuild: function(s){
      guilds.set(s.serverID, s);
    },
    removeGuild: function(id){
      if (guilds.has(id)) {
        // delete sever info from DB
        guilds.get(id).destroy();
        // delete sever info from active
        guilds.delete(id);
      }
    },
    addCollector: function(message){
      const filter = (reaction, user) =>{
        if (user.id == embedHelper.getEventCreator(message)) {
          if (reaction.emoji.name == '❌') {
            this.sendDeletionPrompt(reaction.message, user.id);
            reaction.remove(user.id).catch(console.log);;
            return false;
          } else {
            if (!serversHasInfoChannel(message.guild.id)) {
              message.reply("Some admins have managed to get bot to this awkward state of having events and no info channel.").then(m => m.delete(60000));
            } else {
              const infoChannel = this.getInfoChannel(message.guild.id);
              switch (reaction.emoji.name) {
                case '📝':
                  sendInfoRequestPrompt(infoChannel, user, `Please enter edits, no prefix needed\n for example: \`--seed 31337\``)
                    .then(userStr => message.edit("", embedHelper.addAttitionalFields(message, userStr)))
                    .catch(console.error);

                  reaction.remove(user.id).catch(console.log);;
                  return false;
                  break;
                case '\u2702': //✂
                  const fields = embedHelper.getEnumeratedUserFields(message);
                  if (fields) {
                    sendInfoRequestPrompt(infoChannel, user, `Please enter numbers what fields you want to remove \n${fields}`)
                      .then(userStr => message.edit("", embedHelper.removeFields(message, userStr)))
                      .catch(console.log);
                  } else {
                    infoChannel.send(user, embedHelper.getFailedCommandMessage(`No field to remove`));
                  }
                  reaction.remove(user.id).catch(console.log);;
                  return false;
                  break;
                case '⏱':
                  sendInfoRequestPrompt(infoChannel, user, `Please enter numbers of seconds for countdown. \n  min 5, max 30 seconds`)
                    .then(userStr => {
                      const t = parseInt(userStr.match(/\d+/), 10);
                      if (5 <= t && t <= 30 ) {
                        startCountdown(infoChannel, t, embedHelper.getParticipants(message));
                      } else {
                        infoChannel.send(embedHelper.getFailedCommandMessage("Value has to be between 5 and 30 seconds."));
                      }
                    }).catch(console.error);
                  reaction.remove(user.id).catch(console.log);;
                  return false;
                  break;
                case '💌':
                case '📧':
                  sendInfoRequestPrompt(infoChannel, user, `Please enter your message.`)
                    .then(userStr => {
                      const participants = embedHelper.getParticipants(message);
                      infoChannel.send(participants, embedHelper.getUserMessage(user.username, participants, userStr, message.url));
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
        this.updateParticipants(reaction.message);
        });
      //collector.on('remove', (reaction, user) => editEventParticipants(reaction)); not a thing in curret API
    },
    isGuildConfigured: function(guildID){
      return guilds.has(guildID) && guilds.get(guildID).infoChannelID && guilds.get(guildID).eventChannelID;
    },
    getParticipationRole: function(guildID){
      if (this.isRoleRequiered(guildID)) {
        return guilds.get(guildID).roleID;
      }
      return null;
    },
    isOrganizationRestricted: function(guildID){
      if (guilds.get(guildID).organizerID) {
        return true;
      }
      return false;
    },
    isRoleRequiered: function(guildID){
      if(guilds.get(guildID).roleID){
        return true;
      }
      return false;
    },
    getEventChannel: function(guildID){
      return client.channels.get(guilds.get(guildID).eventChannelID);
    },
    getEventChannelID: function(guildID){
      return guilds.get(guildID).eventChannelID;
    },
    getInfoChannel: function(guildID){
      return client.channels.get(guilds.get(guildID).infoChannelID);
    },
    getInfoChannelID: function(guildID){
      return guilds.get(guildID).infoChannelID;
    },
    getTypeConfig: function(guildID){
      return guilds.get(guildID).getTypeConfig();
    },
    getGuildObjc: function(guildID){
      return guilds.get(guildID);
    },
    getGuildPrefix: function(guildID) {
      if (guilds.get(guildID)) {
        return guilds.get(guildID).prefix;
      }
      return '!';
    },
    setGuildPrefix: function(guildID, prefix) {
       guilds.get(guildID).prefix = prefix;
       guilds.get(guildID).save();
    },
    updateParticipants: function(message){
      /*
        max of 46 runners = field 1024 chars, one user marker "<@Snowflake> " 22 chars
        using description with 2048 chars (2048 - "**Runners:** )/22 = 92
      */
      Promise.all(message.reactions.map(reaction => reaction.fetchUsers(reaction.count))).then(usersCollectionsArray => {
        const users = usersCollectionsArray.reduce( (accCol, curCol) => accCol.concat(curCol), new Collection());
        Promise.all(users.map(user => message.guild.fetchMember(user.id))).then(members => {
          if (this.isRoleRequiered(message.guild.id)){
            members = members.filter(member => member.roles.has(guilds.get(message.guild.id).roleID));
          }
          const participants = members.reduce((accStr, curStr) => accStr + curStr + " ", "\u200B");
          const uptaded = embedHelper.getUpdatedParticipants(message, participants);
          if (uptaded) {
            message.edit("", uptaded);
          }
        }).catch(console.error);
      }).catch(console.error);
    },
    serverInit: function(server){
      return new Promise((resolve, reject) => {
        // maybe check if thoes are channels we can type in
        Servers
          .findOrCreate({where: { serverID: server.serverID }, defaults: server})
          .spread((serverNew, created) => {
            if (created) {
              this.addGuild(serverNew);
            } else {
              serverNew.update(server).then(updatedServer =>{
                this.addGuild(updatedServer);
              });
            }
            resolve(true);
        });
      });
    },
    isAllowedToHostEvent: function(msg){
      if (this.isGuildConfigured(msg.guild.id)) {
        if (this.isOrganizationRestricted(msg.guild.id)) {
          return msg.member.roles.has(guilds.get(msg.guild.id).organizerID);
        } else if (this.isRoleRequiered(msg.guild.id)) {
          return msg.member.roles.has(guilds.get(msg.guild.id).roleID);
        }
        return true;
      }
      return false;
    },
    inWatchlist: function(msg){
      // maybe make a list of event creat channels
      if (guilds.has(msg.guild.id)) {
        return guilds.get(msg.guild.id).infoChannelID == msg.channel.id;
      }
      return false;
    },
    serversHasEventChannel: function(id){
      if (guilds.has(id)) {
        return (guilds.get(id).eventChannelID !== null);
      }
      return false;
    },
    userReactionConfirm: function(msg, userID){
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
    },
    sendDeletionPrompt: function(message, creatorID){
      message.channel.send("<@"+creatorID+">", embedHelper.getDeletionPrompt(message.url))
      .then(promptMessage => {
        this.userReactionConfirm(promptMessage,creatorID)
        .then(b => {
          if (b) message.delete();
        }).catch(console.error);
      }).catch(console.error);
    },
  }
}

function startCountdown(channel, time, tagged){
  channel.send(tagged,embedHelper.getTimerStartMessage(time));
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

function serversHasInfoChannel(guildID){
  if (guilds.has(guildID)) {
    return (guilds.get(guildID).infoChannelID !== null);
  }
  return false;
}

const sendInfoRequestPrompt = (infoChannel, user, requestSr) => {
  return new Promise((resolve, reject) => {
    infoChannel.send(user, embedHelper.getUserInputPrompt(requestSr)).then( requestMessage =>{
      const filter = m => user.id === m.author.id;
      infoChannel.awaitMessages(filter, { time: 60000, maxMatches: 1, errors: ['time'] })
      .then(messages => {
        const userMessage = messages.first();
        userMessage.reply(embedHelper.getUserInputRecivedConfirmMessage(userMessage.content, requestSr)).then(m => m.delete(60000));
        resolve(userMessage.content);
      })
      .catch((e) => {
        console.log(e);
        infoChannel.send(user, embedHelper.getFailedCommandMessage("Time to enter input is over."));
        reject(Error("Edit window is over."));
      });
    }).catch((e) => {
      console.log(e);
      reject(Error(`It broke: ${e}`));
    });
  });
};
