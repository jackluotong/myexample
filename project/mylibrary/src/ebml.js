import { tools, Reader } from 'ts-ebml';
 
import LargeFileDecorder from './decoder';
 
 
 
// fix-webm-metainfo 早期的实现过程
 
async function fixWebmMetaInfo(blob) {
 
  // 解决ts-ebml不支持大于2GB视频文件的问题
 
  const decoder = new LargeFileDecorder();
 
  const reader = new Reader();
 
  reader.logging = false;
 
 
 
  const bufSlices = [];
 
  // 由于Uint8Array或者ArrayBuffer支持的最大长度为2046 * 1024 * 1024
 
  const sliceLength = 1 * 1024 * 1024 * 1024;
 
  for (let i = 0; i < blob.size; i = i + sliceLength) {
 
    // 切割Blob，并读取ArrayBuffer
 
    const bufSlice = await blob.slice(i, Math.min(i + sliceLength, blob.size)).arrayBuffer();
 
    bufSlices.push(bufSlice);
 
  }
 
 
 
  // 解析ArrayBuffer到可阅读与修改的EBML Element类型，并使用reader读取以计算Duration和Cues
 
  decoder.decode(bufSlices).forEach(elm => reader.read(elm));
 
 
 
  // 当全部读取结束后，结束reader
 
  reader.stop();
 
 
 
  // 利用reader生成好的cues与duration，重建meta头，并转换回arrayBuffer
 
  const refinedMetadataBuf = tools.makeMetadataSeekable(reader.metadatas, reader.duration, reader.cues);
 
 
 
  const firstPartSlice = bufSlices.shift() ;
 
  const firstPartSliceWithoutMetadata = firstPartSlice.slice(reader.metadataSize);
 
 
 
  // 重建回Blob
 
  return new Blob([refinedMetadataBuf, firstPartSliceWithoutMetadata, ...bufSlices], { type: blob.type });
 
}