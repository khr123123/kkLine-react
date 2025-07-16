import {
  DeleteOutlined,
  MessageOutlined,
  PushpinOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignTopOutlined
} from '@ant-design/icons';
import GlobalLoading from '@renderer/components/GlobalLoding';
import type { MenuProps } from 'antd';
import { Avatar, Badge, Dropdown, Input, List, Menu, theme, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from "../../utils/timeUtil"

const { Text } = Typography;

interface Contact {
  sessionId: number;
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
    setContacts((prev) => prev.filter((c) => c.sessionId !== contact.sessionId));
    if (selectedContact?.sessionId === contact.sessionId) {
      setSelectedContact(null);
    }
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
    return a.sessionId - b.sessionId;
  });
  const menu = <Menu onClick={onMenuClick} items={getMenuItems(contextContact)} />;
  const [globalLoading, setGlobalLoading] = useState(true);
  //要求的数量
  const [noReadApplyCount, setNoReadApplyCount] = useState<number>(0);
  const { token } = theme.useToken();
  const [ellipsis] = useState(true);
  const fatchSessionList = () => {
    window.electron.ipcRenderer.invoke('get-session-list').then((result: any) => {
      setContacts(result);
      setGlobalLoading(false);
    });
  }
  useEffect(() => {
    fatchSessionList()
    window.electron.ipcRenderer.on('receive-apply', (_event: any, totleApplyCount: any) => setNoReadApplyCount(totleApplyCount))
    window.electron.ipcRenderer.on('reload-session-list', () => fatchSessionList())
    window.electron.ipcRenderer.on('change-session-info', (_event: any, msgInfo: any) => {
      const { chatSessionId, lastMessage, lastReceiveTime } = msgInfo;
      setContacts(prev => prev.map(contact => contact.sessionId === chatSessionId ? { ...contact, lastMessage, lastReceiveTime } : contact))
    })
    window.electron.ipcRenderer.on('change-group-session-info', (_event: any, msgInfo: any) => {
      const { chatSessionId, lastMessage, lastReceiveTime, memberCount } = msgInfo;
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
                window.electron.ipcRenderer.invoke('open-notification-window')
                setNoReadApplyCount(0)
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
                  setSelectedContact(item);
                  navigate(`/sessions/${item.sessionId}`);
                  window.electron.ipcRenderer.send("clear-noread-count", item.sessionId)
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
                      <Badge count={item.noReadCount}>
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