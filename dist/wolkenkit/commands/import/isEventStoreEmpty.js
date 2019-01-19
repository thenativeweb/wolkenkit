'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncIterator"));

var isEventStoreEmpty =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var eventStore, replayStream, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, event;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            eventStore = _ref.eventStore;

            if (eventStore) {
              _context.next = 3;
              break;
            }

            throw new Error('Event store is missing.');

          case 3:
            _context.next = 5;
            return eventStore.getReplay({
              fromPosition: 1,
              toPosition: 1
            });

          case 5:
            replayStream = _context.sent;

            /* eslint-disable no-unused-vars */
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 8;
            _iterator = (0, _asyncIterator2.default)(replayStream);

          case 10:
            _context.next = 12;
            return _iterator.next();

          case 12:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 16;
            return _step.value;

          case 16:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 23;
              break;
            }

            event = _value;
            return _context.abrupt("return", false);

          case 20:
            _iteratorNormalCompletion = true;
            _context.next = 10;
            break;

          case 23:
            _context.next = 29;
            break;

          case 25:
            _context.prev = 25;
            _context.t0 = _context["catch"](8);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 29:
            _context.prev = 29;
            _context.prev = 30;

            if (!(!_iteratorNormalCompletion && _iterator.return != null)) {
              _context.next = 34;
              break;
            }

            _context.next = 34;
            return _iterator.return();

          case 34:
            _context.prev = 34;

            if (!_didIteratorError) {
              _context.next = 37;
              break;
            }

            throw _iteratorError;

          case 37:
            return _context.finish(34);

          case 38:
            return _context.finish(29);

          case 39:
            return _context.abrupt("return", true);

          case 40:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[8, 25, 29, 39], [30,, 34, 38]]);
  }));

  return function isEventStoreEmpty(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = isEventStoreEmpty;