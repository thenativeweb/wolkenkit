#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buntstift_1 = require("buntstift");
const getHandlers_1 = require("../clis/getHandlers");
const rootCommand_1 = require("../clis/concierge/rootCommand");
const command_line_interface_1 = require("command-line-interface");
/* eslint-disable @typescript-eslint/no-floating-promises */
(async () => {
    try {
        await command_line_interface_1.runCli({
            rootCommand: rootCommand_1.rootCommand(),
            argv: process.argv,
            handlers: getHandlers_1.getHandlers()
        });
    }
    catch (ex) {
        buntstift_1.buntstift.info(ex.message);
        buntstift_1.buntstift.error('An unexpected error occured.');
        process.exit(1);
    }
})();
/* eslint-enable @typescript-eslint/no-floating-promises */
//# sourceMappingURL=concierge.js.map