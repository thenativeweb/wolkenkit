"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCommand = void 0;
const Command_1 = require("../../elements/Command");
const buildCommand = function ({ aggregateIdentifier, name, data }) {
    return new Command_1.Command({
        aggregateIdentifier,
        name,
        data
    });
};
exports.buildCommand = buildCommand;
//# sourceMappingURL=buildCommand.js.map