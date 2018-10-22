//  embed messages creator
//  to move all the long text here
// ========
const {RichEmbed } = require('discord.js');
module.exports = {
  welcome: (avatar) => {
    const embed = new RichEmbed()
      .setColor(0x00FF00)
      .setThumbnail(avatar)
      .setTitle("Hello people, \nI am Event Bot, I help you to host community events.")
      .addField("Setting up: !init <event info channel> <event annoucment channel> <role>",
        "**<event info channel>** - channel where I will listen to commands and You plan your events\n"+
        "**<event annoucment channel>** - channel where I post events- I would be happy if there would be to have message edit permssion in that channel, but I can without it.\n"+
        "**<role>** - role of people that can host and take part of events")
      .addBlankField()
      .addField("More commands info:", "!info");
    return embed;
  },
  goodbye: (avatar) => {
    const embed = new RichEmbed()
      .setColor(0x00FF00)
      .setThumbnail(avatar)
      .setTitle("It was fun to be with you, but for now...\nGood Bye!")
      .addField("If you start to miss me, just whisper me.", "Way to get new bot inivte link.")
    return embed;
  },
  help: () => {
    const embed = new RichEmbed()
      .setColor(0x00FF00)
      .setTitle("Start the command with !event followed by following options:")
      .addField("--type text", "Creates \"Event type:\" field with text")
      .addField("--date text", "Creates \"Date:\" field with text")
      .addField("--time text", "Creates \"Time:\" field with text")
      .addField("--rules text", "Creates \"Rules:\" field with text")
      .addField("--seed text", "Creates \"Seed:\" field with text")
      .addField("--colour text", "Set colour one the side with HEX string (\"0xFF0000\" - red by default)")
      .addField("--icon url", "Adds corner image")
      .addField("--img url", "Adds central image")
      .addBlankField()
      .addField("Add Info", "To add another field react event message with 📝\n Then enter command, for example: `--seed 31337`")
      .addField("Message participants", "To send and ping participants - react event message with 💌")
      .addField("Starting clock", "To start a countdown - react event message with ⏱\n Then enter seconds, min 5, max 30 seconds")
      .addField("Remove Field", "To remove field react event message with \u2702 \n Then enter number, for example: `1, 3`")
      .addField("Delete", "To delete the event creator has to react event message with ❌");
    return embed;
  },
  invites: (link) => {
    const embed = new RichEmbed()
      .addField("Invite link", link)
      .addField("Bot Demo Server", "https://discord.gg/hur62Tp")
      .addField("Event Bot source code", "https://github.com/akuinu/discord-event-bot");
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
  removeBot: (events, avatar) => {
    const embed = new RichEmbed()
      .setColor(0xFF0000)
      .setThumbnail(avatar)
      .setTitle("Do you want to remove Event Bot?");
    if (events !== -1) {
      embed.addField("Number of active events by Event Bot:", `${events}`)
    }
    embed.addField("React to confirm:", "👍 - Remove \t 👎 - Cancle");
    return embed;
  },
  userInputRecived: (userStr, requestSr) => {
    const embed = new RichEmbed()
      .addField("Recived your input of", userStr)
      .addField("Info requested:", requestSr)
      .setTimestamp(new Date)
      .setColor(0x00FF00);
    return embed;
  },
  userMessage: (username, participants, userStr, url) => {
    const embed = new RichEmbed()
      .addField(`Message from ${username}`, participants)
      .addField("Message:", userStr)
      .addField("Link to event:", url)
      .setColor(0x00FF00);
    return embed;
  }
};
