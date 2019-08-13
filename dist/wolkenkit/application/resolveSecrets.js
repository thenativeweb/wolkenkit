'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var path = require('path');

var get = require('lodash/get'),
    _require = require('flat'),
    flatten = _require.flatten,
    unflatten = _require.unflatten;

var errors = require('../../errors'),
    file = require('../../file');

var resolveSecrets =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref) {
    var configuration, directory, secrets, identifier, flattenedConfiguration, _i, _Object$entries, _Object$entries$_i, key, value, secretSelector, secret, unflattenedConfiguration;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            configuration = _ref.configuration, directory = _ref.directory;

            if (configuration) {
              _context.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            if (directory) {
              _context.next = 5;
              break;
            }

            throw new Error('Directory is missing.');

          case 5:
            _context.prev = 5;
            _context.next = 8;
            return file.readJson(path.join(directory, 'wolkenkit-secrets.json'));

          case 8:
            secrets = _context.sent;
            _context.next = 15;
            break;

          case 11:
            _context.prev = 11;
            _context.t0 = _context["catch"](5);

            if (!(_context.t0.code !== 'EFILENOTFOUND')) {
              _context.next = 15;
              break;
            }

            throw _context.t0;

          case 15:
            identifier = 'secret://';
            flattenedConfiguration = flatten(configuration);
            _i = 0, _Object$entries = Object.entries(flattenedConfiguration);

          case 18:
            if (!(_i < _Object$entries.length)) {
              _context.next = 34;
              break;
            }

            _Object$entries$_i = (0, _slicedToArray2.default)(_Object$entries[_i], 2), key = _Object$entries$_i[0], value = _Object$entries$_i[1];

            if (!(typeof value !== 'string')) {
              _context.next = 22;
              break;
            }

            return _context.abrupt("continue", 31);

          case 22:
            if (value.startsWith(identifier)) {
              _context.next = 24;
              break;
            }

            return _context.abrupt("continue", 31);

          case 24:
            if (secrets) {
              _context.next = 26;
              break;
            }

            throw new errors.SecretFileNotFound('wolkenkit-secrets.json is missing.');

          case 26:
            secretSelector = value.replace(identifier, '');
            secret = get(secrets, secretSelector);

            if (!(secret === undefined)) {
              _context.next = 30;
              break;
            }

            throw new errors.SecretNotFound("Could not find a secret named '".concat(secretSelector, "'."));

          case 30:
            flattenedConfiguration[key] = secret;

          case 31:
            _i++;
            _context.next = 18;
            break;

          case 34:
            unflattenedConfiguration = unflatten(flattenedConfiguration);
            return _context.abrupt("return", unflattenedConfiguration);

          case 36:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[5, 11]]);
  }));

  return function resolveSecrets(_x) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = resolveSecrets;