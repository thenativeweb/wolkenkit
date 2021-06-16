"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealth = void 0;
const getHealth = {
    description: 'Returns service health information.',
    path: '',
    request: {},
    response: {
        statusCode: [200],
        body: {
            type: 'object',
            properties: {
                host: {
                    type: 'object',
                    properties: {
                        architecture: { type: 'string', minLength: 1 },
                        platform: { type: 'string', minLength: 1 }
                    },
                    required: ['architecture', 'platform'],
                    additionalProperties: false
                },
                node: { type: 'object',
                    properties: {
                        version: { type: 'string', minLength: 1 }
                    },
                    required: ['version'],
                    additionalProperties: false },
                process: { type: 'object',
                    properties: {
                        id: { type: 'number' },
                        uptime: { type: 'number' }
                    },
                    required: ['id', 'uptime'],
                    additionalProperties: false },
                cpuUsage: { type: 'object',
                    properties: {
                        user: { type: 'number' },
                        system: { type: 'number' }
                    },
                    required: ['user', 'system'],
                    additionalProperties: false },
                memoryUsage: { type: 'object',
                    properties: {
                        rss: { type: 'number' },
                        maxRss: { type: 'number' },
                        heapTotal: { type: 'number' },
                        heapUsed: { type: 'number' },
                        external: { type: 'number' }
                    },
                    required: ['rss', 'maxRss', 'heapTotal', 'heapUsed', 'external'],
                    additionalProperties: false },
                diskUsage: { type: 'object',
                    properties: {
                        read: { type: 'number' },
                        write: { type: 'number' }
                    },
                    required: ['read', 'write'],
                    additionalProperties: false }
            },
            required: ['host', 'node', 'process', 'cpuUsage', 'memoryUsage', 'diskUsage'],
            additionalProperties: false
        }
    },
    getHandler() {
        return function (req, res) {
            const { arch, platform, version, pid } = process;
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const { userCPUTime, systemCPUTime, maxRSS, fsRead, fsWrite } = process.resourceUsage();
            const { rss, heapTotal, heapUsed, external } = process.memoryUsage();
            const uptime = process.uptime();
            res.json({
                host: { architecture: arch, platform },
                node: { version },
                process: { id: pid, uptime },
                cpuUsage: { user: userCPUTime, system: systemCPUTime },
                memoryUsage: { rss, maxRss: maxRSS, heapTotal, heapUsed, external },
                diskUsage: { read: fsRead, write: fsWrite }
            });
        };
    }
};
exports.getHealth = getHealth;
//# sourceMappingURL=getHealth.js.map