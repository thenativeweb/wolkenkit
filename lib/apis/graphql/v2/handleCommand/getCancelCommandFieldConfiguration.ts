import { addMissingPrototype } from '../../../../common/utils/graphql/addMissingPrototype';
import { Application } from '../../../../common/application/Application';
import { flaschenpost } from 'flaschenpost';
import { getGraphqlSchemaFromJsonSchema } from 'get-graphql-from-jsonschema';
import { getItemIdentifierSchema } from '../../../../common/schemas/getItemIdentifierSchema';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { OnCancelCommand } from '../../OnCancelCommand';
import { parse } from 'validate-value';
import { ResolverContext } from '../ResolverContext';
import { validateItemIdentifier } from '../../../../common/validators/validateItemIdentifier';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { buildSchema, GraphQLBoolean, GraphQLFieldConfig, GraphQLInputObjectType, GraphQLObjectType } from 'graphql';
import * as errors from '../../../../common/errors';

const logger = flaschenpost.getLogger();

const getCancelCommandFieldConfiguration = function ({ application, onCancelCommand }: {
  application: Application;
  onCancelCommand: OnCancelCommand;
}): GraphQLFieldConfig<any, ResolverContext> {
  const cancelTypeDefs = getGraphqlSchemaFromJsonSchema({
    schema: getItemIdentifierSchema(),
    rootName: 'CommandIdentifier',
    direction: 'input'
  });

  return {
    type: new GraphQLObjectType<{ success: boolean }>({
      name: 'cancel',
      fields: {
        success: {
          type: GraphQLBoolean,
          resolve (source): boolean {
            return source.success;
          }
        }
      }
    }),
    args: {
      commandIdentifier: {
        type: buildSchema(cancelTypeDefs.typeDefinitions.join('\n')).getType(cancelTypeDefs.typeName) as GraphQLInputObjectType
      }
    },
    async resolve (source, { commandIdentifier: rawCommandIdentifier }, { clientMetadata }): Promise<{ success: boolean }> {
      const commandIdentifier = addMissingPrototype({ value: rawCommandIdentifier });

      parse(
        commandIdentifier,
        getItemIdentifierSchema(),
        { valueName: 'commandIdentifier' }
      ).unwrapOrThrow(
        (err): Error => new errors.ItemIdentifierMalformed(err.message)
      );
      validateItemIdentifier({ itemIdentifier: commandIdentifier, application, itemType: 'command' });

      const commandIdentifierWithClient: ItemIdentifierWithClient = {
        ...commandIdentifier,
        client: clientMetadata
      };

      logger.debug(
        'Received request to cancel command.',
        withLogMetadata('api', 'graphql', { commandIdentifierWithClient })
      );

      try {
        await onCancelCommand({ commandIdentifierWithClient });

        return { success: true };
      } catch {
        return { success: false };
      }
    }
  };
};

export { getCancelCommandFieldConfiguration };
