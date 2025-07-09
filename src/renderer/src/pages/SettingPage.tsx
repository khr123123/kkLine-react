import React, { useState } from 'react';
import {
    Form,
    Input,
    Switch,
    Select,
    Button,
    Card,
    Typography,
    message,
    Row,
    Col,
    Upload,
    Image,
} from 'antd';
import { LoadingOutlined, LogoutOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@renderer/store/useUserStore';
import { userLogout } from '@renderer/api/userApis';

const { Title } = Typography;
const { Option } = Select;

interface SettingFormValues {
    username: string;
    email: string;
    notifications: boolean;
    theme: 'light' | 'dark' | 'system';
    bio?: string;
}

const SettingPage: React.FC = () => {
    const [form] = Form.useForm<SettingFormValues>();
    const [loading, setLoading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const [uploadLoading, setUploadLoading] = useState(false);
    const navigate = useNavigate()
    const clearUser = useUserStore(state => state.clearUser)
    const [messageApi, contextHolder] = message.useMessage();

    // 只做本地预览，不实际上传
    const beforeUpload = (file: File) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('只能上传图片文件!');
            return Upload.LIST_IGNORE;
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('图片大小必须小于 2MB!');
            return Upload.LIST_IGNORE;
        }
        return true;
    };

    const getBase64 = (file: File, callback: (url: string) => void) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => callback(reader.result as string));
        reader.readAsDataURL(file);
    };

    const handleChange = (info: any) => {
        if (info.file.status === 'uploading') {
            setUploadLoading(true);
            return;
        }
        if (info.file.status === 'done' || info.file.status === 'success') {
            getBase64(info.file.originFileObj, (url: string) => {
                setUploadLoading(false);
                setAvatarUrl(url);
                message.success('头像上传成功！');
            });
        }
        if (info.file.status === 'error') {
            setUploadLoading(false);
            message.error('头像上传失败！');
        }
    };

    const onFinish = (values: SettingFormValues) => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            message.success('设置已保存');
            console.log('保存的设置：', values);
            console.log('头像地址:', avatarUrl);
        }, 1000);
    };

    const uploadButton = (
        <div>
            {uploadLoading ? <LoadingOutlined /> : <PlusOutlined />}
            <div style={{ marginTop: 8 }}>上传头像</div>
        </div>
    );

    return (
        <Card
            style={{
                width: 'calc(100% - 20px)',
                margin: '14px auto',
            }}
        >
            <Title level={3}>设置中心</Title>
            <Form<SettingFormValues>
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                    username: 'KKUser',
                    email: '',
                    notifications: true,
                    theme: 'light',
                }}
            >
                <Row gutter={24} align="top">
                    {/* 左侧头像列，宽度固定 */}
                    <Col flex="160px" style={{ textAlign: 'center' }}>
                        <Upload
                            name="avatar"
                            listType="picture-card"
                            className="avatar-uploader"
                            showUploadList={false}
                            beforeUpload={beforeUpload}
                            onChange={handleChange}
                            customRequest={({ file, onSuccess }) => {
                                // 模拟上传成功
                                setTimeout(() => {
                                    onSuccess && onSuccess("ok");
                                }, 500);
                            }}
                        >
                            {avatarUrl ? (
                                <Image
                                    src={avatarUrl}
                                    alt="avatar"
                                    style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: '50%' }}
                                    preview={false}
                                />
                            ) : (
                                uploadButton
                            )}
                        </Upload>
                        {contextHolder}
                        <Button
                            style={{ fontSize: 16, marginTop: 10 }}
                            type="primary"
                            danger
                            icon={<LogoutOutlined />}
                            onClick={() => {
                                messageApi.open({
                                    type: 'loading',
                                    content: '正在退出...',
                                });
                                setTimeout(async () => {
                                    message.success('退出成功！', 0.5).then(() => {
                                        clearUser();
                                        navigate('/login');
                                    });
                                    await userLogout()
                                    window.electron.ipcRenderer.send('ws-close')
                                }, 1000);
                            }
                            }
                        >
                            Logout
                        </Button>
                    </Col>

                    {/* 右侧表单列，占剩余宽度 */}
                    <Col flex="auto">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="用户名"
                                    name="username"
                                    rules={[{ required: true, message: '请输入用户名' }]}
                                >
                                    <Input placeholder="请输入用户名" />
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Form.Item
                                    label="邮箱"
                                    name="email"
                                    rules={[
                                        { type: 'email', message: '请输入有效邮箱地址' },
                                        { required: true, message: '请输入邮箱' },
                                    ]}
                                >
                                    <Input placeholder="请输入邮箱" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="是否开启通知" name="notifications" valuePropName="checked">
                                    <Switch />
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Form.Item label="主题风格" name="theme">
                                    <Select>
                                        <Option value="light">浅色模式</Option>
                                        <Option value="dark">深色模式</Option>
                                        <Option value="system">跟随系统</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item label="个人简介" name="bio">
                            <Input.TextArea rows={4} placeholder="介绍一下自己..." />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block>
                                保存设置
                            </Button>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Card>
    );
};

export default SettingPage;
