'use strict';

const flaschenpost = require('flaschenpost'),
      typer = require('content-type');

const ClientMetadata = require('../../../../common/utils/http/ClientMetadata'),
      { Command } = require('../../../../common/elements'),
      { validateCommand } = require('../../../../common/validators');

const logger = flaschenpost.getLogger();

const postCommand = function ({
  overwriteInitiatorAndClient,
  onReceiveCommand,
  application
}) {
  if (overwriteInitiatorAndClient === undefined) {
    throw new Error('Overwrite initiator and client is undefined.');
  }
  if (!onReceiveCommand) {
    throw new Error('On receive command is missing.');
  }
  if (!application) {
    throw new Error('Application is missing.');
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

    try {
      validateCommand({ command, application });
    } catch (ex) {
      return res.status(400).send(ex.message);
    }

    if (!overwriteInitiatorAndClient) {
      command = Command.fromObject(command);
    } else {
      command = Command.fromObject({
        ...command,
        metadata: {
          ...command.metadata,
          initiator: {
            user: {
              id: req.user.id,
              claims: req.user.claims
            }
          }
        },
        annotations: {
          client: new ClientMetadata({ req })
        }
      });
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
