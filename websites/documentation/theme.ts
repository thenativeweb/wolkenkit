import { themes } from 'thenativeweb-ux';

class WolkenkitDocumentationTheme extends themes.Wolkenkit {
  public constructor () {
    super();

    this.font.import += '|Kalam:400';
  }
}

const theme = new WolkenkitDocumentationTheme();

export { theme };
