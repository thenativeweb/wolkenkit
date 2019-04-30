'use strict';

const flaschenpost = require('flaschenpost'),
      partOf = require('partof'),
      pEvent = require('p-event');

const ClientMetadata = require('../ClientMetadata'),
      streamToClient = require('../streamToClient');

const logger = flaschenpost.getLogger();

const getEvents = function ({
  eventStream,
  prepareEventForForwarding,
  heartbeatInterval
}) {
  if (!eventStream) {
    throw new Error('Event stream is missing.');
  }
  if (!prepareEventForForwarding) {
    throw new Error('Prepare event for forwarding is missing.');
  }
  if (!heartbeatInterval) {
    throw new Error('Heartbeat interval is missing.');
  }

  return async function (req, res) {
    const clientMetadata = new ClientMetadata({ req });
    const filter = req.body || {};

    // We need to keep the api outgoing stream open, even if the client
    // disconnects. Hence we can not use for await of on the stream directly,
    // but need to wrap it in an async iterator that decouples the stream
    // from the consumer.
    const stream = pEvent.iterator(eventStream, 'data', {
      resolutionEvents: [ 'end' ]
    });

    await streamToClient({
      req,
      res,
      stream,
      heartbeatInterval,
      async handle ({ event, metadata }) {
        if (!partOf(filter, event)) {
          return;
        }

        let preparedEvent;

        try {
          preparedEvent = await prepareEventForForwarding({
            event,
            metadata: { ...metadata, client: clientMetadata }
          });
        } catch (ex) {
          logger.error('Prepare event for forwarding failed.', { ex });

          // Ignore the error, and hope that prepareEventForForwarding has proper
          // exception handling and does something reasonable. However, we drop
          // this event here.
          return;
        }

        return preparedEvent;
      }
    });
  };
};

module.exports = getEvents;
