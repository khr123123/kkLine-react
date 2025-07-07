import {
  AlipayOutlined,
  LockOutlined,
  MailOutlined,
  TaobaoOutlined,
  UserOutlined,
  WeiboOutlined
} from '@ant-design/icons'
import {
  LoginFormPage,
  ProConfigProvider,
  ProForm,
  ProFormCaptcha,
  ProFormText
} from '@ant-design/pro-components'
import {
  getRegisterEmailCode,
  loginByEmail,
  loginByPwd,
  userRegister
} from '@renderer/api/userApis'
import GlobalToolBar from '@renderer/components/GlobalToolBar'
import { useUserStore } from '@renderer/store/useUserStore'
import { Button, Divider, Space, Tabs, message, theme } from 'antd'
import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../../../../resources/wechat.png'

type LoginType = 'email' | 'account'

const iconStyles: CSSProperties = {
  color: 'rgba(0, 0, 0, 0.2)',
  fontSize: '18px',
  verticalAlign: 'middle',
  cursor: 'pointer'
}

const Page = () => {
  const [loginType, setLoginType] = useState<LoginType>('account')
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const { setUser } = useUserStore()
  const [form] = ProForm.useForm()
  const [checkCodeKey, setCheckCodeKey] = useState<string>('')
  const [isRegisterPage, setIsRegisterPage] = useState<boolean>(false)
  const sendEmailHandelr = async (values: API.getRegisterEmailCodeParams) => {
    try {
      const res = (await getRegisterEmailCode(values)) as API.BaseResponseMapStringString
      if (res && res.code === 0) {
        message.success('邮件发送成功，请查收!')
        const checkCodeKeyMap = res.data as Record<string, string>
        setCheckCodeKey(checkCodeKeyMap['checkCodeKey'] ?? '')
      } else {
        message.error(res.message || '邮件发送失败')
      }
    } catch (error: any) {
      console.error('发送邮件异常', error)
      const msg = error?.response?.data?.message || error?.message || '请求异常'
      message.error(msg)
    }
  }

  const onFinishHandler = async (
    values: API.UserLoginByPwdRequest | API.UserLoginByEmailRequest
  ) => {
    try {
      let res: API.BaseResponseMapStringString
      if (loginType === 'account') {
        res = await loginByPwd(values as API.UserLoginByPwdRequest)
      } else {
        values = { ...values, checkCodeKey }
        res = await loginByEmail(values as API.UserLoginByEmailRequest)
      }
      if (res && res.code === 0) {
        if (res.data) {
          setUser(res.data)
        }
        message.success('登录成功!')
        navigate('/')
        // 登录成功后调用 IPC 初始化 WebSocket
        window.electron.ipcRenderer.invoke('ws-init', res.data)
      }

    } catch (error: any) {
      console.error('登录异常', error)
      message.error(error?.response?.data?.msg || '登录请求异常')
    }
  }
  const registerHandelr = async (values: API.UserRegisterRequest) => {
    try {
      values = { ...values, checkCodeKey }
      const res = (await userRegister(values)) as any as API.BaseResponseLong
      if (res && res.code === 0) {
        message.success('注册成功!')
        setIsRegisterPage(false)
      }
    } catch (error: any) {
      console.error('注册异常', error)
      message.error(error?.response?.data?.msg || '注册请求异常')
    }
  }

  useEffect(() => {
    form.resetFields()
  }, [isRegisterPage])
  return (
    <>
      <GlobalToolBar isLoginPage={true} />
      <div style={{ backgroundColor: 'white', height: '100vh' }}>
        {isRegisterPage ? (
          <LoginFormPage
            form={form}
            onFinish={registerHandelr}
            backgroundImageUrl="https://mdn.alipayobjects.com/huamei_gcee1x/afts/img/A*y0ZTS6WLwvgAAAAAAAAAAAAADml6AQ/fmt.webp"
            backgroundVideoUrl="https://gw.alipayobjects.com/v/huamei_gcee1x/afts/video/jXRBRK_VAwoAAAAAAAAAAAAAK4eUAQBr"
            logo={logo}
            title="KK LINE"
            subTitle="一个基于 Electron + React 的聊天系统"
            containerStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)'
            }}
            activityConfig={{
              title: '测试活动',
              subTitle: '本项目仅用于学习展示',
              style: {
                boxShadow: '0px 0px 8px rgba(0, 0, 0, 0.2)',
                color: token.colorTextHeading,
                borderRadius: 8,
                backgroundColor: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(4px)'
              },
              action: (
                <Button
                  size="large"
                  style={{
                    borderRadius: 20,
                    background: token.colorBgElevated,
                    color: token.colorPrimary,
                    width: 120
                  }}
                >
                  去看看
                </Button>
              )
            }}
          >
            <Tabs centered style={{ marginTop: -30 }}>
              <Tabs.TabPane key="account" tab="注册账号" />
            </Tabs>
            <ProFormText
              name="userAccount"
              fieldProps={{
                size: 'large',
                prefix: <UserOutlined className="prefixIcon" style={{ color: token.colorText }} />
              }}
              placeholder="用户名"
              validateTrigger="onBlur"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 6, message: '用户名长度不能小于6' },
                { max: 12, message: '用户名长度不能大于12' }
              ]}
            />
            <ProFormText.Password
              name="userPassword"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined className="prefixIcon" style={{ color: token.colorText }} />
              }}
              placeholder="密码"
              validateTrigger="onBlur"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码长度不能小于6' },
                { max: 12, message: '密码长度不能大于12' }
              ]}
            />
            <ProFormText.Password
              name="checkPassword"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined className="prefixIcon" style={{ color: token.colorText }} />
              }}
              placeholder="确认密码"
              validateTrigger="onBlur"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码长度不能小于6' },
                { max: 12, message: '密码长度不能大于12' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('userPassword') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'))
                  }
                })
              ]}
            />
            <ProFormText
              name="userEmail"
              validateTrigger="onBlur"
              fieldProps={{
                size: 'large',
                prefix: <MailOutlined className="prefixIcon" style={{ color: token.colorText }} />
              }}
              placeholder="邮箱地址"
              rules={[
                { required: true, message: '请输入邮箱地址！' },
                {
                  pattern: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
                  message: '邮箱格式错误'
                }
              ]}
            />
            <ProFormCaptcha
              name="checkCode"
              fieldProps={{
                size: 'large',
                prefix: <LockOutlined className="prefixIcon" style={{ color: token.colorText }} />
              }}
              placeholder="请输入验证码"
              captchaTextRender={(timing, count) => (timing ? `${count} 秒后重试` : '获取验证码')}
              onGetCaptcha={async () => {
                const email = form.getFieldValue('userEmail')
                if (!email) {
                  message.error('请先输入邮箱地址')
                  return
                }
                const emailReg = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/
                if (!emailReg.test(email)) {
                  message.error('邮箱格式错误')
                  return
                }
                await sendEmailHandelr({ email, isRegister: isRegisterPage })
              }}
              rules={[{ required: true, message: '请输入验证码' }]}
            />
            <a
              style={{ float: 'right', margin: '-20px 10px 10px 10px' }}
              onClick={() => setIsRegisterPage(false)}
            >
              已有账号？去登录
            </a>
          </LoginFormPage>
        ) : (
          <LoginFormPage
            form={form}
            onFinish={onFinishHandler}
            backgroundImageUrl="https://mdn.alipayobjects.com/huamei_gcee1x/afts/img/A*y0ZTS6WLwvgAAAAAAAAAAAAADml6AQ/fmt.webp"
            backgroundVideoUrl="https://gw.alipayobjects.com/v/huamei_gcee1x/afts/video/jXRBRK_VAwoAAAAAAAAAAAAAK4eUAQBr"
            logo={logo}
            title="KK LINE"
            subTitle="一个基于 Electron + React 的聊天系统"
            containerStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)'
            }}
            activityConfig={{
              title: '测试活动',
              subTitle: '本项目仅用于学习展示',
              style: {
                boxShadow: '0px 0px 8px rgba(0, 0, 0, 0.2)',
                color: token.colorTextHeading,
                borderRadius: 8,
                backgroundColor: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(4px)'
              },
              action: (
                <Button
                  size="large"
                  style={{
                    borderRadius: 20,
                    background: token.colorBgElevated,
                    color: token.colorPrimary,
                    width: 120
                  }}
                >
                  去看看

                </Button>
              )
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
              <Tabs.TabPane key="email" tab="邮箱登录" />
            </Tabs>

            {loginType === 'account' && (
              <>
                <ProFormText
                  name="userAccount"
                  fieldProps={{
                    size: 'large',
                    prefix: (
                      <UserOutlined className="prefixIcon" style={{ color: token.colorText }} />
                    )
                  }}
                  placeholder="用户名"
                  validateTrigger="onBlur"
                  rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 6, message: '用户名长度不能小于6' },
                    { max: 12, message: '用户名长度不能大于12' }
                  ]}
                />
                <ProFormText.Password
                  name="userPassword"
                  fieldProps={{
                    size: 'large',
                    prefix: (
                      <LockOutlined className="prefixIcon" style={{ color: token.colorText }} />
                    )
                  }}
                  placeholder="密码"
                  validateTrigger="onBlur"
                  rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码长度不能小于6' },
                    { max: 12, message: '密码长度不能大于12' }
                  ]}
                />
              </>
            )}

            {loginType === 'email' && (
              <>
                <ProFormText
                  name="userEmail"
                  validateTrigger="onBlur"
                  fieldProps={{
                    size: 'large',
                    prefix: (
                      <MailOutlined className="prefixIcon" style={{ color: token.colorText }} />
                    )
                  }}
                  placeholder="邮箱地址"
                  rules={[
                    { required: true, message: '请输入邮箱地址！' },
                    {
                      pattern: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
                      message: '邮箱格式错误'
                    }
                  ]}
                />
                <ProFormCaptcha
                  name="checkCode"
                  fieldProps={{
                    size: 'large',
                    prefix: (
                      <LockOutlined className="prefixIcon" style={{ color: token.colorText }} />
                    )
                  }}
                  placeholder="请输入验证码"
                  captchaTextRender={(timing, count) =>
                    timing ? `${count} 秒后重试` : '获取验证码'
                  }
                  onGetCaptcha={async () => {
                    const email = form.getFieldValue('userEmail')
                    if (!email) {
                      message.error('请先输入邮箱地址')
                      return
                    }
                    const emailReg = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/
                    if (!emailReg.test(email)) {
                      message.error('邮箱格式错误')
                      return
                    }
                    await sendEmailHandelr({ email, isRegister: isRegisterPage })
                  }}
                  rules={[{ required: true, message: '请输入验证码' }]}
                />
              </>
            )}
            <div style={{ marginBottom: 24, paddingBottom: 24 }}>
              <a style={{ float: 'right' }} onClick={() => setIsRegisterPage(true)}>
                没有账号？去注册
              </a>
            </div>
          </LoginFormPage>
        )}
      </div>
    </>
  )
}

const App = () => (
  <ProConfigProvider dark>
    <Page />
  </ProConfigProvider>
)
export default App
