// dbService.ts
import db from './dbinit';
export function accumulateApplyCount(userId: number | string, delta: number) {
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
  userId: number | string,
  contactId: string,
  lastMessage: string,
  lastReceiveTime: number
) {
  const stmt = db.prepare(`
    UPDATE chatSessionUser
    SET lastMessage = ?, lastReceiveTime = ?
    WHERE userId = ? AND contactId = ?
  `);
  stmt.run(lastMessage, lastReceiveTime, userId, contactId);
}


export function queryAllSession(userId: number | string) {
  const stmt = db.prepare(`
    SELECT * FROM chatSessionUser WHERE userId = ?
    ORDER BY lastReceiveTime DESC
  `);
  return stmt.all(userId);
}
