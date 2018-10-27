//  deals with all the discord.RichEmbed messages
// ========
const {RichEmbed} = require('discord.js');
module.exports = {
  welcome: () => {
    const embed = new RichEmbed()
      .setColor(0x00FF00)
      .setTitle("Hello people, \nI am Event Bot, I help you to host community events.")
      .addField("Setting up: !init <event info channel> <event annoucment channel> <role>",
        "**<event info channel>** - channel where I will listen for commands and You plan your events\n"+
        "**<event annoucment channel>** - channel where I post events- I would be happy if there would be to have message edit permssion in that channel, but I can without it.\n"+
        "**<role>** - role of people that can host and take part of events")
      .addBlankField()
      .addField("More commands info:", "!info");
    embed.setOurStuff();
    return embed;
  },
  goodbye: () => {
    const embed = new RichEmbed()
      .setColor(0x00FF00)
      .setTitle("It was fun to be with you, but for now...\nGood Bye!")
      .addField("If you start to miss me, just whisper me.", "Way to get new bot inivte link.");
    embed.setOurStuff();
    return embed;
  },
  help: (admin = false) => {
    const embed = new RichEmbed()
      .setColor(0x00FF00)
      .setTitle("How to use Event Bot")
      .addField("Creating event message:",
        "Start the command with `!event` followed by following options:\n"
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
      .addField("Setting up:", "`!init <event info channel> <event annoucment channel> <role>`\n"+
        "**<event info channel>** - channel where I will listen for commands and You plan your events\n"+
        "**<event annoucment channel>** - channel where I post events- I would be happy if there would be to have message edit permssion in that channel, but I can without it.\n"+
        "**<role>** - role of people that can host and take part of events")
      .addField("Change info channel", "`!setInfo <channel>`")
      .addField("Change event channel", "`!setEvent <channel>`")
      .addField("Change requiered role", "`!setRole <role>`")
      .addField("Remove requiered role", "`!removeRole <role>`")
      .addField("Remove Event Bot", "`!removeBot`")
    }
    embed.setOurFooter();
    return embed;
  },
  invites: (link) => {
    const embed = new RichEmbed()
      .addField("Invite link", link)
      .addField("Bot Demo Server", "https://discord.gg/hur62Tp")
      .addField("Event Bot source code", "https://github.com/akuinu/discord-event-bot")
      .addBlankField()
      .addField("Commands in DM's:", "`!help` - list of commands\n`!demo` - to test event messages apparance")
      .setColor(0x00FF00);
    embed.setOurStuff();
    return embed;
  },
  deletiongPrompt: (url) => {
    const embed = new RichEmbed()
      .setColor(0xFFFF00)
      .setTitle("Do you want to delete event?")
      .addField("Link to event:", url)
      .addField("React to confirm:", "👍 - Delete \t 👎 - Cancle")
    return embed;
  },
  removeBot: (events) => {
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
  userInputRecived: (userStr, requestSr) => {
    const embed = new RichEmbed()
      .addField("Recived your input of", userStr)
      .addField("Info requested:", requestSr)
      .setTimestamp(new Date)
      .setColor(0x00FF00);
    embed.setOurStuff();
    return embed;
  },
  userMessage: (username, participants, userStr, url) => {
    const embed = new RichEmbed()
      .addField(`Message from ${username}`, participants)
      .addField("Message:", userStr)
      .addField("Link to event:", url)
      .setColor(0x00FF00);
    embed.setOurStuff();
    return embed;
  },
  eventMessage: (msg, eventConfig) => {
    const embed = new RichEmbed()
      .setColor(0xFF0000)
      .setAuthor(eventConfig.authorField +  msg.author.username,  msg.author.displayAvatarURL);

    embed.createFields(msg.content.substring(6));
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
  getSetRoleMessage: (id) => {
    const embed = new RichEmbed()
      .setColor("0x00FF00")
      .setTitle("Event Bot settings have been changed.")
      .addField("Roll requiered to host event:", `<@&${id}>`);
    embed.setOurStuff();
    return embed;
  },
  getRemoveRoleMessage: (id) => {
    const embed = new RichEmbed()
      .setColor("0x00FF00")
      .setTitle("Event Bot settings have been changed.")
      .addField("Roll requiered to host event has been removed:", `yay, free for all`);
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
  }
};

RichEmbed.prototype.createFields = function(command){
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

RichEmbed.prototype.setOurStuff = function(){
  this.setOurFooter();
  this.setThumbnail('attachment://EB.png');
};

RichEmbed.prototype.setOurFooter = function(footerText = "Powered by Event Bot"){
  this.setFooter(footerText, 'attachment://EB.png');
  this.attachFiles(['./assets/EB.png'])
  this.setTimestamp(new Date);
};

function trimOptions(str){
  const n = str.split(" ")[0].length;
  return str.substring(n).trim().replace("\\n","\n")
}
