// dbService.ts
import db from './dbinit';
export function accumulateApplyCount(userId: number | string, delta: number): number {
  const selectStmt = db.prepare(`SELECT applyCount FROM applyCount WHERE userId = ?`);
  const row = selectStmt.get(userId);

  let newCount = delta;
  if (row) {
    newCount += row.applyCount || 0;
  }

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO applyCount (userId, applyCount)
    VALUES (?, ?)
  `);
  insertStmt.run(userId, newCount);

  return newCount;
} export function clearApplyCount(userId: number | string): void {
  const stmt = db.prepare(`
    UPDATE applyCount SET applyCount = 0 WHERE userId = ?
  `);
  stmt.run(userId);
}


export function insertChatMessageRecordIgnore(msg: any) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO chatMessage (
      id, sessionId, messageType, messageContent,
      sendUserId, sendUserName, sendTime,
      contactId, fileUrl, fileSize, fileName,
      fileType, sendStatus
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    msg.id,
    msg.sessionId,
    msg.messageType,
    msg.messageContent || null,
    msg.sendUserId,
    msg.sendUserName || null,
    msg.sendTime,
    msg.contactId,
    msg.fileUrl || null,
    msg.fileSize || null,
    msg.fileName || null,
    msg.fileType || null,
    msg.sendStatus ?? 1
  );
}
export function insertChatSessionUserIgnore(session: any, noReadCount?: number) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO chatSessionUser (
      userId, contactId, sessionId, contactName,
      contactAvatar, contactType, lastReceiveTime,
      lastMessage, noReadCount, memberCount, topType
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    session.userId,
    session.contactId,
    session.sessionId,
    session.contactName || null,
    session.contactAvatar || null,
    session.contactType ?? 0,
    session.lastTime ?? null,
    session.lastMessage || null,
    noReadCount || null,              // noReadCount 默认0
    session.memberCount ?? 0,
    0               // topType 默认0
  );
}
export function initCountMessagesBySession(sessionId: string): number {
  const row = db.prepare(`
    SELECT COUNT(*) as cnt FROM chatMessage WHERE sessionId = ?
  `).get(sessionId);
  return row?.cnt ?? 0;
}

// 更新 chatSessionUser 表中的 noReadCount 字段
export function updateSessionNoReadCount(userId: number | string, sessionId: string, noReadCount: number) {
  const stmt = db.prepare(`
    UPDATE chatSessionUser SET noReadCount = ? WHERE userId = ? AND sessionId = ?
  `);
  stmt.run(noReadCount, userId, sessionId);
}
//仅在传入值不为空时才更新该字段
export function updateContactInfo(
  userId: string | number,
  contactId: string,
  contactName?: string,
  contactAvatar?: string
) {
  const fields: string[] = [];
  const values: any[] = [];
  if (contactName && contactName.trim() !== '') {
    fields.push(`contactName = ?`);
    values.push(contactName);
  }
  if (contactAvatar && contactAvatar.trim() !== '') {
    fields.push(`contactAvatar = ?`);
    values.push(contactAvatar);
  }
  if (fields.length === 0) return;
  const sql = `
    UPDATE chatSessionUser
    SET ${fields.join(', ')}
    WHERE userId = ? AND contactId = ?
  `;
  values.push(userId, contactId);
  const stmt = db.prepare(sql);
  stmt.run(...values);
}

// 查询是否存在某个会话
export function findSessionByUserAndContact(userId: number | string, contactId: string) {
  const stmt = db.prepare(`
    SELECT * FROM chatSessionUser WHERE userId = ? AND contactId = ?
  `);
  return stmt.get(userId, contactId);
}

// 更新最后消息和时间
export function updateSessionLastMessage(
  sessionId: string,
  lastMessage: string,
  lastReceiveTime: number
) {
  const stmt = db.prepare(`
    UPDATE chatSessionUser
    SET lastMessage = ?, lastReceiveTime = ?
    WHERE sessionId = ?
  `);
  stmt.run(lastMessage, lastReceiveTime, sessionId);
}
export function updateSessionInfo(
  sessionId: string,
  lastMessage: string,
  lastReceiveTime: number,
  memberCount: number
) {
  const stmt = db.prepare(`
    UPDATE chatSessionUser
    SET lastMessage = ?, lastReceiveTime = ?, memberCount = ?
    WHERE sessionId = ?
  `);
  stmt.run(lastMessage, lastReceiveTime, memberCount, sessionId);
}


export function queryAllSession(userId: number | string) {
  const stmt = db.prepare(`
    SELECT * FROM chatSessionUser WHERE userId = ?
    ORDER BY lastReceiveTime DESC
  `);
  return stmt.all(userId);
}
// 根据 sessionId 查询对应会话的消息（按 sendTime 升序）
export function queryMessagesBySession(sessionId: string) {
  const stmt = db.prepare(`
    SELECT
      id, sessionId, messageType, messageContent,
      sendUserId, sendUserName, sendTime,
      contactId, fileUrl, fileName, fileType, fileSize,
      sendStatus
    FROM chatMessage
    WHERE sessionId = ?
    ORDER BY sendTime ASC
  `)

  return stmt.all(sessionId)
}

export function clearNoreadCount(sessionId: string, userId: string) {
  const stmt = db.prepare(`
    UPDATE chatSessionUser
    SET noReadCount = 0
    WHERE sessionId = ? AND userId = ?
  `);
  stmt.run(sessionId, userId);
}
export function setSessionTop(sessionId: string, userId: string, topState: number) {
  const stmt = db.prepare(`
    UPDATE chatSessionUser
    SET topType = ?
    WHERE sessionId = ? AND userId = ?
  `);
  stmt.run(topState, sessionId, userId);
}

export function updateMessageFileUrlAndStatus(id: number, fileUrl: string, sendStatus: number) {
  const stmt = db.prepare(`
    UPDATE chatMessage
    SET fileUrl = ?, sendStatus = ?
    WHERE id = ?
  `);
  const info = stmt.run(fileUrl, sendStatus, id);
  return info.changes; // 返回影响的行数，方便判断是否成功
}


export function revokeMessageById(messageId: string, msgContent: string, sendTime: number) {
  const stmt = db.prepare(`
    UPDATE chatMessage
    SET
      messageType = 24,
      messageContent = ?,
      sendTime = ?
    WHERE id = ?
  `);

  stmt.run(msgContent, sendTime, messageId);
}
