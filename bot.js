const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');

const { Client, RichEmbed } = require('discord.js');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  // starting up checks
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
              }
            });
          }).catch(console.error);
        }
      }
  });
});

client.on('message', msg => {
  if (msg.content.substring(0, 1) == '!') {
    if (isAllowedToHostRace(msg) && inWatchlist(msg)) {
      let args = msg.content.substring(1).split(' ');
      var cmd = args[0];
      args = args.splice(1);
      switch(cmd) {
        case 'race':
          const embed = new RichEmbed()
            .setColor(0xFF0000)
            .setAuthor("Race created by " +  msg.author.username,  msg.author.displayAvatarURL)
            .setFooter("Race powered by Race Bot", client.user.displayAvatarURL)
            .setTimestamp(new Date);
          let options = msg.content.substring(6).split('--');
          options.forEach(option => {
            console.log(option);
            switch(option.split(' ')[0]) {
              case 'type':
                embed.addField("Race type:", trimOptions(option), true);
              break;
              case 'date':
                embed.addField("Date:", trimOptions(option), true);
              break;
              case 'time':
                embed.addField("Time:", trimOptions(option), true);
              break;
              case 'rules':
                embed.addField("Rules:", trimOptions(option), true);
              break;
              case 'icon':
                embed.setThumbnail(option.substring(5));
              break;
              case 'img':
                embed.setImage(option.substring(4));
              break;
            }
          });
          embed.addField("Runners", '\u200B')
            .addBlankField()
            .addField("React to join the race.", `If have any questions feel free to ask in ${msg.channel} or contact ${msg.author}`);
          try {
            client.channels.get(getEventChannelId(msg)).send(embed)
              .then(message => addCollector(message))
              .catch(console.error);
          } catch (e) {
            msg.reply(e);
          }
        break;
        case 'help':
          msg.reply(new RichEmbed()
            .setColor(0x00FF00)
            .setTitle("Start the command with !race followed by following options:")
            .addField("--type text", "Creates \"Race type:\" field with text")
            .addField("--date text", "Creates \"Date:\" field with text")
            .addField("--time text", "Creates \"Time:\" field with text")
            .addField("--rules text", "Creates \"Rules:\" field with text")
            .addField("--icon url", "Adds corner image")
            .addField("--img url", "Adds central image")
            .addBlankField()
            .addField("Delete", "To delete the race creator has to react with ❌"))
              .then(message => {
                message.delete(60000);
                }
              );
          msg.delete();
        break;
      }
    }
  }
});

function isAllowedToHostRace(msg){
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

function oldMessageCheck(message){
  let embed = new Discord.RichEmbed(message.embeds[0]);
  if (Object.keys(embed.fields).length === 2) {
    message.delete();
  } else {
    checkIfDeleateRequested(message);
    addCollector(message);
    updateRunners(message);
  }
}

function updateRunners(message) {
  /*
    max of 46 runners = field 1024 chars, one user marker "<@Snowflake> " 22 chars
    using description with 2048 chars (2048 - "**Runners:** )/22 = 92
  */
  let embed = new Discord.RichEmbed(message.embeds[0]);
  Promise.all(message.reactions.map(reaction => reaction.fetchUsers()/* 100 max fethced at once */)).then(usersCollectionsArray => {
    const users = usersCollectionsArray.reduce( (accCol, curCol) => accCol.concat(curCol), new Discord.Collection());
    Promise.all(users.map(user => message.guild.fetchMember(user.id))).then(members => {
      if (isRoleRequiered(message.guild.id)){
        members = members.filter(member => member.roles.has(config.servers[message.guild.id].role));
      }
      const runners = members.reduce((accStr, curStr) => accStr + curStr + " ", "\u200B");
      if (embed.fields[Object.keys(embed.fields).length-3].value !== runners) {
        embed.fields[Object.keys(embed.fields).length-3].value = runners;
        message.edit("", embed);
      }
    }).catch(console.error);
  }).catch(console.error);
}

function trimOptions(str){
  return str.substring(5).trim().replace("\\n","\n")
}

function getRaceCreator(message){
  const embed = new Discord.RichEmbed(message.embeds[0]);
  const parts = embed.fields[--Object.keys(embed.fields).length].value.split(' ');
  const userTag = parts[parts.length -1];
  return userTag.substring(2,userTag.length -1);
}

function checkIfDeleateRequested(message){
  if (message.reactions.has('❌')) { // \u274C
    message.reactions.get('❌').fetchUsers().then( users =>{
      const creatorID = getRaceCreator(message);
      const reducer = (user, bool) => bool || user.id == creatorID;
      if(users.reduce(reducer, false)){
        sendDeletionPrompt(message, creatorID);
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
              .then(raceMessage => raceMessage.delete()).catch(console.error); // deleteing the race message
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
    if (reaction.emoji.name === '❌' && user.id == getRaceCreator(message)) {
      sendDeletionPrompt(reaction.message, user.id);
      reaction.remove(user.id);
      return false;
    } // maybe have roll check
    return true;
  }
  const collector = message.createReactionCollector(filter);
  collector.on('collect', reaction => {
    updateRunners(reaction.message);
    });
  //collector.on('remove', (reaction, user) => editEventParticipants(reaction)); not a thing in curret API
}

client.login(config.discord_token);
