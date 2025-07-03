// BaseLayout.tsx
import React, { useState, useEffect } from 'react'
import { Outlet, useMatches, useNavigate } from 'react-router-dom'
import { Layout, Menu, Avatar } from 'antd'
import {
  CommentOutlined,
  ContactsOutlined,
  GithubOutlined,
  OpenAIOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  YoutubeOutlined
} from '@ant-design/icons'
import GlobalToolBar from './GlobalToolBar'

const { Sider, Content } = Layout

interface HandleWithRightArea {
  RightArea?: React.ComponentType<any>
}

const BaseLayout: React.FC = () => {
  const [selectedMenuKey, setSelectedMenuKey] = useState('sessions')
  const navigate = useNavigate()

  useEffect(() => {
    if (selectedMenuKey === 'myGithub') {
      window.open('https://github.com/khr123123')
      return
    }
    navigate(selectedMenuKey)
  }, [selectedMenuKey, navigate])

  const matches = useMatches()
  const matched = matches.find(m => {
    const handle = m.handle as HandleWithRightArea | undefined
    return handle?.RightArea !== undefined
  })

  const RightAreaComponent = (matched?.handle as HandleWithRightArea | undefined)?.RightArea || (() => null)
  const hideMiddleSiderKeys = ['search', 'openai', 'youtube', 'myGithub', 'setting']
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
          borderRight: '1px solid #ddd'
        }}
      >
        <Avatar style={{ marginLeft: 15 }} shape="square" size={46} icon={<UserOutlined />} />
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedMenuKey]}
          onClick={({ key }) => setSelectedMenuKey(key)}
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

      {hideMiddleSiderKeys.includes(selectedMenuKey) ?
        (<Content
          style={{
            backgroundColor: '#fafafa',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            height: '100vh',
            overflowY: 'auto'
          }}
        >
          <GlobalToolBar />
          <Outlet />
        </Content>) :
        (
          <>
            <Sider
              width={280}
              style={{
                backgroundColor: '#fff',
                borderRight: '1px solid #ddd',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Outlet />
            </Sider>
            <Content
              style={{
                backgroundColor: '#fafafa',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                height: '100vh',
                overflowY: 'auto'
              }}
            >
              <GlobalToolBar />
              <RightAreaComponent />
            </Content></>)}
    </Layout>
  )
}

export default BaseLayout
