'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var errors = require('../../../errors'),
    shell = require('../../../shell'),
    waitForSshTunnel = require('./waitForSshTunnel');

var startPuttyTunnel =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(options) {
    var configuration, addresses, username, privateKey, childProcess;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (options) {
              _context2.next = 2;
              break;
            }

            throw new Error('Options are missing.');

          case 2:
            if (options.configuration) {
              _context2.next = 4;
              break;
            }

            throw new Error('Configuration is missing.');

          case 4:
            if (options.addresses) {
              _context2.next = 6;
              break;
            }

            throw new Error('Addresses are missing.');

          case 6:
            if (options.username) {
              _context2.next = 8;
              break;
            }

            throw new Error('Username is missing.');

          case 8:
            configuration = options.configuration, addresses = options.addresses, username = options.username, privateKey = options.privateKey;
            _context2.next = 11;
            return shell.which('plink');

          case 11:
            if (_context2.sent) {
              _context2.next = 13;
              break;
            }

            throw new errors.ExecutableNotFound();

          case 13:
            _context2.next = 15;
            return new Promise(
            /*#__PURE__*/
            function () {
              var _ref2 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee(resolve, reject) {
                var args, child;
                return _regenerator.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        args = ['-N', '-L', "".concat(addresses.from.port, ":").concat(addresses.from.host, ":").concat(addresses.to.port), "".concat(username, "@").concat(addresses.server.host), '-P', "".concat(addresses.server.port)];

                        if (privateKey) {
                          args.push('-i');
                          args.push(privateKey);
                        }

                        child = shell.spawn('plink', args, {
                          stdio: 'pipe'
                        });
                        child.on('error', reject);
                        _context.prev = 4;
                        _context.next = 7;
                        return waitForSshTunnel({
                          configuration: configuration,
                          host: addresses.from.host,
                          port: addresses.from.port
                        });

                      case 7:
                        _context.next = 12;
                        break;

                      case 9:
                        _context.prev = 9;
                        _context.t0 = _context["catch"](4);
                        return _context.abrupt("return", reject(_context.t0));

                      case 12:
                        resolve(child);

                      case 13:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, this, [[4, 9]]);
              }));

              return function (_x2, _x3) {
                return _ref2.apply(this, arguments);
              };
            }());

          case 15:
            childProcess = _context2.sent;
            return _context2.abrupt("return", {
              close: function close() {
                return childProcess.kill();
              }
            });

          case 17:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function startPuttyTunnel(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = startPuttyTunnel;