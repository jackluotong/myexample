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
const ffmpegPath = path.join(
  "C:",
  "Program Files",
  "transcode",
  "resources",
  "build",
  "ffmpeg.exe"
);

ffmpeg.setFfmpegPath(ffmpegPath);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
module.exports = {
  app,
  upload,
  logger,
  ffmpeg,
  fs,
  Readable,
};