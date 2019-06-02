'use strict';

const fs = require('fs'),
      { PassThrough } = require('stream'),
      path = require('path'),
      { promisify } = require('util');

const jsonStream = require('JSONStream'),
      noop = require('lodash/noop'),
      pump = require('pump');

const errors = require('../../../errors'),
      { Event } = require('../../../../../common/elements'),
      shared = require('../../shared');

const readdir = promisify(fs.readdir);

const checkImportEventStore = async function ({
  importDirectory
}, progress = noop) {
  if (!importDirectory) {
    throw new Error('Import directory is missing.');
  }

  const eventStoreDirectory = path.join(importDirectory, 'event-store');
  const entries = await readdir(eventStoreDirectory);

  if (entries.length === 0) {
    progress({ message: 'The event store directory must not be empty.', type: 'info' });

    throw new errors.DirectoryEmpty();
  }

  const eventFiles = entries.
    filter(eventFile => shared.eventFile.isValidFileName(eventFile));

  if (eventFiles.length === 0) {
    progress({ message: 'No event files found.', type: 'info' });

    throw new errors.ExportNotFound();
  }

  for (const [ index, eventFile ] of eventFiles.entries()) {
    const actualFileNumber = shared.eventFile.getFileNumber(eventFile),
          expectedFileNumber = index + 1;

    if (actualFileNumber !== expectedFileNumber) {
      progress({ message: 'Export is missing event files.', type: 'info' });

      throw new errors.ExportInvalid();
    }
  }

  let expectedPosition = 0;

  for (const eventFile of eventFiles) {
    const eventFileAbsolute = path.join(eventStoreDirectory, eventFile);

    const eventStream = fs.createReadStream(eventFileAbsolute, { encoding: 'utf8' });
    const parseStream = jsonStream.parse('.*');
    const passThrough = new PassThrough({ objectMode: true });

    // We intentionally do not use await here, because we want to process the
    // stream in an asynchronous way further down below.
    pump(eventStream, parseStream, passThrough);

    for await (const data of passThrough) {
      let event;

      try {
        event = Event.wrap(data);
      } catch {
        progress({ message: 'Export contains malformed events.', type: 'info' });

        throw new errors.ExportInvalid();
      }

      const actualPosition = event.metadata.position;

      expectedPosition += 1;

      if (actualPosition !== expectedPosition) {
        progress({ message: 'Export is missing events.', type: 'info' });

        throw new errors.ExportInvalid();
      }
    }
  }
};

module.exports = checkImportEventStore;
