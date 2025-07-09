import { DeleteOutlined, MessageOutlined, NotificationOutlined, PushpinOutlined, UsergroupAddOutlined, VerticalAlignBottomOutlined, VerticalAlignTopOutlined } from '@ant-design/icons'
import GlobalLoading from '@renderer/components/GlobalLoding'
import type { MenuProps } from 'antd'
import { Avatar, Badge, Button, Dropdown, Input, List, Menu, Modal, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
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

  const [globalLoading, setGlobalLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await new Promise((resolve) =>
          setTimeout(() => resolve({ user: "KK", role: "admin" }), 200)
        );
        setData(res);
      } catch (error) {
        console.error(error);
      } finally {
        setGlobalLoading(false); // 请求完毕关闭加载蒙层
      }
    };
    fetchData();
  }, []);

  const [noReadApplyCount, setNoReadApplyCount] = useState<number>(0);
  return (
    <>
      {/* 全局加载蒙层 */}
      <GlobalLoading loading={globalLoading} />
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div className="drag" style={{ height: 25, width: '100%' }}></div>
        <div
          style={{
            height: 46,
            position: 'sticky',
            top: 25,
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            paddingBottom: 10,
            background: '#fff',
            zIndex: 10,
          }}
        >
          <Input.Search
            placeholder="搜索联系人"
            style={{ flex: 1, marginRight: 10 }}
            allowClear
          />
          <Badge count={noReadApplyCount} size="small" style={{ width: 16, fontSize: 11 }} offset={[1, -5]}>
            <MessageOutlined className="hover-icon" style={{ fontSize: 20, }} onClick={() => window.electron.ipcRenderer.invoke('open-notification-window')} />
          </Badge>
        </div>
        <List
          className='scrollableDiv'
          itemLayout="horizontal"
          dataSource={sortedContacts}
          style={{ flexGrow: 1, overflowY: 'auto' }}
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
      </div>

    </>
  )
}

export default SessionsPage



// import {
//   Tag,
//   Pagination,
//   Space,
//   Card,
//   Divider
// } from "antd";
// import { UserOutlined, TeamOutlined } from "@ant-design/icons";
// const mockContactApplyList: API.ContactApplyVO[] = [
//   {
//     id: 1,
//     fromUserId: 1001,
//     toUserId: 2001,
//     groupId: null,
//     contactType: 0, // 好友
//     applyInfo: "你好，可以加个好友吗？",
//     createTime: new Date("2025-07-07T14:00:00"),
//     updateTime: new Date("2025-07-07T14:05:00"),
//     applyStatus: 0,
//     userVO: {
//       id: 1001,
//       nickname: "小明",
//       avatar: "https://i.pravatar.cc/150?img=3"
//     },
//     groupVO: null,
//   },
//   {
//     id: 2,
//     fromUserId: 1002,
//     toUserId: 2001,
//     groupId: "G1942436901383626753",
//     contactType: 1, // 群
//     applyInfo: "请求加入 Netty 群",
//     createTime: new Date("2025-07-07T15:10:00"),
//     updateTime: new Date("2025-07-07T15:12:00"),
//     applyStatus: 1,
//     userVO: {
//       id: 1002,
//       nickname: "小红",
//       avatar: "https://i.pravatar.cc/150?img=5"
//     },
//     groupVO: {
//       id: "G1942436901383626753",
//       groupName: "Netty 技术交流群",
//       groupAvatar: "https://i.pravatar.cc/150?img=10"
//     },
//   },
//   {
//     id: 3,
//     fromUserId: 1003,
//     toUserId: 2001,
//     groupId: null,
//     contactType: 0,
//     applyInfo: "加个好友，一起学习 React！",
//     createTime: new Date("2025-07-08T09:30:00"),
//     updateTime: new Date("2025-07-08T09:35:00"),
//     applyStatus: 2,
//     userVO: {
//       id: 1003,
//       nickname: "张三",
//       avatar: "https://i.pravatar.cc/150?img=8"
//     },
//     groupVO: null,
//   },
// ];

// interface Props {
//   data: API.ContactApplyVO[];
// }

// const PAGE_SIZE = 5;

// const ContactApplyList: React.FC<Props> = ({ data }) => {
//   const [currentPage, setCurrentPage] = useState(1);

//   const pagedData = data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

//   const renderStatusTag = (status: number) => {
//     switch (status) {
//       case 0: return <Tag color="blue">待处理</Tag>;
//       case 1: return <Tag color="green">已接受</Tag>;
//       case 2: return <Tag color="red">已拒绝</Tag>;
//       case 3: return <Tag color="default">已拉黑</Tag>;
//       default: return <Tag>未知</Tag>;
//     }
//   };

//   return (
//     <Card title="新的好友/群申请" bordered style={{ borderRadius: 12 }}>
//       <List
//         itemLayout="vertical"
//         dataSource={pagedData}
//         renderItem={(item) => {
//           const isGroup = item.contactType === 1;
//           const name = isGroup ? item.groupVO?.groupName : item.userVO?.nickname;
//           const avatar = isGroup ? item.groupVO?.groupAvatar : item.userVO?.avatar;

//           return (
//             <List.Item style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, marginBottom: 12 }}>
//               {/* 上部分 */}
//               <Space align="start">
//                 <Avatar src={avatar} icon={isGroup ? <TeamOutlined /> : <UserOutlined />} />
//                 <Space size="large">
//                   <Text strong>{name ?? "未知用户"}</Text>
//                   <Tag color={isGroup ? "purple" : "cyan"}>
//                     {isGroup ? "群申请" : "好友申请"}
//                   </Tag>
//                 </Space>
//               </Space>
//               <Divider style={{ margin: "8px 0" }} />
//               <Space direction="vertical" style={{ width: "100%" }} size={4}>
//                 <Text>备注：{item.applyInfo || "无备注信息"}</Text>
//                 <Space>
//                   {renderStatusTag(item.applyStatus ?? 0)}
//                   <Text type="secondary">
//                     申请时间：{new Date(item.createTime).toLocaleString()}
//                   </Text>
//                 </Space>
//               </Space>
//             </List.Item>
//           );
//         }}
//       />

//       {/* 分页器 */}
//       <div style={{ textAlign: "center", marginTop: 16 }}>
//         <Pagination
//           current={currentPage}
//           pageSize={PAGE_SIZE}
//           total={data.length}
//           onChange={(page) => setCurrentPage(page)}
//           showSizeChanger={false}
//         />
//       </div>
//     </Card>
//   );
// };

