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
        env,
        sharedKey,
        containers,
        importDirectory,
        progress,
        coreContainer,
        eventStore,
        currentEnvironment,
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
            configuration = _ref.configuration, env = _ref.env, sharedKey = _ref.sharedKey, containers = _ref.containers, importDirectory = _ref.importDirectory;
            progress = _args.length > 1 && _args[1] !== undefined ? _args[1] : noop;

            if (configuration) {
              _context.next = 4;
              break;
            }

            throw new Error('Configuration is missing.');

          case 4:
            if (env) {
              _context.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            if (sharedKey) {
              _context.next = 8;
              break;
            }

            throw new Error('Shared key is missing.');

          case 8:
            if (containers) {
              _context.next = 10;
              break;
            }

            throw new Error('Containers are missing.');

          case 10:
            if (importDirectory) {
              _context.next = 12;
              break;
            }

            throw new Error('Import directory is missing.');

          case 12:
            coreContainer = containers.find(function (container) {
              return container.name.endsWith('core');
            });

            if (coreContainer) {
              _context.next = 15;
              break;
            }

            throw new Error('Invalid operation.');

          case 15:
            /* eslint-disable global-require */
            eventStore = require("wolkenkit-eventstore/".concat(coreContainer.env.EVENTSTORE_TYPE));
            /* eslint-enable global-require */

            currentEnvironment = configuration.environments[env];
            _context.next = 19;
            return eventStore.initialize({
              url: "pg://wolkenkit:".concat(sharedKey, "@").concat(currentEnvironment.api.address.host, ":").concat(currentEnvironment.api.address.port + 3, "/wolkenkit"),
              namespace: "".concat(configuration.application, "domain")
            });

          case 19:
            _context.next = 21;
            return isEventStoreEmpty({
              eventStore: eventStore
            });

          case 21:
            if (_context.sent) {
              _context.next = 24;
              break;
            }

            progress({
              message: 'The event store is not empty.',
              type: 'info'
            });
            throw new errors.EventStoreNotEmpty();

          case 24:
            eventStoreDirectory = path.join(importDirectory, 'event-store');
            _context.next = 27;
            return readdir(eventStoreDirectory);

          case 27:
            entries = _context.sent;
            eventFiles = entries.filter(function (eventFile) {
              return shared.eventFile.isValidFileName(eventFile);
            });
            numberOfEventsPerSave = 1024;
            events = [], numberOfProcessedEvents = 0;
            i = 0;

          case 32:
            if (!(i < eventFiles.length)) {
              _context.next = 82;
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
            _context.prev = 41;
            _iterator = (0, _asyncIterator2.default)(passThrough);

          case 43:
            _context.next = 45;
            return _iterator.next();

          case 45:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 49;
            return _step.value;

          case 49:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 63;
              break;
            }

            data = _value;
            event = Event.wrap(data);
            events.push(event);
            numberOfProcessedEvents += 1;

            if (!(events.length === numberOfEventsPerSave)) {
              _context.next = 60;
              break;
            }

            _context.next = 58;
            return eventStore.saveEvents({
              events: events
            });

          case 58:
            progress({
              message: "Processed ".concat(numberOfProcessedEvents, " events."),
              type: 'info'
            });
            events = [];

          case 60:
            _iteratorNormalCompletion = true;
            _context.next = 43;
            break;

          case 63:
            _context.next = 69;
            break;

          case 65:
            _context.prev = 65;
            _context.t0 = _context["catch"](41);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 69:
            _context.prev = 69;
            _context.prev = 70;

            if (!(!_iteratorNormalCompletion && _iterator.return != null)) {
              _context.next = 74;
              break;
            }

            _context.next = 74;
            return _iterator.return();

          case 74:
            _context.prev = 74;

            if (!_didIteratorError) {
              _context.next = 77;
              break;
            }

            throw _iteratorError;

          case 77:
            return _context.finish(74);

          case 78:
            return _context.finish(69);

          case 79:
            i++;
            _context.next = 32;
            break;

          case 82:
            if (!(events.length > 0)) {
              _context.next = 86;
              break;
            }

            _context.next = 85;
            return eventStore.saveEvents({
              events: events
            });

          case 85:
            progress({
              message: "Processed ".concat(numberOfProcessedEvents, " events."),
              type: 'info'
            });

          case 86:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[41, 65, 69, 79], [70,, 74, 78]]);
  }));

  return function importEventStore(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = importEventStore;