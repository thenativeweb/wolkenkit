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
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(_ref) {
    var addresses, configuration, _ref$privateKey, privateKey, username, childProcess;

    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            addresses = _ref.addresses, configuration = _ref.configuration, _ref$privateKey = _ref.privateKey, privateKey = _ref$privateKey === void 0 ? undefined : _ref$privateKey, username = _ref.username;

            if (addresses) {
              _context2.next = 3;
              break;
            }

            throw new Error('Addresses are missing.');

          case 3:
            if (configuration) {
              _context2.next = 5;
              break;
            }

            throw new Error('Configuration is missing.');

          case 5:
            if (username) {
              _context2.next = 7;
              break;
            }

            throw new Error('Username is missing.');

          case 7:
            _context2.next = 9;
            return shell.which('plink');

          case 9:
            if (_context2.sent) {
              _context2.next = 11;
              break;
            }

            throw new errors.ExecutableNotFound();

          case 11:
            _context2.next = 13;
            return new Promise(
            /*#__PURE__*/
            function () {
              var _ref3 = (0, _asyncToGenerator2.default)(
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
                return _ref3.apply(this, arguments);
              };
            }());

          case 13:
            childProcess = _context2.sent;
            return _context2.abrupt("return", {
              close: function close() {
                return childProcess.kill();
              }
            });

          case 15:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function startPuttyTunnel(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = startPuttyTunnel;