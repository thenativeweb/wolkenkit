'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var tar = require('tar');

var makeAufwindRequest = require('./makeAufwindRequest');

var streamApplication = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(options, progress) {
    var _this = this;

    var directory, endpoint, tunnel, response;
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
            if (options.directory) {
              _context2.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            if (options.endpoint) {
              _context2.next = 6;
              break;
            }

            throw new Error('Endpoint is missing.');

          case 6:
            if (options.tunnel) {
              _context2.next = 8;
              break;
            }

            throw new Error('Tunnel is missing.');

          case 8:
            if (progress) {
              _context2.next = 10;
              break;
            }

            throw new Error('Progress is missing.');

          case 10:
            directory = options.directory, endpoint = options.endpoint, tunnel = options.tunnel;


            progress({ message: 'Uploading .tar.gz file...' });

            _context2.next = 14;
            return new _promise2.default(function () {
              var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(resolve, reject) {
                var tarStream, receivedData;
                return _regenerator2.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        endpoint.headers = {
                          'content-type': 'application/gzip'
                        };

                        tarStream = tar.create({
                          gzip: true,
                          cwd: directory,
                          strict: true
                        }, ['package.json', 'server']);


                        tarStream.on('end', function () {
                          progress({ message: 'Uploaded .tar.gz file.' });
                        });

                        receivedData = void 0;
                        _context.prev = 4;
                        _context.next = 7;
                        return makeAufwindRequest({ endpoint: endpoint, tunnel: tunnel, uploadStream: tarStream }, progress);

                      case 7:
                        receivedData = _context.sent;
                        _context.next = 13;
                        break;

                      case 10:
                        _context.prev = 10;
                        _context.t0 = _context['catch'](4);
                        return _context.abrupt('return', reject(_context.t0));

                      case 13:

                        resolve(receivedData);

                      case 14:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, _this, [[4, 10]]);
              }));

              return function (_x3, _x4) {
                return _ref2.apply(this, arguments);
              };
            }());

          case 14:
            response = _context2.sent;
            return _context2.abrupt('return', response);

          case 16:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function streamApplication(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = streamApplication;