import { classNames, createUseStyles, Theme } from 'thenativeweb-ux';
import { HintClassNames, styles } from './styles';
import React, { CSSProperties, FunctionComponent, ReactElement } from 'react';

const useStyles = createUseStyles<Theme, HintClassNames>(styles);

interface HintProps {
  className?: string;
  style?: CSSProperties;
  title: string;
  type: 'congrats' | 'question' | 'tip' | 'warning' | 'wisdom';
}

const Hint: FunctionComponent<HintProps> = ({
  children,
  className = '',
  style,
  title,
  type
}): ReactElement => {
  const classes = useStyles();

  const componentClasses = classNames(
    classes.Hint,
    {
      [classes.TypeCongrats]: type === 'congrats',
      [classes.TypeQuestion]: type === 'question',
      [classes.TypeTip]: type === 'tip',
      [classes.TypeWarning]: type === 'warning',
      [classes.TypeWisdom]: type === 'wisdom'
    },
    className
  );

  return (
    <div className={ componentClasses } style={ style }>
      <blockquote className={ classes.Bubble }>
        <header><strong>{ title }</strong></header>
        { children }
      </blockquote>
    </div>
  );
};

export default Hint;
