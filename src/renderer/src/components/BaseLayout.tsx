import React, { ReactNode, useState } from "react";
import { Layout, Menu, } from "antd";
import { WechatOutlined, ContactsOutlined, SettingOutlined } from "@ant-design/icons";

const { Sider, Content } = Layout;

interface BaseLayoutProps {
    contactsList?: ReactNode;  // 中间联系人列表内容
    chatArea?: ReactNode;      // 右侧聊天区域内容
}

const BaseLayout: React.FC<BaseLayoutProps> = ({
    contactsList,
    chatArea,
}) => {
    const [selectedMenuKey, setSelectedMenuKey] = useState("wechat");

    return (
        <Layout style={{ height: "100vh" }}>
            <Sider
                theme="light"
                width={50}
                className="drag"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    paddingTop: 20,
                }}
            >
                <Menu
                    theme="light"
                    mode="inline"
                    selectedKeys={[selectedMenuKey]}
                    onClick={({ key }) => setSelectedMenuKey(key)}
                    className="icon-only-menu no-drag"
                    items={[
                        { key: "wechat", icon: <WechatOutlined style={{ fontSize: 24 }} /> },
                        { key: "contacts", icon: <ContactsOutlined style={{ fontSize: 24 }} /> },
                        { key: "settings", icon: <SettingOutlined style={{ fontSize: 24 }} /> }
                    ].map(({ key, icon }) => ({
                        key,
                        icon,
                        style: { fontSize: 24, margin: "16px 0" },
                    }))}
                />
            </Sider>

            <Sider
                width={280}
                style={{
                    backgroundColor: "#fff",
                    borderRight: "1px solid #ddd",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {contactsList}
            </Sider>

            <Content
                style={{
                    backgroundColor: "#fafafa",
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    height: "100vh",
                    overflowY: "auto",
                }}
            >
                {chatArea}
            </Content>
        </Layout>
    );
};

export default BaseLayout;
