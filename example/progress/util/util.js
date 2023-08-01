// ebml.util.js
import { Decoder, tools, Reader } from './ebml'

/**
 * @param {Blob} file - File or Blob object.
 * @param {function} callback - Callback function.
 * @example
 * getSeekableBlob(blob or file, callback);
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 */
export function getSeekableBlob(inputBlob, callback) {
    const reader = new Reader()
    const decoder = new Decoder()
    const tool = tools

    const fileReader = new FileReader()
    fileReader.onload = function (e) {
        const ebmlElms = decoder.decode(this.result)
        ebmlElms.forEach(function (element) {
            reader.read(element)
        })
        reader.stop()
        const refinedMetadataBuf = tool.makeMetadataSeekable(
            reader.metadatas,
            reader.duration,
            reader.cues
        )
        const body = this.result.slice(reader.metadataSize)
        const newBlob = new Blob([refinedMetadataBuf, body], {
            type: 'video/webm'
        })

        callback(newBlob)
    }
    fileReader.readAsArrayBuffer(inputBlob)
}

