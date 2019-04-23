'use strict';

const path = require('path');

const assert = require('assertthat');

const getConfiguration = require('../../../../lib/wolkenkit/application/getConfiguration');

suite('application/getConfiguration', () => {
  const directory = {
    missing: path.join(__dirname, '..', '..', '..', 'shared', 'configuration', 'missing'),
    invalidJson: path.join(__dirname, '..', '..', '..', 'shared', 'configuration', 'invalidJson'),
    validJson: path.join(__dirname, '..', '..', '..', 'shared', 'configuration', 'validJson'),
    missingRuntimeVersion: path.join(__dirname, '..', '..', '..', 'shared', 'configuration', 'templates', 'missingRuntimeVersion'),
    unknownRuntimeVersion: path.join(__dirname, '..', '..', '..', 'shared', 'configuration', 'templates', 'unknownRuntimeVersion'),
    certificate: path.join(__dirname, '..', '..', '..', 'shared', 'configuration', 'templates', 'certificate'),
    doesNotContainNodeEnvironment: path.join(__dirname, '..', '..', '..', 'shared', 'configuration', 'templates', 'doesNotContainNodeEnvironment'),
    doesNotContainPort: path.join(__dirname, '..', '..', '..', 'shared', 'configuration', 'templates', 'doesNotContainPort'),
    doesNotContainAllowAccessFrom: path.join(__dirname, '..', '..', '..', 'shared', 'configuration', 'templates', 'doesNotContainAllowAccessFrom'),
    multipleEnvironments: path.join(__dirname, '..', '..', '..', 'shared', 'configuration', 'templates', 'multipleEnvironments'),
    multipleEnvironmentsWithDockerMachine: path.join(__dirname, '..', '..', '..', 'shared', 'configuration', 'templates', 'multipleEnvironmentsWithDockerMachine'),
    multipleAllowAccessFrom: path.join(__dirname, '..', '..', '..', 'shared', 'configuration', 'templates', 'multipleAllowAccessFrom'),
    allowAccessFrom: path.join(__dirname, '..', '..', '..', 'shared', 'configuration', 'templates', 'allowAccessFrom'),
    identityProviders: path.join(__dirname, '..', '..', '..', 'shared', 'configuration', 'templates', 'identityProviders'),
    transformEnvironmentVariables: path.join(__dirname, '..', '..', '..', 'shared', 'configuration', 'templates', 'transformEnvironmentVariables'),
    secretFileNotFound: path.join(__dirname, '..', '..', '..', 'shared', 'configuration', 'templates', 'secretFileNotFound'),
    secretNotFound: path.join(__dirname, '..', '..', '..', 'shared', 'configuration', 'templates', 'secretNotFound'),
    resolveSecrets: path.join(__dirname, '..', '..', '..', 'shared', 'configuration', 'templates', 'resolveSecrets')
  };

  test('is a function.', done => {
    assert.that(getConfiguration).is.ofType('function');
    done();
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

  test('throws an error if package.json reference to a secret but the secret file does not exists.', async () => {
    await assert.that(async () => {
      await getConfiguration({ directory: directory.secretFileNotFound });
    }).is.throwingAsync(ex => ex.code === 'ESECRETFILENOTFOUND');
  });

  test('throws an error if package.json reference to a secret which is not specified.', async () => {
    await assert.that(async () => {
      await getConfiguration({ directory: directory.secretNotFound });
    }).is.throwingAsync(ex => ex.code === 'ESECRETNOTFOUND');
  });

  test('returns a configuration if a valid certificate template is given.', async () => {
    const configuration = await getConfiguration({ directory: directory.certificate });

    assert.that(configuration).is.equalTo({
      application: 'Chat',
      runtime: {
        version: 'latest'
      },
      environments: {
        default: {
          api: {
            host: {
              name: 'local.wolkenkit.io',
              certificate: '/server/keys'
            },
            allowAccessFrom: '*'
          },
          fileStorage: {
            allowAccessFrom: '*',
            provider: {
              type: 'fileSystem'
            }
          },
          node: {
            environment: 'development'
          }
        }
      }
    });
  });

  test('returns a configuration if a valid multiple environment template is given.', async () => {
    const configuration = await getConfiguration({ directory: directory.multipleEnvironments });

    assert.that(configuration).is.equalTo({
      application: 'Chat',
      runtime: {
        version: 'latest'
      },
      environments: {
        default: {
          api: {
            allowAccessFrom: '*'
          },
          fileStorage: {
            allowAccessFrom: '*',
            provider: {
              type: 'fileSystem'
            }
          },
          node: {
            environment: 'development'
          }
        },
        production: {
          api: {
            allowAccessFrom: '*'
          },
          fileStorage: {
            allowAccessFrom: '*',
            provider: {
              type: 'fileSystem'
            }
          },
          node: {
            environment: 'production'
          }
        }
      }
    });
  });

  test('returns a configuration if a valid multiple environment with docker machine template is given.', async () => {
    const configuration = await getConfiguration({ directory: directory.multipleEnvironmentsWithDockerMachine });

    assert.that(configuration).is.equalTo({
      application: 'Chat',
      runtime: {
        version: 'latest'
      },
      environments: {
        default: {
          api: {
            allowAccessFrom: '*'
          },
          fileStorage: {
            allowAccessFrom: '*',
            provider: {
              type: 'fileSystem'
            }
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
            allowAccessFrom: '*'
          },
          fileStorage: {
            allowAccessFrom: '*',
            provider: {
              type: 'fileSystem'
            }
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

  test('returns a configuration if a valid single allowAccessFrom template is given.', async () => {
    const configuration = await getConfiguration({ directory: directory.allowAccessFrom });

    assert.that(configuration).is.equalTo({
      application: 'Chat',
      runtime: {
        version: 'latest'
      },
      environments: {
        default: {
          api: {
            allowAccessFrom: '*'
          },
          fileStorage: {
            allowAccessFrom: '*',
            provider: {
              type: 'fileSystem'
            }
          },
          node: {
            environment: 'development'
          }
        }
      }
    });
  });

  test('returns a configuration if a valid multiple allowAccessFrom template is given.', async () => {
    const configuration = await getConfiguration({ directory: directory.multipleAllowAccessFrom });

    assert.that(configuration).is.equalTo({
      application: 'Chat',
      runtime: {
        version: 'latest'
      },
      environments: {
        default: {
          api: {
            allowAccessFrom: [
              'http://www.cradleoffilth.com',
              'http://anthrax.com',
              'http://slayer.net'
            ]
          },
          fileStorage: {
            allowAccessFrom: '*',
            provider: {
              type: 'fileSystem'
            }
          },
          node: {
            environment: 'development'
          }
        }
      }
    });
  });

  test('returns a configuration if a valid identityProviders template is given.', async () => {
    const configuration = await getConfiguration({ directory: directory.identityProviders });

    assert.that(configuration).is.equalTo({
      application: 'Chat',
      runtime: {
        version: 'latest'
      },
      environments: {
        default: {
          api: {
            allowAccessFrom: '*'
          },
          fileStorage: {
            allowAccessFrom: '*',
            provider: {
              type: 'fileSystem'
            }
          },
          identityProviders: [
            {
              issuer: 'identityprovider.example.com',
              certificate: '/server/keys/identityprovider.example.com'
            }
          ],
          node: {
            environment: 'development'
          }
        }
      }
    });
  });

  test('returns a configuration with transformed environment variables.', async () => {
    const configuration = await getConfiguration({ directory: directory.transformEnvironmentVariables });

    assert.that(configuration).is.equalTo({
      application: 'Chat',
      runtime: {
        version: 'latest'
      },
      environments: {
        default: {
          api: {
            allowAccessFrom: '*'
          },
          fileStorage: {
            allowAccessFrom: '*',
            provider: {
              type: 'fileSystem'
            }
          },
          node: {
            environment: 'development'
          },
          environmentVariables: {
            WOLKENKIT_FOO: 'bar',
            WOLKENKIT_FOO_EXTENDED: 'barExtended'
          }
        }
      }
    });
  });

  test('returns a configuration with resolved secrets.', async () => {
    const configuration = await getConfiguration({ directory: directory.resolveSecrets });

    assert.that(configuration).is.equalTo({
      application: 'Chat',
      runtime: {
        version: 'latest'
      },
      environments: {
        default: {
          api: {
            host: {
              name: 'local.wolkenkit.io',
              certificate: '/keys/local.wolkenkit.io'
            },
            port: 3000,
            allowAccessFrom: '*'
          },
          fileStorage: {
            allowAccessFrom: '*',
            provider: {
              type: 'fileSystem'
            }
          },
          node: {
            environment: 'development'
          },
          environmentVariables: {
            WOLKENKIT_FOO: 'bar',
            WOLKENKIT_MAINTENANCE: false
          }
        }
      }
    });
  });
});
