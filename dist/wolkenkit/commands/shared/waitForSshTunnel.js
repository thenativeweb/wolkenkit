'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var axios = require('axios'),
    retry = require('async-retry');

var errors = require('../../../errors'),
    switchSemver = require('../../../switchSemver');

var waitForSshTunnel =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee5(options) {
    var host, port, version;
    return _regenerator.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            if (options) {
              _context5.next = 2;
              break;
            }

            throw new Error('Options are missing.');

          case 2:
            if (options.configuration) {
              _context5.next = 4;
              break;
            }

            throw new Error('Configuration is missing.');

          case 4:
            if (options.host) {
              _context5.next = 6;
              break;
            }

            throw new Error('Host is missing.');

          case 6:
            if (options.port) {
              _context5.next = 8;
              break;
            }

            throw new Error('Port is missing.');

          case 8:
            host = options.host, port = options.port;
            version = options.configuration.runtime.version;
            _context5.next = 12;
            return switchSemver(version, {
              '<= 2.0.0': function () {
                var _2 = (0, _asyncToGenerator2.default)(
                /*#__PURE__*/
                _regenerator.default.mark(function _callee2() {
                  var response;
                  return _regenerator.default.wrap(function _callee2$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          _context2.next = 2;
                          return retry(
                          /*#__PURE__*/
                          (0, _asyncToGenerator2.default)(
                          /*#__PURE__*/
                          _regenerator.default.mark(function _callee() {
                            return _regenerator.default.wrap(function _callee$(_context) {
                              while (1) {
                                switch (_context.prev = _context.next) {
                                  case 0:
                                    _context.next = 2;
                                    return axios({
                                      method: 'get',
                                      url: "http://".concat(host, ":").concat(port, "/v1/ping")
                                    });

                                  case 2:
                                    return _context.abrupt("return", _context.sent);

                                  case 3:
                                  case "end":
                                    return _context.stop();
                                }
                              }
                            }, _callee, this);
                          })), {
                            retries: 5,
                            maxTimeout: 2 * 1000
                          });

                        case 2:
                          response = _context2.sent;

                          if (!(response.data.api !== 'v1')) {
                            _context2.next = 5;
                            break;
                          }

                          throw new errors.JsonMalformed();

                        case 5:
                        case "end":
                          return _context2.stop();
                      }
                    }
                  }, _callee2, this);
                }));

                return function _() {
                  return _2.apply(this, arguments);
                };
              }(),
              default: function () {
                var _default2 = (0, _asyncToGenerator2.default)(
                /*#__PURE__*/
                _regenerator.default.mark(function _callee4() {
                  return _regenerator.default.wrap(function _callee4$(_context4) {
                    while (1) {
                      switch (_context4.prev = _context4.next) {
                        case 0:
                          _context4.next = 2;
                          return retry(
                          /*#__PURE__*/
                          (0, _asyncToGenerator2.default)(
                          /*#__PURE__*/
                          _regenerator.default.mark(function _callee3() {
                            return _regenerator.default.wrap(function _callee3$(_context3) {
                              while (1) {
                                switch (_context3.prev = _context3.next) {
                                  case 0:
                                    _context3.next = 2;
                                    return axios({
                                      method: 'get',
                                      url: "http://".concat(host, ":").concat(port, "/")
                                    });

                                  case 2:
                                  case "end":
                                    return _context3.stop();
                                }
                              }
                            }, _callee3, this);
                          })), {
                            retries: 5,
                            maxTimeout: 2 * 1000
                          });

                        case 2:
                        case "end":
                          return _context4.stop();
                      }
                    }
                  }, _callee4, this);
                }));

                return function _default() {
                  return _default2.apply(this, arguments);
                };
              }()
            });

          case 12:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function waitForSshTunnel(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = waitForSshTunnel;