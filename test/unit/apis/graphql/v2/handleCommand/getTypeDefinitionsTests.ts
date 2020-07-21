import { ApolloServer } from 'apollo-server-express';
import { Application } from '../../../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { getTypeDefinitions } from '../../../../../../lib/apis/graphql/v2/handleCommand/getTypeDefinitions';
import gql from 'graphql-tag';
import { isolated } from 'isolated';
import { JSONSchema4 } from 'json-schema';

suite('getTypeDefinitions', (): void => {
  test('works with empty schemas.', async (): Promise<void> => {
    const application: Application = {
      domain: {
        sampleContext: {
          sampleAggregate: {
            commandHandlers: {
              empty: {
                getSchema (): JSONSchema4 {
                  return {
                    type: 'object',
                    properties: {},
                    required: [],
                    additionalFields: false
                  };
                },
                async handle (): Promise<void> {
                  // Intentionally left empty.
                },
                async isAuthorized (): Promise<boolean> {
                  return true;
                }
              }
            },
            domainEventHandlers: {},
            getInitialState (): {} {
              return {};
            }
          }
        }
      },
      flows: {},
      infrastructure: {
        ask: {},
        tell: {}
      },
      hooks: {},
      views: {},
      packageManifest: {
        name: 'empty',
        dependencies: {},
        devDependencies: {},
        engines: {},
        version: '1.0.0'
      },
      rootDirectory: await isolated()
    };

    let typeDefinitions = getTypeDefinitions({ application });

    typeDefinitions += `
        type Query {
          _: Boolean
      }
    `;

    assert.that((): void => {
      // eslint-disable-next-line no-new
      new ApolloServer({
        typeDefs: gql(typeDefinitions),
        resolvers: {}
      });
    }).is.not.throwing();
  });
});
