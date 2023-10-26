/**
 * @description using queue
 */

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
const logDirectory = path.join(os.homedir(), "ffmpeg-transfer-queue");
const Bull = require("bull");
app.use(cors());
app.use(bodyParser.json());
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
const port = 8100;
const videoTranscodeQueue = new Bull("videoTranscodeQueue");
videoTranscodeQueue.process(async (job) => {
  logger.info("job", job);
  const { videoBuffer, outputPath } = job.data;

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoBuffer)
      .inputFormat("matroska")
      .output(outputPath)
      .on("end", (s) => {
        resolve(s);
      })
      .on("error", (err) => {
        reject(err);
      })
      .run();
  });
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/transcode", upload.single("videoData"), (req, res) => {
  logger.info(req.file, "req");
  if (!req.file) {
    res.status(400).json({ error: "No video data provided." });
    logger.error("[upload error]:No video data provided.");
    return;
  }

  const videoBuffer = req.file.buffer;
  const outputPath = "output.mp4";

  videoTranscodeQueue.add({
    videoBuffer,
    outputPath,
  });

  // res.status(202).json({ message: "Transcoding request received and queued." });
});

videoTranscodeQueue.on("completed", (job) => {
  const e_time = new Date();
  const timeDifferenceInMilliseconds = e_time - job.timestamp;
  const timeDifferenceInSeconds = timeDifferenceInMilliseconds / 1000;
  const fileInfo = {
    size: `${job.returnvalue.byteLength / 1024 / 1024}.MB`,
  };
  logger.info("[transfer using time:]", timeDifferenceInSeconds);
  logger.info("[file info:]", fileInfo);

  fs.unlinkSync(job.data.outputPath);
});

app.get("/test", (req, res) => {
  res.status(200).json({ info: "success" });
});
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
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

const portToCheck = 8100;
isPortTaken(portToCheck).then((taken) => {
  if (taken) {
    logger.info(`[port]:端口 ${portToCheck} 已被占用`);
  } else {
    logger.info(`[port]:端口 ${portToCheck} 未被占用`);
  }
});
