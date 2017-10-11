'use strict';

const childProcess = require('child_process'),
      fs = require('fs');

const promisify = require('util.promisify');

const setupAws = require('./helpers/setupAws'),
      teardownAws = require('./helpers/teardownAws');

const readdir = promisify(fs.readdir);

(async () => {
  const tests = (await readdir(__dirname)).
    filter(entry => entry.endsWith('Tests.js'));

  const instanceCount = tests.length;

  const ipAddresses = await setupAws({ instanceCount });

  const childProcesses = [];

  await Promise.all(tests.map((test, index) => new Promise(resolve => {
    const ipAddress = ipAddresses[index];

    const child = childProcess.spawn('node', [ test, ipAddress ], { cwd: __dirname, stdio: 'inherit' });

    child.on('close', code => {
      if (code !== 0) {
        childProcesses.forEach(process => {
          process.kill();
        });
      }

      resolve();
    });

    childProcesses.push(child);
  })));

  await teardownAws({ instanceCount });
})();
