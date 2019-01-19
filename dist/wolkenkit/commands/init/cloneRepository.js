'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var errors = require('../../../errors'),
    runtimes = require('../../runtimes'),
    shell = require('../../../shell');

var cloneRepository =
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(_ref, progress) {
    var directory, template, latestStableVersion, wolkenkitUrl, matches, _matches, url, branch, branchOption;

    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            directory = _ref.directory, template = _ref.template;

            if (directory) {
              _context.next = 3;
              break;
            }

            throw new Error('Directory is missing.');

          case 3:
            if (template) {
              _context.next = 5;
              break;
            }

            throw new Error('Template is missing.');

          case 5:
            if (progress) {
              _context.next = 7;
              break;
            }

            throw new Error('Progress is missing.');

          case 7:
            _context.next = 9;
            return runtimes.getLatestStableVersion();

          case 9:
            latestStableVersion = _context.sent;
            wolkenkitUrl = "https://docs.wolkenkit.io/".concat(latestStableVersion, "/getting-started/installing-wolkenkit/verifying-system-requirements/");
            matches = template.match(/^((?:git:|ssh:|https:\/\/|git@[\w.]+)[\w.@:/~_-]+(?:\.git)?\/?)(?:#([a-zA-Z0-9/.\-_]+))?$/);

            if (matches) {
              _context.next = 15;
              break;
            }

            progress({
              message: 'Malformed url.',
              type: 'info'
            });
            throw new errors.UrlMalformed();

          case 15:
            _context.next = 17;
            return shell.which('git');

          case 17:
            if (_context.sent) {
              _context.next = 20;
              break;
            }

            progress({
              message: "git is not installed (see ".concat(wolkenkitUrl, " for how to install wolkenkit)."),
              type: 'info'
            });
            throw new errors.ExecutableNotFound();

          case 20:
            _matches = (0, _slicedToArray2.default)(matches, 3), url = _matches[1], branch = _matches[2];
            branchOption = branch ? "--branch ".concat(branch) : '';
            progress({
              message: "Cloning ".concat(template, "..."),
              type: 'info'
            });
            _context.prev = 23;
            _context.next = 26;
            return shell.exec("git clone ".concat(branchOption, " ").concat(url, " ."), {
              silent: true,
              cwd: directory
            });

          case 26:
            _context.next = 33;
            break;

          case 28:
            _context.prev = 28;
            _context.t0 = _context["catch"](23);
            progress({
              message: "".concat(_context.t0.stderr)
            });
            progress({
              message: 'git failed to clone the template.',
              type: 'info'
            });
            throw _context.t0;

          case 33:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[23, 28]]);
  }));

  return function cloneRepository(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

module.exports = cloneRepository;