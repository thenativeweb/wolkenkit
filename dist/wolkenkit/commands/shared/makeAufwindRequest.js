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
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref, progress) {
    var endpoint, tunnel, _ref$uploadStream, uploadStream, formattedUrl, receivedData, response, newlineJsonParser, passThrough, hasError, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _value, data;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            endpoint = _ref.endpoint, tunnel = _ref.tunnel, _ref$uploadStream = _ref.uploadStream, uploadStream = _ref$uploadStream === void 0 ? undefined : _ref$uploadStream;

            if (endpoint) {
              _context.next = 3;
              break;
            }

            throw new Error('Endpoint is missing.');

          case 3:
            if (tunnel) {
              _context.next = 5;
              break;
            }

            throw new Error('Tunnel is missing.');

          case 5:
            if (progress) {
              _context.next = 7;
              break;
            }

            throw new Error('Progress is missing.');

          case 7:
            formattedUrl = url.format(endpoint);
            progress({
              message: "Using ".concat(endpoint.method, " ").concat(formattedUrl, " as route.")
            });
            _context.prev = 9;
            _context.next = 12;
            return axios({
              method: endpoint.method.toLowerCase(),
              url: formattedUrl,
              headers: endpoint.headers,
              data: uploadStream || '',
              responseType: 'stream'
            });

          case 12:
            response = _context.sent;
            newlineJsonParser = new NewlineJsonParser();
            passThrough = new PassThrough({
              objectMode: true
            });
            pump(response.data, newlineJsonParser, passThrough);
            hasError = false;
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _context.prev = 19;
            _iterator = (0, _asyncIterator2.default)(passThrough);

          case 21:
            _context.next = 23;
            return _iterator.next();

          case 23:
            _step = _context.sent;
            _iteratorNormalCompletion = _step.done;
            _context.next = 27;
            return _step.value;

          case 27:
            _value = _context.sent;

            if (_iteratorNormalCompletion) {
              _context.next = 40;
              break;
            }

            data = _value;

            if (!(data.type === 'heartbeat')) {
              _context.next = 32;
              break;
            }

            return _context.abrupt("continue", 37);

          case 32:
            if (!(!data.message || !data.type)) {
              _context.next = 35;
              break;
            }

            receivedData = data;
            return _context.abrupt("continue", 37);

          case 35:
            if (data.type === 'error') {
              hasError = true;
              data.type = 'info';
            }

            progress(data);

          case 37:
            _iteratorNormalCompletion = true;
            _context.next = 21;
            break;

          case 40:
            _context.next = 46;
            break;

          case 42:
            _context.prev = 42;
            _context.t0 = _context["catch"](19);
            _didIteratorError = true;
            _iteratorError = _context.t0;

          case 46:
            _context.prev = 46;
            _context.prev = 47;

            if (!(!_iteratorNormalCompletion && _iterator.return != null)) {
              _context.next = 51;
              break;
            }

            _context.next = 51;
            return _iterator.return();

          case 51:
            _context.prev = 51;

            if (!_didIteratorError) {
              _context.next = 54;
              break;
            }

            throw _iteratorError;

          case 54:
            return _context.finish(51);

          case 55:
            return _context.finish(46);

          case 56:
            if (!hasError) {
              _context.next = 58;
              break;
            }

            throw new errors.RequestFailed();

          case 58:
            _context.prev = 58;
            tunnel.close();
            return _context.finish(58);

          case 61:
            return _context.abrupt("return", receivedData);

          case 62:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[9,, 58, 61], [19, 42, 46, 56], [47,, 51, 55]]);
  }));

  return function makeAufwindRequest(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = makeAufwindRequest;