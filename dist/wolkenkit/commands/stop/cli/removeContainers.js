'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var docker = require('../../../../docker');

var removeContainers =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(_ref, progress) {
    var configuration, existingContainers, removedContainer;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            configuration = _ref.configuration;

            if (configuration) {
              _context2.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            if (progress) {
              _context2.next = 5;
              break;
            }

            throw new Error('Progress is missing.');

          case 5:
            _context2.next = 7;
            return docker.getContainers({
              configuration: configuration,
              where: {
                label: {
                  'wolkenkit-application': configuration.application.name
                }
              }
            });

          case 7:
            existingContainers = _context2.sent;
            removedContainer = [];
            _context2.next = 11;
            return Promise.all(existingContainers.map(
            /*#__PURE__*/
            function () {
              var _ref3 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee(container) {
                return _regenerator.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.next = 2;
                        return docker.removeContainer({
                          configuration: configuration,
                          container: container
                        });

                      case 2:
                        removedContainer.push(container);
                        progress({
                          message: "Removed ".concat(container.name, " (").concat(removedContainer.length, "/").concat(existingContainers.length, ")."),
                          type: 'info'
                        });

                      case 4:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }));

              return function (_x3) {
                return _ref3.apply(this, arguments);
              };
            }()));

          case 11:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function removeContainers(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = removeContainers;