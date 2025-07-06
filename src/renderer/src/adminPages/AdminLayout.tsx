// BaseLayout.tsx
import { createFromIconfontCN, UserOutlined, WechatWorkOutlined } from '@ant-design/icons'
import { Avatar, FloatButton, Layout, Menu } from 'antd'
import React, { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import GlobalToolBar from '../components/GlobalToolBar'

const { Sider, Content } = Layout

const AdminLayout: React.FC = () => {
  const [selectedMenuKey, setSelectedMenuKey] = useState('/admin/userList')
  const location = useLocation()
  const navigate = useNavigate()
  const IconFont = createFromIconfontCN({
    scriptUrl: [
      '//at.alicdn.com/t/c/font_4966877_38zkbedurio.js' // icon-javascript, icon-java, icon-shoppingcart (overridden)
    ]
  })
  useEffect(() => {
    navigate(selectedMenuKey)
  }, [selectedMenuKey, navigate])

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      window.electron.ipcRenderer.send('resize-window', { width: 1200, height: 700 })
    }
  }, [])

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
          borderRight: '1px solid #eee',
          overflow: 'hidden'
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
            {
              key: '/admin/userList',
              icon: <IconFont type="icon-yonghuguanli" style={{ fontSize: 24 }} />
            },
            {
              key: '/admin/gourpList',
              icon: <IconFont type="icon-icon-font_qunliaoguanli-" style={{ fontSize: 24 }} />
            },
            {
              key: '/admin/messagePanel',
              icon: <IconFont type="icon-xitongxiaoxiguanli-copy" style={{ fontSize: 24 }} />
            }
          ].map(({ key, icon }) => ({
            key,
            icon,
            style: { fontSize: 24, margin: '16px 0' }
          }))}
        />
      </Sider>
      <Content
        style={{
          backgroundColor: '#fcfcfc',
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
      <FloatButton
        tooltip={'去聊天'}
        type="primary"
        icon={<WechatWorkOutlined />}
        onClick={() => navigate('/')}
        style={{ right: 20, bottom: 120 }}
      />
    </Layout>
  )
}

export default AdminLayout
