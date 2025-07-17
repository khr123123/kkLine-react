// BaseLayout.tsx
import {
  CommentOutlined,
  ContactsOutlined,
  DashboardOutlined,
  GithubOutlined,
  OpenAIOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
  YoutubeOutlined
} from '@ant-design/icons'
import { useUserStore } from '@renderer/store/useUserStore'
import { FloatButton, Layout, Menu, theme } from 'antd'
import React, { useEffect, useState } from 'react'
import { Outlet, useLocation, useMatches, useNavigate } from 'react-router-dom'
import { useIsAdmin } from '../auth/RouteGuard'
import GlobalToolBar from './GlobalToolBar'
import UserIconCard from './UserIconCard'
const { Sider, Content } = Layout

interface HandleWithRightArea {
  RightArea?: React.ComponentType<any>
}

const BaseLayout: React.FC = () => {
  const [selectedMenuKey, setSelectedMenuKey] = useState('sessions')
  const navigate = useNavigate()
  const isAdmin = useIsAdmin()
  const location = useLocation()
  const user = useUserStore((state) => state.user)

  const handleMenuClick = (key: string) => {
    if (key === 'myGithub') {
      window.open('https://github.com/khr123123');
      return;
    }
    setSelectedMenuKey(key);
    if (!location.pathname.startsWith(`/${key}`)) {
      navigate(`/${key}`);
    }
  };


  useEffect(() => {
    if (location.pathname.startsWith('/')) {
      window.electron.ipcRenderer.send('resize-window', { width: 880, height: 620 })
    }
  }, [])

  useEffect(() => {
    const path = location.pathname;
    const firstSegment = path.split('/')[1]; // 比如 /sessions/xxx => sessions
    const validKeys = [
      'sessions',
      'friends',
      'groups',
      'search',
      'openai',
      'youtube',
      'setting',
    ];
    if (validKeys.includes(firstSegment)) {
      setSelectedMenuKey(firstSegment);
    }
  }, [location.pathname]);


  const matches = useMatches()
  const matched = matches.find(
    (m) =>
      m.pathname === location.pathname &&
      typeof (m.handle as HandleWithRightArea)?.RightArea === 'function'
  )

  const RightAreaComponent = (matched?.handle as HandleWithRightArea)?.RightArea ?? (() => null)
  const { token } = theme.useToken()
  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        theme="light"
        width={60}
        className="drag"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 20,
          overflow: 'hidden',
        }}
      >
        <span className="no-drag">
          <UserIconCard user={user as API.UserVO} />
        </span>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedMenuKey]}
          onClick={({ key }) => handleMenuClick(key)}
          className="icon-only-menu no-drag"
          items={[
            { key: 'sessions', icon: <CommentOutlined style={{ fontSize: 24 }} /> },
            { key: 'friends', icon: <ContactsOutlined style={{ fontSize: 24 }} /> },
            { key: 'groups', icon: <TeamOutlined style={{ fontSize: 24 }} /> },
            { key: 'search', icon: <SearchOutlined style={{ fontSize: 24 }} /> },
            { key: 'openai', icon: <OpenAIOutlined style={{ fontSize: 24 }} /> },
            { key: 'youtube', icon: <YoutubeOutlined style={{ fontSize: 24 }} /> },
            { key: 'myGithub', icon: <GithubOutlined style={{ fontSize: 24 }} /> },
            { key: 'setting', icon: <SettingOutlined style={{ fontSize: 24 }} /> }
          ].map(({ key, icon }) => ({
            key,
            icon,
            style: { fontSize: 24, margin: '16px 0' }
          }))}
        />
      </Sider>

      {!matched?.handle ? (
        <Content
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            height: '100vh',
            overflowY: 'auto'
          }}
        >
          <GlobalToolBar />
          <Outlet />
        </Content>
      ) : (
        <>
          <Sider
            width={280}
            style={{
              backgroundColor: token.colorBgLayout,
              borderRight: `1px solid ${token.colorBorderBg}`,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Outlet />
          </Sider>
          <Content
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              height: '100vh',
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            <GlobalToolBar />
            <RightAreaComponent />
          </Content>
        </>
      )}
      {isAdmin && (
        <FloatButton
          tooltip={'去管理'}
          type="primary"
          icon={<DashboardOutlined />}
          onClick={() => navigate('/admin')}
          style={{ right: 20, bottom: 120 }}
        />
      )}
    </Layout>
  )
}

export default BaseLayout
