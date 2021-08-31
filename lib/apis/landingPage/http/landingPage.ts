import fs from 'fs';
import path from 'path';
import { WolkenkitRequestHandler } from '../../base/WolkenkitRequestHandler';

const landingPage = {
  description: 'Serves the landing page',
  path: '',

  request: {},
  response: {
    statusCodes: [ 200 ]
  },

  async getHandler (): Promise<WolkenkitRequestHandler> {
    const absoluteAssetsDirectory = path.join(__dirname, '..', '..', '..', '..', 'assets');

    const absoluteLandingPageFile = path.join(absoluteAssetsDirectory, 'landingPage.html');
    const absoluteWolkenkitLogoFile = path.join(absoluteAssetsDirectory, 'logo.svg');
    const absoluteFaviconFile = path.join(absoluteAssetsDirectory, 'favicon.png');

    const [
      landingPageContentRaw,
      wolkenkitLogoBase64,
      faviconBase64
    ] = await Promise.all([
      await fs.promises.readFile(absoluteLandingPageFile, 'utf-8'),
      await fs.promises.readFile(absoluteWolkenkitLogoFile, 'base64'),
      await fs.promises.readFile(absoluteFaviconFile, 'base64')
    ]);

    const landingPageContent = landingPageContentRaw.
      replace(
        '<wolkenkitLogoSvgSrc>',
        `data:image/svg+xml;charset=utf-8;base64,${wolkenkitLogoBase64}`
      ).
      replace(
        '<wolkenkitFaviconPngSrc>',
        `data:image/png;base64,${faviconBase64}`
      );

    return async function (req, res): Promise<void> {
      res.status(200).send(landingPageContent);
    };
  }
};

export { landingPage };
