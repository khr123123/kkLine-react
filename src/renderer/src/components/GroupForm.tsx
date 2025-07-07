import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Upload, Radio, message } from 'antd';
import type { GetProp, UploadProps } from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';

export type GroupFormProps = {
    initialValues?: Partial<API.GroupCreateRequest>;
    onSubmit?: (formData: API.GroupCreateRequest) => void;
    loading?: boolean;
};
type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];
const getBase64 = (img: FileType, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result as string));
    reader.readAsDataURL(img);
};
const GroupForm: React.FC<GroupFormProps> = ({ initialValues, onSubmit, }) => {
    const [form] = Form.useForm();
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initialValues?.groupAvatar);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(initialValues);
            setAvatarUrl(initialValues.groupAvatar);
        }
    }, [initialValues]);


    const handleFinish = (values: any) => {
        onSubmit?.(values);
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
                setAvatarUrl(url);
            });
        }
    };
    const uploadButton = (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {loading ? <LoadingOutlined /> : <PlusOutlined />}
            <div style={{ marginTop: 4, fontSize: 12 }}>上传</div>
        </div>
    );
    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={initialValues}
        >
            <div style={{ display: 'flex', gap: 24 }}>
                {/* 左侧上传头像 */}
                <div>
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
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="avatar" style={{ width: '100%', borderRadius: 4 }} />
                        ) : (
                            uploadButton
                        )}
                    </Upload>
                    <Form.Item name="groupAvatar" noStyle>
                        <Input type="hidden" />
                    </Form.Item>
                </div>

                {/* 右侧表单项 */}
                <div style={{ flex: 1 }}>
                    <Form.Item
                        name="groupName"
                        label="群聊名称"
                        rules={[{ required: true, message: '请输入群聊名称' }, { max: 100 }]}
                    >
                        <Input placeholder="请输入群聊名称" />
                    </Form.Item>

                    <Form.Item
                        name="groupNotice"
                        label="群公告"
                        rules={[{ max: 500 }]}
                    >
                        <Input.TextArea placeholder="可选，最多500字符" rows={3} style={{ maxHeight: 100, overflowY: 'auto' }} />
                    </Form.Item>

                    <Form.Item
                        name="joinType"
                        label="加入方式"
                        rules={[{ required: true }]}
                    >
                        <Radio.Group>
                            <Radio value={0}>直接加入</Radio>
                            <Radio value={1}>管理员审核</Radio>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            {initialValues ? '更新群聊' : '创建群聊'}
                        </Button>
                    </Form.Item>
                </div>
            </div>
        </Form>
    );
};

export default GroupForm;
