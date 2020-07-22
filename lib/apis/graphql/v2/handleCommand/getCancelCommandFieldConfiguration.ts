import { addMissingPrototype } from '../../../../common/utils/graphql/addMissingPrototype';
import { Application } from '../../../../common/application/Application';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getGraphqlFromJsonSchema } from 'get-graphql-from-jsonschema';
import { getItemIdentifierSchema } from '../../../../common/schemas/getItemIdentifierSchema';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { OnCancelCommand } from '../../OnCancelCommand';
import { ResolverContext } from '../ResolverContext';
import { validateItemIdentifier } from '../../../../common/validators/validateItemIdentifier';
import { Value } from 'validate-value';
import { buildSchema, GraphQLBoolean, GraphQLFieldConfig, GraphQLInputObjectType, GraphQLObjectType } from 'graphql';

const logger = flaschenpost.getLogger();

const getCancelCommandFieldConfiguration = function ({ application, onCancelCommand }: {
  application: Application;
  onCancelCommand: OnCancelCommand;
}): GraphQLFieldConfig<any, ResolverContext> {
  const cancelTypeDefs = getGraphqlFromJsonSchema({
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
    async resolve (_source, { commandIdentifier: rawCommandIdentifier }, { clientMetadata }): Promise<{ success: boolean }> {
      const commandIdentifier = addMissingPrototype({ value: rawCommandIdentifier });

      try {
        new Value(getItemIdentifierSchema()).validate(commandIdentifier, { valueName: 'commandIdentifier' });
      } catch (ex) {
        throw new errors.ItemIdentifierMalformed(ex.message);
      }
      validateItemIdentifier({ itemIdentifier: commandIdentifier, application, itemType: 'command' });

      const commandIdentifierWithClient: ItemIdentifierWithClient = {
        ...commandIdentifier,
        client: clientMetadata
      };

      logger.info('Command cancel request received.', { commandIdentifierWithClient });

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
