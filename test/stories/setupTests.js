'use strict';

const path = require('path');

const assert = require('assertthat'),
      isolated = require('isolated'),
      promisify = require('util.promisify');

const getDirectoryList = require('./helpers/getDirectoryList'),
      suite = require('./helpers/suite');

const defaults = require('../../lib/cli/defaults');

const isolatedAsync = promisify(isolated);

(async () => {
  await suite('setup', async ({ test, wolkenkit }) => {
    await test('[wolkenkit] suggests a command when an unknown command is given.', async ({ directory }) => {
      const { code, stdout, stderr } = await wolkenkit('hel', {}, { cwd: directory });

      assert.that(code).is.not.equalTo(0);
      assert.that(stdout).is.equalTo('');
      assert.that(stderr).is.equalTo('✗ Unknown command \'hel\', did you mean \'help\'?\n');
    });

    await test('[wolkenkit help] shows the usage.', async ({ directory }) => {
      const { code, stderr, stdout } = await wolkenkit('help', {}, { cwd: directory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.matching(/Verify whether wolkenkit is setup correctly/);
      assert.that(stdout).is.matching(/Shows the help/);
      assert.that(stdout).is.matching(/Initializes a new application/);
      assert.that(stdout).is.matching(/Show installed wolkenkit versions/);
      assert.that(stdout).is.matching(/Show available wolkenkit versions/);
      assert.that(stdout).is.matching(/Starts an application/);
      assert.that(stdout).is.matching(/Update the wolkenkit CLI/);
      assert.that(stderr).is.equalTo('');
    });

    await test('[wolkenkit init --help] shows the usage for the specified command.', async ({ directory }) => {
      const { code, stderr, stdout } = await wolkenkit('init', { help: true }, { cwd: directory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.matching(/Initializes a new application/);
      assert.that(stdout).is.matching(/wolkenkit init \[--template <url>\]/);
      assert.that(stderr).is.equalTo('');
    });

    await test('[wolkenkit init] reports an error if the target directory is not empty.', async () => {
      const directory = await isolatedAsync({
        files: [ path.join(__dirname, '..', 'configuration', 'validJson', 'package.json') ]
      });

      const { code, stdout, stderr } = await wolkenkit('init', {}, { cwd: directory });

      assert.that(code).is.not.equalTo(0);
      assert.that(stdout).is.equalTo('  Initializing a new application...\n  The current working directory is not empty.\n');
      assert.that(stderr).is.equalTo('✗ Failed to initialize a new application.\n');

      const directoryList = await getDirectoryList(directory);

      assert.that(directoryList).is.containingAllOf([ 'package.json' ]);
    });

    await test('[wolkenkit init] initializes a new application.', async ({ directory }) => {
      const template = defaults.commands.init.template;

      const { code, stderr, stdout } = await wolkenkit('init', {}, { cwd: directory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.equalTo(`  Initializing a new application...\n  Cloning ${template}...\n✓ Initialized a new application.\n`);
      assert.that(stderr).is.equalTo('');

      const directoryList = await getDirectoryList(directory);

      assert.that(directoryList).is.containingAllOf([ 'client', 'server', 'package.json' ]);
      assert.that(directoryList).is.not.containingAllOf([ '.git' ]);
    });

    await test('[wolkenkit init --template] initializes a new application using the specified template.', async ({ directory }) => {
      const template = 'https://github.com/thenativeweb/wolkenkit-boards.git#master';

      const { code, stderr, stdout } = await wolkenkit('init', { template }, { cwd: directory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.equalTo(`  Initializing a new application...\n  Cloning ${template}...\n✓ Initialized a new application.\n`);
      assert.that(stderr).is.equalTo('');

      const directoryList = await getDirectoryList(directory);

      assert.that(directoryList).is.containingAllOf([ 'client', 'server', 'package.json' ]);
      assert.that(directoryList).is.not.containingAllOf([ '.git' ]);
    });
  });
})();
