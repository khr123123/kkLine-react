import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Upload, Radio, message } from 'antd';
import PicUploader from './PicUploader';
import { useUserStore } from '@renderer/store/useUserStore';

export type GroupFormProps = {
    initialValues?: Partial<API.GroupCreateRequest>;
    onSubmit?: (formData: API.GroupCreateRequest) => void;
    loading?: boolean;
};
const GroupForm: React.FC<GroupFormProps> = ({ initialValues, onSubmit, }) => {
    const [form] = Form.useForm();
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initialValues?.groupAvatar);
    const [loading, setLoading] = useState(false);
    const user = useUserStore(state => state.user);

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(initialValues);
            setAvatarUrl(initialValues.groupAvatar);
        }
    }, [initialValues]);


    const handleFinish = (values: any) => {
        onSubmit?.(values);
    };

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
                    <PicUploader token={user?.token!} initialUrl={avatarUrl} onSuccess={(url) => {
                        form.setFieldValue('groupAvatar', url);
                    }} />
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
