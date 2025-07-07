import { LoadingOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Popover, Typography, Upload, message } from 'antd';
import React, { useState } from 'react';
import type { GetProp, UploadProps } from 'antd';

const { Text, Title } = Typography;

interface UserIconCardProps {
    user: API.UserVO;
}

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const getBase64 = (img: FileType, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result as string));
    reader.readAsDataURL(img);
};

const UserIconCard: React.FC<UserIconCardProps> = ({ user }) => {
    const [clicked, setClicked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string>(user.userAvatar || '');

    const handleClickChange = (open: boolean) => {
        setClicked(open);
    };

    const beforeUpload = (file: FileType) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('只能上传 JPG/PNG 格式的图片！');
            return false;
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('图片必须小于 2MB！');
            return false;
        }
        return true;
    };

    const handleChange: UploadProps['onChange'] = (info) => {
        if (info.file.status === 'uploading') {
            setLoading(true);
            return;
        }
        if (info.file.status === 'done') {
            // Get this url from response in real world.
            getBase64(info.file.originFileObj as FileType, (url) => {
                setLoading(false);
                setImageUrl(url);
            });
        }
    };

    const uploadButton = (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {loading ? <LoadingOutlined /> : <PlusOutlined />}
            <div style={{ marginTop: 4, fontSize: 12 }}>上传</div>
        </div>
    );

    const clickContent = (
        <div style={{ display: 'flex', alignItems: 'center', padding: 4, minWidth: 200 }}>
            <Upload
                style={{ width: 80, height: 80, }}
                name="avatar"
                listType="picture-card"
                className="avatar-uploader"
                showUploadList={false}
                action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload" // 你可以替换成真实接口
                beforeUpload={beforeUpload}
                onChange={handleChange}
            >
                {imageUrl ? (
                    <img src={imageUrl} alt="avatar" style={{ width: '100%', borderRadius: 4 }} />
                ) : (
                    uploadButton
                )}
            </Upload>

            <div style={{ marginLeft: 16, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Title level={5} style={{ margin: 0 }}>{user.userName || '-'}</Title>
                <Text type="secondary">ID：{user.id || '-'}</Text>
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
