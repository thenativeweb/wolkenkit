'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var errors = require('../../../errors'),
    shell = require('../../../shell'),
    waitForSshTunnel = require('./waitForSshTunnel');

var startOpensshTunnel = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(options) {
    var _this = this;

    var addresses, username, privateKey, childProcess;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (options) {
              _context2.next = 2;
              break;
            }

            throw new Error('Options are missing.');

          case 2:
            if (options.addresses) {
              _context2.next = 4;
              break;
            }

            throw new Error('Addresses are missing.');

          case 4:
            if (options.username) {
              _context2.next = 6;
              break;
            }

            throw new Error('Username is missing.');

          case 6:
            addresses = options.addresses, username = options.username, privateKey = options.privateKey;
            _context2.next = 9;
            return shell.which('ssh');

          case 9:
            if (_context2.sent) {
              _context2.next = 11;
              break;
            }

            throw new errors.ExecutableNotFound();

          case 11:
            _context2.next = 13;
            return new _promise2.default(function () {
              var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(resolve, reject) {
                var args, child;
                return _regenerator2.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        args = ['-nNT', '-L', addresses.from.port + ':' + addresses.from.host + ':' + addresses.to.port, username + '@' + addresses.server.host, '-p', '' + addresses.server.port];


                        if (privateKey) {
                          args.push('-i');
                          args.push(privateKey);
                        }

                        child = shell.spawn('ssh', args, { stdio: 'pipe' });


                        child.on('error', reject);

                        _context.prev = 4;
                        _context.next = 7;
                        return waitForSshTunnel({ host: addresses.from.host, port: addresses.from.port });

                      case 7:
                        _context.next = 12;
                        break;

                      case 9:
                        _context.prev = 9;
                        _context.t0 = _context['catch'](4);
                        return _context.abrupt('return', reject(_context.t0));

                      case 12:

                        resolve(child);

                      case 13:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, _this, [[4, 9]]);
              }));

              return function (_x2, _x3) {
                return _ref2.apply(this, arguments);
              };
            }());

          case 13:
            childProcess = _context2.sent;
            return _context2.abrupt('return', { close: function close() {
                return childProcess.kill();
              } });

          case 15:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function startOpensshTunnel(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = startOpensshTunnel;