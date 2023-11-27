const { port } = require("../../package");
const {
  app,
  upload,
  logger,
  ffmpeg,
  fs,
  Readable,
} =require('./common')
app.set("port", port);


app.post("/transcode", upload.single("videoData"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No video data provided." });
    logger.error("[upload error]:No video data provided.");
    return;
  }
  const videoBuffer = req.file.buffer;
  const videoStream = new Readable();
  videoStream.push(videoBuffer);
  videoStream.push(null);

  const outputPath = "output.mp4";

  ffmpeg()
    .input(videoStream)
    .inputFormat("matroska")
    .output(outputPath)
    // .videoCodec("h264_nvenc") // 使用gpu加速，当前不起作用会报错 ffmpeg exited with code 3221225477
    .addOption("-threads", "8") // 设置CPU 核心数
    .videoCodec("libx264") // 选择编码器
    .addOption("-preset", "fast") // 选择适当的预设
    .addOption("-crf", "23") // 控制视频质量
    .size("640x480") // 设置适当的分辨率
    .addOption("-r", "30")  // 设置输出视频帧率
    .addOption("-b:v", "1M")  // 设置输出视频比特率
    .on("end", () => {
      const outputData = fs.readFileSync(outputPath);
      res.send(outputData);
      const deleFileTimer = setTimeout(() => {
        fs.unlinkSync(outputPath);
      }, 1000);
    })
    .on("error", (err) => {
      logger.error("[transfer error]:", err);
      res.status(500).json({ error: "Error during transcoding." });
    })
    .run();
});


app.listen(port, () => {
  logger.info(`[connect success]:Connecting to ${port}`);
});
