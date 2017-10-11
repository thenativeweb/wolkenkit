'use strict';

const assert = require('assertthat');

const runtimes = require('../../lib/wolkenkit/runtimes'),
      suite = require('./helpers/suite');

(async () => {
  await suite('installation lifecycle', async ({ test, wolkenkit }) => {
    const allVersions = await runtimes.getAllVersions(),
          latestStableVersion = await runtimes.getLatestStableVersion();

    await test('[wolkenkit ls-remote] lists all available runtimes.', async ({ directory }) => {
      const { code, stderr, stdout } = await wolkenkit('ls-remote', {}, { cwd: directory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.equalTo(`  Available wolkenkit versions:\n${allVersions.map(version => `∙ ${version}\n`).join('')}`);
      assert.that(stderr).is.equalTo('');
    });

    await test('[wolkenkit ls] reports that no versions are installed.', async ({ directory }) => {
      const { code, stderr, stdout } = await wolkenkit('ls', {}, { cwd: directory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.equalTo('  package.json is missing, using fallback configuration.\n  No wolkenkit versions installed on environment default.\n');
      assert.that(stderr).is.equalTo('');
    });

    await test('[wolkenkit install] installs the latest stable version.', async ({ directory }) => {
      const { code, stderr, stdout } = await wolkenkit('install', {}, { cwd: directory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.matching(new RegExp(`Installed wolkenkit ${latestStableVersion} on environment default`));
      assert.that(stderr).is.equalTo('');
    });

    await test('[wolkenkit ls] reports that the latest stable version is installed.', async ({ directory }) => {
      const { code, stderr, stdout } = await wolkenkit('ls', {}, { cwd: directory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.equalTo(`  package.json is missing, using fallback configuration.\n  Installed wolkenkit versions on environment default:\n∙ ${latestStableVersion}\n`);
      assert.that(stderr).is.equalTo('');
    });

    await test('[wolkenkit uninstall] uninstalls the latest stable version.', async ({ directory }) => {
      const { code, stderr, stdout } = await wolkenkit('uninstall', {}, { cwd: directory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.matching(new RegExp(`Uninstalled wolkenkit ${latestStableVersion} on environment default`));
      assert.that(stderr).is.equalTo('');
    });

    await test('[wolkenkit install --version] installs the specified version.', async ({ directory }) => {
      const { code, stderr, stdout } = await wolkenkit('install', { version: 'latest' }, { cwd: directory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.matching(/Installed wolkenkit latest on environment default./);
      assert.that(stderr).is.equalTo('');
    });

    await test('[wolkenkit install --version] reports an error if the version to install is already installed.', async ({ directory }) => {
      const { code, stderr, stdout } = await wolkenkit('install', { version: 'latest' }, { cwd: directory });

      assert.that(code).is.not.equalTo(0);
      assert.that(stdout).is.equalTo('  Installing wolkenkit latest on environment default...\n  package.json is missing, using fallback configuration.\n  wolkenkit latest is already installed.\n');
      assert.that(stderr).is.equalTo('✗ Failed to install wolkenkit latest on environment default.\n');
    });

    await test('[wolkenkit ls] reports that the latest version is installed.', async ({ directory }) => {
      const { code, stderr, stdout } = await wolkenkit('ls', {}, { cwd: directory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.equalTo('  package.json is missing, using fallback configuration.\n  Installed wolkenkit versions on environment default:\n∙ latest\n');
      assert.that(stderr).is.equalTo('');
    });

    await test('[wolkenkit uninstall --version] uninstalls the latest version.', async ({ directory }) => {
      const { code, stderr, stdout } = await wolkenkit('uninstall', { version: 'latest' }, { cwd: directory });

      assert.that(code).is.equalTo(0);
      assert.that(stdout).is.matching(/Uninstalled wolkenkit latest on environment default./);
      assert.that(stderr).is.equalTo('');
    });

    await test('[wolkenkit uninstall --version] reports an error if the version to uninstall is not installed.', async ({ directory }) => {
      const { code, stderr, stdout } = await wolkenkit('uninstall', { version: 'latest' }, { cwd: directory });

      assert.that(code).is.not.equalTo(0);
      assert.that(stdout).is.equalTo('  Uninstalling wolkenkit latest on environment default...\n  package.json is missing, using fallback configuration.\n  wolkenkit latest is not installed.\n');
      assert.that(stderr).is.equalTo('✗ Failed to uninstall wolkenkit latest on environment default.\n');
    });
  });
})();
