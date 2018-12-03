'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var docker = require('../../../docker'),
    noop = require('../../../noop');

var removeContainers =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(options) {
    var progress,
        configuration,
        env,
        existingContainers,
        applicationContainers,
        removedContainer,
        _args2 = arguments;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            progress = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : noop;

            if (options) {
              _context2.next = 3;
              break;
            }

            throw new Error('Options are missing.');

          case 3:
            if (options.configuration) {
              _context2.next = 5;
              break;
            }

            throw new Error('Configuration is missing.');

          case 5:
            if (options.env) {
              _context2.next = 7;
              break;
            }

            throw new Error('Environment is missing.');

          case 7:
            configuration = options.configuration, env = options.env;
            _context2.next = 10;
            return docker.getContainers({
              configuration: configuration,
              env: env,
              where: {
                label: {
                  'wolkenkit-application': configuration.application
                }
              }
            });

          case 10:
            existingContainers = _context2.sent;
            applicationContainers = existingContainers.filter(function (container) {
              return container.labels['wolkenkit-type'] === 'application';
            });
            removedContainer = [];
            _context2.next = 15;
            return Promise.all(applicationContainers.map(
            /*#__PURE__*/
            function () {
              var _ref2 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee(container) {
                return _regenerator.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.next = 2;
                        return docker.removeContainer({
                          configuration: configuration,
                          container: container,
                          env: env
                        });

                      case 2:
                        removedContainer.push(container);
                        progress({
                          message: "Removed ".concat(container.name, " (").concat(removedContainer.length, "/").concat(applicationContainers.length, ")."),
                          type: 'info'
                        });

                      case 4:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }));

              return function (_x2) {
                return _ref2.apply(this, arguments);
              };
            }()));

          case 15:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function removeContainers(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = removeContainers;