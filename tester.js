var fs = require('fs');

try {
  eval(fs.readFileSync('index.js')+'');
} catch (e) {
  console.log(`Can not even run the code: ${e}`);
  process.exit(1);
}


const expectMessage = (target, text, expectedChannel) => {
  return new Promise((resolve, reject) => {
    target.send(text).then(()  =>{
      const filter = m => tester.user.id !== m.author.id;
      expectedChannel.awaitMessages(filter, { time: 5000, maxMatches: 1, errors: ['time'] })
      .then(messages => {
        resolve(messages);
      })
      .catch((e) => {
        console.log(e);
        reject(Error("No responce in time"));
      });
    }).catch((e) => {
      console.log(e);
      reject(Error(`It broke: ${e}`));
    });
  });
};

const testMagicBox = async (magic)=>{
  return new Promise(async(resolve, reject) => {
    try {
      testsAmmount++;
      if (magic.type == "message") {
        var t = await expectMessage(magic.targetChannel,magic.text,magic.expectedChannel);
      }
      console.log(`${testsAmmount}: Passed - ${magic.name}`);
      resolve(true);
    } catch(e) {
      failsCount++;
      console.log(`${testsAmmount}: Failed - ${magic.name} \n${e}`);
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
      text:"!help",
      type:"message"
    },
    {name:"testing !config",
      targetChannel: mainChannle,
      expectedChannel: mainChannle,
      text:"!config",
      type:"message"
    },
    {name:"testing init and setting thins up for following test",
      targetChannel: mainChannle,
      expectedChannel: mainChannle,
      text:`!init ${mainChannle} ${eventChannel}`,
      type:"message"
    },
    {name:"make event test",
      targetChannel: mainChannle,
      expectedChannel: eventChannel,
      text:`!event --type just bots doing bot stuff`,
      type:"message"
    },
    {name:"set diffrent event channel",
      targetChannel: mainChannle,
      expectedChannel: mainChannle,
      text:`!setEvent ${eventChange}`,
      type:"message"
    },
    {name:"test if event channel change took place",
      targetChannel: mainChannle,
      expectedChannel: eventChange,
      text:`!event --type just bots doing bot stuff`,
      type:"message"
    }
  ];

  for (var i = 0; i < testCases.length; i++) {
    await testMagicBox(testCases[i]);
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
