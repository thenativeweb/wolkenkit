import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getItemIdentifierSchema } from '../../../../common/schemas/getItemIdentifierSchema';
import { jsonSchema } from 'uuidv4';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import typer from 'content-type';
import { validateItemIdentifier } from '../../../../common/validators/validateItemIdentifier';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const defer = {
  description: 'Defers a command from the queue.',
  path: 'defer',

  request: {
    body: {
      type: 'object',
      properties: {
        itemIdentifier: getItemIdentifierSchema(),
        token: jsonSchema.v4,
        priority: { type: 'number', minimum: 0 }
      },
      required: [ 'itemIdentifier', 'token', 'priority' ],
      additionalProperties: false
    }
  },
  response: {
    statusCodes: [ 200, 400, 403, 404, 415 ],
    body: { type: 'object' }
  },

  getHandler ({
    applicationDefinition,
    priorityQueueStore
  }: {
    applicationDefinition: ApplicationDefinition;
    priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>>;
  }): WolkenkitRequestHandler {
    const requestBodySchema = new Value(defer.request.body),
          responseBodySchema = new Value(defer.response.body);

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
      } catch (ex) {
        const error = new errors.RequestMalformed(ex.message);

        res.status(400).json({
          code: error.code,
          message: error.message
        });

        return;
      }

      try {
        validateItemIdentifier({ itemIdentifier: req.body.itemIdentifier, applicationDefinition });
      } catch (ex) {
        const error = new errors.ItemIdentifierMalformed(ex.message);

        res.status(400).json({
          code: error.code,
          message: error.message
        });

        return;
      }

      const { itemIdentifier, token, priority } = req.body;

      try {
        await priorityQueueStore.defer({
          discriminator: itemIdentifier.aggregateIdentifier.id,
          token,
          priority
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

export { defer };
