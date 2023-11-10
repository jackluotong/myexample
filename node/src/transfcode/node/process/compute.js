// const { spawn } = require('child_process');
// const ffmpeg = require('fluent-ffmpeg');

// const inputFilePath = './test.mkv';

// const outputFilePath = 'output.mp4';

// const command = ffmpeg(inputFilePath)
//   .videoCodec('libx264')
//   .audioCodec('aac')
//   .size('640x480')
//   .on('end', () => {
//     console.log('转码完成');
//   })
//   .on('error', (err) => {
//     console.error('转码出错:', err);
//   });
// const ffmpegProcess = spawn(command.bin, command.ffmpegArguments);

// ffmpegProcess.stdout.pipe(process.stdout);
// ffmpegProcess.stderr.pipe(process.stderr);

// ffmpegProcess.on('close', (code) => {
//   if (code === 0) {
//     console.log('子进程正常退出');
//   } else {
//     console.error('子进程退出错误码:', code);
//   }
// });
const http = require('http');	
const longComputation = () => {	
  let sum = 0;	
  for (let i = 0; i < 1e10; i++) {	
    sum += i;	
  };	
  return sum;	
};	
const server = http.createServer();	
server.on('request', (req, res) => {	
  if (req.url === '/compute') {	
    console.info('计算开始',new Date());	
    const sum = longComputation();	
    console.info('计算结束',new Date());	
    return res.end(`Sum is ${sum}`);	
  } else {	
    res.end('Ok')	
  }	
});	
server.listen(3100);	
