'use strict';

const fs = require('fs');

const noop = require('../../../../noop');

const splitStreamToFiles = async function ({
  eventsPerFile,
  getFileName,
  stream
}, progress = noop) {
  if (!eventsPerFile) {
    throw new Error('Events per file is missing.');
  }
  if (!getFileName) {
    throw new Error('Get file name is missing.');
  }
  if (!stream) {
    throw new Error('Stream is missing.');
  }

  let currentFileStream,
      numberOfProcessedEvents = 0,
      numberOfWrittenFiles = 0;

  for await (const event of stream) {
    const eventsInCurrentFile = numberOfProcessedEvents % eventsPerFile;

    if (eventsInCurrentFile === 0) {
      const fileNumber = numberOfWrittenFiles + 1;
      const fileName = getFileName(fileNumber);

      currentFileStream = fs.createWriteStream(fileName, { encoding: 'utf8' });
      currentFileStream.write('[\n');
    } else {
      currentFileStream.write(',\n');
    }

    currentFileStream.write(`  ${JSON.stringify(event)}`);
    numberOfProcessedEvents += 1;

    const eventsInNextFile = numberOfProcessedEvents % eventsPerFile;

    if (eventsInNextFile === 0) {
      currentFileStream.write('\n]\n');
      currentFileStream.end();

      progress({ message: `Processed ${numberOfProcessedEvents} events.`, type: 'info' });

      currentFileStream = undefined;
      numberOfWrittenFiles += 1;
    }
  }

  if (currentFileStream) {
    currentFileStream.write('\n]\n');
    currentFileStream.end();

    progress({ message: `Processed ${numberOfProcessedEvents} events.`, type: 'info' });
  }
};

module.exports = splitStreamToFiles;
