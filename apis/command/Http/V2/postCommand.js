'use strict';

const flaschenpost = require('flaschenpost'),
      typer = require('content-type');

const ClientMetadata = require('../../../../common/utils/http/ClientMetadata'),
      { CommandExternal, CommandInternal } = require('../../../../common/elements');

const logger = flaschenpost.getLogger();

const postCommand = function ({
  purpose,
  onReceiveCommand,
  application
}) {
  if (!purpose) {
    throw new Error('Purpose is missing.');
  }
  if (!onReceiveCommand) {
    throw new Error('On receive command is missing.');
  }
  if (!application) {
    throw new Error('Application is missing.');
  }

  if (![ 'internal', 'external' ].includes(purpose)) {
    throw new Error(`Purpose must either be 'internal' or 'external'.`);
  }

  return async function (req, res) {
    let command = req.body,
        contentType;

    try {
      contentType = typer.parse(req);
    } catch {
      return res.status(415).send('Header content-type must be application/json.');
    }

    if (contentType.type !== 'application/json') {
      return res.status(415).send('Header content-type must be application/json.');
    }

    switch (purpose) {
      case 'internal':
        try {
          CommandInternal.validate({ command, application });
        } catch (ex) {
          return res.status(400).send(ex.message);
        }

        command = CommandInternal.fromObject(command);
        break;
      case 'external':
        try {
          CommandExternal.validate({ command, application });
        } catch (ex) {
          return res.status(400).send(ex.message);
        }

        command = CommandInternal.fromObject({
          ...command,
          annotations: {
            client: new ClientMetadata({ req }),
            initiator: { user: { id: req.user.id, claims: req.user.claims }}
          }
        });
        break;
      default:
        throw new Error('Invalid operation.');
    }

    logger.info('Command received.', { command });

    try {
      await onReceiveCommand({ command });
    } catch {
      res.status(500).end();

      return;
    }

    res.status(200).end();
  };
};

module.exports = postCommand;
