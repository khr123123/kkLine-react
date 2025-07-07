export const Table_DDL = [
    `CREATE TABLE IF NOT EXISTS chatMessage
(
    id              BIGINT PRIMARY KEY,
    sessionId       VARCHAR(255) NOT NULL,
    messageType     TINYINT(1) NOT NULL,
    messageContent  VARCHAR(512) DEFAULT NULL,
    sendUserId      VARCHAR(255) NOT NULL,
    sendUserName    VARCHAR(50) DEFAULT NULL,
    sendTime        BIGINT NOT NULL,
    contactId       VARCHAR(255) NOT NULL,
    contactType     TINYINT(1) NOT NULL,
    fileUrl         VARCHAR(1024) DEFAULT NULL,
    fileName        VARCHAR(255) DEFAULT NULL,
    fileType        VARCHAR(10) DEFAULT NULL,
    sendStatus      TINYINT(1) NOT NULL DEFAULT 0
);`,

    `CREATE TABLE IF NOT EXISTS chatSessionUser
(
    userId          BIGINT NOT NULL,
    contactId       VARCHAR(255) NOT NULL,
    sessionId       VARCHAR(255) NOT NULL,
    contactName     VARCHAR(50) DEFAULT NULL,
    avatar          VARCHAR(1024) NULL,
    contactType     TINYINT,
    lastReceiveTime BIGINT,
    lastMessage     VARCHAR(500),
    noReadCount     SMALLINT DEFAULT 0,
    memberCount     SMALLINT,
    topType         TINYINT DEFAULT 0,
    PRIMARY KEY (userId, contactId)
);`,

    `CREATE TABLE IF NOT EXISTS applyCount
(
    userId     BIGINT NOT NULL,
    applyCount INT DEFAULT 0,
    PRIMARY KEY (userId)
);`
]