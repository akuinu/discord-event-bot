//  deals with all the discord.RichEmbed messages
// ========
const {RichEmbed} = require('discord.js');
module.exports = {
  getWelcomeMessage: (prefix = "!") => {
    const embed = new RichEmbed()
      .setColor(0x00FF00)
      .setTitle("Hello people, \nI am Event Bot, I help you to host community events.")
      .addField("Setting up: "+ prefix +"init <event info channel> <event annoucment channel> <role>",
        "**<event info channel>** - channel where I will listen for commands and You plan your events\n"+
        "**<event annoucment channel>** - channel where I post events- I would be happy if there would be to have message edit permssion in that channel, but I can without it.\n"+
        "**<role>** - role of people that can host and take part of events")
      .addBlankField()
      .addField("More commands info:", ""+ prefix +"info");
    embed.setOurStuff();
    return embed;
  },
  getGoodbyeMessage: () => {
    const embed = new RichEmbed()
      .setColor(0x00FF00)
      .setTitle("It was fun to be with you, but for now...\nGood Bye!")
      .addField("If you start to miss me, just whisper me.", "Way to get new bot inivte link.");
    embed.setOurStuff();
    return embed;
  },
  getHelpMessage: (prefix = "!", admin = false) => {
    const embed = new RichEmbed()
      .setColor(0x00FF00)
      .setTitle("How to use Event Bot")
      .addField("Creating event message:",
        `Start the command with \`${prefix}event\` followed by following options:\n`
        + "**--date text** - Creates \"Date:\" field with text\n"
        + "**--type text** - Creates \"Event type:\" field with text\n"
        + "**--time text** - ឵Creates \"Time:\" field with text\n"
        + "**--rules text** - Creates \"Rules:\" field with text\n"
        + "**--seed text** - Creates \"Seed:\" field with text\n"
        + "**--colour text** - Set colour one the side with HEX string (\"0xFF0000\" - red by default)\n"
        + "**--icon url** - Adds corner image\n"
        + "**--img url** - Adds central image")
      .addField("Event message functions:\nAdd Info", "To add another field react event message with 📝\n Then enter command, for example: `--seed 31337`")
      .addField("Message participants", "To send and ping participants - react event message with 💌")
      .addField("Starting clock", "To start a countdown - react event message with ⏱\n Then enter seconds, min 5, max 30 seconds")
      .addField("Remove Field", "To remove field react event message with \u2702 \n Then enter number, for example: `1, 3`")
      .addField("Delete", "To delete the event creator has to react event message with ❌");
    if (admin) {
      embed.addBlankField()
      .addField("Setting up:", `\`${prefix}init <event info channel> <event annoucment channel> <role>\`\n`+
        "**<event info channel>** - channel where I will listen for commands and You plan your events\n"+
        "**<event annoucment channel>** - channel where I post events- I would be happy if there would be to have message edit permssion in that channel, but I can without it.\n"+
        "**<role>** - role of people that can host and take part of events")
      .addField("Change info channel", "`"+ prefix +"setInfo <channel>`")
      .addField("Change event channel", "`"+ prefix +"setEvent <channel>`")
      .addField("Change requiered participants role", "`"+ prefix +"setRole <role>`")
      .addField("Remove requiered participants role", "`"+ prefix +"removeRole`")
      .addField("Change requiered organizers role", "`"+ prefix +"setOrganizer <role>`")
      .addField("Remove requiered organizers role", "`"+ prefix +"removeOrganizer`")
      .addField("Change Event Bot prefix", "`"+ prefix +"<newPrefix>`")
      .addField("Remove Event Bot", "`"+ prefix +"removeBot`")
    }
    embed.setOurFooter();
    return embed;
  },
  getInvitesMessage: (link) => {
    const embed = new RichEmbed()
      .addField("Invite link", `[Invite Link](${link})`)
      .addField("Bot Demo Server", "https://discord.gg/hur62Tp")
      .addField("Event Bot source code", "https://github.com/akuinu/discord-event-bot")
      .addBlankField()
      .addField("Commands in DM's:", "`!help` - list of commands\n`!demo` - to test event messages apparance")
      .setColor(0x00FF00);
    embed.setOurStuff();
    return embed;
  },
  getDeletionPrompt: (url) => {
    const embed = new RichEmbed()
      .setColor(0xFFFF00)
      .setTitle("Do you want to delete event?")
      .addField("Link to event:", url)
      .addField("React to confirm:", "👍 - Delete \t 👎 - Cancle");
    embed.setOurStuff();
    return embed;
  },
  getBotRemoveConfirmMessage: (events) => {
    const embed = new RichEmbed()
      .setColor(0xFF0000)
      .setTitle("Do you want to remove Event Bot?");
    if (events !== -1) {
      embed.addField("Number of active events by Event Bot:", `${events}`)
    }
    embed.addField("React to confirm:", "👍 - Remove \t 👎 - Cancle");
    embed.setOurStuff();
    return embed;
  },
  getEventChannelMoveConfirmMessage: (events) => {
    const embed = new RichEmbed()
      .setColor(0xFFFF00)
      .setTitle("Do you want to move Event Channel?");
    embed.addField("Number of active that will be deleted:", `${events}`)
    embed.addField("React to confirm:", "👍 - Remove \t 👎 - Cancle");
    embed.setOurStuff();
    return embed;
  },
  getUserInputRecivedConfirmMessage: (userStr, requestSr) => {
    const embed = new RichEmbed()
      .addField("Recived your input of", userStr)
      .addField("Info requested:", requestSr)
      .setTimestamp(new Date)
      .setColor(0x00FF00);
    embed.setOurStuff();
    return embed;
  },
  getUserMessage: (username, participants, userStr, url) => {
    const embed = new RichEmbed()
      .addField(`Message from ${username}`, participants)
      .addField("Message:", userStr)
      .addField("Link to event:", url)
      .setColor(0x00FF00);
    embed.setOurStuff();
    return embed;
  },
  getEventMessage: (msg, eventConfig) => {
    const embed = new RichEmbed()
      .setColor(0xFF0000)
      .setAuthor(eventConfig.authorField +  msg.author.username,  msg.author.displayAvatarURL);
    embed.createFields(msg.content);
    embed.addField(eventConfig.participants, '\u200B')
      .addBlankField()
      .addField("React to join.", `If have any questions feel free to ask in ${msg.channel} or contact ${msg.author}`);
    embed.setOurFooter();
    return embed;
  },
  addAttitionalFields: (message, text) => {
    const embed = new RichEmbed(message.embeds[0]);
    const tempEmbedFields = embed.fields.splice(embed.fields.length-3, 3);
    embed.createFields(text);
    while (tempEmbedFields.length > 0) {
      embed.fields.splice(embed.fields.length, 0,  tempEmbedFields.shift());
    }
    return embed;
  },
  getEventCreator: (message) => {
    const embed = new RichEmbed(message.embeds[0]);
    const userTag = embed.fields[embed.fields.length-1].value.split(' ').pop();
    return userTag.substring(2,userTag.length -1);
  },
  removeFields: (message, text) => {
    const embed = new RichEmbed(message.embeds[0]);
    let remouvals = text.split(/,?\s+/).map(function(item) {return parseInt(item, 10) - 1;});
    remouvals = [...new Set(remouvals)];
    remouvals.sort((a, b) => a - b);
    if (remouvals[0] >= 0 && remouvals[remouvals.length-1] <  embed.fields.length - 3) {
      for (var i = 0; i < remouvals.length; i++) {
        embed.fields.splice(remouvals[i]-i, 1);
      }
    }
    return embed;
  },
  isEventMessage: (message) => {
    const embed = new RichEmbed(message.embeds[0]);
    return (embed.fields.length > 2);
  },
  getUpdatedParticipants: (message, participants) => {
    const embed = new RichEmbed(message.embeds[0]);
    if (embed.fields[embed.fields.length-3].value !== participants) {
      embed.fields[embed.fields.length-3].value = participants;
      return embed;
    }
    return null;
  },
  getParticipants: (message) => {
    const embed = new RichEmbed(message.embeds[0]);
    return embed.fields[embed.fields.length-3].value;
  },
  getEnumeratedUserFields: (message) => {
    const embed = new RichEmbed(message.embeds[0]);
    let fields = "";
    if (embed.fields.length -3 > 0) {
      for (var i = 0; i < embed.fields.length -3; i++) {
        fields += `${i + 1} - ${embed.fields[i].name} \n`;
      }
      return fields;
    }
    return null;
  },
  getServerInitMessage: (server, configured) => {
    const embed = new RichEmbed();
    if (server.infoChannelID) {
      embed.addField("Info channel has been set:", `<#${server.infoChannelID}>`)
    }
    if (server.eventChannelID) {
      embed.addField("Event channel has been set:", `<#${server.eventChannelID}>`)
    }
    if (server.roleID) {
      embed.addField("Roll requiered to host event:", `<@&${server.roleID}>`)
    }
    if (configured) {
      embed.setTitle("Event Bot has been set up for this server.")
        .setColor("0x00FF00");
    }else{
      embed.setTitle("Event Bot has been partially configured!")
        .setColor("0xFFFF00");
    }
    embed.setOurStuff();
    return embed;
  },
  getServerConfigMessage: (server) => {
    const embed = new RichEmbed()
      .setColor(0x00FF00)
      .setTitle("Events Bot config is following:")
      .addField("Info Channel:",server.infoChannelID?`<#${server.infoChannelID}>`:"Not set up")
      .addField("Event Channel:",server.eventChannelID?`<#${server.eventChannelID}>`:"Not set up")
      .addField("Participation restriction:",server.roleID?`Only <@&${server.roleID}> can join events`:"Everybody can join events")
      .addField("Organizer restriction:", server.organizerID ?`Only <@&${server.organizerID}> can host events`:(server.roleID?`Only <@&${server.roleID}> can host events`:"Everybody can creat events"))

    embed.setOurStuff();
    return embed;
  },
  getSetEventMessage: (id) => {
    const embed = new RichEmbed()
      .setColor("0x00FF00")
      .setTitle("Event Bot settings have been changed.")
      .addField("Event channel has been set:", `<#${id}>`);
    embed.setOurStuff();
    return embed;
  },
  getSetInfoMessage: (id) => {
    const embed = new RichEmbed()
      .setColor("0x00FF00")
      .setTitle("Event Bot settings have been changed.")
      .addField("Info channel has been set:", `<#${id}>`);
    embed.setOurStuff();
    return embed;
  },
  getSetOrganizerMessage: (id) => {
    const embed = new RichEmbed()
      .setColor("0x00FF00")
      .setTitle("Event Bot settings have been changed.")
      .addField("Role requiered to host event:", `<@&${id}>`);
    embed.setOurStuff();
    return embed;
  },
  getRemoveOrganizerMessage: (id) => {
    const embed = new RichEmbed()
      .setColor("0x00FF00")
      .setTitle("Event Bot settings have been changed.");
    if (id) {
      embed.addField("Organizers restriction removed. All allowed participants can now also host events:", `<@&${id}>`);
    } else {
      embed.addField("Role requiered to host event has been removed:", `yay, free for all`);
    }
    embed.setOurStuff();
    return embed;
  },
  getSetRoleMessage: (id, b) => {
    const embed = new RichEmbed()
      .setColor("0x00FF00")
      .setTitle("Event Bot settings have been changed.");
    if (b) {
      embed.addField("Role requiered to participate in events:", `<@&${id}>`);
    } else {
      embed.addField("Role requiered to **host** and participate in events:", `<@&${id}>`);
    }
    embed.setOurStuff();
    return embed;
  },
  getRemoveRoleMessage: (b) => {
    const embed = new RichEmbed()
      .setColor("0x00FF00")
      .setTitle("Event Bot settings have been changed.");
    if (b) {
      embed.addField("Role requiered to participate in event has been removed:", `yay, everybody can join in the fun!`);
    } else {
      embed.addField("Role requiered to **host** and participate event has been removed:", `yay, everybody can make the fun happen!`);
    }
    embed.setOurStuff();
    return embed;
  },
  getFailedCommandMessage: (problem) => {
    const embed = new RichEmbed()
      .setColor("0xFF0000")
      .setTitle("Event Bot can't act on invalid input.")
      .addField("Problem:", problem);
    embed.setOurStuff();
    return embed;
  },
  getUserInputPrompt: (requestSr) => {
    const embed = new RichEmbed()
      .setColor("0x00FF00")
      .setTitle(requestSr);
    embed.setOurStuff();
    return embed;
  },
  getInitRequieredMessage: () => {
    const embed = new RichEmbed()
      .setColor("0xFFFF00")
      .setTitle("Event Bot can't act if no instructions have been given.")
      .addField("Setting up: !init <event info channel> <event annoucment channel> <role>",
        "**<event info channel>** - channel where I will listen for commands and You plan your events\n"+
        "**<event annoucment channel>** - channel where I post events- I would be happy if there would be to have message edit permssion in that channel, but I can without it.\n"+
        "**<role>** - role of people that can host and take part of events")
      .addField("For example:","!init #race-discussions #race-announcments  @runners");
    embed.setOurStuff();
    return embed;
  },
  getTimerStartMessage: (time) => {
    const embed = new RichEmbed()
      .setColor("0x00FF00")
      .setTitle(`Countdown started for ${time} seconds`);
    embed.setOurStuff();
    return embed;
  },
  getCurrentPrefixMessage: (prefix) => {
    const embed = new RichEmbed()
      .setColor("0x00FF00")
      .setTitle(`Current prefix for Event Bot is \`${prefix}\``)
      .addField(`Also other commands work with \`@Event Bot <command>\``, "Who has time to remember what bot uses what command prefix.");
    embed.setOurStuff();
    return embed;
  },
  getPrefixSetMessage: (prefix) => {
    const embed = new RichEmbed()
      .setColor("0x00FF00")
      .setTitle(`Current prefix for Event Bot is set to \`${prefix}\``)
      .addField(`Also other commands work with \`@Event Bot <command>\``, "Who has time to remember what bot uses what command prefix.");
    embed.setOurStuff();
    return embed;
  },
  getGuildJoinMessage: (guild) => {
    const embed = new RichEmbed()
      .setColor("0x00FF00")
      .setTitle(`Guild added.`)
      .setThumbnail(guild.iconURL)
      .setTimestamp(new Date)
      .addField(`${guild.name}`, `Members: ${guild.memberCount}\nChannels: ${guild.channels.size}`);
    return embed;
  },
  getGuildRemoveMessage: (guild) => {
    const embed = new RichEmbed()
      .setColor("0xFF0000")
      .setThumbnail(guild.iconURL)
      .setTimestamp(new Date)
      .setTitle(`Guild removed.`)
      .addField(`${guild.name}`, `Members: ${guild.memberCount}\nChannels: ${guild.channels.size}\nJoined: ${guild.joinedTimestamp}`);
    return embed;
  },
  getBotStartupMessage: (guildsCount, configured, usersCount, ambandoned) => {
    const embed = new RichEmbed()
      .setColor("0x00FF00")
      .setTitle(`Bot has started up.`)
      .setTimestamp(new Date)
      .addField(`Stats:`, `Guilds: ${guildsCount} (${configured}/${guildsCount})\n` +
        `Members sum: ${usersCount}\n` + //includes duplicates
        `Guilds that left during downtime: ${ambandoned}`);
    return embed;
  },
};

RichEmbed.prototype.createFields = function(command){
  const options = command.split('--');
  options.forEach(option => {
    const args = option.split(' ');
    const optionType = args.shift()
    switch(optionType) {
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
      case 'info':
        this.addField("Info:", trimOptions(option), true);
      case 'movie':
        this.addField("Movie:", trimOptions(option), true);
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
      default:
        this.addField(optionType, trimOptions(option), true);
        break;
    }
  });
};

RichEmbed.prototype.setOurStuff = function(){
  this.setOurFooter();
  //this.setThumbnail('attachment://EB.png');
  this.setThumbnail('https://raw.githubusercontent.com/akuinu/discord-event-bot/master/assets/EB.png');
};

RichEmbed.prototype.setOurFooter = function(footerText = "Powered by Event Bot"){
  this.setFooter(footerText, 'https://raw.githubusercontent.com/akuinu/discord-event-bot/master/assets/EB.png');
  //this.setFooter(footerText, 'attachment://EB.png');
  //this.attachFiles(['./assets/EB.png'])
  this.setTimestamp(new Date);
};

function trimOptions(str){
  const n = str.split(" ")[0].length;
  return str.substring(n).trim().replace(/\\n/gm,"\n")
}
