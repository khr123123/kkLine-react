import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Modal, Form, message, Space, Image, Select } from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { listAd, addAd, deleteAd, publicAd } from '@renderer/api/adCategoryController';
import dayjs from 'dayjs';
import PicUploader from '@renderer/components/PicUploader';
import { useUserStore } from '@renderer/store/useUserStore';

interface AdCategory {
    id: string;
    name: string;
    iconUrl?: string;
    createTime?: string;
}

const AdManagerPage: React.FC = () => {
    const [data, setData] = useState<AdCategory[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [search, setSearch] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);

    const [form] = Form.useForm();
    const [publishForm] = Form.useForm();

    const loadData = async () => {
        setLoading(true);
        try {
            const res = (await listAd()) as any;
            setData(res.data || []);
        } catch (error) {
            message.error('加载广告分类失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAdd = async () => {
        try {
            const values = await form.validateFields();
            const res = await addAd({ ...values }) as unknown as API.BaseResponseBoolean
            if (res.code === 0) {
                message.success('添加成功');
                setIsModalOpen(false);
                form.resetFields();
                loadData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        Modal.confirm({
            title: '确认删除？',
            onOk: async () => {
                try {
                    const res = await deleteAd({ id }) as unknown as API.BaseResponseBoolean
                    if (res.code === 0) {
                        message.success('删除成功');
                        loadData();
                    }
                } catch (err) {
                    message.error('删除失败');
                }
            }
        });
    };

    const handlePublish = async () => {
        try {
            const values = await publishForm.validateFields();
            const res = await publicAd(values) as unknown as API.BaseResponseBoolean
            if (res.code === 0) {
                message.success('广告发布成功');
                publishForm.resetFields();
                setIsPublishModalOpen(false);
            } else {
                message.error('发布失败,' + res.message);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const filteredData = data.filter((item) => item.name.includes(search));

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
        },
        {
            title: '图标',
            dataIndex: 'iconUrl',
            render: (url: string) =>
                url ? <Image src={url} width={40} height={40} /> : '无'
        },
        {
            title: '名称',
            dataIndex: 'name'
        },
        {
            title: '创建时间',
            dataIndex: 'createTime',
            render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
        },
        {
            title: '操作',
            render: (_: any, record: AdCategory) => (
                <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(record.id)}
                >
                    删除
                </Button>
            )
        }
    ];
    const user = useUserStore(state => state.user)
    return (
        <div style={{ padding: 24 }}>
            <Space style={{ marginBottom: 16 }}>
                <Input.Search
                    placeholder="搜索广告分类"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    allowClear
                />
                <Button icon={<ReloadOutlined />} onClick={loadData}>
                    刷新
                </Button>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalOpen(true)}
                >
                    添加分类
                </Button>
                <Button type="dashed" onClick={() => setIsPublishModalOpen(true)}>
                    发布广告
                </Button>
            </Space>

            <Table
                rowKey="id"
                columns={columns}
                dataSource={filteredData}
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            {/* 添加广告分类弹窗 */}
            <Modal
                title="添加广告分类"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleAdd}
                destroyOnClose
            >
                <Form form={form} layout="vertical" preserve={false}>
                    <Space size={"large"}>
                        <PicUploader token={user?.token!} onSuccess={(url) => {
                            form.setFieldsValue({
                                iconUrl: url || ''
                            });
                        }} />
                        <Form.Item
                            label="广告分类 ID"
                            name="id"
                            rules={[
                                { required: true, message: '请输入广告 ID' },
                                {
                                    pattern: /^AD.+$/,
                                    message: 'ID 必须以 AD 开头'
                                }
                            ]}
                        >
                            <Input placeholder="例如：AD001 或 AD_NEWS" />
                        </Form.Item>
                        <Form.Item
                            label="分类名称"
                            name="name"
                            rules={[{ required: true, message: '请输入分类名称' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item name="iconUrl" noStyle>
                            <Input type="hidden" />
                        </Form.Item>
                    </Space>
                </Form>
            </Modal>

            {/* 发布广告弹窗 */}
            <Modal
                title="发布广告"
                open={isPublishModalOpen}
                onCancel={() => setIsPublishModalOpen(false)}
                onOk={handlePublish}
                destroyOnClose
            >
                <Form form={publishForm} layout="vertical">
                    <Form.Item
                        label="广告标题"
                        name="adTitle"
                        rules={[{ required: true, message: '请输入广告标题' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="广告内容"
                        name="adContent"
                        rules={[{ required: true, message: '请输入广告内容' }]}
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>
                    <Form.Item
                        label="选择广告分类"
                        name="adSessionId"
                        rules={[{ required: true, message: '请选择分类' }]}
                    >
                        <Select
                            placeholder="请选择分类"
                            onChange={(value) => {
                                const selected = data.find((item) => item.id === value);
                                publishForm.setFieldsValue({
                                    adAvatar: selected?.iconUrl || ''
                                });
                            }}
                        >
                            {data.map((item) => (
                                <Select.Option key={item.id} value={item.id}>
                                    {item.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="adAvatar" noStyle>
                        <Input type="hidden" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdManagerPage;
