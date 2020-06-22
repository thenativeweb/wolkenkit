import { assert } from 'assertthat';
import { buildApplication } from '../../../../lib/common/application/buildApplication';
import fs from 'fs';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { isolated } from 'isolated';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import path from 'path';
import shell from 'shelljs';

const javascriptApplicationDirectory = getTestApplicationDirectory({ name: 'base-uncompiled' });
const typescriptApplicationDirectory = getTestApplicationDirectory({ name: 'base', language: 'typescript' });

const getExpectedApplication = ({ applicationDirectory, packageName }: {
  applicationDirectory: string;
  packageName: string;
}): any => ({
  rootDirectory: applicationDirectory,
  packageManifest: {
    name: packageName,
    version: '1.0.0'
  },
  domain: {
    sampleContext: {
      sampleAggregate: {
        commandHandlers: {
          execute: {}
        },
        domainEventHandlers: {
          executed: {},
          succeeded: {}
        }
      }
    }
  },
  infrastructure: {
    ask: {},
    tell: {}
  },
  views: {
    sampleView: {
      initializer: {
        storeType: 'infrastructure/inmemory'
      },
      projectionHandlers: {
        executed: {}
      },
      queryHandlers: {
        all: {}
      }
    }
  }
});

suite('buildApplication', function (): void {
  this.timeout(30_000);

  test('builds a JavaScript application.', async (): Promise<void> => {
    const applicationDirectory = await isolated();

    shell.cp('-r', path.join(javascriptApplicationDirectory, '*'), applicationDirectory);
    await buildApplication({ applicationDirectory });

    const actualApplication = await loadApplication({ applicationDirectory });
    const expectedApplication = getExpectedApplication({ applicationDirectory, packageName: 'base-uncompiled' });

    assert.that(actualApplication).is.atLeast(expectedApplication);
  });

  test('builds a TypeScript application.', async (): Promise<void> => {
    const applicationDirectory = await isolated();
    const wolkenkitDirectory = path.join(__dirname, '..', '..', '..', '..');

    shell.cp('-r', path.join(typescriptApplicationDirectory, '*'), applicationDirectory);

    const packageJsonPath = path.join(applicationDirectory, 'package.json');
    const packageJsonContent = await fs.promises.readFile(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    packageJson.dependencies.wolkenkit = `file://${wolkenkitDirectory}`;

    await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson), 'utf8');

    shell.exec('npm install', { cwd: applicationDirectory });
    await buildApplication({ applicationDirectory });

    const actualApplication = await loadApplication({ applicationDirectory });
    const expectedApplication = getExpectedApplication({ applicationDirectory, packageName: 'base' });

    assert.that(actualApplication).is.atLeast(expectedApplication);
  });
});
