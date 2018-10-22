const Discord = require('discord.js');
const Sequelize = require('sequelize');
const config = require('./config.json');
const serversConfig = {};

const client = new Discord.Client();

const { Client, RichEmbed } = require('discord.js');

const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    operatorsAliases: false,
    // SQLite only
    storage: 'database.sqlite',
});

const serversTable = sequelize.define('servers', {
    serverID: {
      type: Sequelize.STRING,
      unique: true,
    },
    eventChannelID: {
      type: Sequelize.STRING
    },
    infoChannelID: {
      type: Sequelize.STRING
    },
    roleID: {
      type: Sequelize.STRING
    },
    type: {
      type: Sequelize.INTEGER,
      defaultValue: 1,
      allowNull: false,
    }
});

const typesTable = sequelize.define('types', {
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.STRING,
    allowNull: false
  },
  authorField: {
    type: Sequelize.STRING,
    defaultValue: "Race created by ",
    allowNull: false
  },
  footer: {
    type: Sequelize.STRING,
    defaultValue: "Race powered by Event Bot",
    allowNull: false
  },
  participants: {
    type: Sequelize.STRING,
    defaultValue: "Runners:",
    allowNull: false
  }
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  // starting up - checks all event channel for event messages
  client.guilds.forEach(guild => {
    if (serversConfig.hasOwnProperty(guild.id)) {
      if(serversConfig[guild.id].eventChannel !== null){
        checkOldMessages(client.channels.get(serversConfig[guild.id].eventChannel));
        }
      }
  });
});

client.on('messageReactionRemove', (reaction, user) => {
  if (serversConfig.hasOwnProperty(reaction.message.guild.id)) {
    if(serversConfig[reaction.message.guild.id].eventChannel !== null){
      if (serversConfig[reaction.message.guild.id].eventChannel == reaction.message.channel.id) {
        if (new Discord.RichEmbed(reaction.message.embeds[0]).fields.length > 2) {
          if(!((['📝','⏱','💌','📧','\u2702'].indexOf(reaction.emoji.name) > -1) && user.id == getEventCreator(reaction.message))) {
            updateParticipants(reaction.message);
          }
        }
      }
    }
  }
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
        console.log(`Generated bot invite link: ${link}`);
        const embed = new RichEmbed()
        .addField("Invite link", link)
        .addField("Bot Demo Server", "https://discord.gg/hur62Tp")
        .addField("Event Bot source code", "https://github.com/akuinu/discord-event-bot")
        msg.reply(embed);
      }).catch(console.error);
    }
  }
  // removing it from cache, we have no use for these
  msg.channel.messages.delete(msg.id);
});

function createEvent(msg) {
  getEventConfig(msg.guild.id).then(eventConfig => {
    const embed = new RichEmbed()
    .setColor(0xFF0000)
    .setAuthor(eventConfig.authorField +  msg.author.username,  msg.author.displayAvatarURL)
    .setFooter(eventConfig.footer, client.user.displayAvatarURL)
    .setTimestamp(new Date);

    embed.createFields(msg.content.substring(6));
    embed.addField(eventConfig.participants, '\u200B')
    .addBlankField()
    .addField("React to join.", `If have any questions feel free to ask in ${msg.channel} or contact ${msg.author}`);
    try {
      client.channels.get(getEventChannelId(msg)).send(embed)
      .then(message => addCollector(message))
      .catch(console.error);
    } catch (e) {
      msg.reply(e);
    }
  });
}

function sendHelp(msg) {
  msg.reply(new RichEmbed()
    .setColor(0x00FF00)
    .setTitle("Start the command with !event followed by following options:")
    .addField("--type text", "Creates \"Event type:\" field with text")
    .addField("--date text", "Creates \"Date:\" field with text")
    .addField("--time text", "Creates \"Time:\" field with text")
    .addField("--rules text", "Creates \"Rules:\" field with text")
    .addField("--colour text", "Set colour one the side with HEX string (\"0xFF0000\" - red by default)")
    .addField("--icon url", "Adds corner image")
    .addField("--img url", "Adds central image")
    .addBlankField()
    .addField("Add Info", "To add another field react event message with 📝\n Then enter command, for example: `--seed 31337`")
    .addField("Message participants", "To send and ping participants - react event message with 💌")
    .addField("Starting clock", "To start a countdown - react event message with ⏱\n Then enter seconds, min 5, max 30 seconds")
    .addField("Remove Field", "To remove field react event message with \u2702 \n Then enter number, for example: `1, 3`")
    .addField("Delete", "To delete the event creator has to react event message with ❌"))
      .then(message => {
        message.delete(60000);
        }
      );
  msg.delete();
}

