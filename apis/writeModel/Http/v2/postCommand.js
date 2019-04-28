'use strict';

const typer = require('content-type');

const { AppService, ClientService, LoggerService } = require('../../../../common/services'),
      ClientMetadata = require('../ClientMetadata'),
      { Command } = require('../../../../common/elements'),
      validateCommand = require('./validateCommand');

const postCommand = function ({ commandStream, application, repository }) {
  if (!commandStream) {
    throw new Error('Command stream is missing.');
  }
  if (!application) {
    throw new Error('Application is missing.');
  }
  if (!repository) {
    throw new Error('Repository is missing.');
  }

  const { writeModel } = application;

  return async function (req, res) {
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

    const metadata = {
      client: new ClientMetadata({ req })
    };

    const services = {
      app: new AppService({ application, repository, capabilities: { readAggregates: true }}),
      client: new ClientService({ metadata }),
      logger: new LoggerService({ fileName: `/server/writeModel/${command.context.name}/${command.aggregate.name}.js` })
    };

    try {
      const aggregate = await repository.loadAggregate({
        contextName: command.context.name,
        aggregateName: command.aggregate.name,
        aggregateId: command.aggregate.id
      });

      const { isAuthorized } =
        writeModel[command.context.name][command.aggregate.name].commands[command.name];

      const isCommandAuthorized =
        await isAuthorized(aggregate.api.forReadOnly, command, services);

      if (!isCommandAuthorized) {
        return res.status(401).send('Access denied.');
      }
    } catch (ex) {
      return res.status(401).send('Access denied.');
    }

    commandStream.write({ command, metadata });

    res.status(200).end();
  };
};

module.exports = postCommand;
