import React, { useState } from 'react';
import {
    InteractionOutlined,
    SearchOutlined,
    TeamOutlined,
    UserOutlined,
    WechatOutlined
} from '@ant-design/icons';
import {
    Avatar,
    Button,
    Card,
    Empty,
    Input,
    message,
    Popover,
    Space,
    Tag,
    Typography
} from 'antd';
import { search } from '@renderer/api/contactApis';
import { useUserStore } from '@renderer/store/useUserStore';
import { applyAdd } from '@renderer/api/contactApplyApis';

const { Title, Text } = Typography;

const SearchPage: React.FC = () => {
    const [keyword, setKeyword] = useState('');
    const [result, setResult] = useState<API.ContactVO | null>(null);
    const [loading, setLoading] = useState(false);
    const [popoverInput, setPopoverInput] = useState(''); // Popover 内输入框内容

    const user = useUserStore(state => state.user);

    const handleSearch = async () => {
        const trimmed = keyword.trim();
        if (!trimmed) {
            message.warning('请输入好友号或群号');
            return;
        }
        setLoading(true);
        try {
            const res = (await search({ id: trimmed })) as API.BaseResponseContactVO;
            if (res.data) {
                setResult(res.data);
            } else {
                setResult(null);
                message.info('未找到对应的群组或用户');
            }
        } catch {
            message.error('搜索失败，请重试');
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    const getDisplayInfo = (data: API.ContactVO) => {
        const isGroup = data.contactType === 1;
        if (isGroup && data.groupVO) {
            return {
                name: data.groupVO.groupName || '',
                avatar: data.groupVO.groupAvatar || '',
                desc: data.groupVO.groupNotice || '',
                buttonDisabled: data.joined,
                buttonType: 'default' as const,
                buttonText: data.joined ? '已加入群组' : '申请加入',
            };
        }
        if (!isGroup && data.userVO) {
            const mySelf = user?.id === data.userVO.id;
            return {
                name: data.userVO.userName || '',
                avatar: data.userVO.userAvatar || '',
                desc: data.userVO.userProfile || '这个人很懒没有留下任何描述..',
                buttonDisabled: data.joined || mySelf,
                buttonType: 'primary' as const,
                buttonText: data.joined ? '已经是好友' : mySelf ? 'MySelf' : '发送消息',
            };
        }
        return {
            name: '',
            avatar: '',
            desc: '',
            buttonText: '未知',
            buttonDisabled: true,
            buttonType: 'default' as const,
        };
    };

    const contactApplyHandel = async (msg: string) => {
        if (!result) return;
        if (!result.contactId) return;
        const res = await applyAdd({ contactId: result.contactId, applyMessage: msg }) as API.BaseResponseContactVO
        if (res.code === 0) {
            message.success(`已发送申请${msg}给：${result.contactId}`);
            setPopoverInput('');
        } else {
            message.error(`${res.message}`);
        }
    };

    const containerStyle: React.CSSProperties = {
        margin: '40px auto',
        padding: '0 20px',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '80%',
    };

    const searchAreaStyle: React.CSSProperties = {
        width: '80%',
        marginBottom: 24,
        justifyContent: 'flex-start',
        display: 'flex',
        gap: 8,
    };

    const resultAreaStyle: React.CSSProperties = {
        width: '80%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    };
    const [openPopover, setOpenPopover] = useState(false);
    return (
        <div style={containerStyle}>
            <Title
                level={2}
                style={{
                    fontWeight: 'bold',
                    color: 'rgb(22,119,255)',
                    textAlign: 'center',
                    marginBottom: 24,
                    width: '100%',
                }}
            >
                <WechatOutlined /> 搜索好友/群组
            </Title>

            <div style={searchAreaStyle}>
                <Input
                    placeholder="请输入群号或好友号"
                    prefix={<SearchOutlined />}
                    allowClear
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    onPressEnter={handleSearch}
                    style={{
                        height: 40,
                        flex: 1,
                        borderRadius: 8,
                        boxShadow: '0 1px 4px rgba(0,21,41,.12)',
                    }}
                    disabled={loading}
                />
                <Button
                    type="primary"
                    onClick={handleSearch}
                    loading={loading}
                    style={{ borderRadius: 8, padding: '0 24px', height: 40, fontSize: 16 }}
                >
                    搜索
                </Button>
            </div>

            {result ? (
                <div style={resultAreaStyle}>
                    <Tag
                        icon={result.contactType === 1 ? <TeamOutlined /> : <UserOutlined />}
                        color={result.contactType === 1 ? 'blue' : 'green'}
                        style={{
                            fontSize: 16,
                            padding: '6px 12px',
                            marginBottom: 12,
                            userSelect: 'none',
                        }}
                    >
                        {result.contactType === 1 ? '群组' : '好友'}
                    </Tag>

                    <Card
                        hoverable
                        style={{
                            width: '100%',
                            borderRadius: 12,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                        bodyStyle={{ padding: '24px' }}
                        title={
                            <Space style={{ padding: 12 }}>
                                <Avatar size={56} src={getDisplayInfo(result).avatar} />
                                <Text strong style={{ fontSize: 18 }}>
                                    {getDisplayInfo(result).name}
                                </Text>
                            </Space>
                        }
                        extra={
                            <Popover
                                open={openPopover}
                                trigger="click"
                                onOpenChange={(visible) => setOpenPopover(visible)}
                                content={
                                    <Space>
                                        <Input
                                            placeholder="打个招呼吧！😀"
                                            allowClear
                                            value={popoverInput}
                                            onChange={e => setPopoverInput(e.target.value)}
                                            style={{ width: 200 }}
                                        />
                                        <Button
                                            icon={<InteractionOutlined />}
                                            onClick={() => {
                                                contactApplyHandel(popoverInput)
                                                setOpenPopover(false)
                                            }}
                                        />
                                    </Space>
                                }
                            >
                                <Button
                                    type={getDisplayInfo(result).buttonType}
                                    disabled={getDisplayInfo(result).buttonDisabled}
                                    style={{ borderRadius: 8, minWidth: 100 }}
                                    onClick={() => setOpenPopover(true)}
                                >
                                    {getDisplayInfo(result).buttonText}
                                </Button>
                            </Popover>
                        }
                    >
                        <Text style={{ fontSize: 14, lineHeight: 1.6, color: '#444' }}>
                            {getDisplayInfo(result).desc}
                        </Text>
                    </Card>
                </div>
            ) : (
                keyword &&
                !loading && (
                    <Empty
                        description={
                            <span style={{ fontSize: 16, color: '#666' }}>
                                未找到对应的群组或用户 🤷‍♂️
                                <br />
                                请确认输入的群号或好友号是否正确。
                            </span>
                        }
                        style={{ marginTop: 40, textAlign: 'center' }}
                    />
                )
            )}
        </div>
    );
};

export default SearchPage;
