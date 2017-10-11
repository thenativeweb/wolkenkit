'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var fs = require('fs'),
    path = require('path');

var promisify = require('util.promisify');

var errors = require('../errors');

var access = promisify(fs.access);

var getCertificateDirectory = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(options) {
    var directory, configuration, env, certificateDirectory;
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
            if (options.configuration) {
              _context.next = 6;
              break;
            }

            throw new Error('Configuration is missing.');

          case 6:
            if (options.env) {
              _context.next = 8;
              break;
            }

            throw new Error('Environment is missing.');

          case 8:
            directory = options.directory, configuration = options.configuration, env = options.env;

            if (configuration.environments[env]) {
              _context.next = 11;
              break;
            }

            throw new errors.EnvironmentNotFound();

          case 11:
            certificateDirectory = configuration.environments[env].api.certificate;


            if (certificateDirectory) {
              certificateDirectory = path.join(directory, certificateDirectory);
            } else {
              certificateDirectory = path.join(__dirname, '..', '..', 'keys', 'local.wolkenkit.io');
            }

            _context.prev = 13;
            _context.next = 16;
            return access(certificateDirectory, fs.constants.R_OK);

          case 16:
            _context.next = 23;
            break;

          case 18:
            _context.prev = 18;
            _context.t0 = _context['catch'](13);

            if (!(_context.t0.code === 'ENOENT')) {
              _context.next = 22;
              break;
            }

            throw new errors.DirectoryNotFound();

          case 22:
            throw _context.t0;

          case 23:
            return _context.abrupt('return', certificateDirectory);

          case 24:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[13, 18]]);
  }));

  return function getCertificateDirectory(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getCertificateDirectory;