import { Application } from '../../../../common/application/Application';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getItemIdentifierSchema } from '../../../../common/schemas/getItemIdentifierSchema';
import { IFieldResolver } from 'graphql-tools';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { OnCancelCommand } from '../../OnCancelCommand';
import { validateItemIdentifier } from '../../../../common/validators/validateItemIdentifier';
import { Value } from 'validate-value';

const logger = flaschenpost.getLogger();

const getCancelResolver = function ({
  application,
  onCancelCommand
}: {
  application: Application;
  onCancelCommand: OnCancelCommand;
}): IFieldResolver<any, { clientMetadata: ClientMetadata }> {
  return async ({ commandIdentifier }, { clientMetadata }): Promise<{ success: boolean }> => {
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
  };
};

export { getCancelResolver };
