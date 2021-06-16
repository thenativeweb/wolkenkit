"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandWithMetadata = void 0;
const Command_1 = require("./Command");
class CommandWithMetadata extends Command_1.Command {
    constructor({ aggregateIdentifier, name, data, id, metadata }) {
        super({ aggregateIdentifier, name, data });
        this.id = id;
        this.metadata = metadata;
    }
    getItemIdentifier() {
        return {
            aggregateIdentifier: this.aggregateIdentifier,
            name: this.name,
            id: this.id
        };
    }
}
exports.CommandWithMetadata = CommandWithMetadata;
//# sourceMappingURL=CommandWithMetadata.js.map