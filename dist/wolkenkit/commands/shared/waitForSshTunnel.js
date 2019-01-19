'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var axios = require('axios'),
    retry = require('async-retry');

var errors = require('../../../errors');

var waitForSshTunnel =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(_ref) {
    var host, port, response;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            host = _ref.host, port = _ref.port;

            if (host) {
              _context2.next = 3;
              break;
            }

            throw new Error('Host is missing.');

          case 3:
            if (port) {
              _context2.next = 5;
              break;
            }

            throw new Error('Port is missing.');

          case 5:
            _context2.next = 7;
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

          case 7:
            response = _context2.sent;

            if (!(response.data.api !== 'v1')) {
              _context2.next = 10;
              break;
            }

            throw new errors.JsonMalformed();

          case 10:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function waitForSshTunnel(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = waitForSshTunnel;