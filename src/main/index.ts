import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow, ipcMain, shell, } from 'electron';
import { join } from 'path';
import icon from '../../resources/wechat.png?asset';
import { Menu, nativeImage, Tray } from 'electron';
import { closeWs, initWs } from './ws'

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
    // mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
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
  ipcMain.handle('ws-close', () => {
    try {
      closeWs()
      return true
    } catch (e) {
      console.error('WS 关闭失败:', e)
      return false
    }
  })
  //获取登录用户信息
  ipcMain.handle('get-login-user', () => currentLoginUser);

  // 3. 打开[新的通知]窗口
  ipcMain.handle('open-notification-window', () => {
    createNotificationWindow();
  });
  // 4. 关闭[新的通知]窗口
  ipcMain.on('window-close-notifications', () => notificationWindow?.close())
  // 5. 校验是否是[新的通知]窗口 防止恶意路由跳转
  ipcMain.handle("check-is-notification-window", () => mainWindow !== null)
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
      click: () => {
        app.quit()
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
    width: 600,
    height: 800,
    minWidth: 400,
    minHeight: 600,
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
    // mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}
