import { navigation } from '../../configuration/navigation';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import {
  Breadcrumbs,
  Button,
  classNames,
  createUseStyles,
  Footer,
  getLanguageFromUrl,
  HorizontalBar,
  Link,
  MobileToggle,
  NonIdealState,
  PageNavigation,
  PageTree,
  Product,
  Sidebar,
  SidebarBrand,
  SidebarItem,
  Theme,
  useDevice,
  useRouteChange
} from 'thenativeweb-ux';
import { DocumentationClassNames, styles } from './styles';
import React, { FunctionComponent, ReactElement, useCallback, useEffect, useState } from 'react';

const useStyles = createUseStyles<Theme, DocumentationClassNames>(styles);

const Documentation: FunctionComponent = ({ children }): ReactElement | null => {
  const router = useRouter();
  const classes = useStyles();
  const device = useDevice();

  const language = getLanguageFromUrl(router.asPath);
  const items = navigation[language];

  if (!Array.isArray(items)) {
    return null;
  }

  const pageTree = new PageTree({
    items,
    basePath: `/${language}`
  });
  const isMobile = device === 'xs';

  const [ isNavigationVisible, setIsNavigationVisible ] = useState(true);
  const [ isSearchVisible, setIsSearchVisible ] = useState(false);
  const [ activePath, setActivePath ] = useState(router.asPath);

  const currentPage = pageTree.getPageItemByPath(activePath);

  const componentClasses = classNames(classes.Documentation, {
    [classes.WithNavigationVisible]: isNavigationVisible
  });

  const hideNavigationOnMobile = useCallback((): void => {
    if (isMobile) {
      setIsNavigationVisible(false);
    }
  }, []);

  const toggleNavigation = useCallback((): void => {
    setIsNavigationVisible(!isNavigationVisible);
  }, [ isNavigationVisible ]);

  useRouteChange((newPath): void => {
    setActivePath(newPath);
    hideNavigationOnMobile();
  }, [ device ]);

  useEffect(hideNavigationOnMobile, []);

  return (
    <div className={ componentClasses }>
      <div className={ classes.NavigationForDesktop }>
        <Sidebar>
          <NextLink href='/'>
            <Link href='/'>
              <SidebarBrand>
                <Product name='docs' />
              </SidebarBrand>
            </Link>
          </NextLink>
          <SidebarItem
            iconName='toggle-left-panel'
            onClick={ toggleNavigation }
            isActive={ isNavigationVisible }
          />
        </Sidebar>
      </div>

      <HorizontalBar
        background='dark'
        paddingHorizontal='sm'
        borderBottom={ false }
        className={ classes.NavigationForMobile }
      >
        <NextLink href='/'>
          <Link href='/'>
            <Product name='docs' size='sm' />
          </Link>
        </NextLink>
      </HorizontalBar>

      <MobileToggle
        isVisible={ isNavigationVisible }
        onClick={ toggleNavigation }
      />

      <div className={ classes.NavigationUniversal }>
        <PageNavigation
          header={
            <HorizontalBar align='space-between' paddingHorizontal='none'>
              <Button icon='search' onClick={ (): void => setIsSearchVisible(!isSearchVisible) } iconSize='sm' style={{ padding: 16 }} />
            </HorizontalBar>
          }
          nonIdealState={
            <NonIdealState cause='Sorry, no pages found.'>
              <p>
                Try searching for something else!
              </p>
            </NonIdealState>
          }
          pageTree={ pageTree }
          showSearchBar={ isSearchVisible }
          activePath={ activePath }
        />
      </div>

      <div className={ classes.Content }>
        {
          currentPage && (
            <HorizontalBar paddingHorizontal='none' className={ classes.ContentTopBar }>
              <Breadcrumbs items={ currentPage.breadcrumbs } size='md' color='light' />
            </HorizontalBar>
          )
        }

        { children }

        <Footer yearOfCreation={ 2017 } />
      </div>
    </div>
  );
};

export { Documentation };
