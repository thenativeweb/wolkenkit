import { Date } from '../Date';
import { ComponentClassNames, createUseStyles, Theme } from 'thenativeweb-ux';
import React, { FunctionComponent, ReactElement } from 'react';

type NewsItemClassNames =
  'NewsItem' |
  'Title' |
  'Date';

const useStyles = createUseStyles<Theme, NewsItemClassNames>((theme: Theme): ComponentClassNames<NewsItemClassNames> => ({
  NewsItem: {
    padding: `${theme.space(3)}px 0`,
    maxWidth: theme.components.Paragraph.maxWidth,
    fontSize: theme.font.size.md
  },

  Title: {
    display: 'flex',
    fontFamily: theme.font.family.default,
    fontSize: theme.font.size.lg,
    fontWeight: 600,
    marginBottom: theme.space(1)
  },

  Date: {
    fontWeight: 400,
    paddingRight: theme.space(2)
  },

  [theme.breakpoints.down('sm')]: {
    NewsItem: {
      padding: 0,
      margin: `${theme.space(0.5)}px 0`,

      '& p': {
        margin: `0 ${theme.space(2)}px`,
        padding: `${theme.space(2)}px 0`
      }
    },

    Title: {}
  }
}));

interface NewsItemProps {
  day: string;
  month: string;
  year: string;
  title: string;
}

const NewsItem: FunctionComponent<NewsItemProps> = ({ children, day, month, title, year }): ReactElement => {
  const classes = useStyles();

  return (
    <div className={ classes.NewsItem }>
      <h2 className={ classes.Title }>
        <Date className={ classes.Date } year={ year } month={ month } day={ day } />
        { title }
      </h2>

      { children }
    </div>
  );
};

export { NewsItem };
