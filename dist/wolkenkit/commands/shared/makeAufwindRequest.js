'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _asyncIterator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncIterator"));

var _require = require('stream'),
    PassThrough = _require.PassThrough,
    url = require('url');

var axios = require('axios'),
    NewlineJsonParser = require('newline-json').Parser,
    pump = require('pump');

var errors = require('../../../errors');

var makeAufwindRequest =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(options, progress) {
    var endpoint, tunnel, uploadStream, formattedUrl, receivedData, response, newlineJsonParser, passThrough, hasError, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, data;

    return _regenerator.default.wrap(function _callee$(_context) {
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
            progress({
              message: "Using ".concat(endpoint.method, " ").concat(formattedUrl, " as route.")
            });
            _context.prev = 11;
            _context.next = 14;
            return axios({
              method: endpoint.method.toLowerCase(),
              url: formattedUrl,
              headers: endpoint.headers,
              data: uploadStream || '',
              responseType: 'stream'
            });

          case 14:
            response = _context.sent;
            newlineJsonParser = new NewlineJsonParser();
            passThrough = new PassThrough({
              objectMode: true
            });
            pump(response.data, newlineJsonParser, passThrough);
            hasError = false;
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 21;
            _iterator = (0, _asyncIterator2.default)(passThrough);

          case 23:
            _context.next = 25;
            return _iterator.next();

          case 25:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 29;
            return _step.value;

          case 29:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 42;
              break;
            }

            data = _value;

            if (!(data.type === 'heartbeat')) {
              _context.next = 34;
              break;
            }

            return _context.abrupt("continue", 39);

          case 34:
            if (!(!data.message || !data.type)) {
              _context.next = 37;
              break;
            }

            receivedData = data;
            return _context.abrupt("continue", 39);

          case 37:
            if (data.type === 'error') {
              hasError = true;
              data.type = 'info';
            }

            progress(data);

          case 39:
            _iteratorNormalCompletion = true;
            _context.next = 23;
            break;

          case 42:
            _context.next = 48;
            break;

          case 44:
            _context.prev = 44;
            _context.t0 = _context["catch"](21);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 48:
            _context.prev = 48;
            _context.prev = 49;

            if (!(!_iteratorNormalCompletion && _iterator.return != null)) {
              _context.next = 53;
              break;
            }

            _context.next = 53;
            return _iterator.return();

          case 53:
            _context.prev = 53;

            if (!_didIteratorError) {
              _context.next = 56;
              break;
            }

            throw _iteratorError;

          case 56:
            return _context.finish(53);

          case 57:
            return _context.finish(48);

          case 58:
            if (!hasError) {
              _context.next = 60;
              break;
            }

            throw new errors.RequestFailed();

          case 60:
            _context.prev = 60;
            tunnel.close();
            return _context.finish(60);

          case 63:
            return _context.abrupt("return", receivedData);

          case 64:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[11,, 60, 63], [21, 44, 48, 58], [49,, 53, 57]]);
  }));

  return function makeAufwindRequest(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = makeAufwindRequest;