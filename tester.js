var fs = require('fs');

const {Types} = require('./dbObjects');

Types.sync({ force: true }).then(() => {
    Types.create({
      name: "default",
      description: "Default - used when no type is set.",
      authorField: "Race created by ",
      footer: "Race powered by Event Bot",
      participants: "Runners:"
    })
    Types.create({
      name: "race",
      description: "Race - default race",
      authorField: "Race created by ",
      footer: "Race powered by Event Bot",
      participants: "Runners:"
    })
    Types.create({
      name: "event",
      description: "Event - default event",
      authorField: "Event held by ",
      footer: "Event powered by Event Bot",
      participants: "Participants:"
    })
});

try {
  eval(fs.readFileSync('index.js')+'');
} catch (e) {
  console.log(`Can not even run the code: ${e}`);
  process.exit(1);
}

const expectMessage = (expectedChannel) => {
  return new Promise((resolve, reject) => {
    const filter = m => tester.user.id !== m.author.id;
    expectedChannel.awaitMessages(filter, { time: 10000, maxMatches: 1, errors: ['time'] })
    .then(messages => {
      resolve(messages.first());
    })
    .catch((e) => {
      reject(Error(`No responce in time: ${e}`));
    });
  });
};

const testMagicBox = async (magic)=>{
  return new Promise(async(resolve, reject) => {
    try {
      var o = {};
      if (magic.action == "send") {
        o.messageSent = await magic.targetChannel.send(magic.text);
      } else if (magic.action == "react") {
        o.messageReacted = magic.targetChannel.messages.get(magic.targetChannel.lastMessageID);
        o.messageReacted.react(magic.reaction);
      }
      if (magic.expect == "message") {
        o.messageRecived = await expectMessage(magic.expectedChannel);
      }
      if (magic.handel) {
        resolve( await magic.handel(o))
      }else {
        resolve(true);
      }
    } catch(e) {
      console.log(e);
      resolve(false);
    }
  });
}

let testsAmmount = 0;
let failsCount = 0;
const Discord = require('discord.js');
const tester = new Discord.Client();

tester.on('ready',async () => {
  console.log(`TESTER: Logged in as ${tester.user.tag}!`);
  // picking random channels
  const [mainChannle, eventChannel, eventChange] = tester.channels.random(3);

  const testCases = [
    {name:"testing !help",
      targetChannel: mainChannle,
      expectedChannel: mainChannle,
      action: "send",
      text:"!help",
      expect:"message",
      handel(o){
        return (o.messageRecived.embeds[0].title === "How to use Event Bot");
      }
    },
    {name:"testing !config",
      targetChannel: mainChannle,
      expectedChannel: mainChannle,
      action: "send",
      text:"!config",
      expect:"message",
      handel(o){
        return (o.messageRecived.embeds[0].title === "Events Bot config is following:");
      }
    },
    {name:"testing init and setting thins up for following test",
      targetChannel: mainChannle,
      expectedChannel: mainChannle,
      action: "send",
      text:`!init ${mainChannle} ${eventChannel}`,
      expect:"message",
      handel(o){
        if (o.messageRecived.embeds[0].title === "Event Bot has been set up for this server.") {
          return true;
        }
        console.log("Not expected message");
        return false;
      }
    },
    {name:"event create test",
      targetChannel: mainChannle,
      expectedChannel: eventChannel,
      action: "send",
      text:`!event --type just bots doing bot stuff`,
      expect:"message"
    },
    {name:"event react message request",
      targetChannel: eventChannel,
      expectedChannel: mainChannle,
      action: "react",
      reaction: '💌',
      expect:"message"
    },
    {name:"event react start timer",
      targetChannel: eventChannel,
      expectedChannel: mainChannle,
      action: "react",
      reaction: '⏱',
      expect:"message"
    },
    {name:"event react edit request",
      targetChannel: eventChannel,
      expectedChannel: mainChannle,
      action: "react",
      reaction: '📝',
      expect:"message"
    },
    {name:"event react delete request",
      targetChannel: eventChannel,
      expectedChannel: eventChannel,
      action: "react",
      reaction: '❌',
      expect:"message"
    }, // chnage to testing set event/info
    {name:"set diffrent event channel",
      targetChannel: mainChannle,
      expectedChannel: mainChannle,
      action: "send",
      text:`!setEvent ${eventChange}`,
      expect:"message"
    },
    {name:"test if event channel change took place",
      targetChannel: mainChannle,
      expectedChannel: eventChange,
      action: "send",
      text:`!event --type just bots doing bot stuff`,
      expect:"message"
    },
    {name:"set diffrent info channel",
      targetChannel: mainChannle,
      expectedChannel: mainChannle,
      action: "send",
      text:`!setInfo ${eventChannel}`,
      expect:"message"
    },
    {name:"test if info channel change took place",
      targetChannel: eventChannel,
      expectedChannel: eventChange,
      action: "send",
      text:`!event --type just bots doing bot stuff`,
      expect:"message"
    },
  ];

  for (var i = 0; i < testCases.length; i++) {
    testsAmmount++;
    if (await testMagicBox(testCases[i])) {
      console.log(`${testsAmmount}: Passed - ${testCases[i].name}`);
    } else {
      failsCount++;
      console.log(`${testsAmmount}: Failed - ${testCases[i].name}`);
    }
  }

  if (failsCount === 0) {
    console.log(`All ${testsAmmount} of the tests passed.`);
    process.exit(0);
  }else {
    console.log(`Failure: ${failsCount} out of ${testsAmmount} tests failed.`);
    process.exit(1);
  }

});

setTimeout(() => {tester.login(process.env.TESTERTOKEN)}, 5000);
