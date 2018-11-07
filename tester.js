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
      console.log(e);
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
      handel: (o) => {
        return new Promise((resolve, reject) => {
         resolve(o.messageRecived.embeds[0].title === "How to use Event Bot");
        });
      }
    },
    {name:"testing !config",
      targetChannel: mainChannle,
      expectedChannel: mainChannle,
      action: "send",
      text:"!config",
      expect:"message",
      handel: (o) => {
        return new Promise((resolve, reject) => {
          resolve(o.messageRecived.embeds[0].title === "Events Bot config is following:");
        });
      }
    },
    {name:"testing init and setting thins up for following test",
      targetChannel: mainChannle,
      expectedChannel: mainChannle,
      action: "send",
      text:`!init ${mainChannle} ${eventChannel}`,
      expect:"message",
      handel: (o) => {
        return new Promise((resolve, reject) => {
          if (o.messageRecived.embeds[0].title === "Event Bot has been set up for this server.") {
            resolve(true);
          }else {
            console.log("Not expected message");
            resolve(false);
          }
        });
      }
    },
    {name:"event create test",
      targetChannel: mainChannle,
      expectedChannel: eventChannel,
      action: "send",
      text:`!event --type just bots doing bot stuff`,
      expect:"message",
      subtests:[
        {name:"event react add fields request",
          targetChannel: eventChannel,
          expectedChannel: mainChannle,
          action: "react",
          reaction: '📝',
          expect:"message",
          handel: (o) => {
            return new Promise((resolve, reject) => {
              const fields = o.messageReacted.embeds[0].fields.length;
              if (o.messageRecived.embeds[0].title === `Please enter edits, no prefix needed\n for example: \`--seed 31337\``) {
                o.messageRecived.channel.send("--seed 31337");
                expectMessage(mainChannle).then(messageRecived =>{
                  const interval = setInterval(function () {
                    if(fields < o.messageReacted.embeds[0].fields.length) {
                      resolve(fields < o.messageReacted.embeds[0].fields.length);
                      clearInterval(interval);
                    };
                  }, 50);
                  setTimeout(function() {
                    clearInterval(interval);
                    resolve(false);
                  }, 1000);
                }).catch(e => {
                  console.log("Our update message was not recived");
                  resolve(false);
                });
              }else {
                console.log("Did not recive right message");
                resolve(false);
              }
            });
          }
        },
        {name:"event react delete request",
          targetChannel: eventChannel,
          expectedChannel: eventChannel,
          action: "react",
          reaction: '❌',
          expect:"message",
          handel: (o) => {
            return new Promise((resolve, reject) => {
              if (o.messageRecived.embeds[0].title === "Do you want to delete event?") {
                o.messageRecived.react('👍');
                const interval = setInterval(function () {
                  if(o.messageReacted.deleted) {
                    resolve(o.messageReacted.deleted);
                    clearInterval(interval);
                  }
                }, 50);
                setTimeout(function() {
                  clearInterval(interval);
                  resolve(o.messageReacted.deleted);
                }, 1000);
              }else {
                console.log("No delete confirm asked.");
                return false;
              }
            });
          }
        }
      ]
    },
     // chnage to testing set event/info
    {name:"set same event channel(no prompt)",
      targetChannel: mainChannle,
      expectedChannel: mainChannle,
      action: "send",
      text:`!setEvent ${eventChannel}`,
      expect:"message",
      handel: (o) => {
        return new Promise((resolve, reject) => {
          if (o.messageRecived.embeds[0].title === "Event Bot settings have been changed.") {
            resolve(true);
          }else if (o.messageRecived.embeds[0].title === "Do you want to move Event Channel?") {
            expectMessage(mainChannle).then(messageRecived =>{
              if (messageRecived.embeds[0].title === "Event Bot settings have been changed."){
                resolve(true);
              }else {
                resolve(false);
                console.log("unexpected message");
              }
            }).catch(e=>{
              resolve(false);
              console.log("nothing recived in time");
            });
            o.messageRecived.react('👍');
          } else {
            resolve(false);
            console.log("unexpected message");
          }
        });
      },
      subtests: [
        {name:"add event to channel",
          targetChannel: mainChannle,
          expectedChannel: eventChannel,
          action: "send",
          text:`!event --type just bots doing bot stuff`,
          expect:"message",
        },
        {name:"set diffrent event channel(with prompt)",
          targetChannel: mainChannle,
          expectedChannel: mainChannle,
          action: "send",
          text:`!setEvent ${eventChange}`,
          expect:"message",
          handel: (o) => {
            return new Promise((resolve, reject) => {
              if (o.messageRecived.embeds[0].title === "Event Bot settings have been changed.") {
                resolve(true);
              }else if (o.messageRecived.embeds[0].title === "Do you want to move Event Channel?") {
                expectMessage(mainChannle).then(messageRecived =>{
                  if (messageRecived.embeds[0].title === "Event Bot settings have been changed."){
                    resolve(true);
                  }else {
                    resolve(false);
                    console.log("unexpected message");
                  }
                }).catch(e=>{
                  resolve(false);
                  console.log("nothing recived in time");
                });
                o.messageRecived.react('👍');
              } else {
                resolve(false);
                console.log("unexpected message");
              }
            });
          }
        },
        {name:"create event in new event channel",
          targetChannel: mainChannle,
          expectedChannel: eventChange,
          action: "send",
          text:`!event --type just bots doing bot stuff`,
          expect:"message"
        },
        {name:"event react remove fields request",
          targetChannel: eventChange,
          expectedChannel: mainChannle,
          action: "react",
          reaction: '✂',
          expect:"message",
          handel: (o) => {
            return new Promise((resolve, reject) => {
              const fields = o.messageReacted.embeds[0].fields.length;
                o.messageRecived.channel.send("1");
                expectMessage(mainChannle).then(messageRecived =>{
                  const interval = setInterval(function () {
                    if(fields > o.messageReacted.embeds[0].fields.length) {
                      resolve(fields > o.messageReacted.embeds[0].fields.length);
                      clearInterval(interval);
                    };
                  }, 50);
                  setTimeout(function() {
                    clearInterval(interval);
                    resolve(false);
                  }, 1000);
                }).catch(e => {
                  console.log("Our update message was not recived");
                  resolve(false);
                });
            });
          }
        },
        {name:"event react message request",
          targetChannel: eventChange,
          expectedChannel: mainChannle,
          action: "react",
          reaction: '💌',
          expect:"message",
          async handel(o){
            o.messageRecived.reply("test");
            return await expectMessage(mainChannle);
          }
        },
      ]
    },
    {name:"set diffrent info channel",
      targetChannel: mainChannle,
      expectedChannel: mainChannle,
      action: "send",
      text:`!setInfo ${eventChannel}`,
      expect:"message",
      subtests:[
        {name:"test if info channel change took place",
          targetChannel: eventChannel,
          expectedChannel: eventChange,
          action: "send",
          text:`!event --type just bots doing bot stuff`,
          expect:"message"
        },
        {name:"event react start timer",
          targetChannel: eventChange,
          expectedChannel: eventChannel,
          action: "react",
          reaction: '⏱',
          expect:"message",
          async handel(o){
            o.messageRecived.reply("10");
            return await expectMessage(eventChannel);
          }
        },
      ]
    },
  ];

  for (var i = 0; i < testCases.length; i++) {
    testsAmmount++;
    if (await testMagicBox(testCases[i])) {
      console.log(`${i+1}: \x1b[32mPassed\x1b[0m - ${testCases[i].name}`);
      if (testCases[i].subtests) {
        for (var j = 0; j < testCases[i].subtests.length; j++) {
          testsAmmount++;
          if (await testMagicBox(testCases[i].subtests[j])) {
            console.log(`${i+1}.${j+1}: \x1b[32mPassed\x1b[0m - ${testCases[i].subtests[j].name}`);
          }else {
            failsCount++;
            console.log("\x1b[31m%s\x1b[0m", `${i+1}.${j+1}: Failed - ${testCases[i].subtests[j].name}`);
          }
        }
      }
    } else {
      failsCount++;
      console.log("\x1b[31m%s\x1b[0m", `${i+1}: Failed - ${testCases[i].name}`);
    }
  }

  if (failsCount === 0) {
    console.log(`\x1b[32mAll ${testsAmmount} of the tests Passed\x1b[0m.`);
    process.exit(0);
  }else {
    console.log("\x1b[31m%s\x1b[0m", `Failure: ${failsCount} out of ${testsAmmount} tests failed.`);
    process.exit(1);
  }

});

setTimeout(() => {tester.login(process.env.TESTERTOKEN)}, 5000);
