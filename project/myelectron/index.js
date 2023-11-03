// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
const { app, BrowserWindow ,Menu,ipcMain} = require("electron");
const { spawn } = require("child_process");
const path = require('node:path');
const { name } = require("./package.json");

let expressServer;
let win;
const appName = app.getPath("exe");
const expressAppUrl = "http://127.0.0.1:9000";
const expressPath = appName.endsWith(`${name}.exe`)
  ? path.join("./resources/app.asar", "./transfer.js")
  : "./transfer.js";

function createWindow() {
  win = new BrowserWindow({
    width: 600,
    height: 700,
    // frame: false, 
    // resizable: false ,
    webPreferences: {
      nodeIntegration: true, 
      contextIsolation: true,
      // preload: path.join(__dirname, 'transfer.js'),
      preload: path.join(__dirname, "./preload.js"),
    },
  });

  win.loadFile("./index.html");

}
app.on('ready', ()=>{
  createMenu(); 
})

app.whenReady().then(() => {
  // startExpressServer();
  createWindow();
 /**
   * @description node part
*/
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

function startExpressServer() {
  // expressServer = spawn("node", ["transfer.js"]);
  // expressServer.stdout.on("data", (data) => {
  //   console.log(data.toString());
  // });
  const expressAppProcess = spawn(appName, [expressPath], { env: { ELECTRON_RUN_AS_NODE: "1" } });

  [expressAppProcess.stdout, expressAppProcess.stderr].forEach(redirectOutput);
}
function refreshWindows(){
  win.reload();
}
function createMenu() {
  let menuStructure = [
      {
          label: '配置',
          submenu: [
              {
                  label: '配置',
              },
              {
                  label: '刷新', 
                  click() {
                      refreshWindows()
                  }
              },
              {
                  label: '打开调试窗口',
                  click() {
                      win.webContents.openDevTools();
                  }
              },
              {
                  label: '关闭调试窗口',
                  click() {
                      win.closeDevTools()
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
