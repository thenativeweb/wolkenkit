import { DocumentationPage as DocumentationPageLayout } from 'thenativeweb-ux';
import { navigation } from '../../configuration/navigation';
import React, { FunctionComponent, ReactElement } from 'react';

interface DocumentationPageProps {
  pageTitle?: string;
}

const DocumentationPage: FunctionComponent<DocumentationPageProps> = ({
  children,
  pageTitle
}): ReactElement => (
  <DocumentationPageLayout
    productName='docs'
    navigation={ navigation }
    siteTitle={ pageTitle ?? 'wolkenkit Documenation' }
    yearOfCreation={ 2_016 }
  >
    { children }
  </DocumentationPageLayout>
);

export { DocumentationPage };
