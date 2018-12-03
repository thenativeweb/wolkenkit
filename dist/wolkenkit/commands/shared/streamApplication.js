'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var path = require('path'),
    _require = require('stream'),
    PassThrough = _require.PassThrough;

var pump = require('pump'),
    tar = require('tar');

var file = require('../../../file'),
    makeAufwindRequest = require('./makeAufwindRequest');

var streamApplication =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(options, progress) {
    var directory, endpoint, tunnel, response;
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
            progress({
              message: "Uploading .tar.gz file..."
            });
            _context2.next = 14;
            return new Promise(
            /*#__PURE__*/
            function () {
              var _ref2 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee(resolve, reject) {
                var files, secretFileName, tarStream, uploadStream, receivedData;
                return _regenerator.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        endpoint.headers = {
                          'content-type': 'application/gzip'
                        };
                        files = ['package.json', 'server'];
                        secretFileName = 'wolkenkit-secrets.json';
                        _context.next = 5;
                        return file.exists(path.join(directory, secretFileName));

                      case 5:
                        if (!_context.sent) {
                          _context.next = 7;
                          break;
                        }

                        files.push(secretFileName);

                      case 7:
                        tarStream = tar.create({
                          gzip: true,
                          cwd: directory,
                          strict: true
                        }, files);
                        uploadStream = new PassThrough(); // Pump tar stream into a pass through stream, since tar stream is not a
                        // real stream and the upload doesn't work otherwise.

                        pump(tarStream, uploadStream, function () {
                          progress({
                            message: "Uploaded .tar.gz file."
                          });
                        });
                        _context.prev = 10;
                        _context.next = 13;
                        return makeAufwindRequest({
                          endpoint: endpoint,
                          tunnel: tunnel,
                          uploadStream: uploadStream
                        }, progress);

                      case 13:
                        receivedData = _context.sent;
                        _context.next = 19;
                        break;

                      case 16:
                        _context.prev = 16;
                        _context.t0 = _context["catch"](10);
                        return _context.abrupt("return", reject(_context.t0));

                      case 19:
                        resolve(receivedData);

                      case 20:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, this, [[10, 16]]);
              }));

              return function (_x3, _x4) {
                return _ref2.apply(this, arguments);
              };
            }());

          case 14:
            response = _context2.sent;
            return _context2.abrupt("return", response);

          case 16:
          case "end":
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