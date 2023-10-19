let express = require('express') 
let app = express() 
let ffmpeg = require('fluent-ffmpeg') 

let command = ffmpeg('./test.mp4')
  .on('start', function(commandLine) {
    console.log('Spawned Ffmpeg with command: ' + commandLine);
  }).on('progress', function(progress) {
    console.log('Processing: ' + progress.percent + '% done');
  }).on('end', function(stdout, stderr) {
    console.log('Transcoding succeeded !');
  }).on('error', function(err) {
    console.log('An error occurred: ' + err.message);
  }).save('test.avi')
