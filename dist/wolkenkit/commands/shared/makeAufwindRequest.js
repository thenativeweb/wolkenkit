'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var http = require('http'),
    url = require('url');

var NewlineJsonParser = require('newline-json').Parser;

var errors = require('../../../errors');

var makeAufwindRequest = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(options, progress) {
    var endpoint, tunnel, uploadStream, formattedUrl, requestOptions, responseData;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (options) {
              _context.next = 2;
              break;
            }

            throw new Error('Options are missing.');

          case 2:
            if (options.endpoint) {
              _context.next = 4;
              break;
            }

            throw new Error('Endpoint is missing.');

          case 4:
            if (options.tunnel) {
              _context.next = 6;
              break;
            }

            throw new Error('Tunnel is missing.');

          case 6:
            if (progress) {
              _context.next = 8;
              break;
            }

            throw new Error('Progress is missing.');

          case 8:
            endpoint = options.endpoint, tunnel = options.tunnel, uploadStream = options.uploadStream;
            formattedUrl = url.format(endpoint);


            progress({ message: 'Using ' + endpoint.method + ' ' + formattedUrl + ' as route.' });

            requestOptions = url.parse(formattedUrl);


            requestOptions.method = endpoint.method;

            _context.next = 15;
            return new _promise2.default(function (resolve, reject) {
              var request = http.request(requestOptions, function (response) {
                var newlineJsonparser = new NewlineJsonParser();

                var hasError = false,
                    receivedData = void 0,
                    unsubscribe = void 0;

                var onData = function onData(data) {
                  if (!data.message || !data.type) {
                    receivedData = data;

                    return;
                  }

                  if (data.type === 'error') {
                    hasError = true;
                    data.type = 'info';
                  }

                  progress(data);
                };

                var onEnd = function onEnd() {
                  unsubscribe();
                  tunnel.close();

                  if (hasError) {
                    return reject(new errors.RequestFailed());
                  }

                  resolve(receivedData);
                };

                var onError = function onError(err) {
                  unsubscribe();
                  tunnel.close();
                  reject(err);
                };

                unsubscribe = function unsubscribe() {
                  newlineJsonparser.removeListener('data', onData).removeListener('end', onEnd).removeListener('error', onError);
                };

                newlineJsonparser.on('data', onData).on('end', onEnd).on('error', onError);

                response.pipe(newlineJsonparser);
              });

              if (!uploadStream) {
                return request.end();
              }

              uploadStream.on('error', function (err) {
                tunnel.close();

                reject(err);
              }).pipe(request);
            });

          case 15:
            responseData = _context.sent;
            return _context.abrupt('return', responseData);

          case 17:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function makeAufwindRequest(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = makeAufwindRequest;