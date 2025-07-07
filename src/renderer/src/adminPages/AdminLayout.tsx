import { createFromIconfontCN, WechatWorkOutlined } from '@ant-design/icons'
import { FloatButton, Layout, Menu, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import GlobalToolBar from '../components/GlobalToolBar'
import UserIconCard from '@renderer/components/UserIconCard'
import { useUserStore } from '@renderer/store/useUserStore'

const { Sider, Content } = Layout
const { Title } = Typography

const AdminLayout: React.FC = () => {
  const [selectedMenuKey, setSelectedMenuKey] = useState('/admin/userList')
  const location = useLocation()
  const navigate = useNavigate()
  const user = useUserStore(state => state.user)

  const IconFont = createFromIconfontCN({
    scriptUrl: [
      '//at.alicdn.com/t/c/font_4966877_38zkbedurio.js'
    ]
  })

  // 路由对应标题映射
  const routeTitleMap: Record<string, string> = {
    '/admin/userList': '用户管理',
    '/admin/gourpList': '群组管理',
    '/admin/messagePanel': '消息管理',
  }

  useEffect(() => {
    navigate(selectedMenuKey)
  }, [selectedMenuKey, navigate])

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      window.electron.ipcRenderer.send('resize-window', { width: 1200, height: 700 })
    }
  }, [location.pathname])

  // 从映射中获取当前路径对应的标题，找不到默认空字符串
  const title = routeTitleMap[location.pathname] || ''

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
        <span className='no-drag'>
          <UserIconCard user={user as API.UserVO} />
        </span>
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
          overflowY: 'auto',
        }}
      >
        <GlobalToolBar />
        <Title level={3} style={{ margin: '16px 24px', marginBottom: 0, marginTop: 0 }}>
          {title}
        </Title>
        <div style={{ padding: '16px' }}>
          <Outlet />
        </div>
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
