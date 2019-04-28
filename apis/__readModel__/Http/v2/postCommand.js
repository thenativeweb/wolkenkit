'use strict';

const typer = require('content-type');

const ClientMetadata = require('../ClientMetadata'),
      { Command } = require('../../../../common/elements'),
      validateCommand = require('./validateCommand');

const postCommand = function ({ commandStream, application }) {
  if (!commandStream) {
    throw new Error('Command stream is missing.');
  }
  if (!application) {
    throw new Error('Application is missing.');
  }

  return function (req, res) {
    let command = req.body,
        contentType;

    try {
      contentType = typer.parse(req);
    } catch (ex) {
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

    command = Command.deserialize(command);
    command.addInitiator({ token: req.user });

    const clientMetadata = new ClientMetadata({ req });

    commandStream.write({
      command,
      metadata: { client: clientMetadata }
    });

    res.status(200).end();
  };
};

module.exports = postCommand;
