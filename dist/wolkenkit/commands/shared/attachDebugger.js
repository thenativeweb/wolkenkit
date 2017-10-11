'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var request = require('requestretry');

var runtimes = require('../../runtimes');

var attachDebugger = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(options, progress) {
    var configuration, env, sharedKey, persistData, debug, host, runtime, containers, i, container, debugPort, debugConfiguration, _debugConfiguration$, devtoolsFrontendUrl, id, hash, debugUrl;

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
            if (options.sharedKey) {
              _context.next = 8;
              break;
            }

            throw new Error('Shared key is missing.');

          case 8:
            if (!(options.persistData === undefined)) {
              _context.next = 10;
              break;
            }

            throw new Error('Persist data is missing.');

          case 10:
            if (!(options.debug === undefined)) {
              _context.next = 12;
              break;
            }

            throw new Error('Debug is missing.');

          case 12:
            if (progress) {
              _context.next = 14;
              break;
            }

            throw new Error('Progress is missing.');

          case 14:
            configuration = options.configuration, env = options.env, sharedKey = options.sharedKey, persistData = options.persistData, debug = options.debug;
            host = configuration.environments[env].api.address.host, runtime = configuration.runtime.version;
            _context.next = 18;
            return runtimes.getContainers({
              forVersion: runtime,
              configuration: configuration,
              env: env,
              sharedKey: sharedKey,
              persistData: persistData,
              debug: debug
            });

          case 18:
            containers = _context.sent;
            i = 0;

          case 20:
            if (!(i < containers.length)) {
              _context.next = 37;
              break;
            }

            container = containers[i];

            if (container.ports) {
              _context.next = 24;
              break;
            }

            return _context.abrupt('continue', 34);

          case 24:
            debugPort = container.ports[9229];

            if (debugPort) {
              _context.next = 27;
              break;
            }

            return _context.abrupt('continue', 34);

          case 27:
            _context.next = 29;
            return request({
              url: 'http://' + host + ':' + debugPort + '/json',
              json: true,
              fullResponse: false,
              maxAttempts: 1
            });

          case 29:
            debugConfiguration = _context.sent;
            _debugConfiguration$ = debugConfiguration[0], devtoolsFrontendUrl = _debugConfiguration$.devtoolsFrontendUrl, id = _debugConfiguration$.id;
            hash = devtoolsFrontendUrl.match(/@\w+/)[0];
            debugUrl = 'chrome-devtools://devtools/remote/serve_file/' + hash + '/inspector.html?experiments=true&v8only=true&ws=' + host + ':' + debugPort + '/' + id;


            progress({ message: 'Started debugger for ' + container.name + ' on ' + debugUrl + '.', type: 'info' });

          case 34:
            i++;
            _context.next = 20;
            break;

          case 37:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function attachDebugger(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = attachDebugger;