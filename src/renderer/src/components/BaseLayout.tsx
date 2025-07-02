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
import { Avatar, Layout, Menu } from 'antd'
import React, { ReactNode, useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import GlobalToolBar from './GlobalToolBar'
const { Sider, Content } = Layout

interface BaseLayoutProps {
  contactsList?: ReactNode // 中间联系人列表内容
  chatArea?: ReactNode // 右侧聊天区域内容
}

const BaseLayout: React.FC<BaseLayoutProps> = ({ chatArea }) => {
  const [selectedMenuKey, setSelectedMenuKey] = useState('sessions')
  const navigate = useNavigate()
  useEffect(() => {
    if (selectedMenuKey === 'myGithub') {
      window.open('https://github.com/khr123123')
      return
    }
    navigate(selectedMenuKey) // 跳转到联系人ID为1的聊天界面
  }, [selectedMenuKey])

  return (
    <>
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
          {chatArea}
        </Content>
      </Layout>
    </>
  )
}

export default BaseLayout
