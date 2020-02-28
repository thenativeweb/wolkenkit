import { NextDocument } from 'thenativeweb-ux';
import { theme } from '../theme';
import { DocumentContext, DocumentInitialProps } from 'next/document';

class CustomDocument extends NextDocument {
  public static async getInitialProps (originalContext: DocumentContext): Promise<DocumentInitialProps> {
    return NextDocument.getInitialPropsWithTheme(originalContext, theme);
  }
}

export default CustomDocument;
