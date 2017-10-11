'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var flatten = require('lodash/flatten'),
    map = require('lodash/map'),
    merge = require('lodash/merge');

var getEnvironmentVariables = require('./getEnvironmentVariables'),
    shell = require('../shell');

var getContainers = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(options) {
    var configuration, env, where, environmentVariables, filter, _ref2, stdout, containers;

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
            if (options.where) {
              _context.next = 8;
              break;
            }

            throw new Error('Where is missing.');

          case 8:
            configuration = options.configuration, env = options.env, where = options.where;
            _context.next = 11;
            return getEnvironmentVariables({ configuration: configuration, env: env });

          case 11:
            environmentVariables = _context.sent;
            filter = flatten(map(where, function (keyValuePair, criterion) {
              return map(keyValuePair, function (value, key) {
                return '--filter \'' + criterion + '=' + key + '=' + value + '\'';
              });
            }));
            _context.next = 15;
            return shell.exec('docker ps --all ' + filter.join(' ') + ' --format \'{{json .}}\'', {
              env: environmentVariables
            });

          case 15:
            _ref2 = _context.sent;
            stdout = _ref2.stdout;
            containers = stdout.split('\n').filter(function (item) {
              return item;
            }).map(function (item) {
              return JSON.parse(item);
            }).map(function (container) {
              return {
                name: container.Names,
                labels: container.Labels.split(',').map(function (label) {
                  var _label$split = label.split('='),
                      _label$split2 = _slicedToArray(_label$split, 2),
                      key = _label$split2[0],
                      value = _label$split2[1];

                  return _defineProperty({}, key, value);
                }).reduce(function (labels, label) {
                  return merge({}, labels, label);
                })
              };
            });
            return _context.abrupt('return', containers);

          case 19:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function getContainers(_x) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = getContainers;