const { port } = require("./package");
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
const logDirectory = path.join(os.homedir(), ".transcode.log");
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
const ffmpegPath = path.join(
  "C:",
  "Program Files",
  "transcode",
  "resources",
  "build",
  "ffmpeg.exe"
);
ffmpeg.setFfmpegPath(ffmpegPath);

logger.info(ffmpegPath, "[ffmpeg path]");
//C:\Program Files\transcode\resources\ffmpeg.exe
app.use(cors());
app.set("port", port);
app.use(bodyParser.json());
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const childProcess = require("child_process");

app.post("/transcode", upload.single("videoData"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No video data provided." });
    logger.error("[upload error]:No video data provided.");
    return;
  }
  const fileName = "test1.mp4";
  const videoBuffer = req.file.buffer;
  const videoStream = new Readable();
  videoStream.push(videoBuffer);
  videoStream.push(null);

  const outputPath = "output.mp4";
  const cmd = `ffmpeg.exe -i "${outputPath}" -f null -`;
  const b_time = new Date();
  ffmpeg()
    .input(videoStream)
    .inputFormat("matroska")
    .output(outputPath)
    .addOption("-threads", "8") 
    .videoCodec("libx264") 
    .addOption("-preset", "fast") 
    .addOption("-crf", "23")//压缩质量
    .size("640x480") 
    .addOption("-r", "30")  
    .addOption("-b:v", "1M")  
    .on("end", () => {
      const outputData = fs.readFileSync(outputPath);
      getVideoInfo(cmd, true);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );

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
      const deleFileTimer = setTimeout(() => {
        fs.unlinkSync(outputPath);
      }, 1000);
      logger.info('[transfer status]:success')
    })
    .on("error", (err) => {
      logger.error("[transfer error]:", err);
      res.status(500).json({ error: "Error during transcoding." });
    })
    .run();
});
app.get("/", (req, res) => {
  res.json({ msg: "success" });
});

app.listen(port, () => {
  logger.info(`[connect success]:Connecting to ${port}`);
});

const net = require("net");

function isPortTaken(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(true);
    });

    server.once("listening", () => {
      server.close();
      resolve(false);
    });

    server.listen(port, "127.0.0.1");
  });
}

isPortTaken(port).then((taken) => {
  if (taken) {
    logger.info(`[port]:port ${port} is token`);
  } else {
    logger.info(`[port]:port ${port} not token`);
  }
});

function getVideoInfo(cmd, log) {
  childProcess.exec(cmd, (error, stdout, stderr) => {
    if (error) {
      logger.error("Error running ffmpeg: " + error);
      return;
    }

    const lines = stderr.split("\n");
    const videoInfo = {};
    // logger.info("[lines]", lines);

    lines.forEach((line) => {
      if (line.includes("Stream #0:0")) {
        if (line.includes("Video:")) {
          const parts = line.split("Video:")[1].split(",");
          parts.forEach((part) => {
            part = part.trim();
            if (part.includes("x")) {
              const resolution = part.split(" ")[0];
              const [width, height] = resolution.split("x");
              videoInfo.width = parseInt(width);
              videoInfo.height = parseInt(height);
            }
            if (part.includes("bitrate")) {
              videoInfo.bitrate = part;
            }
            if (part.includes("fps")) {
              videoInfo.framerate = part.split("fps")[0];
            }
            if (part.includes("Codec:")) {
              videoInfo.codec = part.split("Codec:")[1].trim();
            }
          });
        }
      }
    });
    if (log) {
      logger.info("Video Info:", videoInfo);
    }
  });
}
