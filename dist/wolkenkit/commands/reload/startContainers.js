'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var difference = require('lodash/difference'),
    remove = require('lodash/remove');

var docker = require('../../../docker'),
    sleep = require('../../../sleep');

var startContainers =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(_ref, progress) {
    var configuration, dangerouslyExposeHttpPorts, debug, persistData, sharedKey, containers, started, applicationContainers, startedApplicationContainers, numberOfContainers, err, _loop;

    return _regenerator.default.wrap(function _callee2$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            configuration = _ref.configuration, dangerouslyExposeHttpPorts = _ref.dangerouslyExposeHttpPorts, debug = _ref.debug, persistData = _ref.persistData, sharedKey = _ref.sharedKey;

            if (configuration) {
              _context3.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            if (!(dangerouslyExposeHttpPorts === undefined)) {
              _context3.next = 5;
              break;
            }

            throw new Error('Dangerously expose http ports is missing.');

          case 5:
            if (!(debug === undefined)) {
              _context3.next = 7;
              break;
            }

            throw new Error('Debug is missing.');

          case 7:
            if (!(persistData === undefined)) {
              _context3.next = 9;
              break;
            }

            throw new Error('Persist data is missing.');

          case 9:
            if (sharedKey) {
              _context3.next = 11;
              break;
            }

            throw new Error('Shared key is missing.');

          case 11:
            if (progress) {
              _context3.next = 13;
              break;
            }

            throw new Error('Progress is missing.');

          case 13:
            _context3.next = 15;
            return configuration.containers({
              dangerouslyExposeHttpPorts: dangerouslyExposeHttpPorts,
              debug: debug,
              persistData: persistData,
              sharedKey: sharedKey
            });

          case 15:
            containers = _context3.sent;
            started = containers.filter(function (container) {
              return container.labels['wolkenkit-type'] === 'infrastructure';
            });
            applicationContainers = containers.filter(function (container) {
              return container.labels['wolkenkit-type'] === 'application';
            });
            startedApplicationContainers = [];
            numberOfContainers = applicationContainers.length;
            _loop =
            /*#__PURE__*/
            _regenerator.default.mark(function _loop() {
              var nextContainerToStart;
              return _regenerator.default.wrap(function _loop$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      nextContainerToStart = applicationContainers.find(function (container) {
                        var dependsOn = container.dependsOn || [];
                        var startedContainerNames = started.map(function (startedContainer) {
                          return startedContainer.name;
                        });
                        return difference(dependsOn, startedContainerNames).length === 0;
                      });

                      if (nextContainerToStart) {
                        remove(applicationContainers, function (container) {
                          return container.name === nextContainerToStart.name;
                        });
                        /* eslint-disable no-loop-func */

                        (0, _asyncToGenerator2.default)(
                        /*#__PURE__*/
                        _regenerator.default.mark(function _callee() {
                          return _regenerator.default.wrap(function _callee$(_context) {
                            while (1) {
                              switch (_context.prev = _context.next) {
                                case 0:
                                  _context.prev = 0;
                                  _context.next = 3;
                                  return docker.startContainer({
                                    configuration: configuration,
                                    container: nextContainerToStart
                                  });

                                case 3:
                                  started.push(nextContainerToStart);
                                  startedApplicationContainers.push(nextContainerToStart);
                                  progress({
                                    message: "Started ".concat(nextContainerToStart.name, " (").concat(startedApplicationContainers.length, "/").concat(numberOfContainers, ")."),
                                    type: 'info'
                                  });
                                  _context.next = 11;
                                  break;

                                case 8:
                                  _context.prev = 8;
                                  _context.t0 = _context["catch"](0);
                                  err = _context.t0;

                                case 11:
                                case "end":
                                  return _context.stop();
                              }
                            }
                          }, _callee, this, [[0, 8]]);
                        }))();
                        /* eslint-enable no-loop-func */
                      }

                      _context2.next = 4;
                      return sleep(50);

                    case 4:
                    case "end":
                      return _context2.stop();
                  }
                }
              }, _loop, this);
            });

          case 21:
            if (!(startedApplicationContainers.length < numberOfContainers && !err)) {
              _context3.next = 25;
              break;
            }

            return _context3.delegateYield(_loop(), "t0", 23);

          case 23:
            _context3.next = 21;
            break;

          case 25:
            if (!err) {
              _context3.next = 27;
              break;
            }

            throw err;

          case 27:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee2, this);
  }));

  return function startContainers(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = startContainers;