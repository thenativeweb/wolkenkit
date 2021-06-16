"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = void 0;
const path_1 = __importDefault(require("path"));
const shelljs_1 = __importDefault(require("shelljs"));
const transform = async ({ applicationDirectory }) => {
    shelljs_1.default.rm('-rf', path_1.default.join(applicationDirectory, 'server', 'domain'));
    shelljs_1.default.rm('-rf', path_1.default.join(applicationDirectory, 'server', 'views', 'sampleView', 'projections'));
    shelljs_1.default.rm('-rf', path_1.default.join(applicationDirectory, 'server', 'views', 'sampleView', 'queries'));
    shelljs_1.default.rm('-rf', path_1.default.join(applicationDirectory, 'server', 'views', 'sampleView', 'initializer.ts'));
};
exports.transform = transform;
//# sourceMappingURL=transform.js.map