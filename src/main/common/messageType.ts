// src/constants/messageType.ts

/**
 * 消息类型枚举（前端使用）
 * 与后端 org.khr.kkline.netty.domain.enums.MessageType 保持一致
 */
export enum MessageType {
    // ===== 0 系统初始化 =====
    INIT = 0, // 连接 WS 初始化获取信息

    // ===== 1–9 好友相关 =====
    ADD_FRIEND = 1,          // 添加好友打招呼消息
    CONTACT_APPLY = 2,       // 好友申请
    EDIT_MY_NAME = 3,        // 更新昵称

    // ===== 10–19 群组相关 =====
    GROUP_CREATE = 10,       // 群组已创建，可以和好友一起畅聊
    DISSOLUTION_GROUP = 11,  // 群聊已解散
    ADD_GROUP = 12,          // %s 加入了群组
    LEAVE_GROUP = 13,        // %s 退出了群聊
    REMOVE_GROUP = 14,       // %s 被管理员移出了群聊
    GROUP_NAME_UPDATE = 15,  // 更新群昵称

    // ===== 20–29 聊天相关 =====
    CHAT = 20,               // 普通聊天消息
    MEDIA_CHAT = 21,         // 媒体文件
    TYPING = 22,             // %s 正在输入...
    TYPING_END = 23,         // 输入结束
    REVOKE_MESSAGE = 24,     // %s 撤回了一条消息

    // ===== 30–39 文件传输相关 =====
    FILE_UPLOAD = 30,        // 文件上传完成
    FILE_TRANSMITTING = 31,  // 正在传输文件

    // ===== 40–49 系统类 =====
    FORCE_OFF_LINE = 40,     // 强制下线
    ADVERTISEMENT = 41       // 广告消息
}
export enum ContactType {
    USER = 0,
    GROUP = 1,
    // 你可以根据后台 ContactType 枚举补充
}

export interface MessageSendDTO {
    messageId?: number;          // 消息ID，可能为空
    messageType?: MessageType;        // 消息类型
    sendTime?: number;           // 发送时间，毫秒时间戳

    sender?: UserSender;         // 发送方信息
    contact?: ContactInfo;       // 接收方/群组信息
    content?: MessageContent;    // 消息内容
    file?: FileInfoDTO;          // 文件信息（可选）
}

export interface UserSender {
    userId?: string;
    userName?: string;
    userAvatar?: string;
}

export interface ContactInfo {
    chatSessionId?: string;
    contactId?: string;
    contactName?: string;
    memberCount?: number;
    contactType?: ContactType;
}

export interface MessageContent {
    text?: string;           // 纯文本内容
    summary?: string;        // 可展示内容（最近消息预览）
    extraData?: any;         // 额外数据，类型不确定，用 any
}

export interface FileInfoDTO {
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: string;
}


// WsInitDTO 对应后端的类结构
export interface InitMessageDTO {
  chatSessionVOList: any[];  // 你可以根据ChatSessionVO的TS类型替换any
  chatMessageList: any[];    // 同上，替换为ChatMessage类型
  applyCount: number;
}