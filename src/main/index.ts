import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import axios from 'axios';
import { app, BrowserWindow, ipcMain, Menu, nativeImage, shell, Tray, } from 'electron';
import path, { join } from 'path';
import icon from '../../resources/wechat.png?asset';
import { accumulateApplyCount, clearApplyCount, clearNoreadCount, hasChatSessionUser, insertChatMessageRecordIgnore, insertChatSessionUserIgnore, queryAllSession, queryMessagesBySession, removeChatSessionUser, removeMessageById, removeMessageBySessionId, revokeMessageById, setSessionTop, updateSessionLastMessage } from '../db/dbService';
import { closeWs, initWs } from './ws';
const { exec } = require('child_process');
const sendPath = path.join(__dirname, '../../resources/send.wav')
let mainWindow: BrowserWindow;
function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 880,
    height: 620,
    minWidth: 880,    // 最小宽度
    minHeight: 620,   // 最小高度
    frame: false, // ❗️设置为 false，移除窗口边框
    resizable: true,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL('http://localhost:5173/login')
    // mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
     mainWindow.loadURL(`file://${join(__dirname, '../renderer/index.html')}#/login`)
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
  //创建窗口
  createWindow()
  //注册 IPC 事件
  registerIpcHandlers(mainWindow)
  //创建托盘
  createTray(mainWindow)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

let currentLoginUser: any
function registerIpcHandlers(mainWindow: BrowserWindow) {
  // 简单封装 ipcMain.on
  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.on('window-minimize', () => mainWindow.minimize())
  ipcMain.on('window-close', () => {
    mainWindow.close()
    closeWs()
    if (notificationWindow) {
      notificationWindow.close()
    }
  })
  ipcMain.on('window-toggle-always-on-top', () =>
    mainWindow.setAlwaysOnTop(!mainWindow.isAlwaysOnTop())
  )
  ipcMain.on('window-toggle-maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })
  ipcMain.on('resize-window', (_, { width, height }) => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) win.setSize(width, height)
  })
  // 1. 登陆成功 初始化WS
  ipcMain.handle('ws-init', (_, loginUser) => {
    try {
      currentLoginUser = loginUser
      initWs(loginUser, mainWindow)
      return true
    } catch (e) {
      console.error('WS 初始化失败:', e)
      return false
    }
  })
  // 2. 退出登陆 关闭WS
  ipcMain.on('ws-close', () => closeWs())
  //获取登录用户信息
  ipcMain.handle('get-login-user', () => currentLoginUser);
  // 3. 打开[新的通知]窗口
  ipcMain.handle('open-notification-window', () => {
    createNotificationWindow();
    clearApplyCount(currentLoginUser.id);
  });
  // 4. 关闭[新的通知]窗口
  ipcMain.on('window-close-notifications', () => notificationWindow?.close())
  // 5. 校验是否是[新的通知]窗口 防止恶意路由跳转
  ipcMain.handle("check-is-notification-window", () => mainWindow !== null)

  // 6. 初始化Session列表
  ipcMain.handle('get-session-list', () => {
    return queryAllSession(currentLoginUser.id)
  })
  // 6. 初始化Msg列表
  ipcMain.handle('get-message-list', (_, sessionId) => {
    return queryMessagesBySession(sessionId);
  });
  ipcMain.handle('get-noread-receive-apply-count', () => {
    return accumulateApplyCount(currentLoginUser.id, 0)
  });

  // 7. 当前用户发送消息后 直接在本地后端保存即可
  ipcMain.on('user-send-message', (_, msgData) => {
    exec(`powershell -c (New-Object Media.SoundPlayer '${sendPath}').PlaySync();`)
    insertChatMessageRecordIgnore({
      id: msgData.messageId,
      sessionId: msgData.contact?.chatSessionId,
      messageType: msgData.messageType,
      messageContent: msgData.content?.text,
      sendUserId: currentLoginUser.id,
      sendUserName: currentLoginUser.userName,
      sendTime: msgData.sendTime,
      contactId: msgData.contact?.contactId,
      fileUrl: msgData.file?.fileUrl,
      fileSize: msgData.file?.fileSize,
      fileName: msgData.file?.fileName,
      fileType: msgData.file?.fileType,
      sendStatus: 1,
    });
    mainWindow.webContents.send('change-session-info', {
      chatSessionId: msgData.contact?.chatSessionId!,
      lastMessage: msgData.content?.text!,
      lastReceiveTime: msgData.sendTime!
    });
  })
  ipcMain.on('user-send-file-message', (_, fileMsgData) => {
    exec(`powershell -c (New-Object Media.SoundPlayer '${sendPath}').PlaySync();`)
    insertChatMessageRecordIgnore(fileMsgData);
    mainWindow.webContents.send('change-session-info', {
      chatSessionId: fileMsgData.sessionId!,
      lastMessage: fileMsgData.messageContent!,
      lastReceiveTime: fileMsgData.sendTime!
    });
  })
  ipcMain.on('user-revoke-message', (_, messageId, sessionId) => {
    const newMsgContent = currentLoginUser.userName + "撤回了一条消息"
    const now = Date.now();
    revokeMessageById(messageId, newMsgContent, now)
    updateSessionLastMessage(sessionId, newMsgContent, now)
    mainWindow.webContents.send('change-session-info', {
      chatSessionId: sessionId,
      lastMessage: newMsgContent,
      lastReceiveTime: now
    });
  })
  ipcMain.on('user-delete-message', (_, messageId) => {
    removeMessageById(messageId)
  })
  // 8. 清除未读消息数量
  ipcMain.on('clear-noread-count', (_, sessionId) => {
    clearNoreadCount(sessionId, currentLoginUser.id)
  });
  // 9.会话置顶与取消置顶
  ipcMain.on('set-sessiont-top', (_, sessionId, topState) => {
    setSessionTop(sessionId, currentLoginUser.id, topState)
  });
  //10.会话的删除
  ipcMain.on('user-delete-contact', (_, sessionId) => {
    removeChatSessionUser(sessionId, currentLoginUser.id)
    removeMessageBySessionId(sessionId)
  });
  //11.用户从朋友列表点击了聊天
  ipcMain.handle('user-goto-session', (_, chatSession) => {
    const sessionId = chatSession.sessionId;
    const userId = currentLoginUser.id;
    const exists = hasChatSessionUser(sessionId, userId);
    if (!exists) {
      insertChatSessionUserIgnore(chatSession)
    }
    return chatSession.sessionId
  });
}

