'use strict';

const flaschenpost = require('flaschenpost'),
      typer = require('content-type');

const { EventInternal } = require('../../../../common/elements');

const logger = flaschenpost.getLogger();

const postEvent = function ({ onReceiveEvent, application }) {
  if (!onReceiveEvent) {
    throw new Error('On receive event is missing.');
  }
  if (!application) {
    throw new Error('Application is missing.');
  }

  return async function (req, res) {
    let contentType,
        event = req.body;

    try {
      contentType = typer.parse(req);
    } catch {
      return res.status(415).send('Header content-type must be application/json.');
    }

    if (contentType.type !== 'application/json') {
      return res.status(415).send('Header content-type must be application/json.');
    }

    try {
      EventInternal.validate({ event, application });
    } catch (ex) {
      return res.status(400).send(ex.message);
    }

    event = EventInternal.fromObject(event);

    logger.info('Event received.', { event });

    try {
      await onReceiveEvent({ event });
    } catch {
      res.status(500).end();

      return;
    }

    res.status(200).end();
  };
};

module.exports = postEvent;
