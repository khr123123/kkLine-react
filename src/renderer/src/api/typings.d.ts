declare namespace API {
  type ApplyDealWithRequest = {
    /** 申请ID，必填 */
    applyId: number
    /** 申请状态，必填，1=接受，2=拒绝 */
    applyStatus: number
  }

  type ApplyQueryRequest = {
    current?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
  }

  type ApplyRequest = {
    /** 联系人ID，必填 */
    contactId: string
    /** 申请附言，选填 */
    applyMessage?: string
  }

  type BaseResponseBoolean = {
    code?: number
    data?: boolean
    message?: string
  }

  type BaseResponseContactVO = {
    code?: number
    data?: ContactVO
    message?: string
  }

  type BaseResponseGroupVO = {
    code?: number
    data?: GroupVO
    message?: string
  }

  type BaseResponseListContactApplyVO = {
    code?: number
    data?: ContactApplyVO[]
    message?: string
  }

  type BaseResponseListContactVO = {
    code?: number
    data?: ContactVO[]
    message?: string
  }

  type BaseResponseListGroup = {
    code?: number
    data?: Group[]
    message?: string
  }

  type BaseResponseLoginUserVO = {
    code?: number
    data?: LoginUserVO
    message?: string
  }

  type BaseResponseLong = {
    code?: number
    data?: number
    message?: string
  }

  type BaseResponseMapStringString = {
    code?: number
    data?: Record<string, any>
    message?: string
  }

  type BaseResponseMessageSendDTO = {
    code?: number
    data?: MessageSendDTO
    message?: string
  }

  type BaseResponsePageGroupVO = {
    code?: number
    data?: PageGroupVO
    message?: string
  }

  type BaseResponsePageUser = {
    code?: number
    data?: PageUser
    message?: string
  }

  type BaseResponsePageUserVO = {
    code?: number
    data?: PageUserVO
    message?: string
  }

  type BaseResponseString = {
    code?: number
    data?: string
    message?: string
  }

  type BaseResponseUser = {
    code?: number
    data?: User
    message?: string
  }

  type BaseResponseUserVO = {
    code?: number
    data?: UserVO
    message?: string
  }

  type ChatSendFileRequest = {
    messageId?: number
    contactId: string
    sendTime?: string
    biz?: string
  }

  type ChatSendRequest = {
    messageId?: number
    contactId: string
    messageContent: string
    messageType: number
    sendTime?: string
    fileUrl?: string
    fileName?: string
    fileType?: string
  }

  type ContactApplyVO = {
    id?: number
    fromUserId?: number
    toUserId?: number
    groupId?: string
    contactType?: number
    applyInfo?: string
    createTime?: string
    updateTime?: string
    applyStatus?: number
    userVO?: UserVO
    groupVO?: GroupVO
  }

  type ContactDelRequest = {
    /** 联系人ID(群或好友) */
    contactId: string
    /** 申请状态（例如：0=拉黑，1=删除） */
    applyStatus: number
  }

  type ContactListRequest = {
    /** 联系人类型（例如：1=好友，2=群聊） */
    contactType: number
  }

  type ContactQueryRequest = {
    /** 联系人ID（好友或群） */
    id: string
  }

  type ContactVO = {
    userId?: number
    contactId?: string
    contactType?: number
    createTime?: string
    updateTime?: string
    userVO?: UserVO
    groupVO?: GroupVO
    joined?: boolean
  }

  type DeleteRequest = {
    /** 要删除的数据 ID，必须为正整数 */
    id: number
  }

  type getRegisterEmailCodeParams = {
    email: string
    isRegister: boolean
  }

  type getUserByIdParams = {
    id: number
  }

  type getUserVOByIdParams = {
    id: number
  }

  type Group = {
    id?: string
    groupName?: string
    groupOwner?: number
    groupNotice?: string
    groupAvatar?: string
    joinType?: number
    createTime?: string
    updateTime?: string
    isDelete?: number
  }

  type GroupAddMemberRequest = {
    /** 要添加的成员用户ID列表（至少一个） */
    userIds: number[]
    /** 群聊 ID */
    groupId: string
  }

  type GroupCreateRequest = {
    /** 群聊名称（必填，1~100字符） */
    groupName: string
    /** 群公告（可选，最多500字符） */
    groupNotice?: string
    /** 群头像 URL（可选，最多255字符） */
    groupAvatar?: string
    /** 加入方式：0-直接加入，1-管理员审核 */
    joinType: number
  }

  type GroupEditRequest = {
    /** 群聊 ID（必填） */
    id: string
    /** 群聊名称（必填，最大100字符） */
    groupName: string
    /** 群公告（可选，最大500字符） */
    groupNotice?: string
    /** 群头像 URL（可选） */
    groupAvatar?: string
    /** 加入方式：0-直接加入，1-管理员审核 */
    joinType: number
  }

  type GroupInfoRequest = {
    /** 群聊 ID（必填） */
    id: string
  }

  type GroupKickRequest = {
    /** 被踢出的成员用户ID列表（至少一个） */
    memberIds: number[]
    /** 群聊 ID */
    groupId: string
  }

  type GroupQueryRequest = {
    current?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    /** 群聊 ID */
    id?: string
    /** 群聊名称（支持模糊查询） */
    groupName?: string
    /** 加入方式：0-直接加入，1-管理员审核 */
    joinType?: number
  }

  type GroupRemoveRequest = {
    /** 要解散的群聊 ID */
    id: string
  }

  type GroupVO = {
    id?: string
    groupName?: string
    groupOwner?: number
    groupNotice?: string
    groupAvatar?: string
    joinType?: number
    createTime?: string
    memberCount?: number
    userVOList?: UserVO[]
    groupOwnerName?: string
  }

  type LoginUserVO = {
    id?: number
    userName?: string
    userAvatar?: string
    userEmail?: string
    userProfile?: string
    userRole?: string
    createTime?: string
    updateTime?: string
    userSex?: number
    lastLoginTime?: string
    lastLogoutTime?: string
    areaName?: string
    areaCode?: string
    session?: string
  }

  type MessageSendDTO = {
    messageId?: number
    sessionId?: string
    sendUserId?: string
    sendUserName?: string
    contactId?: string
    contactName?: string
    contactType?: number
    messageContent?: string
    lastMessage?: string
    messageType?: number
    sendTime?: number
    sendStatus?: number
    memberCount?: number
    avatar?: string
    fileUrl?: string
    fileName?: string
    fileType?: string
    data?: Record<string, any>
  }

  type OrderItem = {
    column?: string
    asc?: boolean
  }

  type PageGroupVO = {
    records?: GroupVO[]
    total?: number
    size?: number
    current?: number
    orders?: OrderItem[]
    optimizeCountSql?: PageGroupVO
    searchCount?: PageGroupVO
    optimizeJoinOfCountSql?: boolean
    maxLimit?: number
    countId?: string
    pages?: number
  }

  type PageUser = {
    records?: User[]
    total?: number
    size?: number
    current?: number
    orders?: OrderItem[]
    optimizeCountSql?: PageUser
    searchCount?: PageUser
    optimizeJoinOfCountSql?: boolean
    maxLimit?: number
    countId?: string
    pages?: number
  }

  type PageUserVO = {
    records?: UserVO[]
    total?: number
    size?: number
    current?: number
    orders?: OrderItem[]
    optimizeCountSql?: PageUserVO
    searchCount?: PageUserVO
    optimizeJoinOfCountSql?: boolean
    maxLimit?: number
    countId?: string
    pages?: number
  }

  type uploadFileParams = {
    uploadFileRequest: UploadFileRequest
  }

  type UploadFileRequest = {
    /** 业务类型 */
    biz?: string
  }

  type User = {
    id?: number
    userAccount?: string
    userEmail?: string
    userPassword?: string
    userName?: string
    userAvatar?: string
    userProfile?: string
    userRole?: string
    userSex?: number
    areaName?: string
    areaCode?: string
    editTime?: string
    createTime?: string
    updateTime?: string
    lastLogOutTime?: string
    isDelete?: number
  }

  type UserAddRequest = {
    /** 用户名，2-10个字符 */
    userName: string
    /** 用户账号，4-20个字符 */
    userAccount: string
    /** 用户邮箱 */
    userEmail: string
    /** 用户头像地址，必须是图片链接 */
    userAvatar: string
    /** 用户角色，user 或 admin */
    userRole: string
  }

  type UserLoginByEmailRequest = {
    userEmail: string
    checkCodeKey: string
    checkCode: string
  }

  type UserLoginByPwdRequest = {
    userAccount: string
    userPassword: string
  }

  type UserQueryRequest = {
    current?: number
    pageSize?: number
    sortField?: string
    sortOrder?: string
    /** 用户ID */
    id?: number
    /** 用户账号 */
    userAccount?: string
    /** 用户邮箱 */
    userEmail?: string
    /** 用户名 / 昵称 */
    userName?: string
    /** 用户角色（user/admin） */
    userRole?: string
    /** 用户性别（0：女，1：男，2：未知） */
    userSex?: number
    /** 地区名称 */
    areaName?: string
    /** 地区邮编 */
    areaCode?: string
  }

  type UserRegisterRequest = {
    userAccount: string
    userPassword: string
    checkPassword: string
    userEmail: string
    checkCodeKey: string
    checkCode: string
  }

  type UserUpdateMyPasswordRequest = {
    /** 新密码，6~12位字符 */
    password: string
    /** 重复密码，需与新密码一致 */
    rePassword: string
  }

  type UserUpdateMyRequest = {
    /** 用户名，2～10个字符 */
    userName: string
    /** 用户头像URL */
    userAvatar: string
    /** 用户自我介绍，最大200字符 */
    userProfile?: string
    /** 用户性别（0：女性，1：男性，2：未知） */
    userSex: number
    /** 地区名称 */
    areaName: string
    /** 地区邮编（格式示例：123-4567） */
    areaCode: string
  }

  type UserUpdateRequest = {
    /** 用户ID，必须为正整数 */
    id: number
    /** 用户账号，4~20个字符 */
    userAccount: string
    /** 用户名，2~10个字符 */
    userName: string
    /** 用户邮箱 */
    userEmail: string
    /** 用户头像，必须为图片链接 */
    userAvatar: string
    /** 用户角色，user 或 admin */
    userRole: string
  }

  type UserVO = {
    id?: number
    userAccount?: string
    userEmail?: string
    userName?: string
    userAvatar?: string
    userProfile?: string
    userRole?: string
    userSex?: number
    areaName?: string
    areaCode?: string
  }
}
