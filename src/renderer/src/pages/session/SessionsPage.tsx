import { DeleteOutlined, PushpinOutlined, VerticalAlignBottomOutlined, VerticalAlignTopOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Avatar, Badge, Dropdown, Input, List, Menu, Typography } from 'antd'
import React, { useState } from 'react'
const { Text } = Typography
import { useNavigate } from 'react-router-dom'
interface Contact {
  id: number
  name: string
  avatar: string
  lastMessage: string
  lastTime: string
  notRead: number
  isTop?: boolean
}

const initialContacts: Contact[] = [
  {
    id: 1,
    name: '张三',
    avatar:
      'https://khr-picture-1305009273.cos.ap-shanghai.myqcloud.com/public/1866835837082255362/2024-12-13_O44QxUxdg8hgNYLU.png',
    lastMessage: '你好！',
    lastTime: '12:00',
    notRead: 2
  },
  {
    id: 2,
    name: '李四',
    avatar:
      'https://www.bing.com/th/id/OIP.g5M-iZUiocFCi9YAzojtRAAAAA?w=193&h=211&c=8&rs=1&qlt=90&o=6&cb=ircwebp2&dpr=1.3&pid=3.1&rm=2',
    lastMessage: '今天吃饭了吗？',
    lastTime: '12:00',
    notRead: 2,
    isTop: false
  },
  {
    id: 3,
    name: '李四',
    avatar:
      'https://www.bing.com/th/id/OIP.g5M-iZUiocFCi9YAzojtRAAAAA?w=193&h=211&c=8&rs=1&qlt=90&o=6&cb=ircwebp2&dpr=1.3&pid=3.1&rm=2',
    lastMessage: '今天吃饭了吗？',
    lastTime: '12-10',
    notRead: 2,
    isTop: false
  },
  {
    id: 4,
    name: '李1',
    avatar:
      'https://www.bing.com/th/id/OIP.g5M-iZUiocFCi9YAzojtRAAAAA?w=193&h=211&c=8&rs=1&qlt=90&o=6&cb=ircwebp2&dpr=1.3&pid=3.1&rm=2',
    lastMessage: '今天吃饭了吗？',
    lastTime: '12-10',
    notRead: 2,
    isTop: false
  },
  {
    id: 5,
    name: '李2',
    avatar:
      'https://www.bing.com/th/id/OIP.g5M-iZUiocFCi9YAzojtRAAAAA?w=193&h=211&c=8&rs=1&qlt=90&o=6&cb=ircwebp2&dpr=1.3&pid=3.1&rm=2',
    lastMessage: '今天吃饭了吗？',
    lastTime: '12-10',
    notRead: 0,
    isTop: false
  },
  {
    id: 6,
    name: '李6',
    avatar:
      'https://www.bing.com/th/id/OIP.g5M-iZUiocFCi9YAzojtRAAAAA?w=193&h=211&c=8&rs=1&qlt=90&o=6&cb=ircwebp2&dpr=1.3&pid=3.1&rm=2',
    lastMessage: '今天吃饭了吗？',
    lastTime: '12-10',
    notRead: 0,
    isTop: false
  },
  {
    id: 7,
    name: '李7',
    avatar:
      'https://www.bing.com/th/id/OIP.g5M-iZUiocFCi9YAzojtRAAAAA?w=193&h=211&c=8&rs=1&qlt=90&o=6&cb=ircwebp2&dpr=1.3&pid=3.1&rm=2',
    lastMessage: '今天吃饭了吗？',
    lastTime: '12-10',
    notRead: 0,
    isTop: false
  },
  {
    id: 123456,
    name: '腾讯新闻',
    avatar:
      'https://th.bing.com/th/id/ODLS.eb37fcc5-7670-48e7-8c00-cda0f210ba5b?w=32&h=32&qlt=90&pcl=fffffc&o=6&cb=ircwebp2&pid=1.2',
    lastMessage: '今天吃饭了吗？',
    lastTime: '12-10',
    notRead: 2,
    isTop: false
  }
]

