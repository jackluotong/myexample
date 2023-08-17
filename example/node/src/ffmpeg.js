const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const morgan = require('morgan');
const app = express();
const cors = require('cors');
const port = 30001; // 设置您希望监听的端口号

// 配置 body-parser 中间件，用于解析请求体中的 JSON 数据
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors()); 
// 处理 POST 请求
app.post('/convert', (req, res) => {
  // 这里假设前端传入的流是通过 Express.js 的 req 对象传递过来的
    const inputStream = req.body.file; // 假设请求体中包含名为 "file" 的文件流
    console.log( req.body,'[inputStream]')
    if(!inputStream) return;
  // 为了确保安全性，可以为每个上传的文件生成一个唯一的文件名
  const uniqueFilename = 'output_' + Date.now() + '.mp4';

  // 指定输出文件路径
  const outputPath = path.join(__dirname, uniqueFilename);

  // 使用 fluent-ffmpeg 进行转码
  ffmpeg()
    .input(inputStream)
    .inputFormat('matroska') // 输入流的格式，这里是 MKV
    .output(outputPath)
    .outputFormat('mp4') // 输出文件的格式，这里是 MP4
    .on('end', () => {
      console.log('转码完成');
      // 发送下载链接给前端
      res.json({ downloadLink: uniqueFilename });
    })
    .on('error', (err) => {
      console.error('转码出错:', err);
      res.status(500).send('转码出错');
    })
    .run();
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器已启动，监听端口 ${port}`);
});
