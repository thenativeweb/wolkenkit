'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var path = require('path');

var noop = require('../../../noop'),
    shared = require('../shared'),
    shell = require('../../../shell'),
    splitStreamToFiles = require('./splitStreamToFiles');

var exportEventStore =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var configuration,
        env,
        containers,
        sharedKey,
        exportDirectory,
        progress,
        eventStoreDirectory,
        coreContainer,
        eventStore,
        currentEnvironment,
        replayStream,
        eventsPerFile,
        _args = arguments;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration, env = _ref.env, containers = _ref.containers, sharedKey = _ref.sharedKey, exportDirectory = _ref.exportDirectory;
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
            if (containers) {
              _context.next = 8;
              break;
            }

            throw new Error('Containers are missing.');

          case 8:
            if (sharedKey) {
              _context.next = 10;
              break;
            }

            throw new Error('Shared key is missing.');

          case 10:
            if (exportDirectory) {
              _context.next = 12;
              break;
            }

            throw new Error('Export directory is missing.');

          case 12:
            eventStoreDirectory = path.join(exportDirectory, 'event-store');
            _context.next = 15;
            return shell.mkdir('-p', eventStoreDirectory);

          case 15:
            coreContainer = containers.find(function (container) {
              return container.name.endsWith('core');
            });

            if (coreContainer) {
              _context.next = 18;
              break;
            }

            throw new Error('Invalid operation.');

          case 18:
            /* eslint-disable global-require */
            eventStore = require("wolkenkit-eventstore/".concat(coreContainer.env.EVENTSTORE_TYPE));
            /* eslint-enable global-require */

            currentEnvironment = configuration.environments[env];
            _context.next = 22;
            return eventStore.initialize({
              url: "pg://wolkenkit:".concat(sharedKey, "@").concat(currentEnvironment.api.address.host, ":").concat(currentEnvironment.api.address.port + 3, "/wolkenkit"),
              namespace: "".concat(configuration.application, "domain")
            });

          case 22:
            _context.next = 24;
            return eventStore.getReplay();

          case 24:
            replayStream = _context.sent;
            eventsPerFile = Math.pow(2, 16);
            _context.next = 28;
            return splitStreamToFiles({
              stream: replayStream,
              getFileName: function getFileName(fileNumber) {
                var fileName = shared.eventFile.getFileName(fileNumber);
                var fileNameAbsolute = path.join(eventStoreDirectory, fileName);
                return fileNameAbsolute;
              },
              eventsPerFile: eventsPerFile
            }, progress);

          case 28:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function exportEventStore(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = exportEventStore;