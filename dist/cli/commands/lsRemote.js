'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var buntstift = require('buntstift');

var ls = require('./ls');

var lsRemote = {
  description: ls.description + ' (deprecated, use ls instead)',
  getOptionDefinitions: ls.getOptionDefinitions,

  run: function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options) {
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return ls.run(options);

            case 2:
              buntstift.warn('The command ls-remote is deprecated and will be removed in a future version, use ls instead.');

            case 3:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    function run(_x) {
      return _ref.apply(this, arguments);
    }

    return run;
  }()
};

module.exports = lsRemote;