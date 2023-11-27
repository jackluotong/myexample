const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const Bull = require("bull");
const { promisify } = require("util");
const { exec } = require("child_process");

const app = express();
const port = 8100;
const videoTranscodeQueue = new Bull("videoTranscodeQueue");
const unlinkAsync = promisify(fs.unlink);
// 异步处理视频转码任务
videoTranscodeQueue.process(async (job) => {
  try {
    const { videoBuffer, outputPath } = job.data;

    // 使用 Promise 包装的 FFmpeg 转码
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoBuffer)
        .inputFormat("matroska")
        .output(outputPath)
        .on("end", () => {
          resolve();
        })
        .on("error", (err) => {
          reject(err);
        })
        .run();
    });
    // 删除临时文件
    await unlinkAsync(outputPath);

    return "Transcoding completed successfully";
  } catch (error) {
    throw error;
  }
});

app.use(express.json());
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 处理视频上传和转码请求
app.post("/transcode", upload.single("videoData"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No video data provided." });
      return;
    }

    const videoBuffer = req.file.buffer;
    const outputPath = "output.mp4";

    const job = await videoTranscodeQueue.add({
      videoBuffer,
      outputPath,
    });

    job.finished().then(() => {
      res.status(200).json({ message: "Video transcoding completed." });
    });
  } catch (error) {
    res.status(500).json({ error: "Video transcoding failed." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
