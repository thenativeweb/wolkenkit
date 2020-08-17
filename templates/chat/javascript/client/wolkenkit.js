'use strict';

/* global window */

const parseNewlineDelimitedStream = function (stream) {
  if (!stream) {
    throw new Error('Stream is missing.');
  }

  let isCanceled = false,
      reader;

  return new window.ReadableStream({
    async start (controller) {
      reader = stream.getReader();

      const decoder = new window.TextDecoder();
      let buffer = '';

      /* eslint-disable no-constant-condition */
      while (true) {
      /* eslint-enable no-constant-condition */
        const { value, done } = await reader.read();

        if (done) {
          if (isCanceled) {
            return;
          }

          buffer = buffer.trim();
          if (buffer.length > 0) {
            try {
              const parsedLine = JSON.parse(buffer);
              const processedLine = process(parsedLine);

              if (processedLine) {
                controller.enqueue(processedLine);
              }
            } catch (ex) {
              return controller.error(ex);
            }
          }

          return controller.close();
        }

        const data = decoder.decode(value, { stream: true });

        buffer += data;

        const lines = buffer.split('\n');

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();

          if (line.length > 0) {
            try {
              const parsedLine = JSON.parse(line);

              controller.enqueue(parsedLine);
            } catch (ex) {
              isCanceled = true;
              controller.error(ex);

              return reader.cancel();
            }
          }
        }

        buffer = lines[lines.length - 1];
      }
    },

    cancel () {
      isCanceled = true;
      reader.cancel();
    }
  });
};

const getIterator = function (stream) {
  if (!stream) {
    throw new Error('Stream is missing.');
  }

  const reader = parseNewlineDelimitedStream(stream).getReader();

  return {
    next () {
      return reader.read();
    },

    return () {
      reader.cancel();

      return {};
    },

    [Symbol.asyncIterator] () {
      return this;
    }
  };
};

class Wolkenkit {
  constructor ({ protocol = 'http', hostName = 'localhost', port = 3000 } = {}) {
    this.protocol = protocol;
    this.hostName = hostName;
    this.port = port;
  }

  async issueCommand ({ contextIdentifier, aggregateIdentifier, name, data }) {
    let url;

    if (aggregateIdentifier.id) {
      url = `${this.protocol}://${this.hostName}:${this.port}/command/v2/${contextIdentifier.name}/${aggregateIdentifier.name}/${aggregateIdentifier.id}/${name}`;
    } else {
      url = `${this.protocol}://${this.hostName}:${this.port}/command/v2/${contextIdentifier.name}/${aggregateIdentifier.name}/${name}`;
    }

    let response;

    try {
      response = await window.fetch(url, {
        method: 'post',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (ex) {
      throw new Error(`Failed to issue command. ${ex.message}`);
    }

    if (response.status !== 200) {
      throw new Error(`Failed to issue command. Unexpected status code '${response.status}'.`);
    }

    const result = await response.json();

    return result;
  }

  async queryView ({ viewName, queryName }) {
    const url = `${this.protocol}://${this.hostName}:${this.port}/views/v2/${viewName}/${queryName}`;

    let response;

    try {
      response = await window.fetch(url);
    } catch (ex) {
      throw new Error(`Failed to query view. ${ex.message}`);
    }

    if (response.status !== 200) {
      throw new Error(`Failed to query view. Unexpected status code '${response.status}'.`);
    }

    const iterator = getIterator(response.body);

    return iterator;
  }

  observeDomainEvents (callback) {
    (async () => {
      const url = `${this.protocol}://${this.hostName}:${this.port}/domain-events/v2`;

      let response;

      try {
        response = await window.fetch(url);
      } catch (ex) {
        throw new Error(`Failed to observe domain events. ${ex.message}`);
      }

      if (response.status !== 200) {
        throw new Error(`Failed to observe domain events. Unexpected status code '${response.status}'.`);
      }

      const iterator = getIterator(response.body);

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value } = await iterator.next();

        if (value.name === 'heartbeat') {
          continue;
        }

        // eslint-disable-next-line callback-return
        await callback(value);
      }
    })();
  }
}

window.Wolkenkit = Wolkenkit;
