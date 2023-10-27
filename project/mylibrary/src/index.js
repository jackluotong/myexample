import * as math from "./test";
// import ffmpeg from "@ffmpeg/ffmpeg";
const { createFFmpeg, fetchFile } = require("@ffmpeg/core");
const ffmpeg = createFFmpeg({ log: true });

async function convertMKVtoMP4(inputFile, outputFile) {
  // 初始化 FFmpeg
  await ffmpeg.load();

  // 上传输入文件
  await ffmpeg.FS("writeFile", "input.mkv", await fetchFile(inputFile));

  // 执行文件格式转换
  await ffmpeg.run("-i", "input.mkv", "output.mp4");

  // 读取转换后的文件
  const data = ffmpeg.FS("readFile", "output.mp4");

  // 保存转换后的文件
  await fs.promises.writeFile(outputFile, data);

  // 退出 FFmpeg
  await ffmpeg.exit();
}

// // 使用示例
// convertMKVtoMP4("input.mkv", "output.mp4")
//   .then(() => {
//     console.log("Conversion complete");
//   })
//   .catch((err) => {
//     console.error("Conversion error:", err);
//   });

export default { math, ffmpeg };
