import * as React from 'react';
import { useState } from 'react';
import {
  Link,
} from 'react-router-dom';
import { useSelector } from 'react-redux';
import styles from './Header.module.scss';
import logo from '../../assets/images/logo.svg';
import menu from '../../assets/images/menu.svg';
import budjets from './images/budjets.svg';
import costs from './images/costs.svg';
import overview from './images/overview.svg';
import profits from './images/profits.svg';
import savings from './images/savings.svg';
import HeaderMobileMenu from '../HeaderMobileMenu/HeaderMobileMenu';
import Container from '../../hocs/PageContainer/PageContainer';
import { useAuth } from '../../hooks/use-auth';

const menuItems = [
  {
    title: 'Сводка',
    icon: overview,
    url: '/overview',
    id: 0,
  },
  {
    title: 'Доходы',
    icon: profits,
    url: '/incomes',
    id: 1,
  },
  {
    title: 'Постоянные расходы',
    icon: costs,
    url: '/costs',
    id: 2,
  },
  {
    title: 'Сбережения',
    icon: savings,
    url: '/savings',
    id: 3,
  },
  // {
  //   title: 'Дополнительные бюджеты',
  //   icon: budjets,
  //   url: '/',
  //   id: 4,
  // },
];

const Header = () => {
  const {
    header,
    headerItem,
    headerNav,
    headerNavList,
    mobileMenuBtn,
    notActive,
    active,
    headerInner,
    logoWrapper,
    item,
    link,
    mobileMenu,
    mobileMenuOpened,
    headerLogo,
    exitWrapper,
  } = styles;
  const [isMenuOpened, toggleMenu] = useState(false);
  const buttonClassname = isMenuOpened ? active : notActive;
  const mobMenuClassname = isMenuOpened ? mobileMenuOpened : '';
  const auth = useAuth();
  const accessToken = useSelector((state) => state.user.accessToken);

  return (
    <header className={header}>
      <Container>
        <div className={headerInner}>
          <nav className={headerNav}>
            <Link to="/" className={[logoWrapper, headerItem].join(' ')}>
              <img src={logo} alt="Логотип" className={headerLogo} />
            </Link>
            <ul className={headerNavList}>
              {accessToken && menuItems.map((listItem) => (
                <li key={listItem.id} className={item}>
                  <Link to={listItem.url} className={[link, headerItem].join(' ')}>{listItem.title}</Link>
                </li>
              ))}
            </ul>
          </nav>
          {
            accessToken ? (
              <button
                type="button"
                className={[headerItem, mobileMenuBtn, 'btn'].join(' ')}
                onClick={() => toggleMenu((prev) => !prev)}
              >
                <img alt="mobile-menu" src={menu} className={headerLogo} />
              </button>
            ) : (
              <Link to="/sign-in" className={[link, headerItem, mobileMenuBtn].join(' ')}>Вход</Link>
            )
          }
          <div className={exitWrapper}>
            {
              accessToken ? (
                <a className={[link, headerItem].join(' ')} onClick={() => auth.signOut()}>Выход</a>
              ) : (
                <Link to="/sign-in" className={[link, headerItem].join(' ')}>Вход</Link>
              )
            }
          </div>
        </div>
      </Container>
      {
        accessToken && (
          <div className={[mobileMenu, mobMenuClassname].join(' ')}>
            <HeaderMobileMenu menuItems={menuItems} menuCloseHandler={toggleMenu} />
          </div>
        )
      }
    </header>
  );
};

export default Header;
