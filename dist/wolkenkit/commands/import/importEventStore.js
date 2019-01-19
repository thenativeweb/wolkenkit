'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncIterator"));

var fs = require('fs'),
    _require = require('stream'),
    PassThrough = _require.PassThrough,
    path = require('path');

var _require2 = require('commands-events'),
    Event = _require2.Event,
    jsonStream = require('JSONStream'),
    promisify = require('util.promisify'),
    pump = require('pump');

var errors = require('../../../errors'),
    isEventStoreEmpty = require('./isEventStoreEmpty'),
    noop = require('../../../noop'),
    shared = require('../shared');

var readdir = promisify(fs.readdir);

var importEventStore =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var configuration,
        connections,
        importDirectory,
        sharedKey,
        progress,
        _connections$eventSto,
        type,
        external,
        _external$pg,
        protocol,
        user,
        password,
        hostname,
        port,
        database,
        eventStore,
        eventStoreDirectory,
        entries,
        eventFiles,
        numberOfEventsPerSave,
        events,
        numberOfProcessedEvents,
        i,
        eventFile,
        eventFileAbsolute,
        eventStream,
        parseStream,
        passThrough,
        _iteratorNormalCompletion,
        _didIteratorError,
        _iteratorError,
        _iterator,
        _step,
        _value,
        data,
        event,
        _args = arguments;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration, connections = _ref.connections, importDirectory = _ref.importDirectory, sharedKey = _ref.sharedKey;
            progress = _args.length > 1 && _args[1] !== undefined ? _args[1] : noop;

            if (configuration) {
              _context.next = 4;
              break;
            }

            throw new Error('Configuration is missing.');

          case 4:
            if (connections) {
              _context.next = 6;
              break;
            }

            throw new Error('Connections are missing.');

          case 6:
            if (importDirectory) {
              _context.next = 8;
              break;
            }

            throw new Error('Import directory is missing.');

          case 8:
            if (sharedKey) {
              _context.next = 10;
              break;
            }

            throw new Error('Shared key is missing.');

          case 10:
            _connections$eventSto = connections.eventStore, type = _connections$eventSto.type, external = _connections$eventSto.external;
            _external$pg = external.pg, protocol = _external$pg.protocol, user = _external$pg.user, password = _external$pg.password, hostname = _external$pg.hostname, port = _external$pg.port, database = _external$pg.database;
            /* eslint-disable global-require */

            eventStore = require("wolkenkit-eventstore/".concat(type));
            /* eslint-enable global-require */

            _context.next = 15;
            return eventStore.initialize({
              url: "".concat(protocol, "://").concat(user, ":").concat(password, "@").concat(hostname, ":").concat(port, "/").concat(database),
              namespace: "".concat(configuration.application.name, "domain")
            });

          case 15:
            _context.next = 17;
            return isEventStoreEmpty({
              eventStore: eventStore
            });

          case 17:
            if (_context.sent) {
              _context.next = 20;
              break;
            }

            progress({
              message: 'The event store is not empty.',
              type: 'info'
            });
            throw new errors.EventStoreNotEmpty();

          case 20:
            eventStoreDirectory = path.join(importDirectory, 'event-store');
            _context.next = 23;
            return readdir(eventStoreDirectory);

          case 23:
            entries = _context.sent;
            eventFiles = entries.filter(function (eventFile) {
              return shared.eventFile.isValidFileName(eventFile);
            });
            numberOfEventsPerSave = 1024;
            events = [], numberOfProcessedEvents = 0;
            i = 0;

          case 28:
            if (!(i < eventFiles.length)) {
              _context.next = 78;
              break;
            }

            eventFile = eventFiles[i];
            eventFileAbsolute = path.join(eventStoreDirectory, eventFile);
            eventStream = fs.createReadStream(eventFileAbsolute, {
              encoding: 'utf8'
            });
            parseStream = jsonStream.parse('.*');
            passThrough = new PassThrough({
              objectMode: true
            }); // We intentionally do not use await here, because we want to process the
            // stream in an asynchronous way further down below.

            pump(eventStream, parseStream, passThrough);
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 37;
            _iterator = (0, _asyncIterator2.default)(passThrough);

          case 39:
            _context.next = 41;
            return _iterator.next();

          case 41:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 45;
            return _step.value;

          case 45:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 59;
              break;
            }

            data = _value;
            event = Event.wrap(data);
            events.push(event);
            numberOfProcessedEvents += 1;

            if (!(events.length === numberOfEventsPerSave)) {
              _context.next = 56;
              break;
            }

            _context.next = 54;
            return eventStore.saveEvents({
              events: events
            });

          case 54:
            progress({
              message: "Processed ".concat(numberOfProcessedEvents, " events."),
              type: 'info'
            });
            events = [];

          case 56:
            _iteratorNormalCompletion = true;
            _context.next = 39;
            break;

          case 59:
            _context.next = 65;
            break;

          case 61:
            _context.prev = 61;
            _context.t0 = _context["catch"](37);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 65:
            _context.prev = 65;
            _context.prev = 66;

            if (!(!_iteratorNormalCompletion && _iterator.return != null)) {
              _context.next = 70;
              break;
            }

            _context.next = 70;
            return _iterator.return();

          case 70:
            _context.prev = 70;

            if (!_didIteratorError) {
              _context.next = 73;
              break;
            }

            throw _iteratorError;

          case 73:
            return _context.finish(70);

          case 74:
            return _context.finish(65);

          case 75:
            i++;
            _context.next = 28;
            break;

          case 78:
            if (!(events.length > 0)) {
              _context.next = 82;
              break;
            }

            _context.next = 81;
            return eventStore.saveEvents({
              events: events
            });

          case 81:
            progress({
              message: "Processed ".concat(numberOfProcessedEvents, " events."),
              type: 'info'
            });

          case 82:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[37, 61, 65, 75], [66,, 70, 74]]);
  }));

  return function importEventStore(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = importEventStore;