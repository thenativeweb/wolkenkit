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
            _context.next = 3;
            return eventStore.getReplay({
              fromPosition: 1,
              toPosition: 1
            });

          case 3:
            replayStream = _context.sent;

            /* eslint-disable no-unused-vars */
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 6;
            _iterator = (0, _asyncIterator2.default)(replayStream);

          case 8:
            _context.next = 10;
            return _iterator.next();

          case 10:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 14;
            return _step.value;

          case 14:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 21;
              break;
            }

            event = _value;
            return _context.abrupt("return", false);

          case 18:
            _iteratorNormalCompletion = true;
            _context.next = 8;
            break;

          case 21:
            _context.next = 27;
            break;

          case 23:
            _context.prev = 23;
            _context.t0 = _context["catch"](6);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 27:
            _context.prev = 27;
            _context.prev = 28;

            if (!(!_iteratorNormalCompletion && _iterator.return != null)) {
              _context.next = 32;
              break;
            }

            _context.next = 32;
            return _iterator.return();

          case 32:
            _context.prev = 32;

            if (!_didIteratorError) {
              _context.next = 35;
              break;
            }

            throw _iteratorError;

          case 35:
            return _context.finish(32);

          case 36:
            return _context.finish(27);

          case 37:
            return _context.abrupt("return", true);

          case 38:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[6, 23, 27, 37], [28,, 32, 36]]);
  }));

  return function isEventStoreEmpty(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = isEventStoreEmpty;