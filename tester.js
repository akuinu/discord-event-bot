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

const Discord = require('discord.js');
const tester = new Discord.Client();

tester.on('ready',async () => {
  console.log(`TESTER: Logged in as ${tester.user.tag}!`);
  // picking random channels
  const [mainChannle, event, eventChange] = tester.channels.random(3);
  let testsAmmount = 0;
  let failsCount = 0;

  try {
    testsAmmount++;
    var a = await expectMessage(mainChannle,"!help",mainChannle);
    console.log(`${testsAmmount}: Passed`);
  } catch(e) {
    failsCount++;
    console.log(`${testsAmmount}: Failed`);
  }

  try {
    testsAmmount++;
    var b = await expectMessage(mainChannle,"!config",mainChannle);
    console.log(`${testsAmmount}: Passed`);
  } catch(e) {
    failsCount++;
    console.log(`${testsAmmount}: Failed`);
  }

  if (failsCount === 0) {
    console.log(`All ${testsAmmount} of the tests passed.`);
    process.exit(0);
  }else {
    console.log(`Failure: ${failsCount} out of ${testsAmmount} tests failed.`);
    process.exit(1);
  }

});

setTimeout(() => {tester.login(process.env.TESTERTOKEN)}, 2000);
