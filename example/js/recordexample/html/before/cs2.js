// 获取video元素
const videoElement = document.getElementsByTagName('video')[0];

// 创建MediaRecorder对象的函数
function createMediaRecorder() {
  // 创建一个新的MediaRecorder对象，并指定要录制的媒体流和相关选项
  const mediaRecorder = new MediaRecorder(videoElement.captureStream(), { mimeType: 'video/webm' });

  // 创建一个存储录制数据的数组
  let recordedChunks = [];

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

    // 创建一个下载链接
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(recordedBlob);
    downloadLink.download = 'recorded_video.webm';

    // 模拟点击下载链接来保存录制的文件
    downloadLink.click();
  });

  // 返回创建的MediaRecorder对象
  return mediaRecorder;
}

// 创建初始的MediaRecorder对象
let mediaRecorder = createMediaRecorder();

// 监听video元素的src属性改变事件
videoElement.addEventListener('loadedmetadata', () => {
  // 停止之前的录制
  mediaRecorder.stop();

  // 创建新的MediaRecorder对象
  mediaRecorder = createMediaRecorder();

  // 开始新的录制
  mediaRecorder.start();
});

// 开始初始的录制
mediaRecorder.start();

// 监听点击停止按钮的事件
// const stopButton = document.getElementById('stopButton');
// stopButton.addEventListener('click', () => {
//   // 停止录制
//   mediaRecorder.stop();
// });


