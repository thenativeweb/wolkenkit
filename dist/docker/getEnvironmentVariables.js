'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var processenv = require('processenv');

var errors = require('../errors'),
    shell = require('../shell');

var getEnvironmentVariables = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(options) {
    var configuration, env, environment, environmentVariables, _ref2, stdout, matches;

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
            if (options.configuration) {
              _context.next = 4;
              break;
            }

            throw new Error('Configuration is missing.');

          case 4:
            if (options.env) {
              _context.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            configuration = options.configuration, env = options.env;
            environment = configuration.environments[env];

            if (environment) {
              _context.next = 10;
              break;
            }

            throw new errors.EnvironmentNotFound();

          case 10:
            environmentVariables = processenv();

            if (!(!environment.docker || !environment.docker.machine)) {
              _context.next = 13;
              break;
            }

            return _context.abrupt('return', environmentVariables);

          case 13:
            _context.next = 15;
            return shell.exec('docker-machine env --shell bash ' + environment.docker.machine);

          case 15:
            _ref2 = _context.sent;
            stdout = _ref2.stdout;
            matches = stdout.match(/^export .*$/gm);

            if (matches) {
              _context.next = 20;
              break;
            }

            throw new errors.OutputMalformed();

          case 20:

            matches.map(function (match) {
              return match.replace(/^export /, '');
            }).map(function (match) {
              return match.replace(/"/g, '');
            }).forEach(function (match) {
              var _match$split = match.split('='),
                  _match$split2 = _slicedToArray(_match$split, 2),
                  key = _match$split2[0],
                  value = _match$split2[1];

              environmentVariables[key] = value;
            });

            return _context.abrupt('return', environmentVariables);

          case 22:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getEnvironmentVariables(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getEnvironmentVariables;