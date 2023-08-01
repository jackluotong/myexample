// AVC（H.264）视频编码格式示例

// 假设有一个视频帧的数据
const frameData = [
    // 帧起始码
    0x00, 0x00, 0x00, 0x01,
    // NAL 单元
    0x67, 0x42, 0x80, 0x1F, ... // 帧数据
  ];
  
  // 解析帧数据
  function parseFrameData(data) {
    // 解析帧起始码
    const frameStartCode = [0x00, 0x00, 0x00, 0x01];
    const frameStartIndex = findStartCode(data, frameStartCode);
    const nalUnit = data.slice(frameStartIndex + frameStartCode.length);
  
    // 解析 NAL 单元类型
    const nalUnitType = nalUnit[0] & 0x1F;
  
    // 解析帧数据
    const frameData = nalUnit.slice(1); // 去除 NAL 单元类型字节后的数据
  
    // 返回解析结果
    return {
      nalUnitType,
      frameData,
    };
  }
  
  // 查找起始码位置
  function findStartCode(data, startCode) {
    const startCodeLength = startCode.length;
    const dataLength = data.length;
  
    for (let i = 0; i < dataLength - startCodeLength; i++) {
      let match = true;
      for (let j = 0; j < startCodeLength; j++) {
        if (data[i + j] !== startCode[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        return i;
      }
    }
  
    return -1; // 未找到起始码
  }
  
  // 解析视频帧数据
  const parsedFrame = parseFrameData(frameData);
  
  // 打印解析结果
  console.log("NAL Unit Type:", parsedFrame.nalUnitType);
  console.log("Frame Data:", parsedFrame.frameData);
  