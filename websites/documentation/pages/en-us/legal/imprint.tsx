/* eslint-disable react/jsx-child-element-spacing */
import { DocumentationPage } from '../../../layouts/DocumentationPage';
import { Headline, Paragraph } from 'thenativeweb-ux';
import React, { ReactElement } from 'react';

export default (): ReactElement => (
  <DocumentationPage>
    <Headline level='1'>
      Imprint
    </Headline>

    <Paragraph>
      the native web GmbH
    </Paragraph>

    <Paragraph>
      Hauptstraße 8<br />
      79359 Riegel am Kaiserstuhl<br />
      Germany
    </Paragraph>

    <Paragraph>
      Managing partners are Susanna Roden, Stefan Brandys and Golo Roden
    </Paragraph>

    <Paragraph>
      Phone +49 177 3373175<br />
      Web https://www.thenativeweb.io<br />
      Mail hello@thenativeweb.io<br />
      Twitter @thenativeweb<br />
    </Paragraph>

    <Paragraph>
      IBAN DE78 6001 0070 0946 4157 06 BIC PBNKDEFF
    </Paragraph>

    <Paragraph>
      Registry court is Freiburg im Breisgau, Germany<br />
      Commercial register HRB 709303<br />
      German VAT no. DE 287 040 877<br />
    </Paragraph>

    <Paragraph>
      Registered office is Riegel am Kaiserstuhl, Germany
    </Paragraph>

    <Paragraph>
      Responsible for content in accordance with § 55 section 2 RStV is the native web GmbH, address as above
    </Paragraph>

    <Paragraph>
      Read our privacy policy
    </Paragraph>
  </DocumentationPage>
);
/* eslint-enable react/jsx-child-element-spacing */
