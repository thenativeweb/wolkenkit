'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var switchSemver = require('../../../switchSemver'),
    validateLogs = require('./validateLogs'),
    waitForApplication = require('./waitForApplication');

var waitForApplicationAndValidateLogs =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee4(options, progress) {
    var configuration, env, version;
    return _regenerator.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (options) {
              _context4.next = 2;
              break;
            }

            throw new Error('Options are missing.');

          case 2:
            if (options.configuration) {
              _context4.next = 4;
              break;
            }

            throw new Error('Configuration is missing.');

          case 4:
            if (options.env) {
              _context4.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            if (progress) {
              _context4.next = 8;
              break;
            }

            throw new Error('Progress is missing.');

          case 8:
            configuration = options.configuration, env = options.env;
            version = configuration.runtime.version;
            _context4.next = 12;
            return switchSemver(version, {
              '<= 2.0.0': function () {
                var _2 = (0, _asyncToGenerator2.default)(
                /*#__PURE__*/
                _regenerator.default.mark(function _callee() {
                  return _regenerator.default.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          _context.next = 2;
                          return waitForApplication({
                            configuration: configuration,
                            env: env
                          }, progress);

                        case 2:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee, this);
                }));

                return function _() {
                  return _2.apply(this, arguments);
                };
              }(),
              default: function () {
                var _default2 = (0, _asyncToGenerator2.default)(
                /*#__PURE__*/
                _regenerator.default.mark(function _callee3() {
                  return _regenerator.default.wrap(function _callee3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          _context3.next = 2;
                          return new Promise(
                          /*#__PURE__*/
                          function () {
                            var _ref2 = (0, _asyncToGenerator2.default)(
                            /*#__PURE__*/
                            _regenerator.default.mark(function _callee2(resolve, reject) {
                              var validate;
                              return _regenerator.default.wrap(function _callee2$(_context2) {
                                while (1) {
                                  switch (_context2.prev = _context2.next) {
                                    case 0:
                                      _context2.prev = 0;
                                      _context2.next = 3;
                                      return validateLogs({
                                        configuration: configuration,
                                        env: env
                                      }, progress);

                                    case 3:
                                      validate = _context2.sent;
                                      validate.once('error', reject);
                                      _context2.next = 7;
                                      return waitForApplication({
                                        configuration: configuration,
                                        env: env
                                      }, progress);

                                    case 7:
                                      _context2.next = 12;
                                      break;

                                    case 9:
                                      _context2.prev = 9;
                                      _context2.t0 = _context2["catch"](0);
                                      return _context2.abrupt("return", reject(_context2.t0));

                                    case 12:
                                      _context2.prev = 12;
                                      validate.emit('stop');
                                      return _context2.finish(12);

                                    case 15:
                                      resolve();

                                    case 16:
                                    case "end":
                                      return _context2.stop();
                                  }
                                }
                              }, _callee2, this, [[0, 9, 12, 15]]);
                            }));

                            return function (_x3, _x4) {
                              return _ref2.apply(this, arguments);
                            };
                          }());

                        case 2:
                        case "end":
                          return _context3.stop();
                      }
                    }
                  }, _callee3, this);
                }));

                return function _default() {
                  return _default2.apply(this, arguments);
                };
              }()
            });

          case 12:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function waitForApplicationAndValidateLogs(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = waitForApplicationAndValidateLogs;