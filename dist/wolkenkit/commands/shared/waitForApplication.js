'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var axios = require('axios'),
    nodeenv = require('nodeenv'),
    retry = require('async-retry');

var errors = require('../../../errors'),
    switchSemver = require('../../../switchSemver');

var waitForApplication =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee5(_ref, progress) {
    var configuration, _ref$host, host, _ref$port, port, version, restoreEnvironment;

    return _regenerator.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            configuration = _ref.configuration, _ref$host = _ref.host, host = _ref$host === void 0 ? undefined : _ref$host, _ref$port = _ref.port, port = _ref$port === void 0 ? undefined : _ref$port;

            if (configuration) {
              _context5.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            if (progress) {
              _context5.next = 5;
              break;
            }

            throw new Error('Progress is missing.');

          case 5:
            version = configuration.application.runtime.version;
            restoreEnvironment = nodeenv('NODE_TLS_REJECT_UNAUTHORIZED', '0');

            if (!host || !port) {
              host = configuration.api.host.name;
              port = configuration.api.port;
            }

            _context5.next = 10;
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
                          progress({
                            message: "Waiting for https://".concat(host, ":").concat(port, "/v1/ping to reply..."),
                            type: 'info'
                          });
                          _context2.next = 3;
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
                                      url: "https://".concat(host, ":").concat(port, "/v1/ping")
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
                            retries: 60,
                            maxTimeout: 2 * 1000
                          });

                        case 3:
                          response = _context2.sent;

                          if (!(response.data.api !== 'v1')) {
                            _context2.next = 6;
                            break;
                          }

                          throw new errors.JsonMalformed();

                        case 6:
                          restoreEnvironment();

                        case 7:
                        case "end":
                          return _context2.stop();
                      }
                    }
                  }, _callee2, this);
                }));

                function _() {
                  return _2.apply(this, arguments);
                }

                return _;
              }(),
              default: function () {
                var _default2 = (0, _asyncToGenerator2.default)(
                /*#__PURE__*/
                _regenerator.default.mark(function _callee4() {
                  return _regenerator.default.wrap(function _callee4$(_context4) {
                    while (1) {
                      switch (_context4.prev = _context4.next) {
                        case 0:
                          progress({
                            message: "Waiting for https://".concat(host, ":").concat(port, "/ to reply..."),
                            type: 'info'
                          });
                          _context4.next = 3;
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
                                      url: "https://".concat(host, ":").concat(port, "/")
                                    });

                                  case 2:
                                  case "end":
                                    return _context3.stop();
                                }
                              }
                            }, _callee3, this);
                          })), {
                            retries: 60,
                            maxTimeout: 2 * 1000
                          });

                        case 3:
                          progress({
                            message: "Running at https://".concat(host, ":").concat(port, "/"),
                            type: 'info'
                          });
                          restoreEnvironment();

                        case 5:
                        case "end":
                          return _context4.stop();
                      }
                    }
                  }, _callee4, this);
                }));

                function _default() {
                  return _default2.apply(this, arguments);
                }

                return _default;
              }()
            });

          case 10:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function waitForApplication(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = waitForApplication;