RichEmbed.prototype.createFields = function(command) {
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
      return msg.member.roles.has(serversConfig[msg.guild.id].role);
    }
    return true;
  }
  return false;
}

function isRoleRequiered(guildID){
  return serversConfig[guildID].role !== null;
}

function inWatchlist(msg){
  if (serversConfig.hasOwnProperty(msg.guild.id)) {
    return serversConfig[msg.guild.id].infoChannel == msg.channel.id;
  }
  return false;
}

// TODO: maybe remove the throw and do proper handeling with null's
function getEventChannelId(msg){
  if (serversConfig.hasOwnProperty(msg.guild.id)) {
    if (serversConfig[msg.guild.id].eventChannel !== null) {
      return serversConfig[msg.guild.id].eventChannel;
    }else {
      throw "No event channel set up!";
    }
  } else {
    // we should never get here
    throw "Something wrong with channel config";
  }
}

function getInfoChannelId(msg){
  if (serversConfig.hasOwnProperty(msg.guild.id)) {
    if (serversConfig[msg.guild.id].infoChannel !== null) {
      return serversConfig[msg.guild.id].infoChannel;
    }else {
      throw "No info channel set up, something wrong with config!";
    }
  } else {
    // we should never get here
    throw "Something wrong with channel config";
  }
}

async function getEventConfig(guildID){
  if (serversConfig.hasOwnProperty(guildID)) {
      const t = await typesTable.findOne({ where: { id: serversConfig[guildID].type }})
      return t.dataValues;
  }
  const d = await typesTable.findOne({ where: { id: 1 }})
  return d.dataValues;
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
        members = members.filter(member => member.roles.has(serversConfig[message.guild.id].role));
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
  message.channel.send("<@"+creatorID+">", new RichEmbed()
    .setColor(0xFFFF00)
    .setTitle("Do you want to delete event?")
    .addField("Link to event:", message.url)
    .addField("React to confirm:", "👍 - Delete \t 👎 - Cancle"))
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
        const messageEmbed = new Discord.RichEmbed()
          .addField("Recived your input of", userMessage.content)
          .addField("Info requested:", requestSr)
          .setTimestamp(new Date)
          .setColor(0x00FF00);
        userMessage.reply(messageEmbed).then(m => m.delete(60000));
        requestMessage.delete();
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
        try {
          const infoChannel = client.channels.get(getInfoChannelId(message));
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
                  const messageEmbed = new Discord.RichEmbed()
                    .addField(`Message from ${user.username}`, participants)
                    .addField("Message:", userStr)
                    .addField("Link to event:", message.url)
                    .setColor(0x00FF00);
                  infoChannel.send(participants, messageEmbed);
                }).catch(console.error);
              reaction.remove(user.id).catch(console.log);;
              return false;
              break;
              reaction.remove(user.id).catch(console.log);;
              return false;
              break;
          }
        } catch (e) {
          message.channel.send(e).then(m => m.delete(60000));
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
    serverID: msg.guild.id
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
  if (serversConfig.hasOwnProperty(server.serverID)) {
    serversTable.update(server, { where: { serverID: server.serverID }} );
  } else {
    serversTable.create(server);
  }
  addToServerConfig(server);
  checkOldMessages(msg.mentions.channels.find(val => val.id === server.eventChannelID));
}

