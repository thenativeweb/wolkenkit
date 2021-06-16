"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCommand = void 0;
const buntstift_1 = require("buntstift");
const Client_1 = require("../../../apis/getHealth/http/v2/Client");
const validatePort_1 = require("../dev/validatePort");
const validateSocket_1 = require("../dev/validateSocket");
const errors = __importStar(require("../../../common/errors"));
const healthCommand = function () {
    return {
        name: 'health',
        description: 'Verify the health of a wolkenkit application process.',
        optionDefinitions: [
            {
                name: 'protocol',
                alias: 'r',
                description: 'set the protocol',
                parameterName: 'protocol',
                type: 'string',
                isRequired: false,
                defaultValue: 'http'
            },
            {
                name: 'host-name',
                alias: 'n',
                description: 'set the host name',
                parameterName: 'hostName',
                type: 'string',
                isRequired: false,
                defaultValue: 'localhost'
            },
            {
                name: 'health-port',
                alias: 'p',
                description: 'set the health port',
                parameterName: 'port',
                type: 'number',
                isRequired: false,
                validate: validatePort_1.validatePort
            },
            {
                name: 'health-socket',
                alias: 's',
                description: 'set the health socket',
                parameterName: 'path',
                type: 'string',
                isRequired: false,
                validate: validateSocket_1.validateSocket
            },
            {
                name: 'base-path',
                alias: 'b',
                description: 'set the health base path',
                parameterName: 'basePath',
                type: 'string',
                isRequired: false,
                defaultValue: '/health/v2/'
            }
        ],
        async handle({ options: { protocol, 'host-name': hostName, 'health-port': healthPort, 'health-socket': healthSocket, 'base-path': basePath, verbose } }) {
            var _a;
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            if (healthPort && healthSocket) {
                buntstift_1.buntstift.info('Health port and health socket must not be set at the same time.');
                throw new errors.ParameterInvalid();
            }
            const healthPortOrSocket = (_a = healthPort !== null && healthPort !== void 0 ? healthPort : healthSocket) !== null && _a !== void 0 ? _a : 3001;
            buntstift_1.buntstift.info(`Sending health request to '${protocol}://${hostName}:${healthPort}${basePath}'.`);
            const healthClient = new Client_1.Client({
                protocol,
                hostName,
                portOrSocket: healthPortOrSocket,
                path: basePath
            });
            try {
                const healthData = await healthClient.getHealth();
                buntstift_1.buntstift.success('Health check successful.');
                buntstift_1.buntstift.verbose(JSON.stringify(healthData, null, 2));
                // eslint-disable-next-line unicorn/no-process-exit
                process.exit(0);
            }
            catch {
                buntstift_1.buntstift.error('Health check failed.');
                // eslint-disable-next-line unicorn/no-process-exit
                process.exit(1);
            }
        }
    };
};
exports.healthCommand = healthCommand;
//# sourceMappingURL=healthCommand.js.map