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
    noop = require('../../../noop'),
    shared = require('../shared');

var readdir = promisify(fs.readdir);

var checkImportEventStore =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var importDirectory,
        progress,
        eventStoreDirectory,
        entries,
        eventFiles,
        i,
        eventFile,
        actualFileNumber,
        expectedFileNumber,
        expectedPosition,
        _i,
        _eventFile,
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
        actualPosition,
        _args = arguments;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            importDirectory = _ref.importDirectory;
            progress = _args.length > 1 && _args[1] !== undefined ? _args[1] : noop;
            eventStoreDirectory = path.join(importDirectory, 'event-store');
            _context.next = 5;
            return readdir(eventStoreDirectory);

          case 5:
            entries = _context.sent;

            if (!(entries.length === 0)) {
              _context.next = 9;
              break;
            }

            progress({
              message: 'The event store directory must not be empty.',
              type: 'info'
            });
            throw new errors.DirectoryEmpty();

          case 9:
            eventFiles = entries.filter(function (eventFile) {
              return shared.eventFile.isValidFileName(eventFile);
            });

            if (!(eventFiles.length === 0)) {
              _context.next = 13;
              break;
            }

            progress({
              message: 'No event files found.',
              type: 'info'
            });
            throw new errors.ExportNotFound();

          case 13:
            i = 0;

          case 14:
            if (!(i < eventFiles.length)) {
              _context.next = 23;
              break;
            }

            eventFile = eventFiles[i];
            actualFileNumber = shared.eventFile.getFileNumber(eventFile), expectedFileNumber = i + 1;

            if (!(actualFileNumber !== expectedFileNumber)) {
              _context.next = 20;
              break;
            }

            progress({
              message: 'Export is missing event files.',
              type: 'info'
            });
            throw new errors.ExportInvalid();

          case 20:
            i++;
            _context.next = 14;
            break;

          case 23:
            expectedPosition = 0;
            _i = 0;

          case 25:
            if (!(_i < eventFiles.length)) {
              _context.next = 81;
              break;
            }

            _eventFile = eventFiles[_i];
            eventFileAbsolute = path.join(eventStoreDirectory, _eventFile);
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
            _context.prev = 34;
            _iterator = (0, _asyncIterator2.default)(passThrough);

          case 36:
            _context.next = 38;
            return _iterator.next();

          case 38:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 42;
            return _step.value;

          case 42:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 62;
              break;
            }

            data = _value;
            event = void 0;
            _context.prev = 46;
            event = Event.wrap(data);
            _context.next = 54;
            break;

          case 50:
            _context.prev = 50;
            _context.t0 = _context["catch"](46);
            progress({
              message: 'Export contains malformed events.',
              type: 'info'
            });
            throw new errors.ExportInvalid();

          case 54:
            actualPosition = event.metadata.position;
            expectedPosition += 1;

            if (!(actualPosition !== expectedPosition)) {
              _context.next = 59;
              break;
            }

            progress({
              message: 'Export is missing events.',
              type: 'info'
            });
            throw new errors.ExportInvalid();

          case 59:
            _iteratorNormalCompletion = true;
            _context.next = 36;
            break;

          case 62:
            _context.next = 68;
            break;

          case 64:
            _context.prev = 64;
            _context.t1 = _context["catch"](34);
            _didIteratorError = true;
            _iteratorError = _context.t1;

          case 68:
            _context.prev = 68;
            _context.prev = 69;

            if (!(!_iteratorNormalCompletion && _iterator.return != null)) {
              _context.next = 73;
              break;
            }

            _context.next = 73;
            return _iterator.return();

          case 73:
            _context.prev = 73;

            if (!_didIteratorError) {
              _context.next = 76;
              break;
            }

            throw _iteratorError;

          case 76:
            return _context.finish(73);

          case 77:
            return _context.finish(68);

          case 78:
            _i++;
            _context.next = 25;
            break;

          case 81:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[34, 64, 68, 78], [46, 50], [69,, 73, 77]]);
  }));

  return function checkImportEventStore(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = checkImportEventStore;