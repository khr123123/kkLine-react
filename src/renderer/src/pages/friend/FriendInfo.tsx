import { useParams } from "react-router-dom"

const FriendInfo: React.FC = () => {
    const { friendId } = useParams()
    return (
        <div style={{ padding: 16 }}>
            {friendId}
        </div>
    )
}

export default FriendInfo