function setInfo(msg) {
  const server = {};
  if (msg.mentions.channels.firstKey() !== undefined) {
    server.infoChannelID = msg.mentions.channels.firstKey();
    serversConfig[msg.guild.id].infoChannel = msg.mentions.channels.firstKey();
    serversTable.update(server, { where: { serverID: msg.guild.id }} ).then(()=>msg.reply("event info channel has been updated"));
  }else{
    msg.reply(`"you need to tag channel to make it work, for example \`!setInfo <channel>\``);
  }
}

function setEvent(msg) {
  const server = {};
  if (msg.mentions.channels.firstKey() !== undefined) {
    server.eventChannelID = msg.mentions.channels.firstKey();
    serversConfig[msg.guild.id].eventChannel = msg.mentions.channels.firstKey();
    serversTable.update(server, { where: { serverID: msg.guild.id }} ).then(()=>msg.reply("event annoucment channel has been updated"));
  }else{
    msg.reply(`"you need to tag channel to make it work, for example \`!setEvent <channel>\``);
  }

}

function removeRole(msg) {
  const server = {roleID : null};
    serversConfig[msg.guild.id].role = null;
  serversTable.update(server, { where: { serverID: msg.guild.id }}).then(()=>msg.reply("role has been updated"));
}

function setRole(msg) {
  const server = {};
  if (msg.mentions.roles.firstKey() !== undefined) {
    server.roleID = msg.mentions.roles.firstKey();
    serversConfig[msg.guild.id].role = msg.mentions.roles.firstKey();
  }else{
    server.roleID = null;
    serversConfig[msg.guild.id].role = null;
  }
  serversTable.update(server, { where: { serverID: msg.guild.id }} ).then(()=>msg.reply("role has been updated"));
}

function setType(msg) {
  const server = {};
  if (msg.content.match(/race/i)) {
    server.type = 2;
    serversConfig[msg.guild.id].type = 2;
    serversTable.update(server, { where: { serverID: msg.guild.id }} ).then(()=>msg.reply("type has been updated"));
  } else if (msg.content.match(/event/i)) {
    server.type = 3;
    serversConfig[msg.guild.id].type = 3;
    serversTable.update(server, { where: { serverID: msg.guild.id }} ).then(()=>msg.reply("type has been updated"));
  } else {
    msg.reply("non vaild type.")
  }
}

function removeBot(msg) {
  msg.reply(new RichEmbed()
    .setColor(0xFF0000)
    .setThumbnail(client.user.displayAvatarURL)
    .setTitle("Do you want to remove Event Bot?")
    // FIXME: add ability for it to work when server not configed
    .addField("Number of active events by Event Bot:", `${msg.guild.channels.get(getEventChannelId(msg)).messages.keyArray().length}`)
    .addField("React to confirm:", "👍 - Remove \t 👎 - Cancle"))
    .then(requestMessage => {
      userReactionConfirm(requestMessage, msg.author.id)
        .then(b => {
          if (b) {
            // deleteing all messages
            Promise.all(msg.guild.channels.get(getEventChannelId(msg)).messages.map(m => m.delete()))
              .then(() => {
                // delete sever info from active
                delete serversConfig[msg.guild.id];
                // delete sever info from DB
                serversTable.destroy({ where: { serverID: msg.guild.id } });
                // last embed message
                msg.channel.send(new RichEmbed()
                  .setColor(0x00FF00)
                  .setThumbnail(client.user.displayAvatarURL)
                  .setTitle("It was fun to be with you, but for now...\nGood Bye!")
                  .addField("If you start to miss me, just whisper me.", "Way to get new bot inivte link."))
                  // leave server
                  .then(()=>msg.guild.leave());

              }).catch(console.error);
          }
    })
  }).catch(console.error);
}

function addToServerConfig(values) {
  serversConfig[values.serverID] = {
    "eventChannel": values.eventChannelID,
    "infoChannel": values.infoChannelID,
    "role": values.roleID,
    "type": values.type
  }
}

console.log(`Starting up the database.`);
serversTable.sync().then(() => {
  console.log("Loading servers config.");
  serversTable.findAll().then(res => {
    res.forEach(s => {
      addToServerConfig(s.dataValues)
    });
    console.log("Servers config loaded. \nStarting up discord connection.");
    client.login(config.discord_token);
  });
});

// syncing types table
typesTable.sync();
