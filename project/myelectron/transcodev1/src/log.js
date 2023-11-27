const log4js = require("log4js");
const path = require("path");
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
