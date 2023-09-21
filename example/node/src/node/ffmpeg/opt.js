const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const morgan = require('morgan');
const app = express();
const cors = require('cors');
const multer = require('multer');
// const ffmpegPath = require('ffmpeg-static'); // 使用 ffmpeg-static 模块获取 ffmpeg 路径
const log4js = require('log4js');
ffmpeg.setFfmpegPath('./ffmpeg.exe');
log4js.configure({
  appenders: {
    file: { type: 'file', filename: path.join(__dirname, 'myLogs', 'app.log') },
    console: { type: 'console' },
  },
  categories: { default: { appenders: ['file', 'console'], level: 'info' } },
});

const logger = log4js.getLogger();
const net = require('net');
const http = require('http');
const portfinder = require('portfinder');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, World!\n');
});

portfinder.getPortPromise()
  .then((port) => {
    server.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    logger.error(`Error: ${err}`);
  });

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer().listen(port);

    server.on('listening', () => {
      server.close();
      resolve(false);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        throw err;
      }
    });
  });
}

isPortInUse(8080).then((inUse) => {
  if (inUse) {
    logger.info('端口 8080 已被占用');
  } else {
    logger.info('端口 8080 未被占用');
  }
});


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

const port = 30002;

app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors());

app.post('/convert', upload.single('file'), async (req, res) => {
  try {
    const uploadedFile = req.file;
    console.log(uploadedFile, '[uploadedFile]');

    if (!uploadedFile) {
      logger.error('没有上传文件');
      return res.status(400).json({ message: '没有上传文件' });
    }

    const uniqueFilename = 'output_' + Date.now() + '.mp4';

    const outputPath = path.join(__dirname, uniqueFilename);

    await new Promise((resolve, reject) => {
      ffmpeg()
        // .setFfmpegPath(ffmpegPath)
        .input(path.join(__dirname, 'uploads', uploadedFile.originalname))
        .output(outputPath)
        .outputFormat('mp4')
        .on('end', () => {
          logger.info('转码完成');
          resolve();
        })
        .on('error', (err) => {
          logger.error('转码出错', err);
          reject(err);
        })
        .run();
    });
    logger.info("outputPath: " + outputPath,uploadedFile);
    res.setHeader('Content-Type', 'video/mp4');
    res.sendFile(outputPath);

    await Promise.race([
      fs.promises.unlink(outputPath),
      fs.promises.unlink(uploadedFile.path),
    ]);

    logger.info('文件已删除');
    logger.info('源文件已删除');

  } catch (error) {
    logger.error('处理请求出错', error);
    res.status(500).send('[Ffmpeg]处理请求出错了');
  }
});

app.listen(port, () => {
  logger.info(`服务器已启动，监听端口 ${port}`);
  logger.info(path.join(__dirname));
});
