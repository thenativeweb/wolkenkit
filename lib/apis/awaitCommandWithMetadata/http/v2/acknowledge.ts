import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { errors } from '../../../../common/errors';
import { isUuid } from 'uuidv4';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { RequestHandler } from 'express-serve-static-core';
import typer from 'content-type';
import { validateItemIdentifier } from '../../../../common/validators/validateItemIdentifier';

const acknowledge = function ({
  applicationDefinition,
  priorityQueueStore
}: {
  applicationDefinition: ApplicationDefinition;
  priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>>;
}): RequestHandler {
  return async function (req, res): Promise<void> {
    try {
      const contentType = typer.parse(req);

      if (contentType.type !== 'application/json') {
        throw new errors.RequestMalformed();
      }
    } catch {
      res.status(415).send('Header content-type must be application/json.');

      return;
    }

    const { itemIdentifier, token } = req.body;

    if (!isUuid(token)) {
      res.status(400).send('Token must be a UUID v4.');

      return;
    }

    try {
      validateItemIdentifier({ itemIdentifier, applicationDefinition });
    } catch (ex) {
      res.status(400).send(ex.message);

      return;
    }

    try {
      await priorityQueueStore.acknowledge({ itemIdentifier, token });

      res.status(200).end();
    } catch (ex) {
      switch (ex.code) {
        case 'ETOKENMISMATCH': {
          res.status(403).send(ex.message);

          return;
        }
        default: {
          res.status(400).send(ex.message);
        }
      }
    }
  };
};

export { acknowledge };
