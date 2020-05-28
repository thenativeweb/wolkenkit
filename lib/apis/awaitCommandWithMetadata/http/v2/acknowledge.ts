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

const acknowledge = {
  description: 'Acknowledges a command from the queue and removes it.',
  path: 'acknowledge',

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
    const requestBodySchema = new Value(acknowledge.request.body),
          responseBodySchema = new Value(acknowledge.response.body);

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
        validateItemIdentifier({ itemIdentifier: req.body.itemIdentifier, applicationDefinition });
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
        await priorityQueueStore.acknowledge({ itemIdentifier, token });

        const response = {};

        responseBodySchema.validate(response);

        res.status(200).json(response);
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

export { acknowledge };
