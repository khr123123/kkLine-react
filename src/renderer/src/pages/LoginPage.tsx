// src/pages/Login.tsx
import {
    AlipayOutlined,
    LockOutlined,
    MobileOutlined,
    TaobaoOutlined,
    UserOutlined,
    WeiboOutlined,
} from '@ant-design/icons';
import {
    LoginFormPage,
    ProConfigProvider,
    ProFormCaptcha,
    ProFormCheckbox,
    ProFormText,
} from '@ant-design/pro-components';
import GlobalToolBar from '@renderer/components/GlobalToolBar';
import { Button, Divider, Space, Tabs, message, theme } from 'antd';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from "../../../../resources/wechat.png"

type LoginType = 'phone' | 'account';

const iconStyles: CSSProperties = {
    color: 'rgba(0, 0, 0, 0.2)',
    fontSize: '18px',
    verticalAlign: 'middle',
    cursor: 'pointer',
};

const Page = () => {
    const [loginType, setLoginType] = useState<LoginType>('account');
    const { token } = theme.useToken();
    const navigate = useNavigate();

    return (
        <>
            <GlobalToolBar isLoginPage={true} />
            <div style={{ backgroundColor: 'white', height: '100vh' }}>
                <LoginFormPage
                    onFinish={async (values) => {
                        message.success('登录成功！', values.username);
                        localStorage.setItem('token', 'mock-token');
                        navigate('/'); // 跳转首页
                    }}
                    backgroundImageUrl="https://mdn.alipayobjects.com/huamei_gcee1x/afts/img/A*y0ZTS6WLwvgAAAAAAAAAAAAADml6AQ/fmt.webp"
                    backgroundVideoUrl="https://gw.alipayobjects.com/v/huamei_gcee1x/afts/video/jXRBRK_VAwoAAAAAAAAAAAAAK4eUAQBr"
                    logo={logo}
                    title="KK LINE"
                    subTitle="一个基于 Electron + React 的聊天系统"
                    containerStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(4px)',
                    }}
                    activityConfig={{
                        title: '测试活动',
                        subTitle: '本项目仅用于学习展示',
                        style: {
                            boxShadow: '0px 0px 8px rgba(0, 0, 0, 0.2)',
                            color: token.colorTextHeading,
                            borderRadius: 8,
                            backgroundColor: 'rgba(255,255,255,0.25)',
                            backdropFilter: 'blur(4px)',
                        },
                        action: (
                            <Button
                                size="large"
                                style={{
                                    borderRadius: 20,
                                    background: token.colorBgElevated,
                                    color: token.colorPrimary,
                                    width: 120,
                                }}
                            >
                                去看看
                            </Button>
                        ),
                    }}
                    actions={
                        <div style={{ textAlign: 'center' }}>
                            <Divider plain>
                                <span style={{ color: token.colorTextPlaceholder, fontSize: 14 }}>
                                    其他登录方式
                                </span>
                            </Divider>
                            <Space size={24}>
                                <AlipayOutlined style={{ ...iconStyles, color: '#1677FF' }} />
                                <TaobaoOutlined style={{ ...iconStyles, color: '#FF6A10' }} />
                                <WeiboOutlined style={{ ...iconStyles, color: '#eb2f96' }} />
                            </Space>
                        </div>
                    }
                >
                    <Tabs centered activeKey={loginType} onChange={(key) => setLoginType(key as LoginType)}>
                        <Tabs.TabPane key="account" tab="账号密码登录" />
                        <Tabs.TabPane key="phone" tab="手机号登录" />
                    </Tabs>

                    {loginType === 'account' && (
                        <>
                            <ProFormText
                                name="username"
                                fieldProps={{
                                    size: 'large',
                                    prefix: <UserOutlined className="prefixIcon" style={{ color: token.colorText }} />,
                                }}
                                placeholder="用户名：admin"
                                rules={[{ required: true, message: '请输入用户名' }]}
                            />
                            <ProFormText.Password
                                name="password"
                                fieldProps={{
                                    size: 'large',
                                    prefix: <LockOutlined className="prefixIcon" style={{ color: token.colorText }} />,
                                }}
                                placeholder="密码：123456"
                                rules={[{ required: true, message: '请输入密码' }]}
                            />
                        </>
                    )}

                    {loginType === 'phone' && (
                        <>
                            <ProFormText
                                name="mobile"
                                fieldProps={{
                                    size: 'large',
                                    prefix: <MobileOutlined className="prefixIcon" style={{ color: token.colorText }} />,
                                }}
                                placeholder="手机号"
                                rules={[
                                    { required: true, message: '请输入手机号！' },
                                    { pattern: /^1\d{10}$/, message: '手机号格式错误' },
                                ]}
                            />
                            <ProFormCaptcha
                                name="captcha"
                                fieldProps={{
                                    size: 'large',
                                    prefix: <LockOutlined className="prefixIcon" style={{ color: token.colorText }} />,
                                }}
                                placeholder="请输入验证码"
                                captchaTextRender={(timing, count) =>
                                    timing ? `${count} 秒后重试` : '获取验证码'
                                }
                                onGetCaptcha={async () => {
                                    message.success('验证码为：1234（测试）');
                                }}
                                rules={[{ required: true, message: '请输入验证码' }]}
                            />
                        </>
                    )}

                    <div style={{ marginBottom: 24 }}>
                        <ProFormCheckbox noStyle name="autoLogin">
                            自动登录
                        </ProFormCheckbox>
                        <a style={{ float: 'right' }}>忘记密码？</a>
                    </div>
                </LoginFormPage>
            </div>
        </>
    );
};

export default () => (
    <ProConfigProvider dark>
        <Page />
    </ProConfigProvider>
);
