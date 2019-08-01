#!/usr/bin/env node

'use strict';

const buntstift = require('buntstift'),
      isolated = require('isolated'),
      retry = require('retry-ignore-abort');

const tasks = require('../clis/release');

(async () => {
  try {
    await tasks.showLogo();

    buntstift.wait();
    buntstift.info('Verifying environment... this may take a while.');

    await tasks.verifyInstallation();
    await tasks.verifyKubernetes();

    const { twitterCredentials } = await tasks.getEnvironmentVariables();
    const existingVersions = await tasks.getExistingVersions();

    buntstift.newLine();

    const { versions, description, mode, releaseType, twitterHandles } = await tasks.askForDetails({ existingVersions });

    await tasks.verifyRepositories();

    const cwd = await isolated();

    await tasks.useNode({ versions, cwd });
    await tasks.cloneRepositories({ cwd });
    await tasks.installDependencies({ cwd });

    await retry([
      async () => await tasks.testArtefacts({ type: 'base', cwd }),
      async () => await tasks.updateBaseImages({ versions, cwd }),
      async () => await tasks.testArtefacts({ type: 'infrastructure', cwd }),
      async () => await tasks.updateInfrastructureImages({ versions, cwd }),
      async () => await tasks.testArtefacts({ type: 'application', cwd }),
      async () => await tasks.updateApplicationImages({ versions, cwd }),

      async () => await tasks.testArtefacts({ type: 'clientSdks', cwd }),
      async () => await tasks.testDocumentation({ cwd }),
      async () => await tasks.updateDocumentation({ versions, description, cwd }),
      async () => await tasks.updateDocumentationSamples({ versions, cwd }),
      async () => await tasks.testCli({ cwd }),
      async () => await tasks.updateCli({ versions, cwd }),

      async () => await tasks.releaseArtefacts({ type: 'base', mode, releaseType, versions, cwd }),
      async () => await tasks.releaseArtefacts({ type: 'infrastructure', mode, releaseType, versions, cwd }),
      async () => await tasks.releaseArtefacts({ type: 'application', mode, releaseType, versions, cwd }),

      async () => await tasks.releaseClientSdks({ mode, releaseType, versions, cwd }),
      async () => await tasks.releaseArtefacts({ type: 'documentation', mode, releaseType, versions, cwd }),
      async () => await tasks.releaseDocumentationSamples({ mode, releaseType, versions, cwd }),
      async () => await tasks.releaseCli({ mode, releaseType, versions, cwd }),

      async () => await tasks.updateWolkenkitIo({ versions, cwd }),
      async () => await tasks.releaseWolkenkitIo({ mode, versions, cwd }),

      async () => await tasks.updateRoadmap({ mode, cwd }),
      async () => await tasks.updateSampleApplications({ mode, cwd }),

      async () => await tasks.publishWebsites({ mode, versions, cwd }),
      async () => await tasks.announceOnTwitter({ mode, versions, twitterHandles, twitterCredentials, cwd }),

      async () => await tasks.updateVirtualMachines({ versions, cwd }),
      async () => await tasks.updateVagrantfile({ versions, cwd }),

      async () => await tasks.releaseVirtualMachines({ mode, versions, cwd }),
      async () => await tasks.releaseVagrantfile({ mode, versions, cwd })
    ], async ex => {
      buntstift.info(ex.stack);
      buntstift.error(ex.message);

      const selection = await buntstift.select('How do you want to proceed?', [
        'Retry',
        'Ignore',
        'Abort'
      ]);

      return selection.toLowerCase();
    });

    buntstift.line();

    if (mode === 'release') {
      buntstift.success(`Successfully released wolkenkit ${versions.wolkenkit}.`);
    } else {
      buntstift.success(`Successfully simulated the release of wolkenkit ${versions.wolkenkit}.`);
    }

    buntstift.exit(0);
  } catch (ex) {
    buntstift.line();
    buntstift.error(ex.message);
    buntstift.exit(1);
  }
})();
