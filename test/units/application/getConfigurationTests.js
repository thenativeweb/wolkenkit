'use strict';

const path = require('path');

const assert = require('assertthat');

const getConfiguration = require('../../../lib/application/getConfiguration');

suite('application/getConfiguration', () => {
  const directory = {
    missing: path.join(__dirname, '..', '..', 'configuration', 'missing'),
    invalidJson: path.join(__dirname, '..', '..', 'configuration', 'invalidJson'),
    validJson: path.join(__dirname, '..', '..', 'configuration', 'validJson'),
    missingRuntimeVersion: path.join(__dirname, '..', '..', 'configuration', 'templates', 'missingRuntimeVersion'),
    unknownRuntimeVersion: path.join(__dirname, '..', '..', 'configuration', 'templates', 'unknownRuntimeVersion'),
    certificate: path.join(__dirname, '..', '..', 'configuration', 'templates', 'certificate'),
    doesNotContainNodeEnvironment: path.join(__dirname, '..', '..', 'configuration', 'templates', 'doesNotContainNodeEnvironment'),
    doesNotContainPort: path.join(__dirname, '..', '..', 'configuration', 'templates', 'doesNotContainPort'),
    doesNotContainAllowAccessFrom: path.join(__dirname, '..', '..', 'configuration', 'templates', 'doesNotContainAllowAccessFrom'),
    multipleEnvironments: path.join(__dirname, '..', '..', 'configuration', 'templates', 'multipleEnvironments'),
    multipleEnvironmentsWithDockerMachine: path.join(__dirname, '..', '..', 'configuration', 'templates', 'multipleEnvironmentsWithDockerMachine'),
    multipleAllowAccessFrom: path.join(__dirname, '..', '..', 'configuration', 'templates', 'multipleAllowAccessFrom'),
    allowAccessFrom: path.join(__dirname, '..', '..', 'configuration', 'templates', 'allowAccessFrom'),
    identityProvider: path.join(__dirname, '..', '..', 'configuration', 'templates', 'identityProvider')
  };

  test('is a function.', done => {
    assert.that(getConfiguration).is.ofType('function');
    done();
  });

  test('throws an error if options are missing.', async () => {
    await assert.that(async () => {
      await getConfiguration();
    }).is.throwingAsync('Options are missing.');
  });

  test('throws an error if directory is missing.', async () => {
    await assert.that(async () => {
      await getConfiguration({});
    }).is.throwingAsync('Directory is missing.');
  });

  test('throws an error if package.json cannot be found.', async () => {
    await assert.that(async () => {
      await getConfiguration({ directory: directory.missing });
    }).is.throwingAsync(ex => ex.code === 'EFILENOTFOUND');
  });

  test('throws an error if package.json contains format errors.', async () => {
    await assert.that(async () => {
      await getConfiguration({ directory: directory.invalidJson });
    }).is.throwingAsync(ex => ex.code === 'EJSONMALFORMED');
  });

  test('throws an error if package.json does not contain a wolkenkit application.', async () => {
    await assert.that(async () => {
      await getConfiguration({ directory: directory.validJson });
    }).is.throwingAsync(ex => ex.code === 'ECONFIGURATIONNOTFOUND');
  });

  test('throws an error if package.json does not contain a runtime version.', async () => {
    await assert.that(async () => {
      await getConfiguration({ directory: directory.missingRuntimeVersion });
    }).is.throwingAsync(ex => ex.code === 'ECONFIGURATIONMALFORMED');
  });

  test('throws an error if package.json contains an unknown runtime version.', async () => {
    await assert.that(async () => {
      await getConfiguration({ directory: directory.unknownRuntimeVersion });
    }).is.throwingAsync(ex => ex.code === 'EVERSIONNOTFOUND');
  });

  test('does not throw an error if package.json does not contain node environment.', async () => {
    await assert.that(async () => {
      await getConfiguration({ directory: directory.doesNotContainNodeEnvironment });
    }).is.not.throwingAsync();
  });

  test('throws an error if package.json does not contain an port.', async () => {
    await assert.that(async () => {
      await getConfiguration({ directory: directory.doesNotContainPort });
    }).is.throwingAsync(ex => ex.code === 'ECONFIGURATIONMALFORMED');
  });

  test('throws an error if package.json does not contain allowAccessFrom.', async () => {
    await assert.that(async () => {
      await getConfiguration({ directory: directory.doesNotContainAllowAccessFrom });
    }).is.throwingAsync(ex => ex.code === 'ECONFIGURATIONMALFORMED');
  });

  test('returns a configuration if an valid certificate template is given.', async () => {
    const configuration = await getConfiguration({ directory: directory.certificate });

    assert.that(configuration).is.equalTo({
      application: 'Chat',
      runtime: {
        version: 'latest'
      },
      environments: {
        default: {
          api: {
            address: {
              host: 'local.wolkenkit.io',
              port: 3000
            },
            allowAccessFrom: '*',
            certificate: '/server/keys'
          },
          node: {
            environment: 'development'
          }
        }
      }
    });
  });

  test('returns a configuration if an valid multiple environment template is given.', async () => {
    const configuration = await getConfiguration({ directory: directory.multipleEnvironments });

    assert.that(configuration).is.equalTo({
      application: 'Chat',
      runtime: {
        version: 'latest'
      },
      environments: {
        default: {
          api: {
            address: {
              host: 'local.wolkenkit.io',
              port: 3000
            },
            allowAccessFrom: '*'
          },
          node: {
            environment: 'development'
          }
        },
        production: {
          api: {
            address: {
              host: 'local.wolkenkit.io',
              port: 3001
            },
            allowAccessFrom: '*'
          },
          node: {
            environment: 'production'
          }
        }
      }
    });
  });

  test('returns a configuration if an valid multiple environment with docker machine template is given.', async () => {
    const configuration = await getConfiguration({ directory: directory.multipleEnvironmentsWithDockerMachine });

    assert.that(configuration).is.equalTo({
      application: 'Chat',
      runtime: {
        version: 'latest'
      },
      environments: {
        default: {
          api: {
            address: {
              host: 'local.wolkenkit.io',
              port: 3000
            },
            allowAccessFrom: '*'
          },
          docker: {
            machine: 'wolkenkit-cli-test'
          },
          node: {
            environment: 'development'
          }
        },
        production: {
          api: {
            address: {
              host: 'local.wolkenkit.io',
              port: 3001
            },
            allowAccessFrom: '*'
          },
          docker: {
            machine: 'wolkenkit-cli-test-2'
          },
          node: {
            environment: 'production'
          }
        }
      }
    });
  });

  test('returns a configuration if an valid single allowAccessFrom template is given.', async () => {
    const configuration = await getConfiguration({ directory: directory.allowAccessFrom });

    assert.that(configuration).is.equalTo({
      application: 'Chat',
      runtime: {
        version: 'latest'
      },
      environments: {
        default: {
          api: {
            address: {
              host: 'local.wolkenkit.io',
              port: 3000
            },
            allowAccessFrom: '*'
          },
          node: {
            environment: 'development'
          }
        }
      }
    });
  });

  test('returns a configuration if an valid multiple allowAccessFrom template is given.', async () => {
    const configuration = await getConfiguration({ directory: directory.multipleAllowAccessFrom });

    assert.that(configuration).is.equalTo({
      application: 'Chat',
      runtime: {
        version: 'latest'
      },
      environments: {
        default: {
          api: {
            address: {
              host: 'local.wolkenkit.io',
              port: 3000
            },
            allowAccessFrom: [
              'http://www.cradleoffilth.com',
              'http://anthrax.com',
              'http://slayer.net'
            ]
          },
          node: {
            environment: 'development'
          }
        }
      }
    });
  });

  test('returns a configuration if an valid identityProvider template is given.', async () => {
    const configuration = await getConfiguration({ directory: directory.identityProvider });

    assert.that(configuration).is.equalTo({
      application: 'Chat',
      runtime: {
        version: 'latest'
      },
      environments: {
        default: {
          api: {
            address: {
              host: 'local.wolkenkit.io',
              port: 3000
            },
            allowAccessFrom: '*'
          },
          identityProvider: {
            name: 'identityprovider.example.com',
            certificate: '/server/keys/identityprovider.example.com'
          },
          node: {
            environment: 'development'
          }
        }
      }
    });
  });
});
