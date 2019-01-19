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
        connections,
        exportDirectory,
        sharedKey,
        progress,
        eventStoreDirectory,
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
        replayStream,
        eventsPerFile,
        _args = arguments;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration, connections = _ref.connections, exportDirectory = _ref.exportDirectory, sharedKey = _ref.sharedKey;
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
            if (exportDirectory) {
              _context.next = 8;
              break;
            }

            throw new Error('Export directory is missing.');

          case 8:
            if (sharedKey) {
              _context.next = 10;
              break;
            }

            throw new Error('Shared key is missing.');

          case 10:
            eventStoreDirectory = path.join(exportDirectory, 'event-store');
            _context.next = 13;
            return shell.mkdir('-p', eventStoreDirectory);

          case 13:
            _connections$eventSto = connections.eventStore, type = _connections$eventSto.type, external = _connections$eventSto.external;
            _external$pg = external.pg, protocol = _external$pg.protocol, user = _external$pg.user, password = _external$pg.password, hostname = _external$pg.hostname, port = _external$pg.port, database = _external$pg.database;
            /* eslint-disable global-require */

            eventStore = require("wolkenkit-eventstore/".concat(type));
            /* eslint-enable global-require */

            _context.next = 18;
            return eventStore.initialize({
              url: "".concat(protocol, "://").concat(user, ":").concat(password, "@").concat(hostname, ":").concat(port, "/").concat(database),
              namespace: "".concat(configuration.application.name, "domain")
            });

          case 18:
            _context.next = 20;
            return eventStore.getReplay();

          case 20:
            replayStream = _context.sent;
            eventsPerFile = Math.pow(2, 16);
            _context.next = 24;
            return splitStreamToFiles({
              stream: replayStream,
              getFileName: function getFileName(fileNumber) {
                var fileName = shared.eventFile.getFileName(fileNumber);
                var fileNameAbsolute = path.join(eventStoreDirectory, fileName);
                return fileNameAbsolute;
              },
              eventsPerFile: eventsPerFile
            }, progress);

          case 24:
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