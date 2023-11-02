process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

const { app, BrowserWindow ,Menu} = require("electron");
const { spawn } = require("child_process");
let expressServer;
function createWindow() {
  // 创建浏览器窗口
  const win = new BrowserWindow({
    width: 600,
    height: 700,
    // frame: false, 
    resizable: false ,
    webPreferences: {
      nodeIntegration: true, 
    },
  });

  // 加载index.html文件
  win.loadFile("./index.html");

  // 打开开发者工具
  // win.webContents.openDevTools();
}
app.on('ready', ()=>{
  createMenu(); // 创建菜单
  expressServer = spawn("node", ["transfer.js"]);
  expressServer.stdout.on("data", (data) => {
    console.log(data.toString());
  });
})

app.whenReady().then(() => {
  createWindow();
 /**
   * @description node part
*/

// console.log(serverProcess)
// serverProcess.on("error", (err) => {
//   console.error("Error starting server process:", err);
// });

// serverProcess.stdout.on("data", (data) => {
//   console.log(`Server output: ${data}`);
// });

// serverProcess.stderr.on("data", (data) => {
//   console.error(`Server error: ${data}`);
// });
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

// 创建 menu
function createMenu() {
  let menuStructure = [
      {
          label: '配置',
          submenu: [
              {
                  label: '配置',
              },
              {
                  label: '刷新', // 刷新页面
                  click() {
                      refreshWindows()
                  }
              },
              {
                  label: '打开调试窗口',
              },
              {
                  label: '关闭调试窗口',
                  click(menuItem, targetWindow) {
                      targetWindow.closeDevTools()
                  }
              },
          ]
      },
      {
          label: '编辑',
          role: 'editMenu'
      },
      {
          label: '文件夹',
          submenu: [
              {
                  label: '打开工具配置文件夹', click() {
                      let configDir = path.join(os.homedir(), CONFIG_FILE_PATH)
                      shell.openPath(configDir)
                  }
              },
          ]
      },
      {
          label: '关于',
          submenu: [
              {label: '最小化', role: 'minimize'},
              {label: '关于', role: 'about'},
              {type: 'separator'},
              {label: '退出', role: 'quit'},
          ]
      },
  ]
  let menu = Menu.buildFromTemplate(menuStructure)
  Menu.setApplicationMenu(menu)
}
