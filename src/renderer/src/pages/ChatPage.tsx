import { Input, Typography } from 'antd'
import React from 'react'
import { useParams } from 'react-router-dom'

const { Text } = Typography

const ChatArea: React.FC = ({}) => {
  const { sessionId } = useParams<{ sessionId: string }>()

  return (
    <div style={{ padding: 16, flexGrow: 1 }}>
      <div className="drag" style={{ height: 25, width: '100%' }}></div>

      {sessionId ? (
        <>
          <Typography.Title level={4}>{'selectedContact.name'}</Typography.Title>
          <div
            style={{
              flexGrow: 1,
              border: '1px solid #ddd',
              borderRadius: 4,
              backgroundColor: '#fff',
              padding: 16,
              overflowY: 'auto',
              minHeight: 200
            }}
          >
            <p>这里显示和 {'selectedContact.name'} 的聊天消息...</p>
          </div>
          <Input.TextArea
            rows={3}
            placeholder={`给 ${'selectedContact.name'} 发送消息...`}
            style={{ marginTop: 12 }}
          />
        </>
      ) : (
        <Text>请选择联系人开始聊天</Text>
      )}
    </div>
  )
}

export default ChatArea
