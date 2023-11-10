const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 下载FFmpeg压缩包
const downloadUrl = 'https://ffmpeg.org/releases/ffmpeg-4.4.zip';
const downloadPath = path.join(__dirname, 'ffmpeg.zip');
const extractPath = path.join(__dirname, 'ffmpeg');

const file = fs.createWriteStream(downloadPath);
https.get(downloadUrl, (response) => {
  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('FFmpeg压缩包下载完成');

    // 解压缩FFmpeg压缩包
    exec(`tar -xvf ${downloadPath} -C ${extractPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error('解压缩FFmpeg压缩包出错:', error);
        return;
      }
      console.log('FFmpeg压缩包解压缩完成');

      const ffmpegPath = path.join(extractPath, 'bin', 'ffmpeg');
      const destinationPath = '/path/to/user/specified/directory';

      fs.copyFile(ffmpegPath, path.join(destinationPath, 'ffmpeg.exe'), (err) => {
        if (err) {
          console.error('复制ffmpeg可执行文件出错:', err);
          return;
        }
        console.log('FFmpeg安装完成');
      });
    });
  });
}).on('error', (err) => {
  console.error('下载FFmpeg压缩包出错:', err);
});