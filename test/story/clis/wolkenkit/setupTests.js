'use strict';

const path = require('path');

const assert = require('assertthat'),
      isolated = require('isolated');

const getDirectoryList = require('./helpers/getDirectoryList'),
      shell = require('../../../../clis/wolkenkit/shell'),
      suiteAws = require('./helpers/suiteAws');

const packageJson = require('../../../../package.json');

(async () => {
  await suiteAws('setup', async ({ test, wolkenkit }) => {
    await test('[wolkenkit] shows the usage.', async ({ directory }) => {
      const { code, stderr, stdout } = await wolkenkit('', {}, { cwd: directory });

      assert.that(stderr).is.equalTo('');
      assert.that(stdout).is.matching(/Verify whether wolkenkit is setup correctly/u);
      assert.that(stdout).is.matching(/Show the help/u);
      assert.that(stdout).is.matching(/Initialize a new application/u);
      assert.that(stdout).is.matching(/List supported and installed wolkenkit versions/u);
      assert.that(stdout).is.matching(/Start an application/u);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit help] shows the usage.', async ({ directory }) => {
      const { code, stderr, stdout } = await wolkenkit('help', {}, { cwd: directory });

      assert.that(stderr).is.equalTo('');
      assert.that(stdout).is.matching(/Verify whether wolkenkit is setup correctly/u);
      assert.that(stdout).is.matching(/Show the help/u);
      assert.that(stdout).is.matching(/Initialize a new application/u);
      assert.that(stdout).is.matching(/List supported and installed wolkenkit versions/u);
      assert.that(stdout).is.matching(/Start an application/u);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit application init --help] shows the usage for the specified command.', async ({ directory }) => {
      const { code, stderr, stdout } = await wolkenkit('application init', { help: true }, { cwd: directory });

      assert.that(stderr).is.equalTo('');
      assert.that(stdout).is.matching(/Initialize a new application/u);
      assert.that(stdout).is.matching(/wolkenkit application init \[--template <url>\]/u);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit] suggests a command when an unknown command is given.', async ({ directory }) => {
      const { code, stdout, stderr } = await wolkenkit('hel', {}, { cwd: directory });

      assert.that(stderr).is.equalTo('✗ Unknown command \'hel\', did you mean \'help\'?\n');
      assert.that(stdout).is.equalTo('');
      assert.that(code).is.not.equalTo(0);
    });

    await test('[wolkenkit --version] shows its version number.', async ({ directory }) => {
      const { code, stdout, stderr } = await wolkenkit('--version', {}, { cwd: directory });

      assert.that(stderr).is.equalTo('');
      assert.that(stdout).is.equalTo(`  ${packageJson.version}\n`);
      assert.that(code).is.equalTo(0);
    });

    await test('[wolkenkit application init] reports an error if the target directory is not empty.', async () => {
      const directory = await isolated({
        files: [ path.join(__dirname, '..', 'shared', 'configuration', 'validJson', 'package.json') ]
      });

      const { code, stdout, stderr } = await wolkenkit('application init', {}, { cwd: directory });

      assert.that(stderr).is.equalTo('✗ Failed to initialize a new application.\n');
      assert.that(stdout).is.startingWith('  Initializing a new application...\n  The current working directory is not empty.\n');
      assert.that(code).is.not.equalTo(0);

      const directoryList = await getDirectoryList(directory);

      assert.that(directoryList).is.containingAllOf([ 'package.json' ]);
    });

    await test('[wolkenkit application init --template] initializes a new application using the specified template.', async ({ directory }) => {
      const template = 'https://github.com/thenativeweb/wolkenkit-template-chat.git#master';

      const { code, stderr, stdout } = await wolkenkit('application init', { template }, { cwd: directory });

      assert.that(stderr).is.equalTo('');
      assert.that(stdout).is.equalTo(`  Initializing a new application...\n  Cloning ${template}...\n✓ Initialized a new application.\n`);
      assert.that(code).is.equalTo(0);

      const directoryList = await getDirectoryList(directory);

      assert.that(directoryList).is.containingAllOf([ 'client', 'server', 'package.json' ]);
      assert.that(directoryList).is.not.containingAllOf([ '.git' ]);
    });

    await test('[wolkenkit application init --template --force] overwrites existing files.', async () => {
      const directory = await isolated({
        files: [ path.join(__dirname, '..', 'shared', 'configuration', 'validJson', 'package.json') ]
      });
      const template = 'https://github.com/thenativeweb/wolkenkit-template-chat.git#master';

      const { code, stderr, stdout } = await wolkenkit('application init', { template, force: true }, { cwd: directory });

      assert.that(stderr).is.equalTo('');
      assert.that(stdout).is.equalTo(`  Initializing a new application...\n  Cloning ${template}...\n  Creating backup file for package.json...\n✓ Initialized a new application.\n`);
      assert.that(code).is.equalTo(0);

      const directoryList = await getDirectoryList(directory);

      assert.that(directoryList).is.containingAllOf([ 'client', 'server', 'package.json', 'package.json.bak' ]);
      assert.that(directoryList).is.not.containingAllOf([ '.git' ]);
    });

    await test('[wolkenkit application init --template --force] ignores the .git directory.', async ({ directory }) => {
      const template = 'https://github.com/thenativeweb/wolkenkit-template-chat.git#master';

      await shell.cp('-R', path.join(__dirname, '..', '..', '.git'), directory);

      const { code, stderr, stdout } = await wolkenkit('application init', { template, force: true }, { cwd: directory });

      assert.that(stderr).is.equalTo('');
      assert.that(stdout).is.equalTo(`  Initializing a new application...\n  Cloning ${template}...\n✓ Initialized a new application.\n`);
      assert.that(code).is.equalTo(0);

      const directoryList = await getDirectoryList(directory);

      assert.that(directoryList).is.containingAllOf([ 'client', 'server', 'package.json', '.git' ]);

      const gitDirectoryList = await getDirectoryList(path.join(directory, '.git'));

      assert.that(gitDirectoryList).is.containingAllOf([ 'index', 'HEAD', 'objects', 'refs' ]);
    });
  });
})();
