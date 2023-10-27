// 使用 FFmpeg.js
const FFmpeg = require("ffmpeg.js");
const fs = require("fs");

// 要转换的文件
const inputFile = "input.mkv";
const outputFile = "output.mp4";

// 配置 FFmpeg.js
const ffmpeg = FFmpeg.createFFmpeg({
  log: true,
});

// 加载 FFmpeg.js
(async () => {
  await ffmpeg.load();
  await ffmpeg.write("input.mkv", fs.readFileSync(inputFile));
  // 转换 MKV 到 MP4
  await ffmpeg.run("-i", "input.mkv", "output.mp4");
  const data = ffmpeg.read("output.mp4");
  fs.writeFileSync(outputFile, data);
  console.log("Conversion complete");
  ffmpeg.exit();
})();

// // 使用 FFmpeg.wasm
// const Module = require('ffmpeg-wasm');

// // 配置 FFmpeg.wasm
// Module({
//   onRuntimeInitialized() {
//     // 转换 MKV 到 MP4
//     Module.callMain([
//       '-i', 'input.mkv',
//       'output.mp4'
//     ]);
//     console.log('Conversion complete');
//   }
// });
