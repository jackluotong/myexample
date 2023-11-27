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
