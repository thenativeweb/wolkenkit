import { ComponentClassNames, Theme } from 'thenativeweb-ux';

export type HintClassNames =
  'Hint' |
  'Bubble' |
  'TypeCongrats' |
  'TypeQuestion' |
  'TypeTip' |
  'TypeWarning' |
  'TypeWisdom';

const styles = (theme: Theme): ComponentClassNames<HintClassNames> => ({
  Hint: {
    position: 'relative',
    maxWidth: theme.components.Paragraph.maxWidth,
    marginTop: theme.space(8),
    marginBottom: theme.space(8),

    '&::after': {
      position: 'absolute',
      width: '200px',
      height: '200px',
      left: '10px',
      top: '50%',
      marginTop: '-120px',
      content: '""',
      backgroundRepeat: 'no-repeat'
    }
  },

  Bubble: {
    maxWidth: theme.components.Paragraph.maxWidth,
    margin: `${theme.space(2)}px ${theme.space(4)}px ${theme.space(2)}px 0px`,
    background: theme.color.brand.grayLight,
    padding: `${theme.space(4)}px ${theme.space(5)}px ${theme.space(3)}px ${theme.space(5)}px`,
    marginLeft: `${theme.space(28)}px`,
    borderRadius: theme.space(1),

    '& header': {
      fontFamily: 'Kalam',
      fontSize: '24px',
      'letter-spacing': '0.5px'
    },

    '&:after': {
      position: 'absolute',
      borderColor: `transparent ${theme.color.brand.grayLight} transparent transparent`,
      borderStyle: 'solid',
      borderWidth: theme.space(1),
      top: '50%',
      content: '""',
      left: 0,
      marginLeft: `${theme.space(26)}px`,
      marginTop: '-10px'
    }
  },

  TypeCongrats: {
    '&::after': {
      backgroundImage: `url('/mascot/congrats-medium.svg')`
    }
  },

  TypeQuestion: {
    '&::after': {
      backgroundImage: `url('/mascot/question-medium.svg')`
    }
  },

  TypeTip: {
    '&::after': {
      backgroundImage: `url('/mascot/tip-medium.svg')`
    }
  },

  TypeWarning: {
    '&::after': {
      backgroundImage: `url('/mascot/warning-medium.svg')`
    }
  },

  TypeWisdom: {
    '&::after': {
      backgroundImage: `url('/mascot/wisdom-medium.svg')`
    }
  },

  [theme.breakpoints.down('sm')]: {
    Hint: {
      '&:after': {
        left: '50%',
        top: -theme.space(21),
        marginLeft: -theme.space(12),
        marginTop: 0,
        width: theme.space(20),
        height: theme.space(20)
      }
    },
    Bubble: {
      padding: theme.space(2),
      marginTop: theme.space(24),
      marginLeft: 0,

      '&::after': {
        top: 0,
        left: '50%',
        marginTop: -theme.space(2),
        marginLeft: -theme.space(3),
        borderColor: `transparent transparent ${theme.color.brand.grayLight} transparent`
      }
    }
  }
});

export { styles };
