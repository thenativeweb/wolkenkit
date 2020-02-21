import Head from 'next/head';
import { NextPage } from 'next';
import React, { ReactElement } from 'react';

interface RedirectProps {
  metaRedirect: boolean;
}

const redirect = (destination: string): NextPage<RedirectProps> => {
  if (!destination) {
    throw new Error('Destination is missing.');
  }

  const RedirectComponent: NextPage<RedirectProps> = ({ metaRedirect }): ReactElement | null => {
    if (metaRedirect) {
      return (
        <Head>
          <meta httpEquiv='refresh' content={ `0; url=${destination}` } />
        </Head>
      );
    }

    return null;
  };

  // eslint-disable-next-line @typescript-eslint/unbound-method
  RedirectComponent.getInitialProps = function ({ res }): RedirectProps {
    if (res && res.writeHead) {
      res.writeHead(302, { Location: destination });
      res.end();
    }

    return { metaRedirect: true };
  };

  return RedirectComponent;
};

export { redirect };
