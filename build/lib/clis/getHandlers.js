"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHandlers = void 0;
const buntstift_1 = require("buntstift");
const getHandlers = function () {
    return {
        commandFailed({ ex }) {
            if (ex instanceof Error && ex.stack) {
                buntstift_1.buntstift.verbose(ex.stack, { isVerboseModeEnabled: true });
            }
        },
        commandUnknown({ unknownCommandName, recommendedCommandName }) {
            buntstift_1.buntstift.error(`Unknown command '${unknownCommandName}', did you mean '${recommendedCommandName}'?`);
        },
        optionInvalid({ reason }) {
            buntstift_1.buntstift.error(reason);
        },
        optionMissing({ optionDefinition }) {
            buntstift_1.buntstift.error(`Option '${optionDefinition.name}' is missing.`);
        },
        optionUnknown({ optionName }) {
            buntstift_1.buntstift.error(`Unknown option '${optionName}'.`);
        }
    };
};
exports.getHandlers = getHandlers;
//# sourceMappingURL=getHandlers.js.map