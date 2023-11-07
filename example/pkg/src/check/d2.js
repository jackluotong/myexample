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

  // 获取默认下载路径
  const defaultDownloadPath = path.join(os.homedir(), "Downloads");
  const localFilePath = path.join(defaultDownloadPath, "ffmpeg-transfer.exe");

  // 检查文件是否已经下载
  if (fs.existsSync(localFilePath)) {
    console.log(`文件 ${localFilePath} 已经存在，无需下载。`);
    // 返回下载中的信息
    res.status(200).send("文件已存在，无需下载。");
    childProcess.execFile(localFilePath, () => {});
  } else {
    // 文件不存在，检查是否有文件正在下载
    if (isFileDownloading(localFilePath)) {
      console.log("文件正在下载，请等待下载完成。");
      // 返回下载中的信息
      res.status(200).send("文件正在下载，请等待下载完成。");
    } else {
      // 开始下载文件
      downloadFile(downloadUrl, localFilePath, res);
    }
  }
});

// 下载文件并保存到本地
function downloadFile(url, localPath, response) {
  // 设置响应头
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
            // 在这里添加代码以启动已下载的文件
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

// 启动已下载的文件
function startDownloadedFile(filePath, response) {
  // 使用 child_process 模块来启动已下载的文件
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

// 检查文件是否正在下载
function isFileDownloading(filePath) {
  // 检查文件是否存在且大小大于0表示文件正在下载
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    return stats.size > 0;
  }
  return false;
}

app.listen(port, () => {
  console.log(`Express 应用运行在 http://localhost:${port}`);
});
