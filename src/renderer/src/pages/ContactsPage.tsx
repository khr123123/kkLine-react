import { Avatar, Badge, Input, List, Typography } from 'antd'
import React, { useState } from 'react'

const { Text } = Typography

interface Contact {
  id: number
  name: string
  avatar: string
  lastMessage: string
  lastTime: string
  notRead: number
}

const contacts: Contact[] = [
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
    notRead: 2
  },
  {
    id: 3,
    name: '李四',
    avatar:
      'https://www.bing.com/th/id/OIP.g5M-iZUiocFCi9YAzojtRAAAAA?w=193&h=211&c=8&rs=1&qlt=90&o=6&cb=ircwebp2&dpr=1.3&pid=3.1&rm=2',
    lastMessage: '今天吃饭了吗？',
    lastTime: '12-10',
    notRead: 2
  },
  {
    id: 123456,
    name: '腾讯新闻',
    avatar:
      'https://th.bing.com/th/id/ODLS.eb37fcc5-7670-48e7-8c00-cda0f210ba5b?w=32&h=32&qlt=90&pcl=fffffc&o=6&cb=ircwebp2&pid=1.2',
    lastMessage: '今天吃饭了吗？',
    lastTime: '12-10',
    notRead: 2
  }
  // ...
]

const ContactsPage: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(contacts[0])

  return (
    <>
      <div className="drag" style={{ height: 25, width: '100%' }}></div>
      <Input.Search
        placeholder="搜索联系人"
        style={{ margin: '12px', marginTop: 0, width: '260px' }}
        allowClear
      />
      <List
        itemLayout="horizontal"
        dataSource={contacts}
        style={{ flexGrow: 1, overflowY: 'auto' }}
        renderItem={(item) => (
          <List.Item
            style={{
              backgroundColor: selectedContact?.id === item.id ? '#e6f7ff' : undefined,
              cursor: 'pointer',
              padding: '12px 16px'
            }}
            onClick={() => setSelectedContact(item)}
          >
            <List.Item.Meta
              avatar={
                item.id === 123456 ? (
                  <Badge dot>
                    <Avatar shape="square" size={50} src={item.avatar} />{' '}
                  </Badge>
                ) : (
                  <Badge count={2}>
                    <Avatar shape="square" size={50} src={item.avatar} />
                  </Badge>
                )
              }
              title={<Text strong>{item.name}</Text>}
              description={
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.lastMessage}</span>
                  <span>{item.lastTime}</span>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </>
  )
}
export default ContactsPage
