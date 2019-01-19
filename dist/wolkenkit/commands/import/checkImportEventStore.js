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

            if (importDirectory) {
              _context.next = 4;
              break;
            }

            throw new Error('Import directory is missing.');

          case 4:
            eventStoreDirectory = path.join(importDirectory, 'event-store');
            _context.next = 7;
            return readdir(eventStoreDirectory);

          case 7:
            entries = _context.sent;

            if (!(entries.length === 0)) {
              _context.next = 11;
              break;
            }

            progress({
              message: 'The event store directory must not be empty.',
              type: 'info'
            });
            throw new errors.DirectoryEmpty();

          case 11:
            eventFiles = entries.filter(function (eventFile) {
              return shared.eventFile.isValidFileName(eventFile);
            });

            if (!(eventFiles.length === 0)) {
              _context.next = 15;
              break;
            }

            progress({
              message: 'No event files found.',
              type: 'info'
            });
            throw new errors.ExportNotFound();

          case 15:
            i = 0;

          case 16:
            if (!(i < eventFiles.length)) {
              _context.next = 25;
              break;
            }

            eventFile = eventFiles[i];
            actualFileNumber = shared.eventFile.getFileNumber(eventFile), expectedFileNumber = i + 1;

            if (!(actualFileNumber !== expectedFileNumber)) {
              _context.next = 22;
              break;
            }

            progress({
              message: 'Export is missing event files.',
              type: 'info'
            });
            throw new errors.ExportInvalid();

          case 22:
            i++;
            _context.next = 16;
            break;

          case 25:
            expectedPosition = 0;
            _i = 0;

          case 27:
            if (!(_i < eventFiles.length)) {
              _context.next = 83;
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
            _context.prev = 36;
            _iterator = (0, _asyncIterator2.default)(passThrough);

          case 38:
            _context.next = 40;
            return _iterator.next();

          case 40:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 44;
            return _step.value;

          case 44:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 64;
              break;
            }

            data = _value;
            event = void 0;
            _context.prev = 48;
            event = Event.wrap(data);
            _context.next = 56;
            break;

          case 52:
            _context.prev = 52;
            _context.t0 = _context["catch"](48);
            progress({
              message: 'Export contains malformed events.',
              type: 'info'
            });
            throw new errors.ExportInvalid();

          case 56:
            actualPosition = event.metadata.position;
            expectedPosition += 1;

            if (!(actualPosition !== expectedPosition)) {
              _context.next = 61;
              break;
            }

            progress({
              message: 'Export is missing events.',
              type: 'info'
            });
            throw new errors.ExportInvalid();

          case 61:
            _iteratorNormalCompletion = true;
            _context.next = 38;
            break;

          case 64:
            _context.next = 70;
            break;

          case 66:
            _context.prev = 66;
            _context.t1 = _context["catch"](36);
            _didIteratorError = true;
            _iteratorError = _context.t1;

          case 70:
            _context.prev = 70;
            _context.prev = 71;

            if (!(!_iteratorNormalCompletion && _iterator.return != null)) {
              _context.next = 75;
              break;
            }

            _context.next = 75;
            return _iterator.return();

          case 75:
            _context.prev = 75;

            if (!_didIteratorError) {
              _context.next = 78;
              break;
            }

            throw _iteratorError;

          case 78:
            return _context.finish(75);

          case 79:
            return _context.finish(70);

          case 80:
            _i++;
            _context.next = 27;
            break;

          case 83:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[36, 66, 70, 80], [48, 52], [71,, 75, 79]]);
  }));

  return function checkImportEventStore(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = checkImportEventStore;