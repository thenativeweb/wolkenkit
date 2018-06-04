'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var docker = require('../../../docker'),
    noop = require('../../../noop');

var removeContainers = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(options) {
    var _this = this;

    var progress = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
    var configuration, env, existingContainers, applicationContainers, removedContainer;
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
            if (options.configuration) {
              _context2.next = 4;
              break;
            }

            throw new Error('Configuration is missing.');

          case 4:
            if (options.env) {
              _context2.next = 6;
              break;
            }

            throw new Error('Environment is missing.');

          case 6:
            configuration = options.configuration, env = options.env;
            _context2.next = 9;
            return docker.getContainers({
              configuration: configuration,
              env: env,
              where: { label: { 'wolkenkit-application': configuration.application } }
            });

          case 9:
            existingContainers = _context2.sent;
            applicationContainers = existingContainers.filter(function (container) {
              return container.labels['wolkenkit-type'] === 'application';
            });
            removedContainer = [];
            _context2.next = 14;
            return _promise2.default.all(applicationContainers.map(function () {
              var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(container) {
                return _regenerator2.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.next = 2;
                        return docker.removeContainer({ configuration: configuration, container: container, env: env });

                      case 2:

                        removedContainer.push(container);

                        progress({ message: 'Removed ' + container.name + ' (' + removedContainer.length + '/' + applicationContainers.length + ').', type: 'info' });

                      case 4:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, _this);
              }));

              return function (_x3) {
                return _ref2.apply(this, arguments);
              };
            }()));

          case 14:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function removeContainers(_x2) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = removeContainers;