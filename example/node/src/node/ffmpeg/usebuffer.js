const express = require('express');
const bodyParser = require('body-parser');
const ffmpeg = require('fluent-ffmpeg');
const morgan = require('morgan');
const app = express();
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// ffmpeg.setFfmpegPath('./ffmpeg.exe');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const port = 30001;

app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors());

app.post('/convert', upload.single('file'), (req, res) => {
  const uploadedFile = req.file;

  if (!uploadedFile) {
    return res.status(400).json({ message: '没有上传文件qaq_' });
  }

  // 生成唯一的临时文件名，使用时间戳确保唯一性
  const timestamp = Date.now();
  const tempFilePath = `temp_${timestamp}.mkv`;

  // 将内存中的数据写入临时文件
  fs.writeFileSync(tempFilePath, uploadedFile.buffer);

  // 使用临时文件作为输入
  const ffmpegCommand = ffmpeg()
    .input(tempFilePath)
    .inputFormat('matroska')
    .outputFormat('mp4')
    .pipe(res, { end: true });
  console.log('FFmpeg 命令行:', ffmpegCommand);
  ffmpegCommand.on('end', () => {
    console.log('转码完成');
    // 删除临时文件
    fs.unlinkSync(tempFilePath);
  });

  ffmpegCommand.on('error', (err) => {
    console.error('转码出错:', err);
    res.status(500).send('[Ffmpeg]转码出错了');
  });
});

app.listen(port, () => {
  console.log(`服务器已启动，监听端口 ${port}`);
});

