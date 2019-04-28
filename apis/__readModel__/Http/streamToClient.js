'use strict';

const streamToClient = async function ({
  req,
  res,
  stream,
  handle,
  heartbeatInterval
}) {
  if (!req) {
    throw new Error('Request is missing.');
  }
  if (!res) {
    throw new Error('Response is missing.');
  }
  if (!stream) {
    throw new Error('Stream is missing.');
  }
  if (!handle) {
    throw new Error('Handle item is missing.');
  }
  if (!heartbeatInterval) {
    throw new Error('Heartbeat interval is missing.');
  }

  req.setTimeout(0);
  res.setTimeout(0);

  let isClientConnected = true;

  const onClose = function () {
    isClientConnected = false;
  };

  res.socket.once('close', onClose);

  const writeLine = function (data) {
    if (!data) {
      throw new Error('Data is missing.');
    }

    try {
      res.write(`${JSON.stringify(data)}\n`);
    } catch (ex) {
      if (ex.message === 'write after end') {
        // Ignore write after end errors. This simply means that the connection
        // was closed concurrently, and we can't do anything about it anyway.
        // Hence, simply return.
        isClientConnected = false;

        return;
      }

      throw ex;
    }
  };

  res.writeHead(200, {
    'content-type': 'application/x-ndjson'
  });

  const intervalId = setInterval(() => {
    writeLine({ name: 'heartbeat' });
  }, heartbeatInterval);

  for await (const item of stream) {
    if (!isClientConnected) {
      break;
    }

    const handledItem = await handle(item);

    if (!handledItem) {
      continue;
    }

    writeLine(handledItem);
  }

  clearInterval(intervalId);

  res.socket.removeListener('close', onClose);
  res.end();
};

module.exports = streamToClient;
