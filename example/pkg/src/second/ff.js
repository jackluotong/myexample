const express = require("express");
const app = express();
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors"); // 导入cors模块
const multer = require("multer");
app.use(cors());
const port = 9000;

app.use(bodyParser.json());
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/transcode", upload.single("videoData"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No video data provided." });
    return;
  }

  // 获取上传的视频数据文件
  const videoData = req.file; // 使用 req.file.buffer 获取文件的二进制数据
  console.log(videoData, "[videoData");
  // 转码为.mp4格式
  const outputPath = "output.mp4";
  ffmpeg()
    .input(videoData) // 使用 videoData 作为输入
    .inputFormat("matroska") // 指定输入格式，根据实际情况修改
    .output(outputPath)
    .on("end", () => {
      // 读取转码后的.mp4文件数据
      const outputData = fs.readFileSync(outputPath);

      // 删除临时文件
      fs.unlinkSync(outputPath);

      res.json({
        result: "Video transcoded successfully.",
        mp4Data: outputData.toString("base64"),
      });
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
