const os = require("os");
const path = require("path");

const defaultDownloadsPath = path.join(os.homedir(), "Downloads");
const fs = require("fs");
const { exec } = require("child_process");
const downloadUrl = "https://www.luotongtong.top/transfer/ffmpeg-transfer.exe";
// const fileName = "ffmpeg-transfer.exe";
const fileName = "work.txt";
function isFileDownloaded(filePath) {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (!err) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

const filePath = path.join(defaultDownloadsPath, fileName);

isFileDownloaded(filePath)
  .then((downloaded) => {
    if (downloaded) {
      console.log(`${fileName} 已下载在默认下载路径中。`);
      console.log(filePath);
      // startFFmpegTransfer(filePath);
    } else {
      console.log(`${fileName} 未下载在默认下载路径中。`);
    }
  })
  .catch((error) => {
    console.error(`检查文件时出现错误：${error}`);
  });

function startFFmpegTransfer(filePath) {
  exec(filePath, (error, stdout, stderr) => {
    if (error) {
      console.error(`启动 ${fileName} 时出现错误：${error}`);
    } else {
      console.log(`${fileName} 启动成功。`);
    }
  });
}
