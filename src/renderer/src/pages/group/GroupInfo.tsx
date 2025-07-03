import { useParams } from "react-router-dom"

const GroupInfo: React.FC = () => {
    const { groupId } = useParams()
    return (
        <div style={{ padding: 16 }}>
            {groupId}
        </div>
    )
}

export default GroupInfo
