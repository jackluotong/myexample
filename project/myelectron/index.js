const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");

function createWindow() {
  // 创建浏览器窗口
  const win = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true
    },
  });

  // 加载index.html文件
  win.loadFile("./index.html");

  // 打开开发者工具
  win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
 /**
   * @description node part
*/

const serverProcess = spawn("node", ["./transfer.js"]);
console.log(serverProcess)
serverProcess.on("error", (err) => {
  console.error("Error starting server process:", err);
});

serverProcess.stdout.on("data", (data) => {
  console.log(`Server output: ${data}`);
});

serverProcess.stderr.on("data", (data) => {
  console.error(`Server error: ${data}`);
});
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
