'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var path = require('path');

var ajv = require('ajv');

var errors = require('../errors'),
    file = require('../file');

var getConfiguration = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(options) {
    var directory, configurationFile, packageJson, configuration, runtimeVersion, schema, isValid;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (options) {
              _context.next = 2;
              break;
            }

            throw new Error('Options are missing.');

          case 2:
            if (options.directory) {
              _context.next = 4;
              break;
            }

            throw new Error('Directory is missing.');

          case 4:
            directory = options.directory;
            configurationFile = path.join(directory, 'package.json');
            _context.next = 8;
            return file.readJson(configurationFile);

          case 8:
            packageJson = _context.sent;
            configuration = packageJson.wolkenkit;

            if (configuration) {
              _context.next = 12;
              break;
            }

            throw new errors.ConfigurationNotFound();

          case 12:
            runtimeVersion = void 0;
            _context.prev = 13;

            runtimeVersion = configuration.runtime.version;
            _context.next = 20;
            break;

          case 17:
            _context.prev = 17;
            _context.t0 = _context['catch'](13);
            throw new errors.ConfigurationMalformed();

          case 20:
            schema = void 0;
            _context.prev = 21;

            /* eslint-disable global-require */
            schema = require('../../configuration/' + runtimeVersion + '/schema')();
            /* eslint-enable global-require */
            _context.next = 32;
            break;

          case 25:
            _context.prev = 25;
            _context.t1 = _context['catch'](21);
            _context.t2 = _context.t1.code;
            _context.next = _context.t2 === 'MODULE_NOT_FOUND' ? 30 : 31;
            break;

          case 30:
            throw new errors.VersionNotFound();

          case 31:
            throw _context.t1;

          case 32:
            isValid = ajv().compile(schema);

            if (isValid(configuration)) {
              _context.next = 35;
              break;
            }

            throw new errors.ConfigurationMalformed();

          case 35:
            return _context.abrupt('return', configuration);

          case 36:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[13, 17], [21, 25]]);
  }));

  return function getConfiguration(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getConfiguration;