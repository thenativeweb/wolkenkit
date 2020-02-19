import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { errors } from '../../../../common/errors';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { RequestHandler } from 'express';
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
      const error = new errors.ContentTypeMismatch('Header content-type must be application/json.');

      res.status(415).json({
        code: error.code,
        message: error.message
      });

      return;
    }

    const { itemIdentifier, token } = req.body;

    try {
      validateItemIdentifier({ itemIdentifier, applicationDefinition });
    } catch (ex) {
      const error = new errors.ItemIdentifierMalformed(ex.message);

      res.status(400).json({
        code: error.code,
        message: error.message
      });

      return;
    }

    try {
      await priorityQueueStore.acknowledge({ itemIdentifier, token });

      res.status(200).end();
    } catch (ex) {
      switch (ex.code) {
        case 'ETOKENMISMATCH': {
          res.status(403).json({
            code: ex.code,
            message: ex.message
          });

          return;
        }
        case 'EITEMNOTFOUND': {
          res.status(404).json({
            code: ex.code,
            message: ex.message
          });

          return;
        }
        default: {
          res.status(400).json({
            code: ex.code ?? 'EUNKNOWNERROR',
            message: ex.message
          });
        }
      }
    }
  };
};

export { acknowledge };
