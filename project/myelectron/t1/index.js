// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
const { app, BrowserWindow, Menu, BrowserView, ipcMain } = require("electron");
const path = require("node:path");
const os = require("os");

let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(__dirname, "wdz.png"),
    width: 600,
    height: 700,
    // frame: false,
    // resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("./index.html");
}
app.on("ready", () => {
  createMenu();
});

app.whenReady().then(() => {
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle("search-port", async (event, portToSearch) => {
  try {
    const result = await searchPort(portToSearch);
    return result;
  } catch (error) {
    console.error("Error searching port:", error.message);
    return `Error searching port: ${error.message}`;
  }
});

function searchPort(portToSearch = 9000) {
  return Promise.resolve(`Fake Port ${portToSearch} is open.`);
}

function refreshWindows() {
  win.reload();
  // 创建浏览器视图
  // const baiduView = new BrowserView();
  // win.setBrowserView(baiduView);
  // baiduView.setBounds({ x: 0, y: 0, width: 800, height: 600 });

  // 加载百度网页
  // baiduView.webContents.loadURL('https://chat.openai.com/');
}
function createMenu() {
  let menuStructure = [
    {
      label: "配置",
      submenu: [
        {
          label: "端口查询",
          click() {
            searchPort();
          },
        },
        {
          label: "刷新",
          click() {
            refreshWindows();
          },
        },
        // {
        //   label: "打开调试窗口",
        //   click() {
        //     win.webContents.openDevTools();
        //   },
        // },
        // {
        //   label: "关闭调试窗口",
        //   click() {
        //     win.closeDevTools();
        //   },
        // },
      ],
    },
    {
      label: "编辑",
      role: "editMenu",
    },
    {
      label: "文件夹",
      submenu: [
        {
          label: "打开工具配置文件夹",
          click() {
            let configDir = path.join(os.homedir());
          },
        },
      ],
    },
    {
      label: "关于",
      submenu: [
        { label: "最小化", role: "minimize" },
        { label: "关于", role: "about" },
        { type: "separator" },
        { label: "退出", role: "quit" },
      ],
    },
  ];
  let menu = Menu.buildFromTemplate(menuStructure);
  Menu.setApplicationMenu(menu);
}