const getMenuItems = (contact: Contact | null): MenuProps['items'] => {
  if (!contact) return []
  return [
    {
      label: contact.isTop ? '取消置顶' : '置顶',
      key: 'top',
      icon: contact.isTop ? <VerticalAlignBottomOutlined /> : <VerticalAlignTopOutlined />
    },
    {
      label: '删除',
      key: 'delete',
      icon: <DeleteOutlined />
    }
  ]
}

const SessionsPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [contextContact, setContextContact] = useState<Contact | null>(null)
  const navigate = useNavigate()

  // 置顶联系人：把联系人移到数组头部，并设置 isTop
  const handleTop = (contact: Contact) => {
    setContacts((prev) => {
      const isCurrentlyTop = contact.isTop ?? false
      if (isCurrentlyTop) {
        // 取消置顶，保持原顺序
        return prev.map((c) => (c.id === contact.id ? { ...c, isTop: false } : c))
      } else {
        // 置顶，放到头部
        const filtered = prev.filter((c) => c.id !== contact.id)
        return [{ ...contact, isTop: true }, ...filtered]
      }
    })
  }

  // 删除联系人：从数组中移除
  const handleDelete = (contact: Contact) => {
    setContacts((prev) => prev.filter((c) => c.id !== contact.id))
    // 如果当前选中被删了，清空或选中第一条
    if (selectedContact?.id === contact.id) {
      setSelectedContact(null)
    }
  }

  // 菜单点击事件
  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (!contextContact) return
    if (key === 'top') {
      handleTop(contextContact)
    }
    if (key === 'delete') {
      handleDelete(contextContact)
    }
    setContextContact(null)
  }

  // 给联系人排序，isTop=true的放最前面，其他按id排序（可根据需求改）
  const sortedContacts = [...contacts].sort((a, b) => {
    if (a.isTop && !b.isTop) return -1
    if (!a.isTop && b.isTop) return 1
    return a.id - b.id
  })

  const menu = <Menu onClick={onMenuClick} items={getMenuItems(contextContact)} />

  return (
    <>
      <div className="drag" style={{ height: 25, width: '100%' }}></div>
      <Input.Search
        placeholder="搜索联系人"
        style={{ margin: '12px', marginTop: 0, width: '260px' }}
        allowClear
      />
      <List
        className='scrollableDiv'
        itemLayout="horizontal"
        dataSource={sortedContacts}
        style={{ flexGrow: 1, overflowY: 'auto', height: 550, }}
        renderItem={(item) => (
          <Dropdown
            overlay={menu}
            trigger={['contextMenu']}
            onOpenChange={(open) => {
              if (!open) setContextContact(null)
            }}
            onVisibleChange={(visible) => {
              if (visible) setContextContact(item)
            }}
            key={item.id}
          >
            <List.Item
              className='list-item'
              style={{
                backgroundColor:
                  selectedContact?.id === item.id
                    ? '#bae7ff' // 选中蓝色背景
                    : item.isTop
                      ? '#fff5f8' // 置顶粉色背景
                      : undefined,
                cursor: 'pointer',
                padding: '12px 16px'
              }}
              onClick={() => {
                setSelectedContact(item)
                navigate(`/sessions/${item.id}`)
              }}
            >
              <List.Item.Meta
                avatar={
                  item.id === 123456 ? (
                    <Badge dot>
                      <Avatar shape="square" size={50} src={item.avatar} />
                    </Badge>
                  ) : (
                    <Badge count={item.notRead}>
                      <Avatar shape="square" size={50} src={item.avatar} />
                    </Badge>
                  )
                }
                title={
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Text
                      strong
                      style={{
                        flex: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {item.name}
                    </Text>
                    {item.isTop && <PushpinOutlined style={{ marginLeft: 8, color: '#1890ff' }} />}
                  </div>
                }
                description={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.lastMessage}</span>
                    <span>{item.lastTime}</span>
                  </div>
                }
              />
            </List.Item>
          </Dropdown>
        )}
      />
    </>
  )
}

export default SessionsPage
