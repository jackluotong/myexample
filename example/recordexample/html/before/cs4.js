let mediaRecorder = null;
let videoElement=document.getElementsByTagName('video')[0];
function createMediaRecorder(stream) {
  const options = { mimeType: 'video/webm' };
  mediaRecorder = new MediaRecorder(stream, options);
  
  // 创建一个存储录制数据的数组
  const recordedChunks = [];

  // 监听dataavailable事件，当有新的数据可用时触发
  mediaRecorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  });

  // 监听stop事件，录制结束时触发
  mediaRecorder.addEventListener('stop', () => {
    // 创建一个Blob对象，将录制的数据存储在其中
    const recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });

    // 设置下载链接的URL
    const downloadUrl = URL.createObjectURL(recordedBlob);

    // 设置下载链接的href和download属性
    downloadLink.href = downloadUrl;
    downloadLink.download = 'recorded_video.webm';

    // 显示下载按钮
    downloadButton.style.display = 'block';
  });
}

videoElement.addEventListener('loadedmetadata', () => {
    // 停止之前的录制
    if (mediaRecorder) {
      mediaRecorder.pause();
    }
  
    // 创建新的MediaRecorder对象，并传入video元素的媒体流
    const mediaStream = videoElement.captureStream();
    createMediaRecorder(mediaStream);
});

function stopRecord(){
  if (mediaRecorder) {
    mediaRecorder.stop();
  }
};
function startRecord(){
    if(mediaRecorder) {
        mediaRecorder.start();
    }
}