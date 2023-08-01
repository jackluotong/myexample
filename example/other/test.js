let mediaRecorder = null;
let mediaStream = null;
let buffer;

// 创建 MutationObserver 实例
const observer = new MutationObserver(function(mutationsList) {
  for (let mutation of mutationsList) {
    // 检查新添加的节点
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach(function(node) {
        if (node instanceof HTMLVideoElement) {
        //   handleVideoCreation(node);
        console.log('add new video element')
        }
      });
    }
    
    // 检查被移除的节点
    if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
      mutation.removedNodes.forEach(function(node) {
        if (node instanceof HTMLVideoElement) {
        //   handleVideoDestruction(node);
        console.log('delete old video element')
        }
      });
    }
  }
});

// 配置 MutationObserver 监听的选项
const observerConfig = { childList: true };

// 监听某个容器节点的变化
observer.observe(document.getElementsByTagName('video')[0], observerConfig);

function handleVideoCreation(videoElement) {
  // 在新创建的 video 元素加载完成后开始录制
  videoElement.addEventListener('loadedmetadata', startRecording(videoElement));
}

function handleVideoDestruction(videoElement) {
  // 停止录制和释放资源
  stopRecording();
  releaseResources();
}

function startRecording(videoElement) {
  // 获取 video 元素的当前流
  mediaStream = videoElement.captureStream();

  // 创建新的 MediaRecorder 对象
  mediaRecorder = new MediaRecorder(mediaStream);

  // 监听 dataavailable 事件
  mediaRecorder.addEventListener('dataavailable', handleDataAvailable);

  // 开始录制
  mediaRecorder.start();
}

function stopRecording() {
  // 停止录制
  if (mediaRecorder) {
    mediaRecorder.stop();
    mediaRecorder.removeEventListener('dataavailable', handleDataAvailable);
    mediaRecorder = null;
  }
}

function handleDataAvailable(event) {
  buffer.push(event.data)

  // 在这里可以将 recordedData 存储到文件或进行其他操作
}
function save(){
    var blob =new Blob(buffer,{type:'video/mp4'});
    var url=window.URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;
    a.style.display='none';
    a.download= `record.mp4`
    a.click()
}
function releaseResources() {
  // 释放资源，如停止视频流等
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
}
