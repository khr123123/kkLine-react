import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
  PushpinOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignTopOutlined
} from '@ant-design/icons';
import GlobalLoading from '@renderer/components/GlobalLoding';
import type { MenuProps } from 'antd';
import { Avatar, Badge, Dropdown, Input, List, Menu, Modal, theme, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatDate } from "../../utils/timeUtil"
import { useNoReadStore } from '@renderer/store/useNoReadStore';

const { Text } = Typography;

interface Contact {
  sessionId: string;
  contactName: string;
  contactAvatar: string;
  lastMessage: string;
  lastReceiveTime: string;
  noReadCount: number;
  memberCount: number;
  topType: number; // 0 or 1
}

const isTop = (contact: Contact) => contact.topType === 1;

const getMenuItems = (contact: Contact | null): MenuProps['items'] => {
  if (!contact) return [];
  return [
    {
      label: isTop(contact) ? '取消置顶' : '置顶',
      key: 'top',
      icon: isTop(contact) ? <VerticalAlignBottomOutlined /> : <VerticalAlignTopOutlined />
    },
    {
      label: '删除',
      key: 'delete',
      icon: <DeleteOutlined />
    }
  ];
};

const SessionsPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contextContact, setContextContact] = useState<Contact | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const unreadMap = useNoReadStore(state => state.unreadMap);
  const noReadApplyCount = useNoReadStore(state => state.noReadApplyCount);
  const increase = useNoReadStore(state => state.increase);
  const clear = useNoReadStore(state => state.clear);
  const initFromContacts = useNoReadStore(state => state.initFromContacts);
  const setNoReadApplyCount = useNoReadStore(state => state.setNoReadApplyCount);
  const clearNoReadApplyCount = useNoReadStore(state => state.clearNoReadApplyCount);

  useEffect(() => {
    if (!contacts || contacts.length === 0) return;
    const match = location.pathname.match(/^\/sessions\/([^/]+)$/);
    if (match) {
      const sessionId = match[1];
      const contact = contacts.find(c => c.sessionId === sessionId);
      if (contact) {
        setSelectedContact(contact);
      }
    }
  }, [contacts, location.pathname]);
  const selectedContactRef = useRef<Contact | null>(null);
  // 同步 selectedContact 到 ref
  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);
  //置顶处理器 0：取消置顶 1：置顶
  const handleTop = (contact: Contact) => {
    setContacts((prev) => {
      const isCurrentlyTop = isTop(contact);
      if (isCurrentlyTop) {
        window.electron.ipcRenderer.send("set-sessiont-top", contact.sessionId, 0)
        return prev.map((c) =>
          c.sessionId === contact.sessionId ? { ...c, topType: 0 } : c
        );
      } else {
        window.electron.ipcRenderer.send("set-sessiont-top", contact.sessionId, 1)
        const filtered = prev.filter((c) => c.sessionId !== contact.sessionId);
        return [{ ...contact, topType: 1 }, ...filtered];
      }
    });
  };
  const handleDelete = (contact: Contact) => {
    Modal.confirm({
      title: '警告',
      icon: <ExclamationCircleOutlined />,
      content: '删除会话后，聊天记录也将一并删除！',
      okText: '确定',
      cancelText: '取消',
      onOk() {
        window.electron.ipcRenderer.send('user-delete-contact', contact.sessionId)
        setContacts((prev) => prev.filter((c) => c.sessionId !== contact.sessionId));
        if (selectedContact?.sessionId === contact.sessionId) {
          setSelectedContact(null);
          navigate(`/sessions`);
        }
      }
    });
  };
  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (!contextContact) return;
    if (key === 'top') {
      handleTop(contextContact);
    }
    if (key === 'delete') {
      handleDelete(contextContact);
    }
    setContextContact(null);
  };
  const sortedContacts = [...contacts].sort((a, b) => {
    if (a.topType === 1 && b.topType !== 1) return -1;
    if (a.topType !== 1 && b.topType === 1) return 1;
    return a.sessionId.localeCompare(b.sessionId);
  });
  const menu = <Menu onClick={onMenuClick} items={getMenuItems(contextContact)} />;
  const [globalLoading, setGlobalLoading] = useState(true);
  //邀请的数量
  const { token } = theme.useToken();
  const [ellipsis] = useState(true);
  const fatchSessionList = () => {
    window.electron.ipcRenderer.invoke('get-session-list').then((result: any) => {
      setContacts(result);
      initFromContacts(result)
      setGlobalLoading(false);
    });
    window.electron.ipcRenderer.invoke('get-noread-receive-apply-count').then((result: any) => {
      setNoReadApplyCount(result)
    });
  }
  useEffect(() => {
    fatchSessionList()
  }, []);
  useEffect(() => {
    window.electron.ipcRenderer.on('receive-apply', (_event: any, totleApplyCount: any) => setNoReadApplyCount(totleApplyCount))
    window.electron.ipcRenderer.on('reload-session-list', () => fatchSessionList())
    window.electron.ipcRenderer.on('change-session-info', (_event: any, msgInfo: any) => {
      const { chatSessionId, lastMessage, lastReceiveTime } = msgInfo;
      if (chatSessionId !== selectedContactRef.current?.sessionId) {
        increase(chatSessionId);
      } else {
        window.electron.ipcRenderer.send("clear-noread-count", chatSessionId)
      }
      setContacts(prev => prev.map(contact => contact.sessionId === chatSessionId ? { ...contact, lastMessage, lastReceiveTime } : contact))
    })
    window.electron.ipcRenderer.on('change-group-session-info', (_event: any, msgInfo: any) => {
      const { chatSessionId, lastMessage, lastReceiveTime, memberCount } = msgInfo;
      if (chatSessionId !== selectedContactRef.current?.sessionId) {
        increase(chatSessionId);
      } else {
        window.electron.ipcRenderer.send("clear-noread-count", chatSessionId)
      }
      setContacts(prev => prev.map(contact => contact.sessionId === chatSessionId ? { ...contact, lastMessage, lastReceiveTime, memberCount } : contact))
    })
    return () => {
      window.electron.ipcRenderer.removeAllListeners('receive-apply')
      window.electron.ipcRenderer.removeAllListeners('reload-session-list')
      window.electron.ipcRenderer.removeAllListeners('change-session-info')
      window.electron.ipcRenderer.removeAllListeners('change-group-session-info')
    }
  }, [])


  const listRef = useRef<HTMLDivElement>(null);
  const [hasScroll, setHasScroll] = useState(false);
  useEffect(() => {
    function checkScroll() {
      if (listRef.current) {
        const el = listRef.current;
        setHasScroll(el.scrollHeight > el.clientHeight);
      }
    }
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => {
      window.removeEventListener('resize', checkScroll);
    };
  }, [sortedContacts]);
  return (
    <>
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
            zIndex: 10
          }}
        >
          <Input.Search placeholder="搜索联系人" style={{ flex: 1, marginRight: 10 }} allowClear />
          <Badge
            count={noReadApplyCount}
            size="small"
            style={{ width: 16, fontSize: 11 }}
            offset={[1, -5]}
          >
            <MessageOutlined
              className="hover-icon"
              style={{ fontSize: 20 }}
              onClick={() => {
                clearNoReadApplyCount()
                window.electron.ipcRenderer.invoke('open-notification-window')
              }}
            />
          </Badge>
        </div>
        <List
          className="scrollableDiv"
          itemLayout="horizontal"
          dataSource={sortedContacts}
          style={{ flexGrow: 1, overflowY: 'auto', marginTop: hasScroll ? 22 : 0, }}
          ref={listRef}
          renderItem={(item) => (
            <Dropdown
              overlay={menu}
              trigger={['contextMenu']}
              onOpenChange={(open) => {
                if (!open) setContextContact(null);
              }}
              onVisibleChange={(visible) => {
                if (visible) setContextContact(item);
              }}
              key={item.sessionId}
            >
              <List.Item
                className="list-item"
                style={{
                  backgroundColor:
                    selectedContact?.sessionId === item.sessionId
                      ? token.controlItemBgActiveHover
                      : item.topType === 1
                        ? token.colorErrorBgFilledHover
                        : undefined,
                  cursor: 'pointer',
                  padding: '12px 16px',
                  maxHeight: '74px',
                }}
                onClick={() => {
                  navigate(`/sessions/${item.sessionId}`);
                  window.electron.ipcRenderer.send("clear-noread-count", item.sessionId)
                  clear(item.sessionId)
                  setContacts(prev =>
                    prev.map(contact =>
                      contact.sessionId === item.sessionId
                        ? { ...contact, noReadCount: 0 }
                        : contact
                    )
                  );
                }}
              >
                <List.Item.Meta
                  avatar={
                    item.sessionId.toString().startsWith('AD') ? (
                      <Badge dot>
                        <Avatar shape="square" size={50} src={item.contactAvatar} />
                      </Badge>
                    ) : (
                      <Badge count={unreadMap[item.sessionId]}>
                        <Avatar shape="square" size={50} src={item.contactAvatar} />
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
                        {item.contactName}
                        {item.sessionId.toString().startsWith('G') && item.memberCount > 0 &&
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            （{item.memberCount}）
                          </Text>
                        }
                      </Text>
                      {item.topType === 1 && (
                        <PushpinOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
                      )}
                    </div>
                  }
                  description={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', }}>
                      <Text
                        style={ellipsis ? { width: 160, color: "#888888" } : undefined}
                        ellipsis={ellipsis ? { tooltip: item.lastMessage } : false}
                      >
                        {item.lastMessage}
                      </Text>
                      <span style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        {formatDate(item.lastReceiveTime)}
                      </span>
                    </div>
                  }
                />
              </List.Item>
            </Dropdown>
          )}
        />
      </div>
    </>
  );
};

export default SessionsPage;