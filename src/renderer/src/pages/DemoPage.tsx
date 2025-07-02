import React, { useState } from "react";
import { List, Avatar, Typography, Input } from "antd";
import BaseLayout from "../components/BaseLayout";

const { Text } = Typography;

interface Contact {
    id: number;
    name: string;
    avatar: string;
    lastMessage: string;
}

const contacts: Contact[] = [
    { id: 1, name: "张三", avatar: "https://joeschmoe.io/api/v1/random", lastMessage: "你好！" },
    { id: 2, name: "李四", avatar: "https://joeschmoe.io/api/v1/random", lastMessage: "今天吃饭了吗？" },
    // ...
];

const DemoPage: React.FC = () => {
    const [selectedContact, setSelectedContact] = useState<Contact | null>(contacts[0]);

    const contactsList = (
        <>
            <div className="drag" style={{ height: 25, width: "100%" }}></div>
            <Input.Search placeholder="搜索联系人" style={{ margin: "12px", width: "260px" }} allowClear />
            <List
                itemLayout="horizontal"
                dataSource={contacts}
                style={{ flexGrow: 1, overflowY: "auto" }}
                renderItem={(item) => (
                    <List.Item
                        style={{
                            backgroundColor: selectedContact?.id === item.id ? "#e6f7ff" : undefined,
                            cursor: "pointer",
                            padding: "12px 16px",
                        }}
                        onClick={() => setSelectedContact(item)}
                    >
                        <List.Item.Meta
                            avatar={<Avatar src={item.avatar} />}
                            title={<Text strong>{item.name}</Text>}
                            description={item.lastMessage}
                        />
                    </List.Item>
                )}
            />
        </>
    );

    const chatArea = selectedContact ? (
        <>
            <div className="drag" style={{ height: 25, width: "100%" }}></div>
            <Typography.Title level={4}>{selectedContact.name}</Typography.Title>
            <div
                style={{
                    flexGrow: 1,
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    backgroundColor: "#fff",
                    padding: 16,
                    overflowY: "auto",
                    minHeight: 200,
                }}
            >
                <p>这里显示和 {selectedContact.name} 的聊天消息...</p>
            </div>
            <Input.TextArea rows={3} placeholder={`给 ${selectedContact.name} 发送消息...`} style={{ marginTop: 12 }} />
        </>
    ) : (
        <>
         <div className="drag" style={{ height: 25, width: "100%" }}></div>
        <Text>请选择联系人开始聊天</Text></>
    );

    return <BaseLayout contactsList={contactsList} chatArea={chatArea} />;
};

export default DemoPage;
