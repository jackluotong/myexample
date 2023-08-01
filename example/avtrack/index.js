// 获取视频元素和画布
const videoElement = document.getElementById('videoElement');
const canvasElement = document.getElementById('canvasElement');

// 在画布上绘制视频
const canvasContext = canvasElement.getContext('2d');
canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

// 获取视频流和音频源
const videoStream = videoElement.captureStream();
const audioSource = videoElement.captureStream().getAudioTracks()[0];

// 创建音频上下文和节点
const audioContext = new AudioContext();
const audioDestination = audioContext.createMediaStreamDestination();
const audioDestinationStream = audioDestination.stream;

// 将音频源连接到音频目标
const audioSourceNode = audioContext.createMediaStreamSource(audioSource);
audioSourceNode.connect(audioDestination);

// 合并视频流和音频流
const mergedStream = new MediaStream([...videoStream.getVideoTracks(), ...audioDestinationStream.getAudioTracks()]);

// 创建 MediaRecorder
const mediaRecorder = new MediaRecorder(mergedStream);



