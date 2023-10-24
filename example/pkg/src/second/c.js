const express = require("express");
const app = express();
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const { Readable } = require("stream");
const path = require("path");
const log4js = require("log4js");
const os = require("os");
const logDirectory = path.join(os.homedir(), "ffmpeg-transfer"); //此方法适合当app跑在客户端时调用日志

log4js.configure({
  appenders: {
    file: {
      type: "file",
      filename: path.join(logDirectory, "app.log"),
    },
    console: { type: "console" },
  },
  categories: { default: { appenders: ["file", "console"], level: "info" } },
});

const logger = log4js.getLogger();
app.use(cors());
const port = 9000;

app.use(bodyParser.json());
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
  const b_time = new Date();
  ffmpeg()
    .input(videoStream)
    .inputFormat("matroska")
    .output(outputPath)
    .on("end", () => {
      const outputData = fs.readFileSync(outputPath);

      res.setHeader("Content-Type", "video/mp4");
      res.send(outputData);
      const e_time = new Date();
      const timeDifferenceInMilliseconds = e_time - b_time;

      const timeDifferenceInSeconds = timeDifferenceInMilliseconds / 1000;
      const fileInfo = {
        size: `${outputData.byteLength / 1024 / 1024}.MB`, // bit => byte => k byte => m byte
      };
      logger.info("[transfer using time:]", timeDifferenceInSeconds);
      logger.info("[file info:]", fileInfo);
      fs.unlinkSync(outputPath);
    })
    .on("error", (err) => {
      logger.error("[transfer error]:", err);
      res.status(500).json({ error: "Error during transcoding." });
    })
    .run();
});

app.get("/testing", (req, res) => {
  res.json({
    states: 200,
  });
});

app.listen(port, () => {
  logger.info(`[connect success]:Connecting to ${port}`);
});

const net = require("net");

function isPortTaken(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      // 端口被占用
      resolve(true);
    });

    server.once("listening", () => {
      // 端口未被占用
      server.close();
      resolve(false);
    });

    server.listen(port, "127.0.0.1");
  });
}

const portToCheck = 9000;
isPortTaken(portToCheck).then((taken) => {
  if (taken) {
    logger.info(`[port]:端口 ${portToCheck} 已被占用`);
  } else {
    logger.info(`[port]:端口 ${portToCheck} 未被占用`);
  }
});
