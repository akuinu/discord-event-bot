const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');

const { Client, RichEmbed } = require('discord.js');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  // starting up - checks all event channel for race event messages
  client.guilds.forEach(guild => {
    if (config.servers.hasOwnProperty(guild.id)) {
      if(config.servers[guild.id].hasOwnProperty("eventChannel")){
        client.channels.get(config.servers[guild.id].eventChannel).fetchMessages()
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
      }
  });
});

client.on('messageReactionRemove', (reaction, user) => {
    if(!((reaction.emoji.name === '❌' || reaction.emoji.name === '📝' || reaction.emoji.name === '\u2702') && user.id == getEventCreator(reaction.message))) {
      updateParticipants(reaction.message);
    }
});

client.on('message', msg => {
  if (msg.content.startsWith("!") && isAllowedToHostEvent(msg) && inWatchlist(msg)) {
    /*
      // no command uses !command arg1 arg2 ... format
      let args = msg.content.substring(1).split(' ');
      var cmd = args.shift();
    */
    switch(msg.content.substring(1).split(' ')[0]) {
      case 'race': // TODO: add diffrent keyword support: event race raid ejc
        const eventConfig = getEventConfig(msg.guild.id);
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
        break;
      case 'help':
      case 'info':
        msg.reply(new RichEmbed()
          .setColor(0x00FF00)
          .setTitle("Start the command with !race followed by following options:")
          .addField("--type text", "Creates \"Race type:\" field with text")
          .addField("--date text", "Creates \"Date:\" field with text")
          .addField("--time text", "Creates \"Time:\" field with text")
          .addField("--rules text", "Creates \"Rules:\" field with text")
          .addField("--colour text", "Set colour one the side with HEX string (\"0xFF0000\" - red by default)")
          .addField("--icon url", "Adds corner image")
          .addField("--img url", "Adds central image")
          .addBlankField()
          .addField("Add Info", "To add another field react race message with 📝\n Then enter command, for example: `--seed 31337`")
          .addField("Remove Field", "To remove field react race message with \u2702 \n Then enter number, for example: `1, 3`")
          .addField("Delete", "To delete the race creator has to react race message with ❌"))
            .then(message => {
              message.delete(60000);
              }
            );
        msg.delete();
        break;
    }
  }
  // removing it from cache, we have no use for these
  msg.channel.messages.delete(msg.id);
});

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
        this.addField("Rules:", trimOptions(option, 6), true);
      break;
      case 'seed':
        this.addField("Seed:", trimOptions(option), true);
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
  // maybe had other restrictions like not have more than X races active or something
  return hasRightRoll(msg);
}

function hasRightRoll(msg) {
  if (config.servers.hasOwnProperty(msg.guild.id)) {
    if (isRoleRequiered(msg.guild.id)) {
      return msg.member.roles.has(config.servers[msg.guild.id].role);
    }
    return true;
  }
  return false;
}

function isRoleRequiered(guildID){
  return config.servers[guildID].hasOwnProperty("role");
}

function inWatchlist(msg){
  if (config.servers.hasOwnProperty(msg.guild.id)) {
    return config.servers[msg.guild.id].infoChannel == msg.channel.id;
  }
  return false;
}

function getEventChannelId(msg){
  if (config.servers.hasOwnProperty(msg.guild.id)) {
    if (config.servers[msg.guild.id].hasOwnProperty("eventChannel")) {
      return config.servers[msg.guild.id].eventChannel;
    }else {
      throw "No event channel set up!";
    }
  } else {
    // we should never get here
    throw "Something wrong with channel config";
  }
}

function getInfoChannelId(msg){
  if (config.servers.hasOwnProperty(msg.guild.id)) {
    if (config.servers[msg.guild.id].hasOwnProperty("infoChannel")) {
      return config.servers[msg.guild.id].infoChannel;
    }else {
      throw "No info channel set up, something wrong with config!";
    }
  } else {
    // we should never get here
    throw "Something wrong with channel config";
  }
}

function getEventConfig(guildID){
  if (config.servers.hasOwnProperty(guildID)) {
    if (config.servers[guildID].hasOwnProperty("type")) {
      if (config.types.hasOwnProperty(config.servers[guildID].type)) {
        return config.types[config.servers[guildID].type];
      }
    }
  }
  return config.types.default;
}

