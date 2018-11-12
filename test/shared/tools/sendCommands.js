'use strict';

const buntstift = require('buntstift'),
      wolkenkit = require('wolkenkit-client');

const host = 'local.wolkenkit.io',
      port = 3000;

const numberOfCommands = 100000;

const sendCommand = function ({ app, numberOfCommand }) {
  return new Promise((resolve, reject) => {
    app.communication.message().send({ text: `Hi there! ${numberOfCommand}` }).
      failed(err => reject(err)).
      await('sent', () => resolve());
  });
};

(async () => {
  try {
    const app = await wolkenkit.connect({ host, port });

    for (let i = 0; i < numberOfCommands; i++) {
      await sendCommand({
        app,
        numberOfCommand: i
      });

      buntstift.info(`Sent ${i + 1} commands.`);
    }

    buntstift.success('Sent all commands.');
    buntstift.exit(0);
  } catch (ex) {
    buntstift.error(ex.message);
    buntstift.exit(1);
  }
})();
