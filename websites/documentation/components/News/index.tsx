import { ComponentClassNames, createUseStyles, Headline, Theme } from 'thenativeweb-ux';
import React, { FunctionComponent, ReactElement } from 'react';

type NewsClassNames =
  'News' |
  'Items';

const useStyles = createUseStyles<Theme, NewsClassNames>((theme: Theme): ComponentClassNames<NewsClassNames> => ({
  News: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },

  Items: {
    flex: '1 1 100%',
    overflow: 'auto',
    '-webkit-overflow-scrolling': 'touch'
  },

  [theme.breakpoints.down('sm')]: {
    News: {
      overflow: 'visible',
      flex: '1 1 auto',
      width: '100%',
      display: 'block'
    },

    Title: {
      padding: theme.space(2)
    }
  }
}));

const News: FunctionComponent = ({ children }): ReactElement => {
  const classes = useStyles();

  return (
    <div className={ classes.News }>
      <Headline level='1'>News</Headline>
      <div className={ classes.Items }>
        { children }
      </div>
    </div>
  );
};

export { News };
