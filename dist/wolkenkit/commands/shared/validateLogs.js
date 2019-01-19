'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var EventEmitter = require('events'),
    _require = require('util'),
    promisify = _require.promisify;

var _require2 = require('newline-json'),
    Parser = _require2.Parser;

var docker = require('../../../docker'),
    errors = require('../../../errors');

var sleep = promisify(setTimeout);

var validateLogs =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3(_ref, progress) {
    var configuration, containers, validate, isStopped;
    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            configuration = _ref.configuration;

            if (configuration) {
              _context3.next = 3;
              break;
            }

            throw new Error('Configuration is missing.');

          case 3:
            if (progress) {
              _context3.next = 5;
              break;
            }

            throw new Error('Progress is missing.');

          case 5:
            _context3.next = 7;
            return docker.getContainers({
              configuration: configuration,
              where: {
                label: {
                  'wolkenkit-application': configuration.application.name,
                  'wolkenkit-type': 'application'
                }
              }
            });

          case 7:
            containers = _context3.sent;
            progress({
              message: 'Validating container logs...',
              type: 'info'
            });
            validate = new EventEmitter();
            isStopped = false;
            validate.once('stop', function () {
              isStopped = true;
            });
            (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee2() {
              return _regenerator.default.wrap(function _callee2$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      if (isStopped) {
                        _context2.next = 14;
                        break;
                      }

                      _context2.prev = 1;
                      _context2.next = 4;
                      return new Promise(
                      /*#__PURE__*/
                      function () {
                        var _ref4 = (0, _asyncToGenerator2.default)(
                        /*#__PURE__*/
                        _regenerator.default.mark(function _callee(resolve, reject) {
                          var passThrough, unsubscribe, onData;
                          return _regenerator.default.wrap(function _callee$(_context) {
                            while (1) {
                              switch (_context.prev = _context.next) {
                                case 0:
                                  passThrough = new Parser();

                                  onData = function onData(logMessage) {
                                    if (logMessage.level === 'fatal') {
                                      var orginalError = null;

                                      if (logMessage.metadata) {
                                        orginalError = logMessage.metadata.err || logMessage.metadata.ex;
                                      }

                                      var runtimeError = new errors.RuntimeError('Fatal runtime error happened.');
                                      runtimeError.orginalError = orginalError;
                                      runtimeError.logMessage = logMessage;
                                      unsubscribe();
                                      return reject(runtimeError);
                                    }
                                  };

                                  unsubscribe = function unsubscribe() {
                                    passThrough.removeListener('data', onData);
                                  };

                                  passThrough.on('data', onData);
                                  passThrough.once('end', function () {
                                    unsubscribe();
                                    resolve();
                                  });
                                  _context.prev = 5;
                                  _context.next = 8;
                                  return docker.logs({
                                    configuration: configuration,
                                    containers: containers,
                                    follow: false,
                                    passThrough: passThrough
                                  });

                                case 8:
                                  _context.next = 13;
                                  break;

                                case 10:
                                  _context.prev = 10;
                                  _context.t0 = _context["catch"](5);
                                  reject(_context.t0);

                                case 13:
                                case "end":
                                  return _context.stop();
                              }
                            }
                          }, _callee, this, [[5, 10]]);
                        }));

                        return function (_x3, _x4) {
                          return _ref4.apply(this, arguments);
                        };
                      }());

                    case 4:
                      _context2.next = 10;
                      break;

                    case 6:
                      _context2.prev = 6;
                      _context2.t0 = _context2["catch"](1);
                      isStopped = true;
                      validate.emit('error', _context2.t0);

                    case 10:
                      _context2.next = 12;
                      return sleep(250);

                    case 12:
                      _context2.next = 0;
                      break;

                    case 14:
                    case "end":
                      return _context2.stop();
                  }
                }
              }, _callee2, this, [[1, 6]]);
            }))();
            return _context3.abrupt("return", validate);

          case 14:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function validateLogs(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = validateLogs;