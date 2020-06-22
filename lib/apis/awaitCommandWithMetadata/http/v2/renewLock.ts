import { Application } from '../../../../common/application/Application';
import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getItemIdentifierSchema } from '../../../../common/schemas/getItemIdentifierSchema';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { jsonSchema } from 'uuidv4';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import typer from 'content-type';
import { validateItemIdentifier } from '../../../../common/validators/validateItemIdentifier';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const renewLock = {
  description: 'Renews the timeout of a locked item in the queue.',
  path: 'renew-lock',

  request: {
    body: {
      type: 'object',
      properties: {
        itemIdentifier: getItemIdentifierSchema(),
        token: jsonSchema.v4
      },
      required: [ 'itemIdentifier', 'token' ],
      additionalProperties: false
    }
  },
  response: {
    statusCodes: [],
    body: { type: 'object' }
  },

  getHandler ({
    application,
    priorityQueueStore
  }: {
    application: Application;
    priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>;
  }): WolkenkitRequestHandler {
    const requestBodySchema = new Value(renewLock.request.body),
          responseBodySchema = new Value(renewLock.response.body);

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

      try {
        requestBodySchema.validate(req.body);
        validateItemIdentifier({ itemIdentifier: req.body.itemIdentifier, application });
      } catch (ex) {
        const error = new errors.ItemIdentifierMalformed(ex.message);

        res.status(400).json({
          code: error.code,
          message: error.message
        });

        return;
      }

      const { itemIdentifier, token } = req.body;

      try {
        await priorityQueueStore.renewLock({
          discriminator: itemIdentifier.aggregateIdentifier.id,
          token
        });

        const response = {};

        responseBodySchema.validate(response);

        res.status(200).json(response);
      } catch (ex) {
        switch (ex.code) {
          case 'ETOKENMISMATCH': {
            res.status(403).json({
              code: ex.code,
              message: `Token mismatch for item '${itemIdentifier.contextIdentifier.name}.${itemIdentifier.aggregateIdentifier.name}.${itemIdentifier.aggregateIdentifier.id}.${itemIdentifier.name}.${itemIdentifier.id}'.`
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
            logger.error('Unknown error occured.', { ex });

            res.status(500).json({
              code: ex.code ?? 'EUNKNOWNERROR',
              message: ex.message
            });
          }
        }
      }
    };
  }
};

export { renewLock };
