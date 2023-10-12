// 解析 FLV 文件
function parseFLVFile(file) {
    const reader = new FileReader();
  
    reader.onload = function (event) {
      const buffer = event.target.result;
      const dataView = new DataView(buffer);
  
      // 解析文件头
      const fileType = parseFileType(dataView);
      const headerSize = parseHeaderSize(dataView);
  
      // 解析 FLV 标签
      const tags = parseTags(dataView, headerSize);
  
      // 提取音视频数据
      const videoData = extractVideoData(tags);
      const audioData = extractAudioData(tags);
  
      // 打印解析结果
      console.log('File Type:', fileType);
      console.log('Tags:', tags);
      console.log('Video Data:', videoData);
      console.log('Audio Data:', audioData);
    };
  
    reader.readAsArrayBuffer(file);
  }
  
  // 解析文件类型
  function parseFileType(dataView) {
    const signature = String.fromCharCode(dataView.getUint8(0));
    const version = dataView.getUint8(3);
  
    return `${signature}${version}`;
  }
  
  // 解析头部大小
  function parseHeaderSize(dataView) {
    const headerSize = dataView.getUint32(5);
    return headerSize;
  }
  
  // 解析 FLV 标签
  function parseTags(dataView, offset) {
    const tags = [];
  
    while (offset < dataView.byteLength) {
      const tagType = dataView.getUint8(offset);
      const dataSize = parseDataSize(dataView, offset + 1);
      const timestamp = parseTimestamp(dataView, offset + 4);
      const tagData = new Uint8Array(dataView.buffer, offset + 11, dataSize);
      const tag = {
        type: tagType,
        size: dataSize,
        timestamp: timestamp,
        data: tagData,
      };
  
      tags.push(tag);
  
      offset += dataSize + 11;
    }
  
    return tags;
  }
  
  // 解析数据大小
  function parseDataSize(dataView, offset) {
    const sizeBytes = new Uint8Array(dataView.buffer, offset, 3);
    const size = sizeBytes.reduce((result, byte) => (result << 8) | byte, 0);
  
    return size;
  }
  
  // 解析时间戳
  function parseTimestamp(dataView, offset) {
    const timestampBytes = new Uint8Array(dataView.buffer, offset, 4);
    const timestamp = timestampBytes.reduce((result, byte) => (result << 8) | byte, 0);
  
    return timestamp;
  }
  
  // 提取视频数据
  function extractVideoData(tags) {
    const videoTags = tags.filter((tag) => tag.type === 9);
    const videoData = videoTags.map((tag) => tag.data);
  
    return videoData;
  }
  
  // 提取音频数据
  function extractAudioData(tags) {
    const audioTags = tags.filter((tag) => tag.type === 8);
    const audioData = audioTags.map((tag) => tag.data);
  
    return audioData;
  }
  
  // 使用示例
  const flvFile = /* 获取到的 FLV 文件 */;
  parseFLVFile(flvFile);
  