function oldMessageCheck(message){
  const embed = new Discord.RichEmbed(message.embeds[0]);
  if (embed.fields.length <= 2) {
    message.delete();
  } else {
    checkIfDeleateRequested(message);
    removeEditRequested(message);
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
        members = members.filter(member => member.roles.has(config.servers[message.guild.id].role));
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

function trimOptions(str, n = 5){
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
        message.reactions.get('❌').remove(creatorID);
      }
    }).catch(console.error);
  }
}

function removeEditRequested(message){
  if (message.reactions.has('📝')) {
    message.reactions.get('📝').fetchUsers().then( users =>{
      const creatorID = getEventCreator(message);
      const reducer = (user, bool) => bool || user.id == creatorID;
      if(users.reduce(reducer, false)){
        message.reactions.get('📝').remove(creatorID);
      }
    }).catch(console.error);
  }
}

function sendDeletionPrompt(message, creatorID){
  message.channel.send("<@"+creatorID+">", new RichEmbed()
    .setColor(0xFFFF00)
    .setTitle("Do you want to delete race event?")
    .addField("Race event:", message.url)
    .addField("React to confirm:", "👍 - Delete \t 👎 - Cancle"))
    .then(promptMessage => {
      promptMessage.react('👍').then(() => promptMessage.react('👎'));
      const filter = (reaction, user) => {
          return ['👍', '👎'].includes(reaction.emoji.name) && user.id == creatorID;
      };
      promptMessage.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
        .then(collected => {
          const reaction = collected.first();
          if (reaction.emoji.name === '👍') {
            promptMessage.channel.fetchMessage( // featch race message by id
              new Discord.RichEmbed(promptMessage.embeds[0])  // get embeded text
              .fields[0].value  // first field stores race url field
              .split("/")[6]) // last/7th element in url is message ID
              .then(eventMessage => eventMessage.delete()).catch(console.error); // deleteing the race message
            promptMessage.delete();
          } else {
            promptMessage.delete();
          }
        })
        .catch(collected => {
          promptMessage.delete();
        });
    }).catch(console.error);
}

function addCollector(message){
  const filter = (reaction, user) =>{
    if (user.id == getEventCreator(message)) {
      switch (reaction.emoji.name) {
        case '📝':
          try {
            const infoChannel = client.channels.get(getInfoChannelId(message));
            infoChannel.send(`${user} Please enter edits, no prefix needed:`).then(() => {
              const filter = m => user.id === m.author.id;
              infoChannel.awaitMessages(filter, { time: 60000, maxMatches: 1, errors: ['time'] })
                .then(m => {
                  addAttitionalFields(message, m.first().content);
                })
                .catch((e) => {
                  console.log(e);
                  infoChannel.send('Edit window is over.');
                });
              });
          } catch (e) {
            message.channel.send(e).then(m => m.delete(60000));
          }
          reaction.remove(user.id);
          return false;
          break;
        case '\u2702': //✂
          try {
            const infoChannel = client.channels.get(getInfoChannelId(message));
            const embed = new Discord.RichEmbed(message.embeds[0]);
            let fields = "";
            if (embed.fields.length -3 > 0) {
              for (var i = 0; i < embed.fields.length -3; i++) {
                fields += `${i + 1} - ${embed.fields[i].name} \n`;
              }
              infoChannel.send(`${user} Please enter numbers what fields you want to remove \n ${fields}`).then(() => {
                const filter = m => user.id === m.author.id;
                infoChannel.awaitMessages(filter, { time: 60000, maxMatches: 1, errors: ['time'] })
                  .then(m => {
                    removeFields(message, m.first().content);
                  })
                  .catch((e) => {
                    console.log(e);
                    infoChannel.send('Edit window is over.');
                  });
                });
            } else {
              infoChannel.send(`${user} no field to remove`);
            }

          } catch (e) {
            message.channel.send("error: " + e).then(m => m.delete(60000));
          }
          reaction.remove(user.id);
          return false;
          break;
        case '❌':
          sendDeletionPrompt(reaction.message, user.id);
          reaction.remove(user.id);
          return false;
          break;
      }
    } //
    return true;
  }
  const collector = message.createReactionCollector(filter);
  collector.on('collect', reaction => {
    updateParticipants(reaction.message);
    });
  //collector.on('remove', (reaction, user) => editEventParticipants(reaction)); not a thing in curret API
}

client.login(config.discord_token);
