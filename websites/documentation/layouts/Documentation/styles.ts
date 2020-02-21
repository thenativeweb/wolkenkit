import { Styles } from 'jss';
import { Theme } from 'thenativeweb-ux';

export type DocumentationClassNames =
'Documentation' |
'WithNavigationVisible' |
'NavigationUniversal' |
'NavigationForDesktop'|
'NavigationForMobile' |
'Content' |
'ContentTopBar';

const navigationPanelWidthXs = '100%';
const navigationPanelWidthSm = '200px';
const navigationPanelWidthMd = '300px';

const styles = (theme: Theme): Styles<DocumentationClassNames> => ({
  Documentation: {
    background: theme.color.brand.white
  },

  WithNavigationVisible: {
    '& $NavigationUniversal': {
      overflowY: 'auto',
      overflowX: 'hidden'
    }
  },

  NavigationForDesktop: {
    zIndex: theme.zIndices.navigation,
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100%',
    overflow: 'hidden',
    display: 'flex'
  },

  NavigationForMobile: {
  },

  NavigationUniversal: {
    zIndex: theme.zIndices.navigation,
    position: 'fixed',
    top: 0,
    width: '0px',
    height: '100%',
    overflow: 'hidden',
    background: theme.color.brand.white,
    transition: `width 200ms, transform 300ms ${theme.ease.outCirc}, opacity 500ms ${theme.ease.outCirc}`
  },

  Content: {
    transition: 'margin-left 200ms'
  },

  ContentTopBar: {
  },

  [theme.breakpoints.only('xs')]: {
    NavigationForDesktop: {
      display: 'none'
    },

    NavigationForMobile: {
      display: 'flex'
    },

    NavigationUniversal: {
      left: 0,
      opacity: 0,
      width: navigationPanelWidthXs,
      pointerEvents: 'none',
      transform: 'translate(0,-20px)',

      '& > *': {
        width: navigationPanelWidthXs
      }
    },

    Content: {
      paddingLeft: theme.space(2),
      paddingRight: theme.space(2),
      paddingBottom: theme.space(3)
    },

    WithNavigationVisible: {
      '& $NavigationUniversal': {
        pointerEvents: 'all',
        opacity: 1,
        transform: 'translate(0,0)'
      },

      '& $Content': {
        marginLeft: 0
      }
    }
  },

  [theme.breakpoints.up('sm')]: {
    NavigationForDesktop: {
      display: 'flex'
    },

    NavigationForMobile: {
      display: 'none'
    },

    NavigationUniversal: {
      borderRight: `1px solid ${theme.color.brand.grayLight}`,
      left: theme.components.Sidebar.width,

      '& > *': {
        width: navigationPanelWidthSm
      }
    },

    Content: {
      padding: theme.space(6),
      paddingTop: 0,
      marginLeft: theme.components.Sidebar.width
    },

    WithNavigationVisible: {
      '& $NavigationUniversal': {
        width: navigationPanelWidthSm
      },

      '& $Content': {
        marginLeft: `calc(${navigationPanelWidthSm} + ${theme.components.Sidebar.width})`
      }
    }
  },

  [theme.breakpoints.up('md')]: {
    NavigationUniversal: {
      '& > *': {
        width: navigationPanelWidthMd
      }
    },

    WithNavigationVisible: {
      '& $NavigationUniversal': {
        width: navigationPanelWidthMd
      },

      '& $Content': {
        marginLeft: `calc(${navigationPanelWidthMd} + ${theme.components.Sidebar.width})`
      }
    }
  }
});

export { styles };
