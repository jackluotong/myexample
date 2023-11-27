const express = require("express");
const fs = require("fs");
const https = require("https");
const os = require("os");
const path = require("path");
const childProcess = require("child_process");

const app = express();
const port = 3000;

app.get("/download", (req, res) => {
  const downloadUrl =
    "https://www.luotongtong.top/transfer/ffmpeg-transfer.exe";

  const defaultDownloadPath = path.join(os.homedir(), "Downloads");
  const localFilePath = path.join(defaultDownloadPath, "ffmpeg-transfer.exe");

  if (fs.existsSync(localFilePath)) {
    console.log(`文件 ${localFilePath} 已经存在，无需下载。`);
    res.status(200).send("文件已存在，无需下载。");
    childProcess.execFile(localFilePath, () => {});
  } else {
    if (isFileDownloading(localFilePath)) {
      console.log("文件正在下载，请等待下载完成。");
      res.status(200).send("文件正在下载，请等待下载完成。");
    } else {
      downloadFile(downloadUrl, localFilePath, res);
    }
  }
});

function downloadFile(url, localPath, response) {
  response.setHeader(
    "Content-Disposition",
    `attachment; filename=ffmpeg-transfer.exe`
  );
  response.setHeader("Content-Type", "application/octet-stream");

  const file = fs.createWriteStream(localPath);

  https
    .get(url, (downloadResponse) => {
      if (downloadResponse.statusCode === 200) {
        downloadResponse.pipe(file);

        file.on("finish", () => {
          file.close(() => {
            console.log(`文件下载完成：${localPath}`);
            startDownloadedFile(localPath, response);
          });
        });

        file.on("error", (error) => {
          console.error(`文件下载错误：${error}`);
          response.status(500).send("文件下载错误。");
        });
      } else {
        console.error(`下载失败，状态码：${downloadResponse.statusCode}`);
        response.status(500).send("文件下载失败。");
      }
    })
    .on("error", (error) => {
      console.error(`下载时出现错误：${error.message}`);
      response.status(500).send("下载时出现错误。");
    });
}

function startDownloadedFile(filePath, response) {
  childProcess.execFile(filePath, (error, stdout, stderr) => {
    if (error) {
      console.error(`启动文件时出现错误：${error}`);
      response.send("启动文件时出现错误。");
    } else {
      console.log(`文件启动成功：${filePath}`);
      response.send("文件启动成功。");
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

app.listen(port, () => {
  console.log(`Express 应用运行在 http://localhost:${port}`);
});
