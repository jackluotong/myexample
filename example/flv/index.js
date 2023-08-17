const videoElement = document.getElementById('video');

// 创建 flv.js 播放器实例
const flvPlayer = flvjs.createPlayer({
  type: 'flv',
  url: 'your_video_url.flv',
});

// 设置帧率，这里假设帧率为 30 FPS
const targetFPS = 30;

// 监听 MediaDataSource 的 onMediaInfo 事件
flvPlayer.on(flvjs.Events.MEDIA_INFO, (e) => {
  if (e.hasAudio) {
    // 如果有音频，可以根据音频信息来处理
  }
  if (e.hasVideo) {
    // 如果有视频，可以根据视频信息来处理
    // 获取视频的帧率信息
    const videoFPS = e.videoMeta.frameRate || targetFPS;
    // 计算时间间隔，用于控制帧率
    const frameInterval = 1000 / videoFPS;
    let lastTimestamp = 0;

    // 监听 flv.js 播放器的 seek 和 update 事件
    flvPlayer.on(flvjs.Events.SEEK, (e) => {
      lastTimestamp = 0;
    });

    flvPlayer.on(flvjs.Events.UPDATE, (e) => {
      // 判断时间间隔是否大于设定的帧率时间间隔，如果是则跳过当前帧
      const currentTimestamp = performance.now();
      if (currentTimestamp - lastTimestamp < frameInterval) {
        return;
      }
      lastTimestamp = currentTimestamp;

      // 播放当前帧
      videoElement.currentTime = e.detail.endOffset / 1000;
    });
  }
});

// 将 flv.js 播放器绑定到 video 元素上
flvPlayer.attachMediaElement(videoElement);
// 加载并播放视频
flvPlayer.load();
flvPlayer.play();
