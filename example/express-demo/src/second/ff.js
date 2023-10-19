const express = require("express");
const app = express();
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors"); // 导入cors模块

app.use(cors());
const port = 9000;

app.use(bodyParser.json());

app.post("/transcode", (req, res) => {
  console.log(req.body)
  if (!req.body.videoData) {
    res.status(400).json({ error: "No video data provided." });
    return;
  }

  const videoData = req.body.videoData;

  // 保存上传的视频数据为临时.mkv文件
  const inputPath = "temp.mkv";
  fs.writeFileSync(inputPath, videoData, "base64");

  // 转码为.mp4格式
  const outputPath = "output.mp4";
  ffmpeg()
    .input(inputPath)
    .output(outputPath)
    .on("end", () => {
      // 读取转码后的.mp4文件数据
      const outputData = fs.readFileSync(outputPath, "base64");

      // 删除临时文件
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);

      res.json({ result: "Video transcoded successfully.", mp4Data: outputData });
    })
    .on("error", (err) => {
      console.error("Error:", err);
      res.status(500).json({ error: "Error during transcoding." });
    })
    .run();
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
