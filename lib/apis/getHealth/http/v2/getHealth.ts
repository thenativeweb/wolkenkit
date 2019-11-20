import { RequestHandler } from 'express';

const getHealth = function (): RequestHandler {
  return function (_req, res): void {
    const { arch, platform, version, pid } = process;
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
};

export { getHealth };
