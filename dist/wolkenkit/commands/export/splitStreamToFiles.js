'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncIterator"));

var fs = require('fs');

var noop = require('../../../noop');

var splitStreamToFiles =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var eventsPerFile,
        getFileName,
        stream,
        progress,
        currentFileStream,
        numberOfProcessedEvents,
        numberOfWrittenFiles,
        _iteratorNormalCompletion,
        _didIteratorError,
        _iteratorError,
        _iterator,
        _step,
        _value,
        event,
        eventsInCurrentFile,
        fileNumber,
        fileName,
        eventsInNextFile,
        _args = arguments;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            eventsPerFile = _ref.eventsPerFile, getFileName = _ref.getFileName, stream = _ref.stream;
            progress = _args.length > 1 && _args[1] !== undefined ? _args[1] : noop;

            if (eventsPerFile) {
              _context.next = 4;
              break;
            }

            throw new Error('Events per file is missing.');

          case 4:
            if (getFileName) {
              _context.next = 6;
              break;
            }

            throw new Error('Get file name is missing.');

          case 6:
            if (stream) {
              _context.next = 8;
              break;
            }

            throw new Error('Stream is missing.');

          case 8:
            numberOfProcessedEvents = 0, numberOfWrittenFiles = 0;
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 11;
            _iterator = (0, _asyncIterator2.default)(stream);

          case 13:
            _context.next = 15;
            return _iterator.next();

          case 15:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 19;
            return _step.value;

          case 19:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 31;
              break;
            }

            event = _value;
            eventsInCurrentFile = numberOfProcessedEvents % eventsPerFile;

            if (eventsInCurrentFile === 0) {
              fileNumber = numberOfWrittenFiles + 1;
              fileName = getFileName(fileNumber);
              currentFileStream = fs.createWriteStream(fileName, {
                encoding: 'utf8'
              });
              currentFileStream.write('[\n');
            } else {
              currentFileStream.write(',\n');
            }

            currentFileStream.write("  ".concat(JSON.stringify(event)));
            numberOfProcessedEvents += 1;
            eventsInNextFile = numberOfProcessedEvents % eventsPerFile;

            if (eventsInNextFile === 0) {
              currentFileStream.write('\n]\n');
              currentFileStream.end();
              progress({
                message: "Processed ".concat(numberOfProcessedEvents, " events."),
                type: 'info'
              });
              currentFileStream = undefined;
              numberOfWrittenFiles += 1;
            }

          case 28:
            _iteratorNormalCompletion = true;
            _context.next = 13;
            break;

          case 31:
            _context.next = 37;
            break;

          case 33:
            _context.prev = 33;
            _context.t0 = _context["catch"](11);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 37:
            _context.prev = 37;
            _context.prev = 38;

            if (!(!_iteratorNormalCompletion && _iterator.return != null)) {
              _context.next = 42;
              break;
            }

            _context.next = 42;
            return _iterator.return();

          case 42:
            _context.prev = 42;

            if (!_didIteratorError) {
              _context.next = 45;
              break;
            }

            throw _iteratorError;

          case 45:
            return _context.finish(42);

          case 46:
            return _context.finish(37);

          case 47:
            if (currentFileStream) {
              currentFileStream.write('\n]\n');
              currentFileStream.end();
              progress({
                message: "Processed ".concat(numberOfProcessedEvents, " events."),
                type: 'info'
              });
            }

          case 48:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[11, 33, 37, 47], [38,, 42, 46]]);
  }));

  return function splitStreamToFiles(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = splitStreamToFiles;