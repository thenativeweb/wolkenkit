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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenCommand = void 0;
const buntstift_1 = require("buntstift");
const fs_1 = __importDefault(require("fs"));
const getAbsolutePath_1 = require("../../../common/utils/path/getAbsolutePath");
const getJwtSchema_1 = require("./getJwtSchema");
const validate_value_1 = require("validate-value");
const validateExpiration_1 = require("./validateExpiration");
const limes_1 = require("limes");
const errors = __importStar(require("../../../common/errors"));
const jwtParser = new validate_value_1.Parser(getJwtSchema_1.getJwtSchema());
const tokenCommand = function () {
    return {
        name: 'token',
        description: 'Issue a token.',
        optionDefinitions: [
            {
                name: 'issuer',
                alias: 'i',
                description: 'set the issuer',
                type: 'string',
                parameterName: 'url',
                isRequired: true
            },
            {
                name: 'private-key',
                alias: 'k',
                description: 'set the private key file',
                type: 'string',
                parameterName: 'path',
                isRequired: true
            },
            {
                name: 'claims',
                alias: 'c',
                description: 'set the claims file',
                type: 'string',
                parameterName: 'path',
                isRequired: true
            },
            {
                name: 'expiration',
                alias: 'e',
                description: 'set the expiration time',
                type: 'number',
                parameterName: 'minutes',
                isRequired: false,
                defaultValue: 60 * 24 * 365,
                validate: validateExpiration_1.validateExpiration
            },
            {
                name: 'raw',
                alias: 'r',
                description: 'only output the token',
                type: 'boolean',
                isRequired: false,
                defaultValue: false
            }
        ],
        async handle({ options: { verbose, issuer, 'private-key': privateKeyPath, claims: claimsPath, expiration: expiresInMinutes, raw } }) {
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            let stopWaiting;
            if (!raw) {
                stopWaiting = buntstift_1.buntstift.wait();
            }
            try {
                let claims, privateKey;
                const privateKeyAbsolutePath = getAbsolutePath_1.getAbsolutePath({
                    path: privateKeyPath,
                    cwd: process.cwd()
                });
                try {
                    privateKey = await fs_1.default.promises.readFile(privateKeyAbsolutePath);
                }
                catch {
                    buntstift_1.buntstift.info(`Private key file '${privateKeyAbsolutePath}' not found.`);
                    throw new errors.FileNotFound();
                }
                const claimsAbsolutePath = getAbsolutePath_1.getAbsolutePath({
                    path: claimsPath,
                    cwd: process.cwd()
                });
                try {
                    claims = await fs_1.default.promises.readFile(claimsAbsolutePath, { encoding: 'utf8' });
                }
                catch {
                    buntstift_1.buntstift.info(`Claims file '${claimsAbsolutePath}' not found.`);
                    throw new errors.FileNotFound();
                }
                try {
                    claims = JSON.parse(claims);
                }
                catch {
                    buntstift_1.buntstift.info('Claims malformed.');
                    throw new errors.ClaimsMalformed();
                }
                jwtParser.parse(claims, { valueName: 'jwt' }).unwrapOrThrow((err) => {
                    buntstift_1.buntstift.info('Claims malformed.');
                    return err;
                });
                const subject = claims.sub;
                const payload = { ...claims, sub: undefined };
                if (!raw) {
                    buntstift_1.buntstift.info('Issuing a token...');
                }
                const limes = new limes_1.Limes({
                    identityProviders: [new limes_1.IdentityProvider({ issuer, privateKey, expiresInMinutes })]
                });
                const token = limes.issueToken({ issuer, subject, payload });
                if (!raw) {
                    buntstift_1.buntstift.newLine();
                    buntstift_1.buntstift.line();
                    buntstift_1.buntstift.info(token);
                    buntstift_1.buntstift.line();
                    buntstift_1.buntstift.newLine();
                    buntstift_1.buntstift.success('Issued a token.');
                }
                else {
                    // eslint-disable-next-line no-console
                    console.log(token);
                }
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to issue a token.');
                throw ex;
            }
            finally {
                if (stopWaiting) {
                    stopWaiting();
                }
            }
        }
    };
};
exports.tokenCommand = tokenCommand;
//# sourceMappingURL=tokenCommand.js.map