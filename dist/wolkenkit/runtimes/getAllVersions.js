'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var getLatestVersion = require('./getLatestVersion'),
    getNumberedVersions = require('./getNumberedVersions');

var getAllVersions = function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
            var latestVersion, numberedVersions, versions;
            return regeneratorRuntime.wrap(function _callee$(_context) {
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
                                    versions = [latestVersion].concat(_toConsumableArray(numberedVersions));
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