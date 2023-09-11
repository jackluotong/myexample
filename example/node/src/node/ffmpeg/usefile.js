
/**
 * using file 
 */
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const morgan = require('morgan');
const app = express();
const cors = require('cors');
const multer = require('multer');
ffmpeg.setFfmpegPath('./ffmpeg.exe');
const log4js = require('log4js');

log4js.configure({
  appenders: {
    file: { type: 'file', filename: path.join(__dirname, 'dist','myLogs', 'app.log') }, 
    console: { type: 'console' }, 
  },
  categories: { default: { appenders: ['file', 'console'], level: 'info' } },
});

const logger = log4js.getLogger();


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') 
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
    logger.error('没有上传文件');
    return res.status(400).json({ message: '没有上传文件' });
  }

  // 创建一个唯一的输出文件名，这里使用当前时间戳
  const uniqueFilename = 'output_' + Date.now() + '.mp4';

  // 创建输出文件的完整路径
  const outputPath = path.join(__dirname, uniqueFilename);
  ffmpeg()
  .input(path.join(__dirname,'uploads', uploadedFile.originalname)) 
  .output(outputPath)
  .outputFormat('mp4')
  .on('end', () => {
    logger.info('转码完成');
    res.setHeader('Content-Type', 'video/mp4');
    res.sendFile(outputPath); 

    setTimeout(()=>{
      fs.unlink(outputPath, (err) => {
        if (err) {
          logger.error('删除文件失败', err);
        } else {
          logger.info('文件已删除');
        }
      });
      if (uploadedFile.buffer) {
        logger.info('上传文件已删除');
        uploadedFile.buffer = null;
      }
    },1000);
   
  })
  .on('error', (err) => {
    logger.error('转码出错',err);
    res.status(500).send('[Ffmpeg]转码出错了');
  })
  .run();

});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器已启动，监听端口 ${port}`);
    console.log(path.join(__dirname));
});




