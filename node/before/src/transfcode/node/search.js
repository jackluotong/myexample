const { exec } = require('child_process');

exec('ffmpeg -version', (error, stdout, stderr) => {
  if (error) {
    console.error('FFmpeg 未安装:', error);
    return;
  }

  const versionInfo = stdout || stderr;
  if (versionInfo.includes('ffmpeg version')) {
    console.log('已安装 FFmpeg，版本信息：');
    console.log(versionInfo);
  } else {
    console.error('未找到有效的 FFmpeg 安装。');
  }
});
