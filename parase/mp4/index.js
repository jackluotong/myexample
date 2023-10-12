// 解析 MP4 文件
function parseMP4File(file) {
    const reader = new FileReader();
    const blob = new Blob([file])
    reader.onload = function (event) {
      const buffer = event.target.result;
      const dataView = new DataView(buffer);
      // 解析文件头
      const fileType = parseFileType(dataView);
      const moovBox = findBox(dataView, 0, 'moov');
  
      // 解析音视频轨道
      const videoTrack = findTrack(dataView, moovBox.offset, 'video');
      const audioTrack = findTrack(dataView, moovBox.offset, 'audio');
  
      // 提取音视频数据
      const videoSamples = extractSamples(dataView, videoTrack);
      const audioSamples = extractSamples(dataView, audioTrack);
  
      // 打印解析结果
      console.log('File Type:', fileType);
      console.log('MOOV Box:', moovBox);
      console.log('Video Track:', videoTrack);
      console.log('Audio Track:', audioTrack);
      console.log('Video Samples:', videoSamples);
      console.log('Audio Samples:', audioSamples);
    };
    reader.readAsArrayBuffer(file);
  }
  
  // 解析文件类型
  function parseFileType(dataView) {
    const fileTypeBox = findBox(dataView, 0, 'ftyp');
    const majorBrand = getBoxValue(dataView, fileTypeBox.offset + 8, 4);
  
    return majorBrand;
  }
  
  // 查找指定类型的 Box
  function findBox(dataView, offset, type) {
    while (offset < dataView.byteLength) {
      const boxSize = dataView.getUint32(offset);
      const boxType = getBoxType(dataView, offset + 4);
      if (boxType === type) {
        return {
          offset,
          size: boxSize,
          type: boxType,
        };
      }
  
      offset += boxSize;
    }
  
    return null; // 未找到指定类型的 Box
  }
  
  // 获取 Box 类型
  function getBoxType(dataView, offset) {
    const typeBytes = new Uint8Array(dataView.buffer, offset, 4);
    let type = '';
  
    for (let i = 0; i < typeBytes.length; i++) {
      type += String.fromCharCode(typeBytes[i]);
    }
  
    return type;
  }
  
  // 获取 Box 值
  function getBoxValue(dataView, offset, length) {
    let value = '';
  
    for (let i = 0; i < length; i++) {
      value += String.fromCharCode(dataView.getUint8(offset + i));
    }
  
    return value;
  }
  
  // 查找指定类型的音视频轨道
  function findTrack(dataView, offset, type) {
    const trakBoxes = findBoxes(dataView, offset, 'trak');
  
    for (const trakBox of trakBoxes) {
      const mdiaBox = findBox(dataView, trakBox.offset, 'mdia');
      const handlerType = getBoxValue(dataView, mdiaBox.offset + 8, 4);
  
      if (handlerType === type) {
        const minfBox = findBox(dataView, mdiaBox.offset, 'minf');
        const stblBox = findBox(dataView, minfBox.offset, 'stbl');
        const stsdBox = findBox(dataView, stblBox.offset, 'stsd');
  
        return {
          offset: trakBox.offset,
          size: trakBox.size,
          type: trakBox.type,
          handlerType,
          sampleDescription: parseSampleDescription(dataView, stsdBox),
        };
      }
    }
  
    return null; // 未找到指定类型的音视频轨道
  }
  
  // 解析样本描述信息
  function parseSampleDescription(dataView, stsdBox) {
    const entryCount = dataView.getUint32(stsdBox.offset + 8);
    const entryOffset = stsdBox.offset + 12;
  
    let offset = entryOffset;
    const sampleDescriptions = [];
  
    for (let i = 0; i < entryCount; i++) {
      const size = dataView.getUint32(offset);
      const format = getBoxType(dataView, offset + 4);
  
      // 可根据具体的样本描述格式进行解析
      // 这里仅打印格式和大小
      sampleDescriptions.push({
        format,
        size,
      });
  
      offset += size;
    }
  
    return sampleDescriptions;
  }
  
  // 提取音视频样本数据
  function extractSamples(dataView, track) {
    const stblBox = findBox(dataView, track.offset, 'stbl');
    const stszBox = findBox(dataView, stblBox.offset, 'stsz');
    const stcoBox = findBox(dataView, stblBox.offset, 'stco');
    const sampleSize = dataView.getUint32(stszBox.offset + 12);
    const sampleCount = dataView.getUint32(stszBox.offset + 16);
    const chunkOffset = dataView.getUint32(stcoBox.offset + 12);
    const chunkOffsetSize = 4; // 假设 chunk offset 占据 4 字节
  
    const samples = [];
  
    let offset = stszBox.offset + 20; // 第一个样本的偏移量
    let chunkIndex = 0;
  
    for (let i = 0; i < sampleCount; i++) {
      let size = sampleSize;
  
      if (chunkIndex + 1 < stcoBox.size / chunkOffsetSize) {
        const nextChunkOffset = dataView.getUint32(stcoBox.offset + 16 + chunkIndex * chunkOffsetSize);
        size = nextChunkOffset - chunkOffset;
      }
  
      samples.push({
        offset,
        size,
      });
  
      offset += size;
      chunkIndex++;
    }
  
    return samples;
  }
  
  // 使用示例
  