function createTray(win: BrowserWindow) {
  const trayIcon = nativeImage.createFromPath(icon)
  let tray = new Tray(trayIcon)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主界面',
      click: () => {
        win.show()
        win.setSkipTaskbar(false)
      },
    },
    {
      label: '退出',
      click: async () => {
        app.quit()
        try {
          const response = await axios.post('http://118.31.247.73:8080/api/user/logout', {}, {
            headers: {
              Authorization: `${currentLoginUser.token}`,
              'Content-Type': 'application/json',
            },
            timeout: 50000,
            withCredentials: true,
          });

          console.log('登出成功:', response.data);
        } catch (error) {
          console.error('登出失败:', error);
        }
        closeWs()
      },
    },
  ])

  tray.setToolTip('KK-LINE v2.0')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show()
  })
}


let notificationWindow: BrowserWindow | null = null;

function createNotificationWindow(): void {
  if (notificationWindow) {
    notificationWindow.focus();
    return;
  }

  notificationWindow = new BrowserWindow({
    width: 520,
    height: 700,
    minWidth: 520,
    minHeight: 700,
    frame: false,
    resizable: true,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    }
  });

  notificationWindow.on('ready-to-show', () => {
    notificationWindow?.show();
  });

  notificationWindow.on('closed', () => {
    notificationWindow = null;
  });

  notificationWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    notificationWindow.loadURL('http://localhost:5173/notifications');
    // mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadURL(`file://${join(__dirname, '../renderer/index.html')}#/notifications`)
  }
}
