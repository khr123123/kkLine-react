import { useParams } from 'react-router-dom'

const ChatPage = () => {
  const { sessionId } = useParams()
  return (
    <div style={{ padding: 16 }}>
      <h3>聊天窗口</h3>
      <p>当前聊天 ID: {sessionId}</p>
    </div>
  )
}

export default ChatPage
