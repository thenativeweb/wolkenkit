'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getLatestVersion = require('./getLatestVersion'),
    getNumberedVersions = require('./getNumberedVersions');

var getAllVersions = function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
            var latestVersion, numberedVersions, versions;
            return _regenerator2.default.wrap(function _callee$(_context) {
                  while (1) {
                        switch (_context.prev = _context.next) {
                              case 0:
                                    _context.next = 2;
                                    return getLatestVersion();

                              case 2:
                                    latestVersion = _context.sent;
                                    _context.next = 5;
                                    return getNumberedVersions();

                              case 5:
                                    numberedVersions = _context.sent;
                                    versions = [latestVersion].concat((0, _toConsumableArray3.default)(numberedVersions));
                                    return _context.abrupt('return', versions);

                              case 8:
                              case 'end':
                                    return _context.stop();
                        }
                  }
            }, _callee, this);
      }));

      return function getAllVersions() {
            return _ref.apply(this, arguments);
      };
}();

module.exports = getAllVersions;