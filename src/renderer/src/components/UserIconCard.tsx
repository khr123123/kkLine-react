import { UserOutlined } from '@ant-design/icons';
import { Avatar, Popover, Typography, message } from 'antd';
import React, { useState } from 'react';
import { useUserStore } from '@renderer/store/useUserStore';
import { updateMyUser } from '@renderer/api/userApis';
import PicUploader from './PicUploader';
const { Text, Title } = Typography;
interface UserIconCardProps {
    user: API.UserVO;
}

const UserIconCard: React.FC<UserIconCardProps> = ({ user }) => {
    const [clicked, setClicked] = useState(false);
    const [imageUrl, setImageUrl] = useState<string>(user.userAvatar || '');
    const loginUser = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser)
    const handleClickChange = (open: boolean) => setClicked(open);

    const handleUploadSuccess = async (fileUrl: string) => {
        const res = await updateMyUser({ userAvatar: fileUrl }) as API.BaseResponseUser;
        if (res.code === 0) {
            setImageUrl(fileUrl);
            setUser({ ...loginUser, userAvatar: fileUrl });
            message.success('头像上传成功！');
        } else {
            message.error('头像上传失败');
        }
    };
    const clickContent = (
        <div style={{ display: 'flex', alignItems: 'center', padding: 4, minWidth: 220 }}>
            <PicUploader token={loginUser?.token!} initialUrl={imageUrl} onSuccess={handleUploadSuccess} />
            <div style={{ marginLeft: 16, flex: 1 }}>
                <Title level={5} style={{ margin: 0 }}>{user.userName || '-'}</Title>
                <Text type="secondary">ID：{user.id || '-'}</Text><br />
                <Text type="secondary">邮箱：{user.userEmail || '-'}</Text>
            </div>
        </div>
    );

    return (
        <Popover
            placement="right"
            content={clickContent}
            trigger="click"
            open={clicked}
            onOpenChange={handleClickChange}
        >
            <Avatar
                style={{ marginLeft: 15, cursor: 'pointer' }}
                shape="square"
                size={46}
                src={imageUrl || user.userAvatar}
                icon={<UserOutlined />}
            />
        </Popover>
    );
};

export default UserIconCard;
