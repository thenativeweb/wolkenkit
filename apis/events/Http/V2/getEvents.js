'use strict';

const uuid = require('uuidv4');

const getEvents = function ({ connections, writeLine, heartbeatInterval }) {
  if (!connections) {
    throw new Error('Connections are missing.');
  }
  if (!writeLine) {
    throw new Error('Write line is missing.');
  }
  if (!heartbeatInterval) {
    throw new Error('Heartbeat interval is missing.');
  }

  return async function (req, res) {
    const connectionId = uuid();
    let heartbeatIntervalId;

    req.setTimeout(0);
    res.setTimeout(0);

    const onClose = function () {
      res.socket.removeListener('close', onClose);
      clearInterval(heartbeatIntervalId);
      Reflect.deleteProperty(connections, connectionId);
    };

    res.socket.once('close', onClose);
    res.writeHead(200, { 'content-type': 'application/x-ndjson' });

    /* eslint-disable no-param-reassign */
    connections[connectionId] = { req, res };
    /* eslint-enable no-param-reassign */

    // Send an initial heartbeat to initialize the connection. If we do not do
    // this, sometimes the connection does not become open until the first data
    // is sent.
    writeLine({ connectionId, data: { name: 'heartbeat' }});

    heartbeatIntervalId = setInterval(() => {
      writeLine({ connectionId, data: { name: 'heartbeat' }});
    }, heartbeatInterval);
  };
};

module.exports = getEvents;
