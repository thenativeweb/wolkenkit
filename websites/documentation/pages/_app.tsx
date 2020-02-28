import { Documentation } from '../layouts/Documentation';
import { theme } from '../theme';
import { NextApp, Website } from 'thenativeweb-ux';
import React, { ReactElement } from 'react';

class CustomApp extends NextApp {
  public render (): ReactElement {
    const { Component, pageProps } = this.props;

    return NextApp.renderWithTheme((
      <Website
        useNotifications={ true }
        useDialogs={ true }
      >
        <Documentation>
          <Component { ...pageProps } />
        </Documentation>
      </Website>
    ), theme);
  }
}

export default CustomApp;
