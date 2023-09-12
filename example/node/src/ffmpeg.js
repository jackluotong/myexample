// const express = require('express');
// const bodyParser = require('body-parser');
// const fs = require('fs');
// const path = require('path');
// const ffmpeg = require('fluent-ffmpeg');
// const morgan = require('morgan');
// const app = express();
// const cors = require('cors');
// const multer = require('multer');
// // 配置 multer 中间件，用于处理文件上传
// const storage = multer.memoryStorage(); // 使用内存存储，将文件存储在内存中而不是磁盘上
// const upload = multer({ storage: storage });

// const port = 30001; // 设置您希望监听的端口号

// // 配置 body-parser 中间件，用于解析请求体中的 JSON 数据
// app.use(bodyParser.json());
// app.use(morgan('dev'));
// app.use(cors()); 
// // 处理 POST 请求
// app.post('/convert', upload.single('file'), (req, res) => {
//   const uploadedFile = req.file; 
//   console.log(uploadedFile, '[uploadedFile]');

//   if (!uploadedFile) {
//     return res.status(400).json({ message: '没有上传文件' });
//   }

//   // 创建一个唯一的输出文件名，这里使用当前时间戳
//   const uniqueFilename = 'output_' + Date.now() + '.mp4';

//   // 创建输出文件的完整路径
//   const outputPath = path.join(__dirname, uniqueFilename);

//   // 使用 fluent-ffmpeg 进行转码
//   ffmpeg()
//   .input(uploadedFile.buffer)
//   .inputFormat('matroska')
//   .inputOption('-map 0:0') // 选择第一个流作为输入（视频流）
//   .output(outputPath)
//   .outputFormat('mp4')
//   .on('end', () => {
//     console.log('转码完成');
//     res.setHeader('Content-Type', 'video/mp4');
//     res.sendFile(outputPath);
//     // res.send(req.file.buffer);
//     // res.json({ downloadLink: uniqueFilename });
//   })
//   .on('error', (err) => {
//     console.error('转码出错:', err);
//     res.status(500).send('[Ffmpeg]转码出错了');
//   })
//   .run();

// });

// // 启动服务器
// app.listen(port, () => {
//     console.log(`服务器已启动，监听端口 ${port}`);
// });

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const morgan = require('morgan');
const app = express();
const cors = require('cors');
const multer = require('multer');
// 配置 multer 中间件，用于处理文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // 指定上传文件的目录
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) 
  }
});
const upload = multer({ storage: storage });

const port = 30001; 

// 配置 body-parser 中间件，用于解析请求体中的 JSON 数据
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors()); 

// 处理 POST 请求
app.post('/convert', upload.single('file'), (req, res) => {
  const uploadedFile = req.file; 
  console.log(uploadedFile, '[uploadedFile]');

  if (!uploadedFile) {
    return res.status(400).json({ message: '没有上传文件' });
  }

  // 创建一个唯一的输出文件名，这里使用当前时间戳
  const uniqueFilename = 'output_' + Date.now() + '.mp4';

  // 创建输出文件的完整路径
  const outputPath = path.join(__dirname, uniqueFilename);
  console.log(ffmpeg);
  // 使用 fluent-ffmpeg 进行转码
  ffmpeg()
  .input(path.join(__dirname, 'uploads', uploadedFile.originalname)) // 使用文件路径作为输入
  .output(outputPath)
  .outputFormat('mp4')
  .on('end', () => {
    console.log('转码完成');
    res.setHeader('Content-Type', 'video/mp4');
    res.sendFile(outputPath); 
  })
  .on('error', (err) => {
    console.error('转码出错:', err);
    res.status(500).send('[Ffmpeg]转码出错了');
  })
  .run();

});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器已启动，监听端口 ${port}`);
});
