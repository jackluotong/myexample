/**
   * @description node part
*/
  //#region  
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
  const logDirectory = path.join(os.homedir(), "ffmpeg-electron");
  
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
      logger.info(`[port]:port ${portToCheck} is token`);
    } else {
      logger.info(`[port]:port ${portToCheck} not token`);
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