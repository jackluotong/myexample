//EBML.js

(function (f) { if (typeof exports === "object" && typeof module !== "undefined") { module.exports = f() } else if (typeof define === "function" && define.amd) { define([], f) } else { var g; if (typeof window !== "undefined") { g = window } else if (typeof global !== "undefined") { g = global } else if (typeof self !== "undefined") { g = self } else { g = this } g.EBML = f() } })(function () {
  var define, module, exports; return (function () { function r(e, n, t) { function o(i, f) { if (!n[i]) { if (!e[i]) { var c = "function" == typeof require && require; if (!f && c) return c(i, !0); if (u) return u(i, !0); var a = new Error("Cannot find module '" + i + "'"); throw a.code = "MODULE_NOT_FOUND", a } var p = n[i] = { exports: {} }; e[i][0].call(p.exports, function (r) { var n = e[i][1][r]; return o(n || r) }, p, p.exports, r, e, n, t) } return n[i].exports } for (var u = "function" == typeof require && require, i = 0; i < t.length; i++)o(t[i]); return o } return r })()({
      1: [function (require, module, exports) {
          "use strict";
          Object.defineProperty(exports, "__esModule", { value: true });
          var tools_1 = require("./tools");
          var int64_buffer_1 = require("int64-buffer");
          var tools = require("./tools");
          var schema = require("matroska/lib/schema");
          var byEbmlID = schema.byEbmlID;
          // https://www.matroska.org/technical/specs/index.html
          var State;
          (function (State) {
              State[State["STATE_TAG"] = 1] = "STATE_TAG";
              State[State["STATE_SIZE"] = 2] = "STATE_SIZE";
              State[State["STATE_CONTENT"] = 3] = "STATE_CONTENT";
          })(State || (State = {}));
          var EBMLDecoder = /** @class */ (function () {
              function EBMLDecoder() {
                  this._buffer = new tools_1.Buffer(0);
                  this._tag_stack = [];
                  this._state = State.STATE_TAG;
                  this._cursor = 0;
                  this._total = 0;
                  this._schema = byEbmlID;
                  this._result = [];
              }
              EBMLDecoder.prototype.decode = function (chunk) {
                  this.readChunk(chunk);
                  var diff = this._result;
                  this._result = [];
                  return diff;
              };
              EBMLDecoder.prototype.readChunk = function (chunk) {
                  // 読みかけの(読めなかった) this._buffer と 新しい chunk を合わせて読み直す
                  this._buffer = tools.concat([this._buffer, new tools_1.Buffer(chunk)]);
                  while (this._cursor < this._buffer.length) {
                      // console.log(this._cursor, this._total, this._tag_stack);
                      if (this._state === State.STATE_TAG && !this.readTag()) {
                          break;
                      }
                      if (this._state === State.STATE_SIZE && !this.readSize()) {
                          break;
                      }
                      if (this._state === State.STATE_CONTENT && !this.readContent()) {
                          break;
                      }
                  }
              };
              EBMLDecoder.prototype.getSchemaInfo = function (tagNum) {
                  return this._schema[tagNum] || {
                      name: "unknown",
                      level: -1,
                      type: "unknown",
                      description: "unknown"
                  };
              };
              /**
               * vint された parsing tag
               * @return - return false when waiting for more data
               */
              EBMLDecoder.prototype.readTag = function () {
                  // tag.length が buffer の外にある
                  if (this._cursor >= this._buffer.length) {
                      return false;
                  }
                  // read ebml id vint without first byte
                  var tag = tools_1.readVint(this._buffer, this._cursor);
                  // tag が読めなかった
                  if (tag == null) {
                      return false;
                  }
                  // >>>>>>>>>
                  // tag 識別子
                  //const tagStr = this._buffer.toString("hex", this._cursor, this._cursor + tag.length);
                  //const tagNum = parseInt(tagStr, 16);
                  // 上と等価
                  var buf = this._buffer.slice(this._cursor, this._cursor + tag.length);
                  var tagNum = buf.reduce(function (o, v, i, arr) { return o + v * Math.pow(16, 2 * (arr.length - 1 - i)); }, 0);
                  var schema = this.getSchemaInfo(tagNum);
                  var tagObj = {
                      EBML_ID: tagNum.toString(16),
                      schema: schema,
                      type: schema.type,
                      name: schema.name,
                      level: schema.level,
                      tagStart: this._total,
                      tagEnd: this._total + tag.length,
                      sizeStart: this._total + tag.length,
                      sizeEnd: null,
                      dataStart: null,
                      dataEnd: null,
                      dataSize: null,
                      data: null
                  };
                  // | tag: vint | size: vint | data: Buffer(size) |
                  this._tag_stack.push(tagObj);
                  // <<<<<<<<
                  // ポインタを進める
                  this._cursor += tag.length;
                  this._total += tag.length;
                  // 読み込み状態変更
                  this._state = State.STATE_SIZE;
                  return true;
              };
              /**
               * vint された現在のタグの内容の大きさを読み込む
               * @return - return false when waiting for more data
               */
              EBMLDecoder.prototype.readSize = function () {
                  // tag.length が buffer の外にある
                  if (this._cursor >= this._buffer.length) {
                      return false;
                  }
                  // read ebml datasize vint without first byte
                  var size = tools_1.readVint(this._buffer, this._cursor);
                  // まだ読めない
                  if (size == null) {
                      return false;
                  }
                  // >>>>>>>>>
                  // current tag の data size 決定
                  var tagObj = this._tag_stack[this._tag_stack.length - 1];
                  tagObj.sizeEnd = tagObj.sizeStart + size.length;
                  tagObj.dataStart = tagObj.sizeEnd;
                  tagObj.dataSize = size.value;
                  if (size.value === -1) {
                      // unknown size
                      tagObj.dataEnd = -1;
                      if (tagObj.type === "m") {
                          tagObj.unknownSize = true;
                      }
                  }
                  else {
                      tagObj.dataEnd = tagObj.sizeEnd + size.value;
                  }
                  // <<<<<<<<
                  // ポインタを進める
                  this._cursor += size.length;
                  this._total += size.length;
                  this._state = State.STATE_CONTENT;
                  return true;
              };
              /**
               * データ読み込み
               */
              EBMLDecoder.prototype.readContent = function () {
                  var tagObj = this._tag_stack[this._tag_stack.length - 1];
                  // master element は子要素を持つので生データはない
                  if (tagObj.type === 'm') {
                      // console.log('content should be tags');
                      tagObj.isEnd = false;
                      this._result.push(tagObj);
                      this._state = State.STATE_TAG;
                      // この Mastert Element は空要素か
                      if (tagObj.dataSize === 0) {
                          // 即座に終了タグを追加
                          var elm = Object.assign({}, tagObj, { isEnd: true });
                          this._result.push(elm);
                          this._tag_stack.pop(); // スタックからこのタグを捨てる
                      }
                      return true;
                  }
                  // waiting for more data
                  if (this._buffer.length < this._cursor + tagObj.dataSize) {
                      return false;
                  }
                  // タグの中身の生データ
                  var data = this._buffer.slice(this._cursor, this._cursor + tagObj.dataSize);
                  // 読み終わったバッファを捨てて読み込んでいる部分のバッファのみ残す
                  this._buffer = this._buffer.slice(this._cursor + tagObj.dataSize);
                  tagObj.data = data;
                  // >>>>>>>>>
                  switch (tagObj.type) {
                      //case "m": break;
                      // Master-Element - contains other EBML sub-elements of the next lower level
                      case "u":
                          tagObj.value = data.readUIntBE(0, data.length);
                          break;
                      // Unsigned Integer - Big-endian, any size from 1 to 8 octets
                      case "i":
                          tagObj.value = data.readIntBE(0, data.length);
                          break;
                      // Signed Integer - Big-endian, any size from 1 to 8 octets
                      case "f":
                          tagObj.value = tagObj.dataSize === 4 ? data.readFloatBE(0) :
                              tagObj.dataSize === 8 ? data.readDoubleBE(0) :
                                  (console.warn("cannot read " + tagObj.dataSize + " octets float. failback to 0"), 0);
                          break;
                      // Float - Big-endian, defined for 4 and 8 octets (32, 64 bits)
                      case "s":
                          tagObj.value = data.toString("ascii");
                          break; // ascii
                      //  Printable ASCII (0x20 to 0x7E), zero-padded when needed
                      case "8":
                          tagObj.value = data.toString("utf8");
                          break;
                      //  Unicode string, zero padded when needed (RFC 2279)
                      case "b":
                          tagObj.value = data;
                          break;
                      // Binary - not interpreted by the parser
                      case "d":
                          tagObj.value = tools_1.convertEBMLDateToJSDate(new int64_buffer_1.Int64BE(data).toNumber());
                          break;
                      // nano second; Date.UTC(2001,1,1,0,0,0,0) === 980985600000
                      // Date - signed 8 octets integer in nanoseconds with 0 indicating 
                      // the precise beginning of the millennium (at 2001-01-01T00:00:00,000000000 UTC)
                  }
                  if (tagObj.value === null) {
                      throw new Error("unknown tag type:" + tagObj.type);
                  }
                  this._result.push(tagObj);
                  // <<<<<<<<
                  // ポインタを進める
                  this._total += tagObj.dataSize;
                  // タグ待ちモードに変更
                  this._state = State.STATE_TAG;
                  this._cursor = 0;
                  this._tag_stack.pop(); // remove the object from the stack
                  while (this._tag_stack.length > 0) {
                      var topEle = this._tag_stack[this._tag_stack.length - 1];
                      // 親が不定長サイズなので閉じタグは期待できない
                      if (topEle.dataEnd < 0) {
                          this._tag_stack.pop(); // 親タグを捨てる
                          return true;
                      }
                      // 閉じタグの来るべき場所まで来たかどうか
                      if (this._total < topEle.dataEnd) {
                          break;
                      }
                      // 閉じタグを挿入すべきタイミングが来た
                      if (topEle.type !== "m") {
                          throw new Error("parent element is not master element");
                      }
                      var elm = Object.assign({}, topEle, { isEnd: true });
                      this._result.push(elm);
                      this._tag_stack.pop();
                  }
                  return true;
              };
              return EBMLDecoder;
          }());
          exports.default = EBMLDecoder;

      }, { "./tools": 5, "int64-buffer": 15, "matroska/lib/schema": 17 }], 2: [function (require, module, exports) {
          "use strict";
          Object.defineProperty(exports, "__esModule", { value: true });
          var tools = require("./tools");
          var tools_1 = require("./tools");
          var schema = require("matroska/lib/schema");
          var byEbmlID = schema.byEbmlID;
          var EBMLEncoder = /** @class */ (function () {
              function EBMLEncoder() {
                  this._schema = byEbmlID;
                  this._buffers = [];
                  this._stack = [];
              }
              EBMLEncoder.prototype.encode = function (elms) {
                  var _this = this;
                  return tools.concat(elms.reduce(function (lst, elm) {
                      return lst.concat(_this.encodeChunk(elm));
                  }, [])).buffer;
              };
              EBMLEncoder.prototype.encodeChunk = function (elm) {
                  if (elm.type === "m") {
                      if (!elm.isEnd) {
                          this.startTag(elm);
                      }
                      else {
                          this.endTag(elm);
                      }
                  }
                  else {
                      this.writeTag(elm);
                  }
                  return this.flush();
              };
              EBMLEncoder.prototype.flush = function () {
                  var ret = this._buffers;
                  this._buffers = [];
                  return ret;
              };
              EBMLEncoder.prototype.getSchemaInfo = function (tagName) {
                  var tagNums = Object.keys(this._schema).map(Number);
                  for (var i = 0; i < tagNums.length; i++) {
                      var tagNum = tagNums[i];
                      if (this._schema[tagNum].name === tagName) {
                          return new tools_1.Buffer(tagNum.toString(16), 'hex');
                      }
                  }
                  return null;
              };
              EBMLEncoder.prototype.writeTag = function (elm) {
                  var tagName = elm.name;
                  var tagId = this.getSchemaInfo(tagName);
                  var tagData = elm.data;
                  if (tagId == null) {
                      throw new Error('No schema entry found for ' + tagName);
                  }
                  var data = tools.encodeTag(tagId, tagData);
                  /**
                   * 親要素が閉じタグあり(isEnd)なら閉じタグが来るまで待つ(children queに入る)
                   */
                  if (this._stack.length > 0) {
                      var last = this._stack[this._stack.length - 1];
                      last.children.push({
                          tagId: tagId,
                          elm: elm,
                          children: [],
                          data: data
                      });
                      return;
                  }
                  this._buffers = this._buffers.concat(data);
                  return;
              };
              EBMLEncoder.prototype.startTag = function (elm) {
                  var tagName = elm.name;
                  var tagId = this.getSchemaInfo(tagName);
                  if (tagId == null) {
                      throw new Error('No schema entry found for ' + tagName);
                  }
                  /**
                   * 閉じタグ不定長の場合はスタックに積まずに即時バッファに書き込む
                   */
                  if (elm.unknownSize) {
                      var data = tools.encodeTag(tagId, new tools_1.Buffer(0), elm.unknownSize);
                      this._buffers = this._buffers.concat(data);
                      return;
                  }
                  var tag = {
                      tagId: tagId,
                      elm: elm,
                      children: [],
                      data: null
                  };
                  if (this._stack.length > 0) {
                      this._stack[this._stack.length - 1].children.push(tag);
                  }
                  this._stack.push(tag);
              };
              EBMLEncoder.prototype.endTag = function (elm) {
                  var tagName = elm.name;
                  var tag = this._stack.pop();
                  if (tag == null) {
                      throw new Error("EBML structure is broken");
                  }
                  if (tag.elm.name !== elm.name) {
                      throw new Error("EBML structure is broken");
                  }
                  var childTagDataBuffers = tag.children.reduce(function (lst, child) {
                      if (child.data === null) {
                          throw new Error("EBML structure is broken");
                      }
                      return lst.concat(child.data);
                  }, []);
                  var childTagDataBuffer = tools.concat(childTagDataBuffers);
                  if (tag.elm.type === "m") {
                      tag.data = tools.encodeTag(tag.tagId, childTagDataBuffer, tag.elm.unknownSize);
                  }
                  else {
                      tag.data = tools.encodeTag(tag.tagId, childTagDataBuffer);
                  }
                  if (this._stack.length < 1) {
                      this._buffers = this._buffers.concat(tag.data);
                  }
              };
              return EBMLEncoder;
          }());
          exports.default = EBMLEncoder;

      }, { "./tools": 5, "matroska/lib/schema": 17 }], 3: [function (require, module, exports) {
          "use strict";
          var __extends = (this && this.__extends) || (function () {
              var extendStatics = Object.setPrototypeOf ||
                  ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                  function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
              return function (d, b) {
                  extendStatics(d, b);
                  function __() { this.constructor = d; }
                  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
              };
          })();
          Object.defineProperty(exports, "__esModule", { value: true });
          var events_1 = require("events");
          var tools = require("./tools");
          /**
           * This is an informal code for reference.
           * EBMLReader is a class for getting information to enable seeking Webm recorded by MediaRecorder.
           * So please do not use for regular WebM files.
           */
          var EBMLReader = /** @class */ (function (_super) {
              __extends(EBMLReader, _super);
              function EBMLReader() {
                  var _this = _super.call(this) || this;
                  _this.logGroup = "";
                  _this.hasLoggingStarted = false;
                  _this.metadataloaded = false;
                  _this.chunks = [];
                  _this.stack = [];
                  _this.segmentOffset = 0;
                  _this.last2SimpleBlockVideoTrackTimecode = [0, 0];
                  _this.last2SimpleBlockAudioTrackTimecode = [0, 0];
                  _this.lastClusterTimecode = 0;
                  _this.lastClusterPosition = 0;
                  _this.timecodeScale = 1000000; // webm default TimecodeScale is 1ms
                  _this.metadataSize = 0;
                  _this.metadatas = [];
                  _this.cues = [];
                  _this.firstVideoBlockRead = false;
                  _this.firstAudioBlockRead = false;
                  _this.currentTrack = { TrackNumber: -1, TrackType: -1, DefaultDuration: null, CodecDelay: null };
                  _this.trackTypes = [];
                  _this.trackDefaultDuration = [];
                  _this.trackCodecDelay = [];
                  _this.trackInfo = { type: "nothing" };
                  _this.ended = false;
                  _this.logging = false;
                  _this.use_duration_every_simpleblock = false;
                  _this.use_webp = false;
                  _this.use_segment_info = true;
                  _this.drop_default_duration = true;
                  return _this;
              }
              /**
               * emit final state.
               */
              EBMLReader.prototype.stop = function () {
                  this.ended = true;
                  this.emit_segment_info();
                  // clean up any unclosed Master Elements at the end of the stream.
                  while (this.stack.length) {
                      this.stack.pop();
                      if (this.logging) {
                          console.groupEnd();
                      }
                  }
                  // close main group if set, logging is enabled, and has actually logged anything.
                  if (this.logging && this.hasLoggingStarted && this.logGroup) {
                      console.groupEnd();
                  }
              };
              /**
               * emit chunk info
               */
              EBMLReader.prototype.emit_segment_info = function () {
                  var data = this.chunks;
                  this.chunks = [];
                  if (!this.metadataloaded) {
                      this.metadataloaded = true;
                      this.metadatas = data;
                      var videoTrackNum = this.trackTypes.indexOf(1); // find first video track
                      var audioTrackNum = this.trackTypes.indexOf(2); // find first audio track
                      this.trackInfo = videoTrackNum >= 0 && audioTrackNum >= 0 ? { type: "both", trackNumber: videoTrackNum }
                          : videoTrackNum >= 0 ? { type: "video", trackNumber: videoTrackNum }
                              : audioTrackNum >= 0 ? { type: "audio", trackNumber: audioTrackNum }
                                  : { type: "nothing" };
                      if (!this.use_segment_info) {
                          return;
                      }
                      this.emit("metadata", { data: data, metadataSize: this.metadataSize });
                  }
                  else {
                      if (!this.use_segment_info) {
                          return;
                      }
                      var timecode = this.lastClusterTimecode;
                      var duration = this.duration;
                      var timecodeScale = this.timecodeScale;
                      this.emit("cluster", { timecode: timecode, data: data });
                      this.emit("duration", { timecodeScale: timecodeScale, duration: duration });
                  }
              };
              EBMLReader.prototype.read = function (elm) {
                  var _this = this;
                  var drop = false;
                  if (this.ended) {
                      // reader is finished
                      return;
                  }
                  if (elm.type === "m") {
                      // 閉じタグの自動挿入
                      if (elm.isEnd) {
                          this.stack.pop();
                      }
                      else {
                          var parent_1 = this.stack[this.stack.length - 1];
                          if (parent_1 != null && parent_1.level >= elm.level) {
                              // 閉じタグなしでレベルが下がったら閉じタグを挿入
                              this.stack.pop();
                              // From http://w3c.github.io/media-source/webm-byte-stream-format.html#webm-media-segments
                              // This fixes logging for webm streams with Cluster of unknown length and no Cluster closing elements.
                              if (this.logging) {
                                  console.groupEnd();
                              }
                              parent_1.dataEnd = elm.dataEnd;
                              parent_1.dataSize = elm.dataEnd - parent_1.dataStart;
                              parent_1.unknownSize = false;
                              var o = Object.assign({}, parent_1, { name: parent_1.name, type: parent_1.type, isEnd: true });
                              this.chunks.push(o);
                          }
                          this.stack.push(elm);
                      }
                  }
                  if (elm.type === "m" && elm.name == "Segment") {
                      if (this.segmentOffset != 0) {
                          console.warn("Multiple segments detected!");
                      }
                      this.segmentOffset = elm.dataStart;
                      this.emit("segment_offset", this.segmentOffset);
                  }
                  else if (elm.type === "b" && elm.name === "SimpleBlock") {
                      var _a = tools.ebmlBlock(elm.data), timecode = _a.timecode, trackNumber = _a.trackNumber, frames_1 = _a.frames;
                      if (this.trackTypes[trackNumber] === 1) { // trackType === 1 => video track
                          if (!this.firstVideoBlockRead) {
                              this.firstVideoBlockRead = true;
                              if (this.trackInfo.type === "both" || this.trackInfo.type === "video") {
                                  var CueTime = this.lastClusterTimecode + timecode;
                                  this.cues.push({ CueTrack: trackNumber, CueClusterPosition: this.lastClusterPosition, CueTime: CueTime });
                                  this.emit("cue_info", { CueTrack: trackNumber, CueClusterPosition: this.lastClusterPosition, CueTime: this.lastClusterTimecode });
                                  this.emit("cue", { CueTrack: trackNumber, CueClusterPosition: this.lastClusterPosition, CueTime: CueTime });
                              }
                          }
                          this.last2SimpleBlockVideoTrackTimecode = [this.last2SimpleBlockVideoTrackTimecode[1], timecode];
                      }
                      else if (this.trackTypes[trackNumber] === 2) { // trackType === 2 => audio track
                          if (!this.firstAudioBlockRead) {
                              this.firstAudioBlockRead = true;
                              if (this.trackInfo.type === "audio") {
                                  var CueTime = this.lastClusterTimecode + timecode;
                                  this.cues.push({ CueTrack: trackNumber, CueClusterPosition: this.lastClusterPosition, CueTime: CueTime });
                                  this.emit("cue_info", { CueTrack: trackNumber, CueClusterPosition: this.lastClusterPosition, CueTime: this.lastClusterTimecode });
                                  this.emit("cue", { CueTrack: trackNumber, CueClusterPosition: this.lastClusterPosition, CueTime: CueTime });
                              }
                          }
                          this.last2SimpleBlockAudioTrackTimecode = [this.last2SimpleBlockAudioTrackTimecode[1], timecode];
                      }
                      if (this.use_duration_every_simpleblock) {
                          this.emit("duration", { timecodeScale: this.timecodeScale, duration: this.duration });
                      }
                      if (this.use_webp) {
                          frames_1.forEach(function (frame) {
                              var startcode = frame.slice(3, 6).toString("hex");
                              if (startcode !== "9d012a") {
                                  return;
                              }
                              ; // VP8 の場合
                              var webpBuf = tools.VP8BitStreamToRiffWebPBuffer(frame);
                              var webp = new Blob([webpBuf], { type: "image/webp" });
                              var currentTime = _this.duration;
                              _this.emit("webp", { currentTime: currentTime, webp: webp });
                          });
                      }
                  }
                  else if (elm.type === "m" && elm.name === "Cluster" && elm.isEnd === false) {
                      this.firstVideoBlockRead = false;
                      this.firstAudioBlockRead = false;
                      this.emit_segment_info();
                      this.emit("cluster_ptr", elm.tagStart);
                      this.lastClusterPosition = elm.tagStart;
                  }
                  else if (elm.type === "u" && elm.name === "Timecode") {
                      this.lastClusterTimecode = elm.value;
                  }
                  else if (elm.type === "u" && elm.name === "TimecodeScale") {
                      this.timecodeScale = elm.value;
                  }
                  else if (elm.type === "m" && elm.name === "TrackEntry") {
                      if (elm.isEnd) {
                          this.trackTypes[this.currentTrack.TrackNumber] = this.currentTrack.TrackType;
                          this.trackDefaultDuration[this.currentTrack.TrackNumber] = this.currentTrack.DefaultDuration;
                          this.trackCodecDelay[this.currentTrack.TrackNumber] = this.currentTrack.CodecDelay;
                      }
                      else {
                          this.currentTrack = { TrackNumber: -1, TrackType: -1, DefaultDuration: null, CodecDelay: null };
                      }
                  }
                  else if (elm.type === "u" && elm.name === "TrackType") {
                      this.currentTrack.TrackType = elm.value;
                  }
                  else if (elm.type === "u" && elm.name === "TrackNumber") {
                      this.currentTrack.TrackNumber = elm.value;
                  }
                  else if (elm.type === "u" && elm.name === "CodecDelay") {
                      this.currentTrack.CodecDelay = elm.value;
                  }
                  else if (elm.type === "u" && elm.name === "DefaultDuration") {
                      // media source api は DefaultDuration を計算するとバグる。
                      // https://bugs.chromium.org/p/chromium/issues/detail?id=606000#c22
                      // chrome 58 ではこれを回避するために DefaultDuration 要素を抜き取った。
                      // chrome 58 以前でもこのタグを抜き取ることで回避できる
                      if (this.drop_default_duration) {
                          console.warn("DefaultDuration detected!, remove it");
                          drop = true;
                      }
                      else {
                          this.currentTrack.DefaultDuration = elm.value;
                      }
                  }
                  else if (elm.name === "unknown") {
                      console.warn(elm);
                  }
                  if (!this.metadataloaded && elm.dataEnd > 0) {
                      this.metadataSize = elm.dataEnd;
                  }
                  if (!drop) {
                      this.chunks.push(elm);
                  }
                  if (this.logging) {
                      this.put(elm);
                  }
              };
              Object.defineProperty(EBMLReader.prototype, "duration", {
                  /**
                   * DefaultDuration が定義されている場合は最後のフレームのdurationも考慮する
                   * 単位 timecodeScale
                   *
                   * !!! if you need duration with seconds !!!
                   * ```js
                   * const nanosec = reader.duration * reader.timecodeScale;
                   * const sec = nanosec / 1000 / 1000 / 1000;
                   * ```
                   */
                  get: function () {
                      if (this.trackInfo.type === "nothing") {
                          console.warn("no video, no audio track");
                          return 0;
                      }
                      // defaultDuration は 生の nano sec
                      var defaultDuration = 0;
                      // nanoseconds
                      var codecDelay = 0;
                      var lastTimecode = 0;
                      var _defaultDuration = this.trackDefaultDuration[this.trackInfo.trackNumber];
                      if (typeof _defaultDuration === "number") {
                          defaultDuration = _defaultDuration;
                      }
                      else {
                          // https://bugs.chromium.org/p/chromium/issues/detail?id=606000#c22
                          // default duration がないときに使う delta
                          if (this.trackInfo.type === "both") {
                              if (this.last2SimpleBlockAudioTrackTimecode[1] > this.last2SimpleBlockVideoTrackTimecode[1]) {
                                  // audio diff
                                  defaultDuration = (this.last2SimpleBlockAudioTrackTimecode[1] - this.last2SimpleBlockAudioTrackTimecode[0]) * this.timecodeScale;
                                  // audio delay
                                  var delay = this.trackCodecDelay[this.trackTypes.indexOf(2)]; // 2 => audio
                                  if (typeof delay === "number") {
                                      codecDelay = delay;
                                  }
                                  // audio timecode
                                  lastTimecode = this.last2SimpleBlockAudioTrackTimecode[1];
                              }
                              else {
                                  // video diff
                                  defaultDuration = (this.last2SimpleBlockVideoTrackTimecode[1] - this.last2SimpleBlockVideoTrackTimecode[0]) * this.timecodeScale;
                                  // video delay
                                  var delay = this.trackCodecDelay[this.trackTypes.indexOf(1)]; // 1 => video
                                  if (typeof delay === "number") {
                                      codecDelay = delay;
                                  }
                                  // video timecode
                                  lastTimecode = this.last2SimpleBlockVideoTrackTimecode[1];
                              }
                          }
                          else if (this.trackInfo.type === "video") {
                              defaultDuration = (this.last2SimpleBlockVideoTrackTimecode[1] - this.last2SimpleBlockVideoTrackTimecode[0]) * this.timecodeScale;
                              var delay = this.trackCodecDelay[this.trackInfo.trackNumber]; // 2 => audio
                              if (typeof delay === "number") {
                                  codecDelay = delay;
                              }
                              lastTimecode = this.last2SimpleBlockVideoTrackTimecode[1];
                          }
                          else if (this.trackInfo.type === "audio") {
                              defaultDuration = (this.last2SimpleBlockAudioTrackTimecode[1] - this.last2SimpleBlockAudioTrackTimecode[0]) * this.timecodeScale;
                              var delay = this.trackCodecDelay[this.trackInfo.trackNumber]; // 1 => video
                              if (typeof delay === "number") {
                                  codecDelay = delay;
                              }
                              lastTimecode = this.last2SimpleBlockAudioTrackTimecode[1];
                          } // else { not reached }
                      }
                      // convert to timecodescale
                      var duration_nanosec = ((this.lastClusterTimecode + lastTimecode) * this.timecodeScale) + defaultDuration - codecDelay;
                      var duration = duration_nanosec / this.timecodeScale;
                      return Math.floor(duration);
                  },
                  enumerable: true,
                  configurable: true
              });
              EBMLReader.prototype.addListener = function (event, listener) {
                  return _super.prototype.addListener.call(this, event, listener);
              };
              EBMLReader.prototype.put = function (elm) {
                  if (!this.hasLoggingStarted) {
                      this.hasLoggingStarted = true;
                      if (this.logging && this.logGroup) {
                          console.groupCollapsed(this.logGroup);
                      }
                  }
                  if (elm.type === "m") {
                      if (elm.isEnd) {
                          console.groupEnd();
                      }
                      else {
                          console.group(elm.name + ":" + elm.tagStart);
                      }
                  }
                  else if (elm.type === "b") {
                      // for debug
                      //if(elm.name === "SimpleBlock"){
                      //const o = EBML.tools.ebmlBlock(elm.value);
                      //console.log(elm.name, elm.type, o.trackNumber, o.timecode);
                      //}else{
                      console.log(elm.name, elm.type);
                      //}
                  }
                  else {
                      console.log(elm.name, elm.tagStart, elm.type, elm.value);
                  }
              };
              return EBMLReader;
          }(events_1.EventEmitter));
          exports.default = EBMLReader;
          ;
          ;
          ;
          ;

      }, { "./tools": 5, "events": 13 }], 4: [function (require, module, exports) {
          "use strict";
          Object.defineProperty(exports, "__esModule", { value: true });
          var EBMLDecoder_1 = require("./EBMLDecoder");
          exports.Decoder = EBMLDecoder_1.default;
          var EBMLEncoder_1 = require("./EBMLEncoder");
          exports.Encoder = EBMLEncoder_1.default;
          var EBMLReader_1 = require("./EBMLReader");
          exports.Reader = EBMLReader_1.default;
          var tools = require("./tools");
          exports.tools = tools;
          var version = require("../package.json").version;
          exports.version = version;

      }, { "../package.json": 18, "./EBMLDecoder": 1, "./EBMLEncoder": 2, "./EBMLReader": 3, "./tools": 5 }], 5: [function (require, module, exports) {
          "use strict";
          Object.defineProperty(exports, "__esModule", { value: true });
          /// <reference types="node"/>
          var int64_buffer_1 = require("int64-buffer");
          var EBMLEncoder_1 = require("./EBMLEncoder");
          var _Buffer = require("buffer/");
          var _tools = require("ebml/lib/ebml/tools");
          var _block = require("ebml-block");
          exports.Buffer = _Buffer.Buffer;
          exports.readVint = _tools.readVint;
          exports.writeVint = _tools.writeVint;
          exports.ebmlBlock = _block;
          function readBlock(buf) {
              return exports.ebmlBlock(new exports.Buffer(buf));
          }
          exports.readBlock = readBlock;
          /**
            * @param end - if end === false then length is unknown
            */
          function encodeTag(tagId, tagData, unknownSize) {
              if (unknownSize === void 0) { unknownSize = false; }
              return concat([
                  tagId,
                  unknownSize ?
                      new exports.Buffer('01ffffffffffffff', 'hex') :
                      exports.writeVint(tagData.length),
                  tagData
              ]);
          }
          exports.encodeTag = encodeTag;
          /**
           * @return - SimpleBlock to WebP Filter
           */
          function WebPFrameFilter(elms) {
              return WebPBlockFilter(elms).reduce(function (lst, elm) {
                  var o = exports.ebmlBlock(elm.data);
                  return o.frames.reduce(function (lst, frame) {
                      // https://developers.Blob.com/speed/webp/docs/riff_container
                      var webpBuf = VP8BitStreamToRiffWebPBuffer(frame);
                      var webp = new Blob([webpBuf], { type: "image/webp" });
                      return lst.concat(webp);
                  }, lst);
              }, []);
          }
          exports.WebPFrameFilter = WebPFrameFilter;
          /**
           * WebP ファイルにできる SimpleBlock の パスフィルタ
           */
          function WebPBlockFilter(elms) {
              return elms.reduce(function (lst, elm) {
                  if (elm.type !== "b") {
                      return lst;
                  }
                  if (elm.name !== "SimpleBlock") {
                      return lst;
                  }
                  var o = exports.ebmlBlock(elm.data);
                  var hasWebP = o.frames.some(function (frame) {
                      // https://tools.ietf.org/html/rfc6386#section-19.1
                      var startcode = frame.slice(3, 6).toString("hex");
                      return startcode === "9d012a";
                  });
                  if (!hasWebP) {
                      return lst;
                  }
                  return lst.concat(elm);
              }, []);
          }
          exports.WebPBlockFilter = WebPBlockFilter;
          /**
           * @param frame - VP8 BitStream のうち startcode をもつ frame
           * @return - WebP ファイルの ArrayBuffer
           */
          function VP8BitStreamToRiffWebPBuffer(frame) {
              var VP8Chunk = createRIFFChunk("VP8 ", frame);
              var WebPChunk = concat([
                  new exports.Buffer("WEBP", "ascii"),
                  VP8Chunk
              ]);
              return createRIFFChunk("RIFF", WebPChunk);
          }
          exports.VP8BitStreamToRiffWebPBuffer = VP8BitStreamToRiffWebPBuffer;
          /**
           * RIFF データチャンクを作る
           */
          function createRIFFChunk(FourCC, chunk) {
              var chunkSize = new exports.Buffer(4);
              chunkSize.writeUInt32LE(chunk.byteLength, 0);
              return concat([
                  new exports.Buffer(FourCC.substr(0, 4), "ascii"),
                  chunkSize,
                  chunk,
                  new exports.Buffer(chunk.byteLength % 2 === 0 ? 0 : 1) // padding
              ]);
          }
          exports.createRIFFChunk = createRIFFChunk;
          /* Original Metadata
          
           m  0	EBML
           u  1	  EBMLVersion 1
           u  1	  EBMLReadVersion 1
           u  1	  EBMLMaxIDLength 4
           u  1	  EBMLMaxSizeLength 8
           s  1	  DocType webm
           u  1	  DocTypeVersion 4
           u  1	  DocTypeReadVersion 2
           m  0	Segment
           m  1	  Info                                segmentContentStartPos, all CueClusterPositions provided in info.cues will be relative to here and will need adjusted
           u  2	    TimecodeScale 1000000
           8  2	    MuxingApp Chrome
           8  2	    WritingApp Chrome
           m  1	  Tracks                              tracksStartPos
           m  2	    TrackEntry
           u  3	      TrackNumber 1
           u  3	      TrackUID 31790271978391090
           u  3	      TrackType 2
           s  3	      CodecID A_OPUS
           b  3	      CodecPrivate <Buffer 19>
           m  3	      Audio
           f  4	        SamplingFrequency 48000
           u  4	        Channels 1
           m  2	    TrackEntry
           u  3	      TrackNumber 2
           u  3	      TrackUID 24051277436254136
           u  3	      TrackType 1
           s  3	      CodecID V_VP8
           m  3	      Video
           u  4	        PixelWidth 1024
           u  4	        PixelHeight 576
           m  1	  Cluster                             clusterStartPos
           u  2	    Timecode 0
           b  2	    SimpleBlock track:2 timecode:0	keyframe:true	invisible:false	discardable:false	lacing:1
          */
          /* Desired Metadata
          
           m	0 EBML
           u	1   EBMLVersion 1
           u	1   EBMLReadVersion 1
           u	1   EBMLMaxIDLength 4
           u	1   EBMLMaxSizeLength 8
           s	1   DocType webm
           u	1   DocTypeVersion 4
           u	1   DocTypeReadVersion 2
           m	0 Segment
           m	1   SeekHead                            -> This is SeekPosition 0, so all SeekPositions can be calculated as (bytePos - segmentContentStartPos), which is 44 in this case
           m	2     Seek
           b	3       SeekID                          -> Buffer([0x15, 0x49, 0xA9, 0x66])  Info
           u	3       SeekPosition                    -> infoStartPos =
           m	2     Seek
           b	3       SeekID                          -> Buffer([0x16, 0x54, 0xAE, 0x6B])  Tracks
           u	3       SeekPosition { tracksStartPos }
           m	2     Seek
           b	3       SeekID                          -> Buffer([0x1C, 0x53, 0xBB, 0x6B])  Cues
           u	3       SeekPosition { cuesStartPos }
           m	1   Info
           f	2     Duration 32480                    -> overwrite, or insert if it doesn't exist
           u	2     TimecodeScale 1000000
           8	2     MuxingApp Chrome
           8	2     WritingApp Chrome
           m	1   Tracks
           m	2     TrackEntry
           u	3       TrackNumber 1
           u	3       TrackUID 31790271978391090
           u	3       TrackType 2
           s	3       CodecID A_OPUS
           b	3       CodecPrivate <Buffer 19>
           m	3       Audio
           f	4         SamplingFrequency 48000
           u	4         Channels 1
           m	2     TrackEntry
           u	3       TrackNumber 2
           u	3       TrackUID 24051277436254136
           u	3       TrackType 1
           s	3       CodecID V_VP8
           m	3       Video
           u	4         PixelWidth 1024
           u	4         PixelHeight 576
           m  1   Cues                                -> cuesStartPos
           m  2     CuePoint
           u  3       CueTime 0
           m  3       CueTrackPositions
           u  4         CueTrack 1
           u  4         CueClusterPosition 3911
           m  2     CuePoint
           u  3       CueTime 600
           m  3       CueTrackPositions
           u  4         CueTrack 1
           u  4         CueClusterPosition 3911
           m  1   Cluster
           u  2     Timecode 0
           b  2     SimpleBlock track:2 timecode:0	keyframe:true	invisible:false	discardable:false	lacing:1
          */
          /**
           * convert the metadata from a streaming webm bytestream to a seekable file by inserting Duration, Seekhead and Cues
           * @param originalMetadata - orginal metadata (everything before the clusters start) from media recorder
           * @param duration - Duration (TimecodeScale)
           * @param cues - cue points for clusters
           */
          function makeMetadataSeekable(originalMetadata, duration, cuesInfo) {
              // extract the header, we can reuse this as-is
              var header = extractElement("EBML", originalMetadata);
              var headerSize = encodedSizeOfEbml(header);
              //console.error("Header size: " + headerSize);
              //printElementIds(header);
              // After the header comes the Segment open tag, which in this implementation is always 12 bytes (4 byte id, 8 byte 'unknown length')
              // After that the segment content starts. All SeekPositions and CueClusterPosition must be relative to segmentContentStartPos
              var segmentContentStartPos = headerSize + 12;
              //console.error("segmentContentStartPos: " + segmentContentStartPos);    
              // find the original metadata size, and adjust it for header size and Segment start element so we can keep all positions relative to segmentContentStartPos
              var originalMetadataSize = originalMetadata[originalMetadata.length - 1].dataEnd - segmentContentStartPos;
              //console.error("Original Metadata size: " + originalMetadataSize);
              //printElementIds(originalMetadata);
              // extract the segment info, remove the potentially existing Duration element, and add our own one.
              var info = extractElement("Info", originalMetadata);
              removeElement("Duration", info);
              info.splice(1, 0, { name: "Duration", type: "f", data: createFloatBuffer(duration, 8) });
              var infoSize = encodedSizeOfEbml(info);
              //console.error("Info size: " + infoSize);
              //printElementIds(info);  
              // extract the track info, we can re-use this as is
              var tracks = extractElement("Tracks", originalMetadata);
              var tracksSize = encodedSizeOfEbml(tracks);
              //console.error("Tracks size: " + tracksSize);
              //printElementIds(tracks);  
              var seekHeadSize = 47; // Initial best guess, but could be slightly larger if the Cues element is huge.
              var seekHead = [];
              var cuesSize = 5 + cuesInfo.length * 15; // very rough initial approximation, depends a lot on file size and number of CuePoints                   
              var cues = [];
              var lastSizeDifference = -1; // 
              // The size of SeekHead and Cues elements depends on how many bytes the offsets values can be encoded in.
              // The actual offsets in CueClusterPosition depend on the final size of the SeekHead and Cues elements
              // We need to iteratively converge to a stable solution.
              var maxIterations = 10;
              var _loop_1 = function (i) {
                  // SeekHead starts at 0
                  var infoStart = seekHeadSize; // Info comes directly after SeekHead
                  var tracksStart = infoStart + infoSize; // Tracks comes directly after Info
                  var cuesStart = tracksStart + tracksSize; // Cues starts directly after 
                  var newMetadataSize = cuesStart + cuesSize; // total size of metadata  
                  // This is the offset all CueClusterPositions should be adjusted by due to the metadata size changing.
                  var sizeDifference = newMetadataSize - originalMetadataSize;
                  // console.error(`infoStart: ${infoStart}, infoSize: ${infoSize}`);
                  // console.error(`tracksStart: ${tracksStart}, tracksSize: ${tracksSize}`);
                  // console.error(`cuesStart: ${cuesStart}, cuesSize: ${cuesSize}`);
                  // console.error(`originalMetadataSize: ${originalMetadataSize}, newMetadataSize: ${newMetadataSize}, sizeDifference: ${sizeDifference}`); 
                  // create the SeekHead element
                  seekHead = [];
                  seekHead.push({ name: "SeekHead", type: "m", isEnd: false });
                  seekHead.push({ name: "Seek", type: "m", isEnd: false });
                  seekHead.push({ name: "SeekID", type: "b", data: new exports.Buffer([0x15, 0x49, 0xA9, 0x66]) }); // Info
                  seekHead.push({ name: "SeekPosition", type: "u", data: createUIntBuffer(infoStart) });
                  seekHead.push({ name: "Seek", type: "m", isEnd: true });
                  seekHead.push({ name: "Seek", type: "m", isEnd: false });
                  seekHead.push({ name: "SeekID", type: "b", data: new exports.Buffer([0x16, 0x54, 0xAE, 0x6B]) }); // Tracks
                  seekHead.push({ name: "SeekPosition", type: "u", data: createUIntBuffer(tracksStart) });
                  seekHead.push({ name: "Seek", type: "m", isEnd: true });
                  seekHead.push({ name: "Seek", type: "m", isEnd: false });
                  seekHead.push({ name: "SeekID", type: "b", data: new exports.Buffer([0x1C, 0x53, 0xBB, 0x6B]) }); // Cues
                  seekHead.push({ name: "SeekPosition", type: "u", data: createUIntBuffer(cuesStart) });
                  seekHead.push({ name: "Seek", type: "m", isEnd: true });
                  seekHead.push({ name: "SeekHead", type: "m", isEnd: true });
                  seekHeadSize = encodedSizeOfEbml(seekHead);
                  //console.error("SeekHead size: " + seekHeadSize);
                  //printElementIds(seekHead);  
                  // create the Cues element
                  cues = [];
                  cues.push({ name: "Cues", type: "m", isEnd: false });
                  cuesInfo.forEach(function (_a) {
                      var CueTrack = _a.CueTrack, CueClusterPosition = _a.CueClusterPosition, CueTime = _a.CueTime;
                      cues.push({ name: "CuePoint", type: "m", isEnd: false });
                      cues.push({ name: "CueTime", type: "u", data: createUIntBuffer(CueTime) });
                      cues.push({ name: "CueTrackPositions", type: "m", isEnd: false });
                      cues.push({ name: "CueTrack", type: "u", data: createUIntBuffer(CueTrack) });
                      //console.error(`CueClusterPosition: ${CueClusterPosition}, Corrected to: ${CueClusterPosition - segmentContentStartPos}  , offset by ${sizeDifference} to become ${(CueClusterPosition - segmentContentStartPos) + sizeDifference - segmentContentStartPos}`);
                      // EBMLReader returns CueClusterPosition with absolute byte offsets. The Cues section expects them as offsets from the first level 1 element of the Segment, so we need to adjust it.
                      CueClusterPosition -= segmentContentStartPos;
                      // We also need to adjust to take into account the change in metadata size from when EBMLReader read the original metadata.
                      CueClusterPosition += sizeDifference;
                      cues.push({ name: "CueClusterPosition", type: "u", data: createUIntBuffer(CueClusterPosition) });
                      cues.push({ name: "CueTrackPositions", type: "m", isEnd: true });
                      cues.push({ name: "CuePoint", type: "m", isEnd: true });
                  });
                  cues.push({ name: "Cues", type: "m", isEnd: true });
                  cuesSize = encodedSizeOfEbml(cues);
                  //console.error("Cues size: " + cuesSize);   
                  //console.error("Cue count: " + cuesInfo.length);
                  //printElementIds(cues);      
                  // If the new MetadataSize is not the same as the previous iteration, we need to run once more.
                  if (lastSizeDifference !== sizeDifference) {
                      lastSizeDifference = sizeDifference;
                      if (i === maxIterations - 1) {
                          throw new Error("Failed to converge to a stable metadata size");
                      }
                  }
                  else {
                      return "break";
                  }
              };
              for (var i = 0; i < maxIterations; i++) {
                  var state_1 = _loop_1(i);
                  if (state_1 === "break")
                      break;
              }
              var finalMetadata = [].concat.apply([], [
                  header,
                  { name: "Segment", type: "m", isEnd: false, unknownSize: true },
                  seekHead,
                  info,
                  tracks,
                  cues
              ]);
              var result = new EBMLEncoder_1.default().encode(finalMetadata);
              //printElementIds(finalMetadata);
              //console.error(`Final metadata buffer size: ${result.byteLength}`);
              //console.error(`Final metadata buffer size without header and segment: ${result.byteLength-segmentContentStartPos}`);
              return result;
          }
          exports.makeMetadataSeekable = makeMetadataSeekable;
          /**
           * print all element id names in a list
          
           * @param metadata - array of EBML elements to print
           *
          export function printElementIds(metadata: EBML.EBMLElementBuffer[]) {
          
            let result: EBML.EBMLElementBuffer[] = [];
            let start: number = -1;
          
            for (let i = 0; i < metadata.length; i++) {
              console.error("\t id: " + metadata[i].name);
            }
          }
          */
          /**
           * remove all occurances of an EBML element from an array of elements
           * If it's a MasterElement you will also remove the content. (everything between start and end)
           * @param idName - name of the EBML Element to remove.
           * @param metadata - array of EBML elements to search
           */
          function removeElement(idName, metadata) {
              var result = [];
              var start = -1;
              for (var i = 0; i < metadata.length; i++) {
                  var element = metadata[i];
                  if (element.name === idName) {
                      // if it's a Master element, extract the start and end element, and everything in between
                      if (element.type === "m") {
                          if (!element.isEnd) {
                              start = i;
                          }
                          else {
                              // we've reached the end, extract the whole thing
                              if (start == -1)
                                  throw new Error("Detected " + idName + " closing element before finding the start");
                              metadata.splice(start, i - start + 1);
                              return;
                          }
                      }
                      else {
                          // not a Master element, so we've found what we're looking for.
                          metadata.splice(i, 1);
                          return;
                      }
                  }
              }
          }
          exports.removeElement = removeElement;
          /**
           * extract the first occurance of an EBML tag from a flattened array of EBML data.
           * If it's a MasterElement you will also get the content. (everything between start and end)
           * @param idName - name of the EBML Element to extract.
           * @param metadata - array of EBML elements to search
           */
          function extractElement(idName, metadata) {
              var result = [];
              var start = -1;
              for (var i = 0; i < metadata.length; i++) {
                  var element = metadata[i];
                  if (element.name === idName) {
                      // if it's a Master element, extract the start and end element, and everything in between
                      if (element.type === "m") {
                          if (!element.isEnd) {
                              start = i;
                          }
                          else {
                              // we've reached the end, extract the whole thing
                              if (start == -1)
                                  throw new Error("Detected " + idName + " closing element before finding the start");
                              result = metadata.slice(start, i + 1);
                              break;
                          }
                      }
                      else {
                          // not a Master element, so we've found what we're looking for.
                          result.push(metadata[i]);
                          break;
                      }
                  }
              }
              return result;
          }
          exports.extractElement = extractElement;
          /**
           * @deprecated
           * metadata に対して duration と seekhead を追加した metadata を返す
           * @param metadata - 変更前の webm における ファイル先頭から 最初の Cluster 要素までの 要素
           * @param duration - Duration (TimecodeScale)
           * @param cues - cue points for clusters
           * @deprecated @param clusterPtrs - 変更前の webm における SeekHead に追加する Cluster 要素 への start pointer
           * @deprecated @param cueInfos - please use cues.
           */
          function putRefinedMetaData(metadata, info) {
              if (Array.isArray(info.cueInfos) && !Array.isArray(info.cues)) {
                  console.warn("putRefinedMetaData: info.cueInfos property is deprecated. please use info.cues");
                  info.cues = info.cueInfos;
              }
              var ebml = [];
              var payload = [];
              for (var i_1 = 0; i_1 < metadata.length; i_1++) {
                  var elm = metadata[i_1];
                  if (elm.type === "m" && elm.name === "Segment") {
                      ebml = metadata.slice(0, i_1);
                      payload = metadata.slice(i_1);
                      if (elm.unknownSize) {
                          payload.shift(); // remove segment tag
                          break;
                      }
                      throw new Error("this metadata is not streaming webm file");
                  }
              }
              // *0    *4    *5  *36      *40   *48=segmentOffset              *185=originalPayloadOffsetEnd
              // |     |     |   |        |     |                              |
              // [EBML][size]....[Segment][size][Info][size][Duration][size]...[Cluster]
              // |               |        |^inf |                              |
              // |               +segmentSiz(12)+                              |
              // +-ebmlSize(36)--+        |     +-payloadSize(137)-------------+offsetEndDiff+
              //                 |        |     +-newPayloadSize(??)-------------------------+
              //                 |        |     |                                            |
              //                 [Segment][size][Info][size][Duration][size]....[size][value][Cluster]
              //                           ^                                                 |
              //                           |                                                 *??=newPayloadOffsetEnd
              //                           inf
              if (!(payload[payload.length - 1].dataEnd > 0)) {
                  throw new Error("metadata dataEnd has wrong number");
              }
              var originalPayloadOffsetEnd = payload[payload.length - 1].dataEnd; // = first cluster ptr
              var ebmlSize = ebml[ebml.length - 1].dataEnd; // = first segment ptr
              var refinedEBMLSize = new EBMLEncoder_1.default().encode(ebml).byteLength;
              var offsetDiff = refinedEBMLSize - ebmlSize;
              var payloadSize = originalPayloadOffsetEnd - payload[0].tagStart;
              var segmentSize = payload[0].tagStart - ebmlSize;
              var segmentOffset = payload[0].tagStart;
              var segmentTagBuf = new exports.Buffer([0x18, 0x53, 0x80, 0x67]); // Segment
              var segmentSizeBuf = new exports.Buffer('01ffffffffffffff', 'hex'); // Segmentの最後の位置は無数の Cluster 依存なので。 writeVint(newPayloadSize).byteLength ではなく、 infinity.
              var _segmentSize = segmentTagBuf.byteLength + segmentSizeBuf.byteLength; // == segmentSize
              var newPayloadSize = payloadSize;
              // We need the size to be stable between two refinements in order for our offsets to be correct
              // Bound the number of possible refinements so we can't go infinate if something goes wrong
              var i;
              for (i = 1; i < 20; i++) {
                  var newPayloadOffsetEnd = ebmlSize + _segmentSize + newPayloadSize;
                  var offsetEndDiff = newPayloadOffsetEnd - originalPayloadOffsetEnd;
                  var sizeDiff = offsetDiff + offsetEndDiff;
                  var refined = refineMetadata(payload, sizeDiff, info);
                  var newNewRefinedSize = new EBMLEncoder_1.default().encode(refined).byteLength; // 一旦 seekhead を作って自身のサイズを調べる
                  if (newNewRefinedSize === newPayloadSize) {
                      // Size is stable
                      return new EBMLEncoder_1.default().encode([].concat(ebml, [{ type: "m", name: "Segment", isEnd: false, unknownSize: true }], refined));
                  }
                  newPayloadSize = newNewRefinedSize;
              }
              throw new Error("unable to refine metadata, stable size could not be found in " + i + " iterations!");
          }
          exports.putRefinedMetaData = putRefinedMetaData;
          // Given a list of EBMLElementBuffers, returns their encoded size in bytes
          function encodedSizeOfEbml(refinedMetaData) {
              var encorder = new EBMLEncoder_1.default();
              return refinedMetaData.reduce(function (lst, elm) { return lst.concat(encorder.encode([elm])); }, []).reduce(function (o, buf) { return o + buf.byteLength; }, 0);
          }
          function refineMetadata(mesetadata, sizeDiff, info) {
              var duration = info.duration, clusterPtrs = info.clusterPtrs, cues = info.cues;
              var _metadata = mesetadata.slice(0);
              if (typeof duration === "number") {
                  // duration を追加する
                  var overwrited_1 = false;
                  _metadata.forEach(function (elm) {
                      if (elm.type === "f" && elm.name === "Duration") {
                          overwrited_1 = true;
                          elm.data = createFloatBuffer(duration, 8);
                      }
                  });
                  if (!overwrited_1) {
                      insertTag(_metadata, "Info", [{ name: "Duration", type: "f", data: createFloatBuffer(duration, 8) }]);
                  }
              }
              if (Array.isArray(cues)) {
                  insertTag(_metadata, "Cues", create_cue(cues, sizeDiff));
              }
              var seekhead_children = [];
              if (Array.isArray(clusterPtrs)) {
                  console.warn("append cluster pointers to seekhead is deprecated. please use cues");
                  seekhead_children = create_seek_from_clusters(clusterPtrs, sizeDiff);
              }
              // remove seek info
              /*
              _metadata = _metadata.filter((elm)=> !(
                elm.name === "Seek" ||
                elm.name === "SeekID" ||
                elm.name === "SeekPosition") );
              */
              // working on progress
              //seekhead_children = seekhead_children.concat(create_seekhead(_metadata));
              insertTag(_metadata, "SeekHead", seekhead_children, true);
              return _metadata;
          }
          function create_seekhead(metadata, sizeDiff) {
              var seeks = [];
              ["Info", "Tracks", "Cues"].forEach(function (tagName) {
                  var tagStarts = metadata.filter(function (elm) { return elm.type === "m" && elm.name === tagName && elm.isEnd === false; }).map(function (elm) { return elm["tagStart"]; });
                  var tagStart = tagStarts[0];
                  if (typeof tagStart !== "number") {
                      return;
                  }
                  seeks.push({ name: "Seek", type: "m", isEnd: false });
                  switch (tagName) {
                      case "Info":
                          seeks.push({ name: "SeekID", type: "b", data: new exports.Buffer([0x15, 0x49, 0xA9, 0x66]) });
                          break;
                      case "Tracks":
                          seeks.push({ name: "SeekID", type: "b", data: new exports.Buffer([0x16, 0x54, 0xAE, 0x6B]) });
                          break;
                      case "Cues":
                          seeks.push({ name: "SeekID", type: "b", data: new exports.Buffer([0x1C, 0x53, 0xBB, 0x6B]) });
                          break;
                  }
                  seeks.push({ name: "SeekPosition", type: "u", data: createUIntBuffer(tagStart + sizeDiff) });
                  seeks.push({ name: "Seek", type: "m", isEnd: true });
              });
              return seeks;
          }
          function create_seek_from_clusters(clusterPtrs, sizeDiff) {
              var seeks = [];
              clusterPtrs.forEach(function (start) {
                  seeks.push({ name: "Seek", type: "m", isEnd: false });
                  // [0x1F, 0x43, 0xB6, 0x75] で Cluster 意
                  seeks.push({ name: "SeekID", type: "b", data: new exports.Buffer([0x1F, 0x43, 0xB6, 0x75]) });
                  seeks.push({ name: "SeekPosition", type: "u", data: createUIntBuffer(start + sizeDiff) });
                  seeks.push({ name: "Seek", type: "m", isEnd: true });
              });
              return seeks;
          }
          function create_cue(cueInfos, sizeDiff) {
              var cues = [];
              cueInfos.forEach(function (_a) {
                  var CueTrack = _a.CueTrack, CueClusterPosition = _a.CueClusterPosition, CueTime = _a.CueTime;
                  cues.push({ name: "CuePoint", type: "m", isEnd: false });
                  cues.push({ name: "CueTime", type: "u", data: createUIntBuffer(CueTime) });
                  cues.push({ name: "CueTrackPositions", type: "m", isEnd: false });
                  cues.push({ name: "CueTrack", type: "u", data: createUIntBuffer(CueTrack) }); // video track
                  cues.push({ name: "CueClusterPosition", type: "u", data: createUIntBuffer(CueClusterPosition + sizeDiff) });
                  cues.push({ name: "CueTrackPositions", type: "m", isEnd: true });
                  cues.push({ name: "CuePoint", type: "m", isEnd: true });
              });
              return cues;
          }
          function insertTag(_metadata, tagName, children, insertHead) {
              if (insertHead === void 0) { insertHead = false; }
              // find the tagname from _metadata
              var idx = -1;
              for (var i = 0; i < _metadata.length; i++) {
                  var elm = _metadata[i];
                  if (elm.type === "m" && elm.name === tagName && elm.isEnd === false) {
                      idx = i;
                      break;
                  }
              }
              if (idx >= 0) {
                  // insert [<CuePoint />] to <Cues />
                  Array.prototype.splice.apply(_metadata, [idx + 1, 0].concat(children));
              }
              else if (insertHead) {
                  [].concat([{ name: tagName, type: "m", isEnd: false }], children, [{ name: tagName, type: "m", isEnd: true }]).reverse().forEach(function (elm) { _metadata.unshift(elm); });
              }
              else {
                  // metadata 末尾に <Cues /> を追加
                  // insert <Cues />
                  _metadata.push({ name: tagName, type: "m", isEnd: false });
                  children.forEach(function (elm) { _metadata.push(elm); });
                  _metadata.push({ name: tagName, type: "m", isEnd: true });
              }
          }
          // alter Buffer.concat - https://github.com/feross/buffer/issues/154
          function concat(list) {
              //return Buffer.concat.apply(Buffer, list);
              var i = 0;
              var length = 0;
              for (; i < list.length; ++i) {
                  length += list[i].length;
              }
              var buffer = exports.Buffer.allocUnsafe(length);
              var pos = 0;
              for (i = 0; i < list.length; ++i) {
                  var buf = list[i];
                  buf.copy(buffer, pos);
                  pos += buf.length;
              }
              return buffer;
          }
          exports.concat = concat;
          function encodeValueToBuffer(elm) {
              var data = new exports.Buffer(0);
              if (elm.type === "m") {
                  return elm;
              }
              switch (elm.type) {
                  case "u":
                      data = createUIntBuffer(elm.value);
                      break;
                  case "i":
                      data = createIntBuffer(elm.value);
                      break;
                  case "f":
                      data = createFloatBuffer(elm.value);
                      break;
                  case "s":
                      data = new exports.Buffer(elm.value, 'ascii');
                      break;
                  case "8":
                      data = new exports.Buffer(elm.value, 'utf8');
                      break;
                  case "b":
                      data = elm.value;
                      break;
                  case "d":
                      data = new int64_buffer_1.Int64BE(elm.value.getTime().toString()).toBuffer();
                      break;
              }
              return Object.assign({}, elm, { data: data });
          }
          exports.encodeValueToBuffer = encodeValueToBuffer;
          function createUIntBuffer(value) {
              // Big-endian, any size from 1 to 8
              // but js number is float64, so max 6 bit octets
              var bytes = 1;
              for (; value >= Math.pow(2, 8 * bytes); bytes++) { }
              if (bytes >= 7) {
                  console.warn("7bit or more bigger uint not supported.");
                  return new int64_buffer_1.Uint64BE(value).toBuffer();
              }
              var data = new exports.Buffer(bytes);
              data.writeUIntBE(value, 0, bytes);
              return data;
          }
          exports.createUIntBuffer = createUIntBuffer;
          function createIntBuffer(value) {
              // Big-endian, any size from 1 to 8 octets
              // but js number is float64, so max 6 bit
              var bytes = 1;
              for (; value >= Math.pow(2, 8 * bytes); bytes++) { }
              if (bytes >= 7) {
                  console.warn("7bit or more bigger uint not supported.");
                  return new int64_buffer_1.Int64BE(value).toBuffer();
              }
              var data = new exports.Buffer(bytes);
              data.writeIntBE(value, 0, bytes);
              return data;
          }
          exports.createIntBuffer = createIntBuffer;
          function createFloatBuffer(value, bytes) {
              if (bytes === void 0) { bytes = 8; }
              // Big-endian, defined for 4 and 8 octets (32, 64 bits)
              // js number is float64 so 8 bytes.
              if (bytes === 8) {
                  // 64bit
                  var data = new exports.Buffer(8);
                  data.writeDoubleBE(value, 0);
                  return data;
              }
              else if (bytes === 4) {
                  // 32bit
                  var data = new exports.Buffer(4);
                  data.writeFloatBE(value, 0);
                  return data;
              }
              else {
                  throw new Error("float type bits must 4bytes or 8bytes");
              }
          }
          exports.createFloatBuffer = createFloatBuffer;
          function convertEBMLDateToJSDate(int64str) {
              if (int64str instanceof Date) {
                  return int64str;
              }
              return new Date(new Date("2001-01-01T00:00:00.000Z").getTime() + (Number(int64str) / 1000 / 1000));
          }
          exports.convertEBMLDateToJSDate = convertEBMLDateToJSDate;

      }, { "./EBMLEncoder": 2, "buffer/": 8, "ebml-block": 9, "ebml/lib/ebml/tools": 12, "int64-buffer": 15 }], 6: [function (require, module, exports) {
          'use strict'

          exports.byteLength = byteLength
          exports.toByteArray = toByteArray
          exports.fromByteArray = fromByteArray

          var lookup = []
          var revLookup = []
          var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

          var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
          for (var i = 0, len = code.length; i < len; ++i) {
              lookup[i] = code[i]
              revLookup[code.charCodeAt(i)] = i
          }

          // Support decoding URL-safe base64 strings, as Node.js does.
          // See: https://en.wikipedia.org/wiki/Base64#URL_applications
          revLookup['-'.charCodeAt(0)] = 62
          revLookup['_'.charCodeAt(0)] = 63

          function getLens(b64) {
              var len = b64.length

              if (len % 4 > 0) {
                  throw new Error('Invalid string. Length must be a multiple of 4')
              }

              // Trim off extra bytes after placeholder bytes are found
              // See: https://github.com/beatgammit/base64-js/issues/42
              var validLen = b64.indexOf('=')
              if (validLen === -1) validLen = len

              var placeHoldersLen = validLen === len
                  ? 0
                  : 4 - (validLen % 4)

              return [validLen, placeHoldersLen]
          }

          // base64 is 4/3 + up to two characters of the original data
          function byteLength(b64) {
              var lens = getLens(b64)
              var validLen = lens[0]
              var placeHoldersLen = lens[1]
              return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
          }

          function _byteLength(b64, validLen, placeHoldersLen) {
              return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
          }

          function toByteArray(b64) {
              var tmp
              var lens = getLens(b64)
              var validLen = lens[0]
              var placeHoldersLen = lens[1]

              var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

              var curByte = 0

              // if there are placeholders, only get up to the last complete 4 chars
              var len = placeHoldersLen > 0
                  ? validLen - 4
                  : validLen

              for (var i = 0; i < len; i += 4) {
                  tmp =
                      (revLookup[b64.charCodeAt(i)] << 18) |
                      (revLookup[b64.charCodeAt(i + 1)] << 12) |
                      (revLookup[b64.charCodeAt(i + 2)] << 6) |
                      revLookup[b64.charCodeAt(i + 3)]
                  arr[curByte++] = (tmp >> 16) & 0xFF
                  arr[curByte++] = (tmp >> 8) & 0xFF
                  arr[curByte++] = tmp & 0xFF
              }

              if (placeHoldersLen === 2) {
                  tmp =
                      (revLookup[b64.charCodeAt(i)] << 2) |
                      (revLookup[b64.charCodeAt(i + 1)] >> 4)
                  arr[curByte++] = tmp & 0xFF
              }

              if (placeHoldersLen === 1) {
                  tmp =
                      (revLookup[b64.charCodeAt(i)] << 10) |
                      (revLookup[b64.charCodeAt(i + 1)] << 4) |
                      (revLookup[b64.charCodeAt(i + 2)] >> 2)
                  arr[curByte++] = (tmp >> 8) & 0xFF
                  arr[curByte++] = tmp & 0xFF
              }

              return arr
          }

          function tripletToBase64(num) {
              return lookup[num >> 18 & 0x3F] +
                  lookup[num >> 12 & 0x3F] +
                  lookup[num >> 6 & 0x3F] +
                  lookup[num & 0x3F]
          }

          function encodeChunk(uint8, start, end) {
              var tmp
              var output = []
              for (var i = start; i < end; i += 3) {
                  tmp =
                      ((uint8[i] << 16) & 0xFF0000) +
                      ((uint8[i + 1] << 8) & 0xFF00) +
                      (uint8[i + 2] & 0xFF)
                  output.push(tripletToBase64(tmp))
              }
              return output.join('')
          }

          function fromByteArray(uint8) {
              var tmp
              var len = uint8.length
              var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
              var parts = []
              var maxChunkLength = 16383 // must be multiple of 3

              // go through the array every three bytes, we'll deal with trailing stuff later
              for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
                  parts.push(encodeChunk(
                      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
                  ))
              }

              // pad the end with zeros, but make sure to not forget the extra bytes
              if (extraBytes === 1) {
                  tmp = uint8[len - 1]
                  parts.push(
                      lookup[tmp >> 2] +
                      lookup[(tmp << 4) & 0x3F] +
                      '=='
                  )
              } else if (extraBytes === 2) {
                  tmp = (uint8[len - 2] << 8) + uint8[len - 1]
                  parts.push(
                      lookup[tmp >> 10] +
                      lookup[(tmp >> 4) & 0x3F] +
                      lookup[(tmp << 2) & 0x3F] +
                      '='
                  )
              }

              return parts.join('')
          }

      }, {}], 7: [function (require, module, exports) {
          (function (global) {
              /*!
               * The buffer module from node.js, for the browser.
               *
               * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
               * @license  MIT
               */
              /* eslint-disable no-proto */

              'use strict'

              var base64 = require('base64-js')
              var ieee754 = require('ieee754')
              var isArray = require('isarray')

              exports.Buffer = Buffer
              exports.SlowBuffer = SlowBuffer
              exports.INSPECT_MAX_BYTES = 50

              /**
               * If `Buffer.TYPED_ARRAY_SUPPORT`:
               *   === true    Use Uint8Array implementation (fastest)
               *   === false   Use Object implementation (most compatible, even IE6)
               *
               * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
               * Opera 11.6+, iOS 4.2+.
               *
               * Due to various browser bugs, sometimes the Object implementation will be used even
               * when the browser supports typed arrays.
               *
               * Note:
               *
               *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
               *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
               *
               *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
               *
               *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
               *     incorrect length in some situations.
              
               * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
               * get the Object implementation, which is slower but behaves correctly.
               */
              Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
                  ? global.TYPED_ARRAY_SUPPORT
                  : typedArraySupport()

              /*
               * Export kMaxLength after typed array support is determined.
               */
              exports.kMaxLength = kMaxLength()

              function typedArraySupport() {
                  try {
                      var arr = new Uint8Array(1)
                      arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
                      return arr.foo() === 42 && // typed array instances can be augmented
                          typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
                          arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
                  } catch (e) {
                      return false
                  }
              }

              function kMaxLength() {
                  return Buffer.TYPED_ARRAY_SUPPORT
                      ? 0x7fffffff
                      : 0x3fffffff
              }

              function createBuffer(that, length) {
                  if (kMaxLength() < length) {
                      throw new RangeError('Invalid typed array length')
                  }
                  if (Buffer.TYPED_ARRAY_SUPPORT) {
                      // Return an augmented `Uint8Array` instance, for best performance
                      that = new Uint8Array(length)
                      that.__proto__ = Buffer.prototype
                  } else {
                      // Fallback: Return an object instance of the Buffer class
                      if (that === null) {
                          that = new Buffer(length)
                      }
                      that.length = length
                  }

                  return that
              }

              /**
               * The Buffer constructor returns instances of `Uint8Array` that have their
               * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
               * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
               * and the `Uint8Array` methods. Square bracket notation works as expected -- it
               * returns a single octet.
               *
               * The `Uint8Array` prototype remains unmodified.
               */

              function Buffer(arg, encodingOrOffset, length) {
                  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
                      return new Buffer(arg, encodingOrOffset, length)
                  }

                  // Common case.
                  if (typeof arg === 'number') {
                      if (typeof encodingOrOffset === 'string') {
                          throw new Error(
                              'If encoding is specified then the first argument must be a string'
                          )
                      }
                      return allocUnsafe(this, arg)
                  }
                  return from(this, arg, encodingOrOffset, length)
              }

              Buffer.poolSize = 8192 // not used by this implementation

              // TODO: Legacy, not needed anymore. Remove in next major version.
              Buffer._augment = function (arr) {
                  arr.__proto__ = Buffer.prototype
                  return arr
              }

              function from(that, value, encodingOrOffset, length) {
                  if (typeof value === 'number') {
                      throw new TypeError('"value" argument must not be a number')
                  }

                  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
                      return fromArrayBuffer(that, value, encodingOrOffset, length)
                  }

                  if (typeof value === 'string') {
                      return fromString(that, value, encodingOrOffset)
                  }

                  return fromObject(that, value)
              }

              /**
               * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
               * if value is a number.
               * Buffer.from(str[, encoding])
               * Buffer.from(array)
               * Buffer.from(buffer)
               * Buffer.from(arrayBuffer[, byteOffset[, length]])
               **/
              Buffer.from = function (value, encodingOrOffset, length) {
                  return from(null, value, encodingOrOffset, length)
              }

              if (Buffer.TYPED_ARRAY_SUPPORT) {
                  Buffer.prototype.__proto__ = Uint8Array.prototype
                  Buffer.__proto__ = Uint8Array
                  if (typeof Symbol !== 'undefined' && Symbol.species &&
                      Buffer[Symbol.species] === Buffer) {
                      // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
                      Object.defineProperty(Buffer, Symbol.species, {
                          value: null,
                          configurable: true
                      })
                  }
              }

              function assertSize(size) {
                  if (typeof size !== 'number') {
                      throw new TypeError('"size" argument must be a number')
                  } else if (size < 0) {
                      throw new RangeError('"size" argument must not be negative')
                  }
              }

              function alloc(that, size, fill, encoding) {
                  assertSize(size)
                  if (size <= 0) {
                      return createBuffer(that, size)
                  }
                  if (fill !== undefined) {
                      // Only pay attention to encoding if it's a string. This
                      // prevents accidentally sending in a number that would
                      // be interpretted as a start offset.
                      return typeof encoding === 'string'
                          ? createBuffer(that, size).fill(fill, encoding)
                          : createBuffer(that, size).fill(fill)
                  }
                  return createBuffer(that, size)
              }

              /**
               * Creates a new filled Buffer instance.
               * alloc(size[, fill[, encoding]])
               **/
              Buffer.alloc = function (size, fill, encoding) {
                  return alloc(null, size, fill, encoding)
              }

              function allocUnsafe(that, size) {
                  assertSize(size)
                  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
                  if (!Buffer.TYPED_ARRAY_SUPPORT) {
                      for (var i = 0; i < size; ++i) {
                          that[i] = 0
                      }
                  }
                  return that
              }

              /**
               * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
               * */
              Buffer.allocUnsafe = function (size) {
                  return allocUnsafe(null, size)
              }
              /**
               * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
               */
              Buffer.allocUnsafeSlow = function (size) {
                  return allocUnsafe(null, size)
              }

              function fromString(that, string, encoding) {
                  if (typeof encoding !== 'string' || encoding === '') {
                      encoding = 'utf8'
                  }

                  if (!Buffer.isEncoding(encoding)) {
                      throw new TypeError('"encoding" must be a valid string encoding')
                  }

                  var length = byteLength(string, encoding) | 0
                  that = createBuffer(that, length)

                  var actual = that.write(string, encoding)

                  if (actual !== length) {
                      // Writing a hex string, for example, that contains invalid characters will
                      // cause everything after the first invalid character to be ignored. (e.g.
                      // 'abxxcd' will be treated as 'ab')
                      that = that.slice(0, actual)
                  }

                  return that
              }

              function fromArrayLike(that, array) {
                  var length = array.length < 0 ? 0 : checked(array.length) | 0
                  that = createBuffer(that, length)
                  for (var i = 0; i < length; i += 1) {
                      that[i] = array[i] & 255
                  }
                  return that
              }

              function fromArrayBuffer(that, array, byteOffset, length) {
                  array.byteLength // this throws if `array` is not a valid ArrayBuffer

                  if (byteOffset < 0 || array.byteLength < byteOffset) {
                      throw new RangeError('\'offset\' is out of bounds')
                  }

                  if (array.byteLength < byteOffset + (length || 0)) {
                      throw new RangeError('\'length\' is out of bounds')
                  }

                  if (byteOffset === undefined && length === undefined) {
                      array = new Uint8Array(array)
                  } else if (length === undefined) {
                      array = new Uint8Array(array, byteOffset)
                  } else {
                      array = new Uint8Array(array, byteOffset, length)
                  }

                  if (Buffer.TYPED_ARRAY_SUPPORT) {
                      // Return an augmented `Uint8Array` instance, for best performance
                      that = array
                      that.__proto__ = Buffer.prototype
                  } else {
                      // Fallback: Return an object instance of the Buffer class
                      that = fromArrayLike(that, array)
                  }
                  return that
              }

              function fromObject(that, obj) {
                  if (Buffer.isBuffer(obj)) {
                      var len = checked(obj.length) | 0
                      that = createBuffer(that, len)

                      if (that.length === 0) {
                          return that
                      }

                      obj.copy(that, 0, 0, len)
                      return that
                  }

                  if (obj) {
                      if ((typeof ArrayBuffer !== 'undefined' &&
                          obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
                          if (typeof obj.length !== 'number' || isnan(obj.length)) {
                              return createBuffer(that, 0)
                          }
                          return fromArrayLike(that, obj)
                      }

                      if (obj.type === 'Buffer' && isArray(obj.data)) {
                          return fromArrayLike(that, obj.data)
                      }
                  }

                  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
              }

              function checked(length) {
                  // Note: cannot use `length < kMaxLength()` here because that fails when
                  // length is NaN (which is otherwise coerced to zero.)
                  if (length >= kMaxLength()) {
                      throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                          'size: 0x' + kMaxLength().toString(16) + ' bytes')
                  }
                  return length | 0
              }

              function SlowBuffer(length) {
                  if (+length != length) { // eslint-disable-line eqeqeq
                      length = 0
                  }
                  return Buffer.alloc(+length)
              }

              Buffer.isBuffer = function isBuffer(b) {
                  return !!(b != null && b._isBuffer)
              }

              Buffer.compare = function compare(a, b) {
                  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
                      throw new TypeError('Arguments must be Buffers')
                  }

                  if (a === b) return 0

                  var x = a.length
                  var y = b.length

                  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
                      if (a[i] !== b[i]) {
                          x = a[i]
                          y = b[i]
                          break
                      }
                  }

                  if (x < y) return -1
                  if (y < x) return 1
                  return 0
              }

              Buffer.isEncoding = function isEncoding(encoding) {
                  switch (String(encoding).toLowerCase()) {
                      case 'hex':
                      case 'utf8':
                      case 'utf-8':
                      case 'ascii':
                      case 'latin1':
                      case 'binary':
                      case 'base64':
                      case 'ucs2':
                      case 'ucs-2':
                      case 'utf16le':
                      case 'utf-16le':
                          return true
                      default:
                          return false
                  }
              }

              Buffer.concat = function concat(list, length) {
                  if (!isArray(list)) {
                      throw new TypeError('"list" argument must be an Array of Buffers')
                  }

                  if (list.length === 0) {
                      return Buffer.alloc(0)
                  }

                  var i
                  if (length === undefined) {
                      length = 0
                      for (i = 0; i < list.length; ++i) {
                          length += list[i].length
                      }
                  }

                  var buffer = Buffer.allocUnsafe(length)
                  var pos = 0
                  for (i = 0; i < list.length; ++i) {
                      var buf = list[i]
                      if (!Buffer.isBuffer(buf)) {
                          throw new TypeError('"list" argument must be an Array of Buffers')
                      }
                      buf.copy(buffer, pos)
                      pos += buf.length
                  }
                  return buffer
              }

              function byteLength(string, encoding) {
                  if (Buffer.isBuffer(string)) {
                      return string.length
                  }
                  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
                      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
                      return string.byteLength
                  }
                  if (typeof string !== 'string') {
                      string = '' + string
                  }

                  var len = string.length
                  if (len === 0) return 0

                  // Use a for loop to avoid recursion
                  var loweredCase = false
                  for (; ;) {
                      switch (encoding) {
                          case 'ascii':
                          case 'latin1':
                          case 'binary':
                              return len
                          case 'utf8':
                          case 'utf-8':
                          case undefined:
                              return utf8ToBytes(string).length
                          case 'ucs2':
                          case 'ucs-2':
                          case 'utf16le':
                          case 'utf-16le':
                              return len * 2
                          case 'hex':
                              return len >>> 1
                          case 'base64':
                              return base64ToBytes(string).length
                          default:
                              if (loweredCase) return utf8ToBytes(string).length // assume utf8
                              encoding = ('' + encoding).toLowerCase()
                              loweredCase = true
                      }
                  }
              }
              Buffer.byteLength = byteLength

              function slowToString(encoding, start, end) {
                  var loweredCase = false

                  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
                  // property of a typed array.

                  // This behaves neither like String nor Uint8Array in that we set start/end
                  // to their upper/lower bounds if the value passed is out of range.
                  // undefined is handled specially as per ECMA-262 6th Edition,
                  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
                  if (start === undefined || start < 0) {
                      start = 0
                  }
                  // Return early if start > this.length. Done here to prevent potential uint32
                  // coercion fail below.
                  if (start > this.length) {
                      return ''
                  }

                  if (end === undefined || end > this.length) {
                      end = this.length
                  }

                  if (end <= 0) {
                      return ''
                  }

                  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
                  end >>>= 0
                  start >>>= 0

                  if (end <= start) {
                      return ''
                  }

                  if (!encoding) encoding = 'utf8'

                  while (true) {
                      switch (encoding) {
                          case 'hex':
                              return hexSlice(this, start, end)

                          case 'utf8':
                          case 'utf-8':
                              return utf8Slice(this, start, end)

                          case 'ascii':
                              return asciiSlice(this, start, end)

                          case 'latin1':
                          case 'binary':
                              return latin1Slice(this, start, end)

                          case 'base64':
                              return base64Slice(this, start, end)

                          case 'ucs2':
                          case 'ucs-2':
                          case 'utf16le':
                          case 'utf-16le':
                              return utf16leSlice(this, start, end)

                          default:
                              if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
                              encoding = (encoding + '').toLowerCase()
                              loweredCase = true
                      }
                  }
              }

              // The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
              // Buffer instances.
              Buffer.prototype._isBuffer = true

              function swap(b, n, m) {
                  var i = b[n]
                  b[n] = b[m]
                  b[m] = i
              }

              Buffer.prototype.swap16 = function swap16() {
                  var len = this.length
                  if (len % 2 !== 0) {
                      throw new RangeError('Buffer size must be a multiple of 16-bits')
                  }
                  for (var i = 0; i < len; i += 2) {
                      swap(this, i, i + 1)
                  }
                  return this
              }

              Buffer.prototype.swap32 = function swap32() {
                  var len = this.length
                  if (len % 4 !== 0) {
                      throw new RangeError('Buffer size must be a multiple of 32-bits')
                  }
                  for (var i = 0; i < len; i += 4) {
                      swap(this, i, i + 3)
                      swap(this, i + 1, i + 2)
                  }
                  return this
              }

              Buffer.prototype.swap64 = function swap64() {
                  var len = this.length
                  if (len % 8 !== 0) {
                      throw new RangeError('Buffer size must be a multiple of 64-bits')
                  }
                  for (var i = 0; i < len; i += 8) {
                      swap(this, i, i + 7)
                      swap(this, i + 1, i + 6)
                      swap(this, i + 2, i + 5)
                      swap(this, i + 3, i + 4)
                  }
                  return this
              }

              Buffer.prototype.toString = function toString() {
                  var length = this.length | 0
                  if (length === 0) return ''
                  if (arguments.length === 0) return utf8Slice(this, 0, length)
                  return slowToString.apply(this, arguments)
              }

              Buffer.prototype.equals = function equals(b) {
                  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
                  if (this === b) return true
                  return Buffer.compare(this, b) === 0
              }

              Buffer.prototype.inspect = function inspect() {
                  var str = ''
                  var max = exports.INSPECT_MAX_BYTES
                  if (this.length > 0) {
                      str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
                      if (this.length > max) str += ' ... '
                  }
                  return '<Buffer ' + str + '>'
              }

              Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
                  if (!Buffer.isBuffer(target)) {
                      throw new TypeError('Argument must be a Buffer')
                  }

                  if (start === undefined) {
                      start = 0
                  }
                  if (end === undefined) {
                      end = target ? target.length : 0
                  }
                  if (thisStart === undefined) {
                      thisStart = 0
                  }
                  if (thisEnd === undefined) {
                      thisEnd = this.length
                  }

                  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
                      throw new RangeError('out of range index')
                  }

                  if (thisStart >= thisEnd && start >= end) {
                      return 0
                  }
                  if (thisStart >= thisEnd) {
                      return -1
                  }
                  if (start >= end) {
                      return 1
                  }

                  start >>>= 0
                  end >>>= 0
                  thisStart >>>= 0
                  thisEnd >>>= 0

                  if (this === target) return 0

                  var x = thisEnd - thisStart
                  var y = end - start
                  var len = Math.min(x, y)

                  var thisCopy = this.slice(thisStart, thisEnd)
                  var targetCopy = target.slice(start, end)

                  for (var i = 0; i < len; ++i) {
                      if (thisCopy[i] !== targetCopy[i]) {
                          x = thisCopy[i]
                          y = targetCopy[i]
                          break
                      }
                  }

                  if (x < y) return -1
                  if (y < x) return 1
                  return 0
              }

              // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
              // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
              //
              // Arguments:
              // - buffer - a Buffer to search
              // - val - a string, Buffer, or number
              // - byteOffset - an index into `buffer`; will be clamped to an int32
              // - encoding - an optional encoding, relevant is val is a string
              // - dir - true for indexOf, false for lastIndexOf
              function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
                  // Empty buffer means no match
                  if (buffer.length === 0) return -1

                  // Normalize byteOffset
                  if (typeof byteOffset === 'string') {
                      encoding = byteOffset
                      byteOffset = 0
                  } else if (byteOffset > 0x7fffffff) {
                      byteOffset = 0x7fffffff
                  } else if (byteOffset < -0x80000000) {
                      byteOffset = -0x80000000
                  }
                  byteOffset = +byteOffset  // Coerce to Number.
                  if (isNaN(byteOffset)) {
                      // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
                      byteOffset = dir ? 0 : (buffer.length - 1)
                  }

                  // Normalize byteOffset: negative offsets start from the end of the buffer
                  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
                  if (byteOffset >= buffer.length) {
                      if (dir) return -1
                      else byteOffset = buffer.length - 1
                  } else if (byteOffset < 0) {
                      if (dir) byteOffset = 0
                      else return -1
                  }

                  // Normalize val
                  if (typeof val === 'string') {
                      val = Buffer.from(val, encoding)
                  }

                  // Finally, search either indexOf (if dir is true) or lastIndexOf
                  if (Buffer.isBuffer(val)) {
                      // Special case: looking for empty string/buffer always fails
                      if (val.length === 0) {
                          return -1
                      }
                      return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
                  } else if (typeof val === 'number') {
                      val = val & 0xFF // Search for a byte value [0-255]
                      if (Buffer.TYPED_ARRAY_SUPPORT &&
                          typeof Uint8Array.prototype.indexOf === 'function') {
                          if (dir) {
                              return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
                          } else {
                              return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
                          }
                      }
                      return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
                  }

                  throw new TypeError('val must be string, number or Buffer')
              }

              function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
                  var indexSize = 1
                  var arrLength = arr.length
                  var valLength = val.length

                  if (encoding !== undefined) {
                      encoding = String(encoding).toLowerCase()
                      if (encoding === 'ucs2' || encoding === 'ucs-2' ||
                          encoding === 'utf16le' || encoding === 'utf-16le') {
                          if (arr.length < 2 || val.length < 2) {
                              return -1
                          }
                          indexSize = 2
                          arrLength /= 2
                          valLength /= 2
                          byteOffset /= 2
                      }
                  }

                  function read(buf, i) {
                      if (indexSize === 1) {
                          return buf[i]
                      } else {
                          return buf.readUInt16BE(i * indexSize)
                      }
                  }

                  var i
                  if (dir) {
                      var foundIndex = -1
                      for (i = byteOffset; i < arrLength; i++) {
                          if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
                              if (foundIndex === -1) foundIndex = i
                              if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
                          } else {
                              if (foundIndex !== -1) i -= i - foundIndex
                              foundIndex = -1
                          }
                      }
                  } else {
                      if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
                      for (i = byteOffset; i >= 0; i--) {
                          var found = true
                          for (var j = 0; j < valLength; j++) {
                              if (read(arr, i + j) !== read(val, j)) {
                                  found = false
                                  break
                              }
                          }
                          if (found) return i
                      }
                  }

                  return -1
              }

              Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
                  return this.indexOf(val, byteOffset, encoding) !== -1
              }

              Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
                  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
              }

              Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
                  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
              }

              function hexWrite(buf, string, offset, length) {
                  offset = Number(offset) || 0
                  var remaining = buf.length - offset
                  if (!length) {
                      length = remaining
                  } else {
                      length = Number(length)
                      if (length > remaining) {
                          length = remaining
                      }
                  }

                  // must be an even number of digits
                  var strLen = string.length
                  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

                  if (length > strLen / 2) {
                      length = strLen / 2
                  }
                  for (var i = 0; i < length; ++i) {
                      var parsed = parseInt(string.substr(i * 2, 2), 16)
                      if (isNaN(parsed)) return i
                      buf[offset + i] = parsed
                  }
                  return i
              }

              function utf8Write(buf, string, offset, length) {
                  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
              }

              function asciiWrite(buf, string, offset, length) {
                  return blitBuffer(asciiToBytes(string), buf, offset, length)
              }

              function latin1Write(buf, string, offset, length) {
                  return asciiWrite(buf, string, offset, length)
              }

              function base64Write(buf, string, offset, length) {
                  return blitBuffer(base64ToBytes(string), buf, offset, length)
              }

              function ucs2Write(buf, string, offset, length) {
                  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
              }

              Buffer.prototype.write = function write(string, offset, length, encoding) {
                  // Buffer#write(string)
                  if (offset === undefined) {
                      encoding = 'utf8'
                      length = this.length
                      offset = 0
                      // Buffer#write(string, encoding)
                  } else if (length === undefined && typeof offset === 'string') {
                      encoding = offset
                      length = this.length
                      offset = 0
                      // Buffer#write(string, offset[, length][, encoding])
                  } else if (isFinite(offset)) {
                      offset = offset | 0
                      if (isFinite(length)) {
                          length = length | 0
                          if (encoding === undefined) encoding = 'utf8'
                      } else {
                          encoding = length
                          length = undefined
                      }
                      // legacy write(string, encoding, offset, length) - remove in v0.13
                  } else {
                      throw new Error(
                          'Buffer.write(string, encoding, offset[, length]) is no longer supported'
                      )
                  }

                  var remaining = this.length - offset
                  if (length === undefined || length > remaining) length = remaining

                  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
                      throw new RangeError('Attempt to write outside buffer bounds')
                  }

                  if (!encoding) encoding = 'utf8'

                  var loweredCase = false
                  for (; ;) {
                      switch (encoding) {
                          case 'hex':
                              return hexWrite(this, string, offset, length)

                          case 'utf8':
                          case 'utf-8':
                              return utf8Write(this, string, offset, length)

                          case 'ascii':
                              return asciiWrite(this, string, offset, length)

                          case 'latin1':
                          case 'binary':
                              return latin1Write(this, string, offset, length)

                          case 'base64':
                              // Warning: maxLength not taken into account in base64Write
                              return base64Write(this, string, offset, length)

                          case 'ucs2':
                          case 'ucs-2':
                          case 'utf16le':
                          case 'utf-16le':
                              return ucs2Write(this, string, offset, length)

                          default:
                              if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
                              encoding = ('' + encoding).toLowerCase()
                              loweredCase = true
                      }
                  }
              }

              Buffer.prototype.toJSON = function toJSON() {
                  return {
                      type: 'Buffer',
                      data: Array.prototype.slice.call(this._arr || this, 0)
                  }
              }

              function base64Slice(buf, start, end) {
                  if (start === 0 && end === buf.length) {
                      return base64.fromByteArray(buf)
                  } else {
                      return base64.fromByteArray(buf.slice(start, end))
                  }
              }

              function utf8Slice(buf, start, end) {
                  end = Math.min(buf.length, end)
                  var res = []

                  var i = start
                  while (i < end) {
                      var firstByte = buf[i]
                      var codePoint = null
                      var bytesPerSequence = (firstByte > 0xEF) ? 4
                          : (firstByte > 0xDF) ? 3
                              : (firstByte > 0xBF) ? 2
                                  : 1

                      if (i + bytesPerSequence <= end) {
                          var secondByte, thirdByte, fourthByte, tempCodePoint

                          switch (bytesPerSequence) {
                              case 1:
                                  if (firstByte < 0x80) {
                                      codePoint = firstByte
                                  }
                                  break
                              case 2:
                                  secondByte = buf[i + 1]
                                  if ((secondByte & 0xC0) === 0x80) {
                                      tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
                                      if (tempCodePoint > 0x7F) {
                                          codePoint = tempCodePoint
                                      }
                                  }
                                  break
                              case 3:
                                  secondByte = buf[i + 1]
                                  thirdByte = buf[i + 2]
                                  if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                                      tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
                                      if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                                          codePoint = tempCodePoint
                                      }
                                  }
                                  break
                              case 4:
                                  secondByte = buf[i + 1]
                                  thirdByte = buf[i + 2]
                                  fourthByte = buf[i + 3]
                                  if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                                      tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
                                      if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                                          codePoint = tempCodePoint
                                      }
                                  }
                          }
                      }

                      if (codePoint === null) {
                          // we did not generate a valid codePoint so insert a
                          // replacement char (U+FFFD) and advance only 1 byte
                          codePoint = 0xFFFD
                          bytesPerSequence = 1
                      } else if (codePoint > 0xFFFF) {
                          // encode to utf16 (surrogate pair dance)
                          codePoint -= 0x10000
                          res.push(codePoint >>> 10 & 0x3FF | 0xD800)
                          codePoint = 0xDC00 | codePoint & 0x3FF
                      }

                      res.push(codePoint)
                      i += bytesPerSequence
                  }

                  return decodeCodePointsArray(res)
              }

              // Based on http://stackoverflow.com/a/22747272/680742, the browser with
              // the lowest limit is Chrome, with 0x10000 args.
              // We go 1 magnitude less, for safety
              var MAX_ARGUMENTS_LENGTH = 0x1000

              function decodeCodePointsArray(codePoints) {
                  var len = codePoints.length
                  if (len <= MAX_ARGUMENTS_LENGTH) {
                      return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
                  }

                  // Decode in chunks to avoid "call stack size exceeded".
                  var res = ''
                  var i = 0
                  while (i < len) {
                      res += String.fromCharCode.apply(
                          String,
                          codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
                      )
                  }
                  return res
              }

              function asciiSlice(buf, start, end) {
                  var ret = ''
                  end = Math.min(buf.length, end)

                  for (var i = start; i < end; ++i) {
                      ret += String.fromCharCode(buf[i] & 0x7F)
                  }
                  return ret
              }

              function latin1Slice(buf, start, end) {
                  var ret = ''
                  end = Math.min(buf.length, end)

                  for (var i = start; i < end; ++i) {
                      ret += String.fromCharCode(buf[i])
                  }
                  return ret
              }

              function hexSlice(buf, start, end) {
                  var len = buf.length

                  if (!start || start < 0) start = 0
                  if (!end || end < 0 || end > len) end = len

                  var out = ''
                  for (var i = start; i < end; ++i) {
                      out += toHex(buf[i])
                  }
                  return out
              }

              function utf16leSlice(buf, start, end) {
                  var bytes = buf.slice(start, end)
                  var res = ''
                  for (var i = 0; i < bytes.length; i += 2) {
                      res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
                  }
                  return res
              }

              Buffer.prototype.slice = function slice(start, end) {
                  var len = this.length
                  start = ~~start
                  end = end === undefined ? len : ~~end

                  if (start < 0) {
                      start += len
                      if (start < 0) start = 0
                  } else if (start > len) {
                      start = len
                  }

                  if (end < 0) {
                      end += len
                      if (end < 0) end = 0
                  } else if (end > len) {
                      end = len
                  }

                  if (end < start) end = start

                  var newBuf
                  if (Buffer.TYPED_ARRAY_SUPPORT) {
                      newBuf = this.subarray(start, end)
                      newBuf.__proto__ = Buffer.prototype
                  } else {
                      var sliceLen = end - start
                      newBuf = new Buffer(sliceLen, undefined)
                      for (var i = 0; i < sliceLen; ++i) {
                          newBuf[i] = this[i + start]
                      }
                  }

                  return newBuf
              }

              /*
               * Need to make sure that buffer isn't trying to write out of bounds.
               */
              function checkOffset(offset, ext, length) {
                  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
                  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
              }

              Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
                  offset = offset | 0
                  byteLength = byteLength | 0
                  if (!noAssert) checkOffset(offset, byteLength, this.length)

                  var val = this[offset]
                  var mul = 1
                  var i = 0
                  while (++i < byteLength && (mul *= 0x100)) {
                      val += this[offset + i] * mul
                  }

                  return val
              }

              Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
                  offset = offset | 0
                  byteLength = byteLength | 0
                  if (!noAssert) {
                      checkOffset(offset, byteLength, this.length)
                  }

                  var val = this[offset + --byteLength]
                  var mul = 1
                  while (byteLength > 0 && (mul *= 0x100)) {
                      val += this[offset + --byteLength] * mul
                  }

                  return val
              }

              Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
                  if (!noAssert) checkOffset(offset, 1, this.length)
                  return this[offset]
              }

              Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
                  if (!noAssert) checkOffset(offset, 2, this.length)
                  return this[offset] | (this[offset + 1] << 8)
              }

              Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
                  if (!noAssert) checkOffset(offset, 2, this.length)
                  return (this[offset] << 8) | this[offset + 1]
              }

              Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
                  if (!noAssert) checkOffset(offset, 4, this.length)

                  return ((this[offset]) |
                      (this[offset + 1] << 8) |
                      (this[offset + 2] << 16)) +
                      (this[offset + 3] * 0x1000000)
              }

              Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
                  if (!noAssert) checkOffset(offset, 4, this.length)

                  return (this[offset] * 0x1000000) +
                      ((this[offset + 1] << 16) |
                          (this[offset + 2] << 8) |
                          this[offset + 3])
              }

              Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
                  offset = offset | 0
                  byteLength = byteLength | 0
                  if (!noAssert) checkOffset(offset, byteLength, this.length)

                  var val = this[offset]
                  var mul = 1
                  var i = 0
                  while (++i < byteLength && (mul *= 0x100)) {
                      val += this[offset + i] * mul
                  }
                  mul *= 0x80

                  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

                  return val
              }

              Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
                  offset = offset | 0
                  byteLength = byteLength | 0
                  if (!noAssert) checkOffset(offset, byteLength, this.length)

                  var i = byteLength
                  var mul = 1
                  var val = this[offset + --i]
                  while (i > 0 && (mul *= 0x100)) {
                      val += this[offset + --i] * mul
                  }
                  mul *= 0x80

                  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

                  return val
              }

              Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
                  if (!noAssert) checkOffset(offset, 1, this.length)
                  if (!(this[offset] & 0x80)) return (this[offset])
                  return ((0xff - this[offset] + 1) * -1)
              }

              Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
                  if (!noAssert) checkOffset(offset, 2, this.length)
                  var val = this[offset] | (this[offset + 1] << 8)
                  return (val & 0x8000) ? val | 0xFFFF0000 : val
              }

              Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
                  if (!noAssert) checkOffset(offset, 2, this.length)
                  var val = this[offset + 1] | (this[offset] << 8)
                  return (val & 0x8000) ? val | 0xFFFF0000 : val
              }

              Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
                  if (!noAssert) checkOffset(offset, 4, this.length)

                  return (this[offset]) |
                      (this[offset + 1] << 8) |
                      (this[offset + 2] << 16) |
                      (this[offset + 3] << 24)
              }

              Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
                  if (!noAssert) checkOffset(offset, 4, this.length)

                  return (this[offset] << 24) |
                      (this[offset + 1] << 16) |
                      (this[offset + 2] << 8) |
                      (this[offset + 3])
              }

              Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
                  if (!noAssert) checkOffset(offset, 4, this.length)
                  return ieee754.read(this, offset, true, 23, 4)
              }

              Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
                  if (!noAssert) checkOffset(offset, 4, this.length)
                  return ieee754.read(this, offset, false, 23, 4)
              }

              Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
                  if (!noAssert) checkOffset(offset, 8, this.length)
                  return ieee754.read(this, offset, true, 52, 8)
              }

              Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
                  if (!noAssert) checkOffset(offset, 8, this.length)
                  return ieee754.read(this, offset, false, 52, 8)
              }

              function checkInt(buf, value, offset, ext, max, min) {
                  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
                  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
                  if (offset + ext > buf.length) throw new RangeError('Index out of range')
              }

              Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
                  value = +value
                  offset = offset | 0
                  byteLength = byteLength | 0
                  if (!noAssert) {
                      var maxBytes = Math.pow(2, 8 * byteLength) - 1
                      checkInt(this, value, offset, byteLength, maxBytes, 0)
                  }

                  var mul = 1
                  var i = 0
                  this[offset] = value & 0xFF
                  while (++i < byteLength && (mul *= 0x100)) {
                      this[offset + i] = (value / mul) & 0xFF
                  }

                  return offset + byteLength
              }

              Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
                  value = +value
                  offset = offset | 0
                  byteLength = byteLength | 0
                  if (!noAssert) {
                      var maxBytes = Math.pow(2, 8 * byteLength) - 1
                      checkInt(this, value, offset, byteLength, maxBytes, 0)
                  }

                  var i = byteLength - 1
                  var mul = 1
                  this[offset + i] = value & 0xFF
                  while (--i >= 0 && (mul *= 0x100)) {
                      this[offset + i] = (value / mul) & 0xFF
                  }

                  return offset + byteLength
              }

              Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
                  value = +value
                  offset = offset | 0
                  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
                  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
                  this[offset] = (value & 0xff)
                  return offset + 1
              }

              function objectWriteUInt16(buf, value, offset, littleEndian) {
                  if (value < 0) value = 0xffff + value + 1
                  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
                      buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
                          (littleEndian ? i : 1 - i) * 8
                  }
              }

              Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
                  value = +value
                  offset = offset | 0
                  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
                  if (Buffer.TYPED_ARRAY_SUPPORT) {
                      this[offset] = (value & 0xff)
                      this[offset + 1] = (value >>> 8)
                  } else {
                      objectWriteUInt16(this, value, offset, true)
                  }
                  return offset + 2
              }

              Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
                  value = +value
                  offset = offset | 0
                  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
                  if (Buffer.TYPED_ARRAY_SUPPORT) {
                      this[offset] = (value >>> 8)
                      this[offset + 1] = (value & 0xff)
                  } else {
                      objectWriteUInt16(this, value, offset, false)
                  }
                  return offset + 2
              }

              function objectWriteUInt32(buf, value, offset, littleEndian) {
                  if (value < 0) value = 0xffffffff + value + 1
                  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
                      buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
                  }
              }

              Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
                  value = +value
                  offset = offset | 0
                  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
                  if (Buffer.TYPED_ARRAY_SUPPORT) {
                      this[offset + 3] = (value >>> 24)
                      this[offset + 2] = (value >>> 16)
                      this[offset + 1] = (value >>> 8)
                      this[offset] = (value & 0xff)
                  } else {
                      objectWriteUInt32(this, value, offset, true)
                  }
                  return offset + 4
              }

              Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
                  value = +value
                  offset = offset | 0
                  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
                  if (Buffer.TYPED_ARRAY_SUPPORT) {
                      this[offset] = (value >>> 24)
                      this[offset + 1] = (value >>> 16)
                      this[offset + 2] = (value >>> 8)
                      this[offset + 3] = (value & 0xff)
                  } else {
                      objectWriteUInt32(this, value, offset, false)
                  }
                  return offset + 4
              }

              Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
                  value = +value
                  offset = offset | 0
                  if (!noAssert) {
                      var limit = Math.pow(2, 8 * byteLength - 1)

                      checkInt(this, value, offset, byteLength, limit - 1, -limit)
                  }

                  var i = 0
                  var mul = 1
                  var sub = 0
                  this[offset] = value & 0xFF
                  while (++i < byteLength && (mul *= 0x100)) {
                      if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
                          sub = 1
                      }
                      this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
                  }

                  return offset + byteLength
              }

              Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
                  value = +value
                  offset = offset | 0
                  if (!noAssert) {
                      var limit = Math.pow(2, 8 * byteLength - 1)

                      checkInt(this, value, offset, byteLength, limit - 1, -limit)
                  }

                  var i = byteLength - 1
                  var mul = 1
                  var sub = 0
                  this[offset + i] = value & 0xFF
                  while (--i >= 0 && (mul *= 0x100)) {
                      if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
                          sub = 1
                      }
                      this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
                  }

                  return offset + byteLength
              }

              Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
                  value = +value
                  offset = offset | 0
                  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
                  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
                  if (value < 0) value = 0xff + value + 1
                  this[offset] = (value & 0xff)
                  return offset + 1
              }

              Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
                  value = +value
                  offset = offset | 0
                  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
                  if (Buffer.TYPED_ARRAY_SUPPORT) {
                      this[offset] = (value & 0xff)
                      this[offset + 1] = (value >>> 8)
                  } else {
                      objectWriteUInt16(this, value, offset, true)
                  }
                  return offset + 2
              }

              Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
                  value = +value
                  offset = offset | 0
                  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
                  if (Buffer.TYPED_ARRAY_SUPPORT) {
                      this[offset] = (value >>> 8)
                      this[offset + 1] = (value & 0xff)
                  } else {
                      objectWriteUInt16(this, value, offset, false)
                  }
                  return offset + 2
              }

              Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
                  value = +value
                  offset = offset | 0
                  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
                  if (Buffer.TYPED_ARRAY_SUPPORT) {
                      this[offset] = (value & 0xff)
                      this[offset + 1] = (value >>> 8)
                      this[offset + 2] = (value >>> 16)
                      this[offset + 3] = (value >>> 24)
                  } else {
                      objectWriteUInt32(this, value, offset, true)
                  }
                  return offset + 4
              }

              Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
                  value = +value
                  offset = offset | 0
                  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
                  if (value < 0) value = 0xffffffff + value + 1
                  if (Buffer.TYPED_ARRAY_SUPPORT) {
                      this[offset] = (value >>> 24)
                      this[offset + 1] = (value >>> 16)
                      this[offset + 2] = (value >>> 8)
                      this[offset + 3] = (value & 0xff)
                  } else {
                      objectWriteUInt32(this, value, offset, false)
                  }
                  return offset + 4
              }

              function checkIEEE754(buf, value, offset, ext, max, min) {
                  if (offset + ext > buf.length) throw new RangeError('Index out of range')
                  if (offset < 0) throw new RangeError('Index out of range')
              }

              function writeFloat(buf, value, offset, littleEndian, noAssert) {
                  if (!noAssert) {
                      checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
                  }
                  ieee754.write(buf, value, offset, littleEndian, 23, 4)
                  return offset + 4
              }

              Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
                  return writeFloat(this, value, offset, true, noAssert)
              }

              Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
                  return writeFloat(this, value, offset, false, noAssert)
              }

              function writeDouble(buf, value, offset, littleEndian, noAssert) {
                  if (!noAssert) {
                      checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
                  }
                  ieee754.write(buf, value, offset, littleEndian, 52, 8)
                  return offset + 8
              }

              Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
                  return writeDouble(this, value, offset, true, noAssert)
              }

              Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
                  return writeDouble(this, value, offset, false, noAssert)
              }

              // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
              Buffer.prototype.copy = function copy(target, targetStart, start, end) {
                  if (!start) start = 0
                  if (!end && end !== 0) end = this.length
                  if (targetStart >= target.length) targetStart = target.length
                  if (!targetStart) targetStart = 0
                  if (end > 0 && end < start) end = start

                  // Copy 0 bytes; we're done
                  if (end === start) return 0
                  if (target.length === 0 || this.length === 0) return 0

                  // Fatal error conditions
                  if (targetStart < 0) {
                      throw new RangeError('targetStart out of bounds')
                  }
                  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
                  if (end < 0) throw new RangeError('sourceEnd out of bounds')

                  // Are we oob?
                  if (end > this.length) end = this.length
                  if (target.length - targetStart < end - start) {
                      end = target.length - targetStart + start
                  }

                  var len = end - start
                  var i

                  if (this === target && start < targetStart && targetStart < end) {
                      // descending copy from end
                      for (i = len - 1; i >= 0; --i) {
                          target[i + targetStart] = this[i + start]
                      }
                  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
                      // ascending copy from start
                      for (i = 0; i < len; ++i) {
                          target[i + targetStart] = this[i + start]
                      }
                  } else {
                      Uint8Array.prototype.set.call(
                          target,
                          this.subarray(start, start + len),
                          targetStart
                      )
                  }

                  return len
              }

              // Usage:
              //    buffer.fill(number[, offset[, end]])
              //    buffer.fill(buffer[, offset[, end]])
              //    buffer.fill(string[, offset[, end]][, encoding])
              Buffer.prototype.fill = function fill(val, start, end, encoding) {
                  // Handle string cases:
                  if (typeof val === 'string') {
                      if (typeof start === 'string') {
                          encoding = start
                          start = 0
                          end = this.length
                      } else if (typeof end === 'string') {
                          encoding = end
                          end = this.length
                      }
                      if (val.length === 1) {
                          var code = val.charCodeAt(0)
                          if (code < 256) {
                              val = code
                          }
                      }
                      if (encoding !== undefined && typeof encoding !== 'string') {
                          throw new TypeError('encoding must be a string')
                      }
                      if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
                          throw new TypeError('Unknown encoding: ' + encoding)
                      }
                  } else if (typeof val === 'number') {
                      val = val & 255
                  }

                  // Invalid ranges are not set to a default, so can range check early.
                  if (start < 0 || this.length < start || this.length < end) {
                      throw new RangeError('Out of range index')
                  }

                  if (end <= start) {
                      return this
                  }

                  start = start >>> 0
                  end = end === undefined ? this.length : end >>> 0

                  if (!val) val = 0

                  var i
                  if (typeof val === 'number') {
                      for (i = start; i < end; ++i) {
                          this[i] = val
                      }
                  } else {
                      var bytes = Buffer.isBuffer(val)
                          ? val
                          : utf8ToBytes(new Buffer(val, encoding).toString())
                      var len = bytes.length
                      for (i = 0; i < end - start; ++i) {
                          this[i + start] = bytes[i % len]
                      }
                  }

                  return this
              }

              // HELPER FUNCTIONS
              // ================

              var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

              function base64clean(str) {
                  // Node strips out invalid characters like \n and \t from the string, base64-js does not
                  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
                  // Node converts strings with length < 2 to ''
                  if (str.length < 2) return ''
                  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
                  while (str.length % 4 !== 0) {
                      str = str + '='
                  }
                  return str
              }

              function stringtrim(str) {
                  if (str.trim) return str.trim()
                  return str.replace(/^\s+|\s+$/g, '')
              }

              function toHex(n) {
                  if (n < 16) return '0' + n.toString(16)
                  return n.toString(16)
              }

              function utf8ToBytes(string, units) {
                  units = units || Infinity
                  var codePoint
                  var length = string.length
                  var leadSurrogate = null
                  var bytes = []

                  for (var i = 0; i < length; ++i) {
                      codePoint = string.charCodeAt(i)

                      // is surrogate component
                      if (codePoint > 0xD7FF && codePoint < 0xE000) {
                          // last char was a lead
                          if (!leadSurrogate) {
                              // no lead yet
                              if (codePoint > 0xDBFF) {
                                  // unexpected trail
                                  if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                                  continue
                              } else if (i + 1 === length) {
                                  // unpaired lead
                                  if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                                  continue
                              }

                              // valid lead
                              leadSurrogate = codePoint

                              continue
                          }

                          // 2 leads in a row
                          if (codePoint < 0xDC00) {
                              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                              leadSurrogate = codePoint
                              continue
                          }

                          // valid surrogate pair
                          codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
                      } else if (leadSurrogate) {
                          // valid bmp char, but last char was a lead
                          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                      }

                      leadSurrogate = null

                      // encode utf8
                      if (codePoint < 0x80) {
                          if ((units -= 1) < 0) break
                          bytes.push(codePoint)
                      } else if (codePoint < 0x800) {
                          if ((units -= 2) < 0) break
                          bytes.push(
                              codePoint >> 0x6 | 0xC0,
                              codePoint & 0x3F | 0x80
                          )
                      } else if (codePoint < 0x10000) {
                          if ((units -= 3) < 0) break
                          bytes.push(
                              codePoint >> 0xC | 0xE0,
                              codePoint >> 0x6 & 0x3F | 0x80,
                              codePoint & 0x3F | 0x80
                          )
                      } else if (codePoint < 0x110000) {
                          if ((units -= 4) < 0) break
                          bytes.push(
                              codePoint >> 0x12 | 0xF0,
                              codePoint >> 0xC & 0x3F | 0x80,
                              codePoint >> 0x6 & 0x3F | 0x80,
                              codePoint & 0x3F | 0x80
                          )
                      } else {
                          throw new Error('Invalid code point')
                      }
                  }

                  return bytes
              }

              function asciiToBytes(str) {
                  var byteArray = []
                  for (var i = 0; i < str.length; ++i) {
                      // Node's code seems to be doing this and not & 0x7F..
                      byteArray.push(str.charCodeAt(i) & 0xFF)
                  }
                  return byteArray
              }

              function utf16leToBytes(str, units) {
                  var c, hi, lo
                  var byteArray = []
                  for (var i = 0; i < str.length; ++i) {
                      if ((units -= 2) < 0) break

                      c = str.charCodeAt(i)
                      hi = c >> 8
                      lo = c % 256
                      byteArray.push(lo)
                      byteArray.push(hi)
                  }

                  return byteArray
              }

              function base64ToBytes(str) {
                  return base64.toByteArray(base64clean(str))
              }

              function blitBuffer(src, dst, offset, length) {
                  for (var i = 0; i < length; ++i) {
                      if ((i + offset >= dst.length) || (i >= src.length)) break
                      dst[i + offset] = src[i]
                  }
                  return i
              }

              function isnan(val) {
                  return val !== val // eslint-disable-line no-self-compare
              }

          }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
      }, { "base64-js": 6, "ieee754": 14, "isarray": 16 }], 8: [function (require, module, exports) {
          /*!
           * The buffer module from node.js, for the browser.
           *
           * @author   Feross Aboukhadijeh <https://feross.org>
           * @license  MIT
           */
          /* eslint-disable no-proto */

          'use strict'

          var base64 = require('base64-js')
          var ieee754 = require('ieee754')

          exports.Buffer = Buffer
          exports.SlowBuffer = SlowBuffer
          exports.INSPECT_MAX_BYTES = 50

          var K_MAX_LENGTH = 0x7fffffff
          exports.kMaxLength = K_MAX_LENGTH

          /**
           * If `Buffer.TYPED_ARRAY_SUPPORT`:
           *   === true    Use Uint8Array implementation (fastest)
           *   === false   Print warning and recommend using `buffer` v4.x which has an Object
           *               implementation (most compatible, even IE6)
           *
           * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
           * Opera 11.6+, iOS 4.2+.
           *
           * We report that the browser does not support typed arrays if the are not subclassable
           * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
           * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
           * for __proto__ and has a buggy typed array implementation.
           */
          Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

          if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
              typeof console.error === 'function') {
              console.error(
                  'This browser lacks typed array (Uint8Array) support which is required by ' +
                  '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
              )
          }

          function typedArraySupport() {
              // Can typed array instances can be augmented?
              try {
                  var arr = new Uint8Array(1)
                  arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
                  return arr.foo() === 42
              } catch (e) {
                  return false
              }
          }

          Object.defineProperty(Buffer.prototype, 'parent', {
              enumerable: true,
              get: function () {
                  if (!Buffer.isBuffer(this)) return undefined
                  return this.buffer
              }
          })

          Object.defineProperty(Buffer.prototype, 'offset', {
              enumerable: true,
              get: function () {
                  if (!Buffer.isBuffer(this)) return undefined
                  return this.byteOffset
              }
          })

          function createBuffer(length) {
              if (length > K_MAX_LENGTH) {
                  throw new RangeError('The value "' + length + '" is invalid for option "size"')
              }
              // Return an augmented `Uint8Array` instance
              var buf = new Uint8Array(length)
              buf.__proto__ = Buffer.prototype
              return buf
          }

          /**
           * The Buffer constructor returns instances of `Uint8Array` that have their
           * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
           * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
           * and the `Uint8Array` methods. Square bracket notation works as expected -- it
           * returns a single octet.
           *
           * The `Uint8Array` prototype remains unmodified.
           */

          function Buffer(arg, encodingOrOffset, length) {
              // Common case.
              if (typeof arg === 'number') {
                  if (typeof encodingOrOffset === 'string') {
                      throw new TypeError(
                          'The "string" argument must be of type string. Received type number'
                      )
                  }
                  return allocUnsafe(arg)
              }
              return from(arg, encodingOrOffset, length)
          }

          // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
          if (typeof Symbol !== 'undefined' && Symbol.species != null &&
              Buffer[Symbol.species] === Buffer) {
              Object.defineProperty(Buffer, Symbol.species, {
                  value: null,
                  configurable: true,
                  enumerable: false,
                  writable: false
              })
          }

          Buffer.poolSize = 8192 // not used by this implementation

          function from(value, encodingOrOffset, length) {
              if (typeof value === 'string') {
                  return fromString(value, encodingOrOffset)
              }

              if (ArrayBuffer.isView(value)) {
                  return fromArrayLike(value)
              }

              if (value == null) {
                  throw TypeError(
                      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
                      'or Array-like Object. Received type ' + (typeof value)
                  )
              }

              if (isInstance(value, ArrayBuffer) ||
                  (value && isInstance(value.buffer, ArrayBuffer))) {
                  return fromArrayBuffer(value, encodingOrOffset, length)
              }

              if (typeof value === 'number') {
                  throw new TypeError(
                      'The "value" argument must not be of type number. Received type number'
                  )
              }

              var valueOf = value.valueOf && value.valueOf()
              if (valueOf != null && valueOf !== value) {
                  return Buffer.from(valueOf, encodingOrOffset, length)
              }

              var b = fromObject(value)
              if (b) return b

              if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
                  typeof value[Symbol.toPrimitive] === 'function') {
                  return Buffer.from(
                      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
                  )
              }

              throw new TypeError(
                  'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
                  'or Array-like Object. Received type ' + (typeof value)
              )
          }

          /**
           * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
           * if value is a number.
           * Buffer.from(str[, encoding])
           * Buffer.from(array)
           * Buffer.from(buffer)
           * Buffer.from(arrayBuffer[, byteOffset[, length]])
           **/
          Buffer.from = function (value, encodingOrOffset, length) {
              return from(value, encodingOrOffset, length)
          }

          // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
          // https://github.com/feross/buffer/pull/148
          Buffer.prototype.__proto__ = Uint8Array.prototype
          Buffer.__proto__ = Uint8Array

          function assertSize(size) {
              if (typeof size !== 'number') {
                  throw new TypeError('"size" argument must be of type number')
              } else if (size < 0) {
                  throw new RangeError('The value "' + size + '" is invalid for option "size"')
              }
          }

          function alloc(size, fill, encoding) {
              assertSize(size)
              if (size <= 0) {
                  return createBuffer(size)
              }
              if (fill !== undefined) {
                  // Only pay attention to encoding if it's a string. This
                  // prevents accidentally sending in a number that would
                  // be interpretted as a start offset.
                  return typeof encoding === 'string'
                      ? createBuffer(size).fill(fill, encoding)
                      : createBuffer(size).fill(fill)
              }
              return createBuffer(size)
          }

          /**
           * Creates a new filled Buffer instance.
           * alloc(size[, fill[, encoding]])
           **/
          Buffer.alloc = function (size, fill, encoding) {
              return alloc(size, fill, encoding)
          }

          function allocUnsafe(size) {
              assertSize(size)
              return createBuffer(size < 0 ? 0 : checked(size) | 0)
          }

          /**
           * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
           * */
          Buffer.allocUnsafe = function (size) {
              return allocUnsafe(size)
          }
          /**
           * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
           */
          Buffer.allocUnsafeSlow = function (size) {
              return allocUnsafe(size)
          }

          function fromString(string, encoding) {
              if (typeof encoding !== 'string' || encoding === '') {
                  encoding = 'utf8'
              }

              if (!Buffer.isEncoding(encoding)) {
                  throw new TypeError('Unknown encoding: ' + encoding)
              }

              var length = byteLength(string, encoding) | 0
              var buf = createBuffer(length)

              var actual = buf.write(string, encoding)

              if (actual !== length) {
                  // Writing a hex string, for example, that contains invalid characters will
                  // cause everything after the first invalid character to be ignored. (e.g.
                  // 'abxxcd' will be treated as 'ab')
                  buf = buf.slice(0, actual)
              }

              return buf
          }

          function fromArrayLike(array) {
              var length = array.length < 0 ? 0 : checked(array.length) | 0
              var buf = createBuffer(length)
              for (var i = 0; i < length; i += 1) {
                  buf[i] = array[i] & 255
              }
              return buf
          }

          function fromArrayBuffer(array, byteOffset, length) {
              if (byteOffset < 0 || array.byteLength < byteOffset) {
                  throw new RangeError('"offset" is outside of buffer bounds')
              }

              if (array.byteLength < byteOffset + (length || 0)) {
                  throw new RangeError('"length" is outside of buffer bounds')
              }

              var buf
              if (byteOffset === undefined && length === undefined) {
                  buf = new Uint8Array(array)
              } else if (length === undefined) {
                  buf = new Uint8Array(array, byteOffset)
              } else {
                  buf = new Uint8Array(array, byteOffset, length)
              }

              // Return an augmented `Uint8Array` instance
              buf.__proto__ = Buffer.prototype
              return buf
          }

          function fromObject(obj) {
              if (Buffer.isBuffer(obj)) {
                  var len = checked(obj.length) | 0
                  var buf = createBuffer(len)

                  if (buf.length === 0) {
                      return buf
                  }

                  obj.copy(buf, 0, 0, len)
                  return buf
              }

              if (obj.length !== undefined) {
                  if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
                      return createBuffer(0)
                  }
                  return fromArrayLike(obj)
              }

              if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
                  return fromArrayLike(obj.data)
              }
          }

          function checked(length) {
              // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
              // length is NaN (which is otherwise coerced to zero.)
              if (length >= K_MAX_LENGTH) {
                  throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                      'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
              }
              return length | 0
          }

          function SlowBuffer(length) {
              if (+length != length) { // eslint-disable-line eqeqeq
                  length = 0
              }
              return Buffer.alloc(+length)
          }

          Buffer.isBuffer = function isBuffer(b) {
              return b != null && b._isBuffer === true &&
                  b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
          }

          Buffer.compare = function compare(a, b) {
              if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
              if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
              if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
                  throw new TypeError(
                      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
                  )
              }

              if (a === b) return 0

              var x = a.length
              var y = b.length

              for (var i = 0, len = Math.min(x, y); i < len; ++i) {
                  if (a[i] !== b[i]) {
                      x = a[i]
                      y = b[i]
                      break
                  }
              }

              if (x < y) return -1
              if (y < x) return 1
              return 0
          }

          Buffer.isEncoding = function isEncoding(encoding) {
              switch (String(encoding).toLowerCase()) {
                  case 'hex':
                  case 'utf8':
                  case 'utf-8':
                  case 'ascii':
                  case 'latin1':
                  case 'binary':
                  case 'base64':
                  case 'ucs2':
                  case 'ucs-2':
                  case 'utf16le':
                  case 'utf-16le':
                      return true
                  default:
                      return false
              }
          }

          Buffer.concat = function concat(list, length) {
              if (!Array.isArray(list)) {
                  throw new TypeError('"list" argument must be an Array of Buffers')
              }

              if (list.length === 0) {
                  return Buffer.alloc(0)
              }

              var i
              if (length === undefined) {
                  length = 0
                  for (i = 0; i < list.length; ++i) {
                      length += list[i].length
                  }
              }

              var buffer = Buffer.allocUnsafe(length)
              var pos = 0
              for (i = 0; i < list.length; ++i) {
                  var buf = list[i]
                  if (isInstance(buf, Uint8Array)) {
                      buf = Buffer.from(buf)
                  }
                  if (!Buffer.isBuffer(buf)) {
                      throw new TypeError('"list" argument must be an Array of Buffers')
                  }
                  buf.copy(buffer, pos)
                  pos += buf.length
              }
              return buffer
          }

          function byteLength(string, encoding) {
              if (Buffer.isBuffer(string)) {
                  return string.length
              }
              if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
                  return string.byteLength
              }
              if (typeof string !== 'string') {
                  throw new TypeError(
                      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
                      'Received type ' + typeof string
                  )
              }

              var len = string.length
              var mustMatch = (arguments.length > 2 && arguments[2] === true)
              if (!mustMatch && len === 0) return 0

              // Use a for loop to avoid recursion
              var loweredCase = false
              for (; ;) {
                  switch (encoding) {
                      case 'ascii':
                      case 'latin1':
                      case 'binary':
                          return len
                      case 'utf8':
                      case 'utf-8':
                          return utf8ToBytes(string).length
                      case 'ucs2':
                      case 'ucs-2':
                      case 'utf16le':
                      case 'utf-16le':
                          return len * 2
                      case 'hex':
                          return len >>> 1
                      case 'base64':
                          return base64ToBytes(string).length
                      default:
                          if (loweredCase) {
                              return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
                          }
                          encoding = ('' + encoding).toLowerCase()
                          loweredCase = true
                  }
              }
          }
          Buffer.byteLength = byteLength

          function slowToString(encoding, start, end) {
              var loweredCase = false

              // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
              // property of a typed array.

              // This behaves neither like String nor Uint8Array in that we set start/end
              // to their upper/lower bounds if the value passed is out of range.
              // undefined is handled specially as per ECMA-262 6th Edition,
              // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
              if (start === undefined || start < 0) {
                  start = 0
              }
              // Return early if start > this.length. Done here to prevent potential uint32
              // coercion fail below.
              if (start > this.length) {
                  return ''
              }

              if (end === undefined || end > this.length) {
                  end = this.length
              }

              if (end <= 0) {
                  return ''
              }

              // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
              end >>>= 0
              start >>>= 0

              if (end <= start) {
                  return ''
              }

              if (!encoding) encoding = 'utf8'

              while (true) {
                  switch (encoding) {
                      case 'hex':
                          return hexSlice(this, start, end)

                      case 'utf8':
                      case 'utf-8':
                          return utf8Slice(this, start, end)

                      case 'ascii':
                          return asciiSlice(this, start, end)

                      case 'latin1':
                      case 'binary':
                          return latin1Slice(this, start, end)

                      case 'base64':
                          return base64Slice(this, start, end)

                      case 'ucs2':
                      case 'ucs-2':
                      case 'utf16le':
                      case 'utf-16le':
                          return utf16leSlice(this, start, end)

                      default:
                          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
                          encoding = (encoding + '').toLowerCase()
                          loweredCase = true
                  }
              }
          }

          // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
          // to detect a Buffer instance. It's not possible to use `instanceof Buffer`
          // reliably in a browserify context because there could be multiple different
          // copies of the 'buffer' package in use. This method works even for Buffer
          // instances that were created from another copy of the `buffer` package.
          // See: https://github.com/feross/buffer/issues/154
          Buffer.prototype._isBuffer = true

          function swap(b, n, m) {
              var i = b[n]
              b[n] = b[m]
              b[m] = i
          }

          Buffer.prototype.swap16 = function swap16() {
              var len = this.length
              if (len % 2 !== 0) {
                  throw new RangeError('Buffer size must be a multiple of 16-bits')
              }
              for (var i = 0; i < len; i += 2) {
                  swap(this, i, i + 1)
              }
              return this
          }

          Buffer.prototype.swap32 = function swap32() {
              var len = this.length
              if (len % 4 !== 0) {
                  throw new RangeError('Buffer size must be a multiple of 32-bits')
              }
              for (var i = 0; i < len; i += 4) {
                  swap(this, i, i + 3)
                  swap(this, i + 1, i + 2)
              }
              return this
          }

          Buffer.prototype.swap64 = function swap64() {
              var len = this.length
              if (len % 8 !== 0) {
                  throw new RangeError('Buffer size must be a multiple of 64-bits')
              }
              for (var i = 0; i < len; i += 8) {
                  swap(this, i, i + 7)
                  swap(this, i + 1, i + 6)
                  swap(this, i + 2, i + 5)
                  swap(this, i + 3, i + 4)
              }
              return this
          }

          Buffer.prototype.toString = function toString() {
              var length = this.length
              if (length === 0) return ''
              if (arguments.length === 0) return utf8Slice(this, 0, length)
              return slowToString.apply(this, arguments)
          }

          Buffer.prototype.toLocaleString = Buffer.prototype.toString

          Buffer.prototype.equals = function equals(b) {
              if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
              if (this === b) return true
              return Buffer.compare(this, b) === 0
          }

          Buffer.prototype.inspect = function inspect() {
              var str = ''
              var max = exports.INSPECT_MAX_BYTES
              str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
              if (this.length > max) str += ' ... '
              return '<Buffer ' + str + '>'
          }

          Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
              if (isInstance(target, Uint8Array)) {
                  target = Buffer.from(target, target.offset, target.byteLength)
              }
              if (!Buffer.isBuffer(target)) {
                  throw new TypeError(
                      'The "target" argument must be one of type Buffer or Uint8Array. ' +
                      'Received type ' + (typeof target)
                  )
              }

              if (start === undefined) {
                  start = 0
              }
              if (end === undefined) {
                  end = target ? target.length : 0
              }
              if (thisStart === undefined) {
                  thisStart = 0
              }
              if (thisEnd === undefined) {
                  thisEnd = this.length
              }

              if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
                  throw new RangeError('out of range index')
              }

              if (thisStart >= thisEnd && start >= end) {
                  return 0
              }
              if (thisStart >= thisEnd) {
                  return -1
              }
              if (start >= end) {
                  return 1
              }

              start >>>= 0
              end >>>= 0
              thisStart >>>= 0
              thisEnd >>>= 0

              if (this === target) return 0

              var x = thisEnd - thisStart
              var y = end - start
              var len = Math.min(x, y)

              var thisCopy = this.slice(thisStart, thisEnd)
              var targetCopy = target.slice(start, end)

              for (var i = 0; i < len; ++i) {
                  if (thisCopy[i] !== targetCopy[i]) {
                      x = thisCopy[i]
                      y = targetCopy[i]
                      break
                  }
              }

              if (x < y) return -1
              if (y < x) return 1
              return 0
          }

          // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
          // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
          //
          // Arguments:
          // - buffer - a Buffer to search
          // - val - a string, Buffer, or number
          // - byteOffset - an index into `buffer`; will be clamped to an int32
          // - encoding - an optional encoding, relevant is val is a string
          // - dir - true for indexOf, false for lastIndexOf
          function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
              // Empty buffer means no match
              if (buffer.length === 0) return -1

              // Normalize byteOffset
              if (typeof byteOffset === 'string') {
                  encoding = byteOffset
                  byteOffset = 0
              } else if (byteOffset > 0x7fffffff) {
                  byteOffset = 0x7fffffff
              } else if (byteOffset < -0x80000000) {
                  byteOffset = -0x80000000
              }
              byteOffset = +byteOffset // Coerce to Number.
              if (numberIsNaN(byteOffset)) {
                  // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
                  byteOffset = dir ? 0 : (buffer.length - 1)
              }

              // Normalize byteOffset: negative offsets start from the end of the buffer
              if (byteOffset < 0) byteOffset = buffer.length + byteOffset
              if (byteOffset >= buffer.length) {
                  if (dir) return -1
                  else byteOffset = buffer.length - 1
              } else if (byteOffset < 0) {
                  if (dir) byteOffset = 0
                  else return -1
              }

              // Normalize val
              if (typeof val === 'string') {
                  val = Buffer.from(val, encoding)
              }

              // Finally, search either indexOf (if dir is true) or lastIndexOf
              if (Buffer.isBuffer(val)) {
                  // Special case: looking for empty string/buffer always fails
                  if (val.length === 0) {
                      return -1
                  }
                  return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
              } else if (typeof val === 'number') {
                  val = val & 0xFF // Search for a byte value [0-255]
                  if (typeof Uint8Array.prototype.indexOf === 'function') {
                      if (dir) {
                          return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
                      } else {
                          return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
                      }
                  }
                  return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
              }

              throw new TypeError('val must be string, number or Buffer')
          }

          function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
              var indexSize = 1
              var arrLength = arr.length
              var valLength = val.length

              if (encoding !== undefined) {
                  encoding = String(encoding).toLowerCase()
                  if (encoding === 'ucs2' || encoding === 'ucs-2' ||
                      encoding === 'utf16le' || encoding === 'utf-16le') {
                      if (arr.length < 2 || val.length < 2) {
                          return -1
                      }
                      indexSize = 2
                      arrLength /= 2
                      valLength /= 2
                      byteOffset /= 2
                  }
              }

              function read(buf, i) {
                  if (indexSize === 1) {
                      return buf[i]
                  } else {
                      return buf.readUInt16BE(i * indexSize)
                  }
              }

              var i
              if (dir) {
                  var foundIndex = -1
                  for (i = byteOffset; i < arrLength; i++) {
                      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
                          if (foundIndex === -1) foundIndex = i
                          if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
                      } else {
                          if (foundIndex !== -1) i -= i - foundIndex
                          foundIndex = -1
                      }
                  }
              } else {
                  if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
                  for (i = byteOffset; i >= 0; i--) {
                      var found = true
                      for (var j = 0; j < valLength; j++) {
                          if (read(arr, i + j) !== read(val, j)) {
                              found = false
                              break
                          }
                      }
                      if (found) return i
                  }
              }

              return -1
          }

          Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
              return this.indexOf(val, byteOffset, encoding) !== -1
          }

          Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
              return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
          }

          Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
              return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
          }

          function hexWrite(buf, string, offset, length) {
              offset = Number(offset) || 0
              var remaining = buf.length - offset
              if (!length) {
                  length = remaining
              } else {
                  length = Number(length)
                  if (length > remaining) {
                      length = remaining
                  }
              }

              var strLen = string.length

              if (length > strLen / 2) {
                  length = strLen / 2
              }
              for (var i = 0; i < length; ++i) {
                  var parsed = parseInt(string.substr(i * 2, 2), 16)
                  if (numberIsNaN(parsed)) return i
                  buf[offset + i] = parsed
              }
              return i
          }

          function utf8Write(buf, string, offset, length) {
              return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
          }

          function asciiWrite(buf, string, offset, length) {
              return blitBuffer(asciiToBytes(string), buf, offset, length)
          }

          function latin1Write(buf, string, offset, length) {
              return asciiWrite(buf, string, offset, length)
          }

          function base64Write(buf, string, offset, length) {
              return blitBuffer(base64ToBytes(string), buf, offset, length)
          }

          function ucs2Write(buf, string, offset, length) {
              return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
          }

          Buffer.prototype.write = function write(string, offset, length, encoding) {
              // Buffer#write(string)
              if (offset === undefined) {
                  encoding = 'utf8'
                  length = this.length
                  offset = 0
                  // Buffer#write(string, encoding)
              } else if (length === undefined && typeof offset === 'string') {
                  encoding = offset
                  length = this.length
                  offset = 0
                  // Buffer#write(string, offset[, length][, encoding])
              } else if (isFinite(offset)) {
                  offset = offset >>> 0
                  if (isFinite(length)) {
                      length = length >>> 0
                      if (encoding === undefined) encoding = 'utf8'
                  } else {
                      encoding = length
                      length = undefined
                  }
              } else {
                  throw new Error(
                      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
                  )
              }

              var remaining = this.length - offset
              if (length === undefined || length > remaining) length = remaining

              if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
                  throw new RangeError('Attempt to write outside buffer bounds')
              }

              if (!encoding) encoding = 'utf8'

              var loweredCase = false
              for (; ;) {
                  switch (encoding) {
                      case 'hex':
                          return hexWrite(this, string, offset, length)

                      case 'utf8':
                      case 'utf-8':
                          return utf8Write(this, string, offset, length)

                      case 'ascii':
                          return asciiWrite(this, string, offset, length)

                      case 'latin1':
                      case 'binary':
                          return latin1Write(this, string, offset, length)

                      case 'base64':
                          // Warning: maxLength not taken into account in base64Write
                          return base64Write(this, string, offset, length)

                      case 'ucs2':
                      case 'ucs-2':
                      case 'utf16le':
                      case 'utf-16le':
                          return ucs2Write(this, string, offset, length)

                      default:
                          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
                          encoding = ('' + encoding).toLowerCase()
                          loweredCase = true
                  }
              }
          }

          Buffer.prototype.toJSON = function toJSON() {
              return {
                  type: 'Buffer',
                  data: Array.prototype.slice.call(this._arr || this, 0)
              }
          }

          function base64Slice(buf, start, end) {
              if (start === 0 && end === buf.length) {
                  return base64.fromByteArray(buf)
              } else {
                  return base64.fromByteArray(buf.slice(start, end))
              }
          }

          function utf8Slice(buf, start, end) {
              end = Math.min(buf.length, end)
              var res = []

              var i = start
              while (i < end) {
                  var firstByte = buf[i]
                  var codePoint = null
                  var bytesPerSequence = (firstByte > 0xEF) ? 4
                      : (firstByte > 0xDF) ? 3
                          : (firstByte > 0xBF) ? 2
                              : 1

                  if (i + bytesPerSequence <= end) {
                      var secondByte, thirdByte, fourthByte, tempCodePoint

                      switch (bytesPerSequence) {
                          case 1:
                              if (firstByte < 0x80) {
                                  codePoint = firstByte
                              }
                              break
                          case 2:
                              secondByte = buf[i + 1]
                              if ((secondByte & 0xC0) === 0x80) {
                                  tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
                                  if (tempCodePoint > 0x7F) {
                                      codePoint = tempCodePoint
                                  }
                              }
                              break
                          case 3:
                              secondByte = buf[i + 1]
                              thirdByte = buf[i + 2]
                              if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                                  tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
                                  if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                                      codePoint = tempCodePoint
                                  }
                              }
                              break
                          case 4:
                              secondByte = buf[i + 1]
                              thirdByte = buf[i + 2]
                              fourthByte = buf[i + 3]
                              if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                                  tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
                                  if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                                      codePoint = tempCodePoint
                                  }
                              }
                      }
                  }

                  if (codePoint === null) {
                      // we did not generate a valid codePoint so insert a
                      // replacement char (U+FFFD) and advance only 1 byte
                      codePoint = 0xFFFD
                      bytesPerSequence = 1
                  } else if (codePoint > 0xFFFF) {
                      // encode to utf16 (surrogate pair dance)
                      codePoint -= 0x10000
                      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
                      codePoint = 0xDC00 | codePoint & 0x3FF
                  }

                  res.push(codePoint)
                  i += bytesPerSequence
              }

              return decodeCodePointsArray(res)
          }

          // Based on http://stackoverflow.com/a/22747272/680742, the browser with
          // the lowest limit is Chrome, with 0x10000 args.
          // We go 1 magnitude less, for safety
          var MAX_ARGUMENTS_LENGTH = 0x1000

          function decodeCodePointsArray(codePoints) {
              var len = codePoints.length
              if (len <= MAX_ARGUMENTS_LENGTH) {
                  return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
              }

              // Decode in chunks to avoid "call stack size exceeded".
              var res = ''
              var i = 0
              while (i < len) {
                  res += String.fromCharCode.apply(
                      String,
                      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
                  )
              }
              return res
          }

          function asciiSlice(buf, start, end) {
              var ret = ''
              end = Math.min(buf.length, end)

              for (var i = start; i < end; ++i) {
                  ret += String.fromCharCode(buf[i] & 0x7F)
              }
              return ret
          }

          function latin1Slice(buf, start, end) {
              var ret = ''
              end = Math.min(buf.length, end)

              for (var i = start; i < end; ++i) {
                  ret += String.fromCharCode(buf[i])
              }
              return ret
          }

          function hexSlice(buf, start, end) {
              var len = buf.length

              if (!start || start < 0) start = 0
              if (!end || end < 0 || end > len) end = len

              var out = ''
              for (var i = start; i < end; ++i) {
                  out += toHex(buf[i])
              }
              return out
          }

          function utf16leSlice(buf, start, end) {
              var bytes = buf.slice(start, end)
              var res = ''
              for (var i = 0; i < bytes.length; i += 2) {
                  res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
              }
              return res
          }

          Buffer.prototype.slice = function slice(start, end) {
              var len = this.length
              start = ~~start
              end = end === undefined ? len : ~~end

              if (start < 0) {
                  start += len
                  if (start < 0) start = 0
              } else if (start > len) {
                  start = len
              }

              if (end < 0) {
                  end += len
                  if (end < 0) end = 0
              } else if (end > len) {
                  end = len
              }

              if (end < start) end = start

              var newBuf = this.subarray(start, end)
              // Return an augmented `Uint8Array` instance
              newBuf.__proto__ = Buffer.prototype
              return newBuf
          }

          /*
           * Need to make sure that buffer isn't trying to write out of bounds.
           */
          function checkOffset(offset, ext, length) {
              if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
              if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
          }

          Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
              offset = offset >>> 0
              byteLength = byteLength >>> 0
              if (!noAssert) checkOffset(offset, byteLength, this.length)

              var val = this[offset]
              var mul = 1
              var i = 0
              while (++i < byteLength && (mul *= 0x100)) {
                  val += this[offset + i] * mul
              }

              return val
          }

          Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
              offset = offset >>> 0
              byteLength = byteLength >>> 0
              if (!noAssert) {
                  checkOffset(offset, byteLength, this.length)
              }

              var val = this[offset + --byteLength]
              var mul = 1
              while (byteLength > 0 && (mul *= 0x100)) {
                  val += this[offset + --byteLength] * mul
              }

              return val
          }

          Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
              offset = offset >>> 0
              if (!noAssert) checkOffset(offset, 1, this.length)
              return this[offset]
          }

          Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
              offset = offset >>> 0
              if (!noAssert) checkOffset(offset, 2, this.length)
              return this[offset] | (this[offset + 1] << 8)
          }

          Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
              offset = offset >>> 0
              if (!noAssert) checkOffset(offset, 2, this.length)
              return (this[offset] << 8) | this[offset + 1]
          }

          Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
              offset = offset >>> 0
              if (!noAssert) checkOffset(offset, 4, this.length)

              return ((this[offset]) |
                  (this[offset + 1] << 8) |
                  (this[offset + 2] << 16)) +
                  (this[offset + 3] * 0x1000000)
          }

          Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
              offset = offset >>> 0
              if (!noAssert) checkOffset(offset, 4, this.length)

              return (this[offset] * 0x1000000) +
                  ((this[offset + 1] << 16) |
                      (this[offset + 2] << 8) |
                      this[offset + 3])
          }

          Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
              offset = offset >>> 0
              byteLength = byteLength >>> 0
              if (!noAssert) checkOffset(offset, byteLength, this.length)

              var val = this[offset]
              var mul = 1
              var i = 0
              while (++i < byteLength && (mul *= 0x100)) {
                  val += this[offset + i] * mul
              }
              mul *= 0x80

              if (val >= mul) val -= Math.pow(2, 8 * byteLength)

              return val
          }

          Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
              offset = offset >>> 0
              byteLength = byteLength >>> 0
              if (!noAssert) checkOffset(offset, byteLength, this.length)

              var i = byteLength
              var mul = 1
              var val = this[offset + --i]
              while (i > 0 && (mul *= 0x100)) {
                  val += this[offset + --i] * mul
              }
              mul *= 0x80

              if (val >= mul) val -= Math.pow(2, 8 * byteLength)

              return val
          }

          Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
              offset = offset >>> 0
              if (!noAssert) checkOffset(offset, 1, this.length)
              if (!(this[offset] & 0x80)) return (this[offset])
              return ((0xff - this[offset] + 1) * -1)
          }

          Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
              offset = offset >>> 0
              if (!noAssert) checkOffset(offset, 2, this.length)
              var val = this[offset] | (this[offset + 1] << 8)
              return (val & 0x8000) ? val | 0xFFFF0000 : val
          }

          Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
              offset = offset >>> 0
              if (!noAssert) checkOffset(offset, 2, this.length)
              var val = this[offset + 1] | (this[offset] << 8)
              return (val & 0x8000) ? val | 0xFFFF0000 : val
          }

          Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
              offset = offset >>> 0
              if (!noAssert) checkOffset(offset, 4, this.length)

              return (this[offset]) |
                  (this[offset + 1] << 8) |
                  (this[offset + 2] << 16) |
                  (this[offset + 3] << 24)
          }

          Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
              offset = offset >>> 0
              if (!noAssert) checkOffset(offset, 4, this.length)

              return (this[offset] << 24) |
                  (this[offset + 1] << 16) |
                  (this[offset + 2] << 8) |
                  (this[offset + 3])
          }

          Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
              offset = offset >>> 0
              if (!noAssert) checkOffset(offset, 4, this.length)
              return ieee754.read(this, offset, true, 23, 4)
          }

          Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
              offset = offset >>> 0
              if (!noAssert) checkOffset(offset, 4, this.length)
              return ieee754.read(this, offset, false, 23, 4)
          }

          Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
              offset = offset >>> 0
              if (!noAssert) checkOffset(offset, 8, this.length)
              return ieee754.read(this, offset, true, 52, 8)
          }

          Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
              offset = offset >>> 0
              if (!noAssert) checkOffset(offset, 8, this.length)
              return ieee754.read(this, offset, false, 52, 8)
          }

          function checkInt(buf, value, offset, ext, max, min) {
              if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
              if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
              if (offset + ext > buf.length) throw new RangeError('Index out of range')
          }

          Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
              value = +value
              offset = offset >>> 0
              byteLength = byteLength >>> 0
              if (!noAssert) {
                  var maxBytes = Math.pow(2, 8 * byteLength) - 1
                  checkInt(this, value, offset, byteLength, maxBytes, 0)
              }

              var mul = 1
              var i = 0
              this[offset] = value & 0xFF
              while (++i < byteLength && (mul *= 0x100)) {
                  this[offset + i] = (value / mul) & 0xFF
              }

              return offset + byteLength
          }

          Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
              value = +value
              offset = offset >>> 0
              byteLength = byteLength >>> 0
              if (!noAssert) {
                  var maxBytes = Math.pow(2, 8 * byteLength) - 1
                  checkInt(this, value, offset, byteLength, maxBytes, 0)
              }

              var i = byteLength - 1
              var mul = 1
              this[offset + i] = value & 0xFF
              while (--i >= 0 && (mul *= 0x100)) {
                  this[offset + i] = (value / mul) & 0xFF
              }

              return offset + byteLength
          }

          Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
              value = +value
              offset = offset >>> 0
              if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
              this[offset] = (value & 0xff)
              return offset + 1
          }

          Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
              value = +value
              offset = offset >>> 0
              if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
              this[offset] = (value & 0xff)
              this[offset + 1] = (value >>> 8)
              return offset + 2
          }

          Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
              value = +value
              offset = offset >>> 0
              if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
              this[offset] = (value >>> 8)
              this[offset + 1] = (value & 0xff)
              return offset + 2
          }

          Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
              value = +value
              offset = offset >>> 0
              if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
              this[offset + 3] = (value >>> 24)
              this[offset + 2] = (value >>> 16)
              this[offset + 1] = (value >>> 8)
              this[offset] = (value & 0xff)
              return offset + 4
          }

          Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
              value = +value
              offset = offset >>> 0
              if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
              this[offset] = (value >>> 24)
              this[offset + 1] = (value >>> 16)
              this[offset + 2] = (value >>> 8)
              this[offset + 3] = (value & 0xff)
              return offset + 4
          }

          Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
              value = +value
              offset = offset >>> 0
              if (!noAssert) {
                  var limit = Math.pow(2, (8 * byteLength) - 1)

                  checkInt(this, value, offset, byteLength, limit - 1, -limit)
              }

              var i = 0
              var mul = 1
              var sub = 0
              this[offset] = value & 0xFF
              while (++i < byteLength && (mul *= 0x100)) {
                  if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
                      sub = 1
                  }
                  this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
              }

              return offset + byteLength
          }

          Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
              value = +value
              offset = offset >>> 0
              if (!noAssert) {
                  var limit = Math.pow(2, (8 * byteLength) - 1)

                  checkInt(this, value, offset, byteLength, limit - 1, -limit)
              }

              var i = byteLength - 1
              var mul = 1
              var sub = 0
              this[offset + i] = value & 0xFF
              while (--i >= 0 && (mul *= 0x100)) {
                  if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
                      sub = 1
                  }
                  this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
              }

              return offset + byteLength
          }

          Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
              value = +value
              offset = offset >>> 0
              if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
              if (value < 0) value = 0xff + value + 1
              this[offset] = (value & 0xff)
              return offset + 1
          }

          Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
              value = +value
              offset = offset >>> 0
              if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
              this[offset] = (value & 0xff)
              this[offset + 1] = (value >>> 8)
              return offset + 2
          }

          Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
              value = +value
              offset = offset >>> 0
              if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
              this[offset] = (value >>> 8)
              this[offset + 1] = (value & 0xff)
              return offset + 2
          }

          Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
              value = +value
              offset = offset >>> 0
              if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
              this[offset] = (value & 0xff)
              this[offset + 1] = (value >>> 8)
              this[offset + 2] = (value >>> 16)
              this[offset + 3] = (value >>> 24)
              return offset + 4
          }

          Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
              value = +value
              offset = offset >>> 0
              if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
              if (value < 0) value = 0xffffffff + value + 1
              this[offset] = (value >>> 24)
              this[offset + 1] = (value >>> 16)
              this[offset + 2] = (value >>> 8)
              this[offset + 3] = (value & 0xff)
              return offset + 4
          }

          function checkIEEE754(buf, value, offset, ext, max, min) {
              if (offset + ext > buf.length) throw new RangeError('Index out of range')
              if (offset < 0) throw new RangeError('Index out of range')
          }

          function writeFloat(buf, value, offset, littleEndian, noAssert) {
              value = +value
              offset = offset >>> 0
              if (!noAssert) {
                  checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
              }
              ieee754.write(buf, value, offset, littleEndian, 23, 4)
              return offset + 4
          }

          Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
              return writeFloat(this, value, offset, true, noAssert)
          }

          Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
              return writeFloat(this, value, offset, false, noAssert)
          }

          function writeDouble(buf, value, offset, littleEndian, noAssert) {
              value = +value
              offset = offset >>> 0
              if (!noAssert) {
                  checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
              }
              ieee754.write(buf, value, offset, littleEndian, 52, 8)
              return offset + 8
          }

          Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
              return writeDouble(this, value, offset, true, noAssert)
          }

          Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
              return writeDouble(this, value, offset, false, noAssert)
          }

          // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
          Buffer.prototype.copy = function copy(target, targetStart, start, end) {
              if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
              if (!start) start = 0
              if (!end && end !== 0) end = this.length
              if (targetStart >= target.length) targetStart = target.length
              if (!targetStart) targetStart = 0
              if (end > 0 && end < start) end = start

              // Copy 0 bytes; we're done
              if (end === start) return 0
              if (target.length === 0 || this.length === 0) return 0

              // Fatal error conditions
              if (targetStart < 0) {
                  throw new RangeError('targetStart out of bounds')
              }
              if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
              if (end < 0) throw new RangeError('sourceEnd out of bounds')

              // Are we oob?
              if (end > this.length) end = this.length
              if (target.length - targetStart < end - start) {
                  end = target.length - targetStart + start
              }

              var len = end - start

              if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
                  // Use built-in when available, missing from IE11
                  this.copyWithin(targetStart, start, end)
              } else if (this === target && start < targetStart && targetStart < end) {
                  // descending copy from end
                  for (var i = len - 1; i >= 0; --i) {
                      target[i + targetStart] = this[i + start]
                  }
              } else {
                  Uint8Array.prototype.set.call(
                      target,
                      this.subarray(start, end),
                      targetStart
                  )
              }

              return len
          }

          // Usage:
          //    buffer.fill(number[, offset[, end]])
          //    buffer.fill(buffer[, offset[, end]])
          //    buffer.fill(string[, offset[, end]][, encoding])
          Buffer.prototype.fill = function fill(val, start, end, encoding) {
              // Handle string cases:
              if (typeof val === 'string') {
                  if (typeof start === 'string') {
                      encoding = start
                      start = 0
                      end = this.length
                  } else if (typeof end === 'string') {
                      encoding = end
                      end = this.length
                  }
                  if (encoding !== undefined && typeof encoding !== 'string') {
                      throw new TypeError('encoding must be a string')
                  }
                  if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
                      throw new TypeError('Unknown encoding: ' + encoding)
                  }
                  if (val.length === 1) {
                      var code = val.charCodeAt(0)
                      if ((encoding === 'utf8' && code < 128) ||
                          encoding === 'latin1') {
                          // Fast path: If `val` fits into a single byte, use that numeric value.
                          val = code
                      }
                  }
              } else if (typeof val === 'number') {
                  val = val & 255
              }

              // Invalid ranges are not set to a default, so can range check early.
              if (start < 0 || this.length < start || this.length < end) {
                  throw new RangeError('Out of range index')
              }

              if (end <= start) {
                  return this
              }

              start = start >>> 0
              end = end === undefined ? this.length : end >>> 0

              if (!val) val = 0

              var i
              if (typeof val === 'number') {
                  for (i = start; i < end; ++i) {
                      this[i] = val
                  }
              } else {
                  var bytes = Buffer.isBuffer(val)
                      ? val
                      : Buffer.from(val, encoding)
                  var len = bytes.length
                  if (len === 0) {
                      throw new TypeError('The value "' + val +
                          '" is invalid for argument "value"')
                  }
                  for (i = 0; i < end - start; ++i) {
                      this[i + start] = bytes[i % len]
                  }
              }

              return this
          }

          // HELPER FUNCTIONS
          // ================

          var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

          function base64clean(str) {
              // Node takes equal signs as end of the Base64 encoding
              str = str.split('=')[0]
              // Node strips out invalid characters like \n and \t from the string, base64-js does not
              str = str.trim().replace(INVALID_BASE64_RE, '')
              // Node converts strings with length < 2 to ''
              if (str.length < 2) return ''
              // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
              while (str.length % 4 !== 0) {
                  str = str + '='
              }
              return str
          }

          function toHex(n) {
              if (n < 16) return '0' + n.toString(16)
              return n.toString(16)
          }

          function utf8ToBytes(string, units) {
              units = units || Infinity
              var codePoint
              var length = string.length
              var leadSurrogate = null
              var bytes = []

              for (var i = 0; i < length; ++i) {
                  codePoint = string.charCodeAt(i)

                  // is surrogate component
                  if (codePoint > 0xD7FF && codePoint < 0xE000) {
                      // last char was a lead
                      if (!leadSurrogate) {
                          // no lead yet
                          if (codePoint > 0xDBFF) {
                              // unexpected trail
                              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                              continue
                          } else if (i + 1 === length) {
                              // unpaired lead
                              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                              continue
                          }

                          // valid lead
                          leadSurrogate = codePoint

                          continue
                      }

                      // 2 leads in a row
                      if (codePoint < 0xDC00) {
                          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                          leadSurrogate = codePoint
                          continue
                      }

                      // valid surrogate pair
                      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
                  } else if (leadSurrogate) {
                      // valid bmp char, but last char was a lead
                      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                  }

                  leadSurrogate = null

                  // encode utf8
                  if (codePoint < 0x80) {
                      if ((units -= 1) < 0) break
                      bytes.push(codePoint)
                  } else if (codePoint < 0x800) {
                      if ((units -= 2) < 0) break
                      bytes.push(
                          codePoint >> 0x6 | 0xC0,
                          codePoint & 0x3F | 0x80
                      )
                  } else if (codePoint < 0x10000) {
                      if ((units -= 3) < 0) break
                      bytes.push(
                          codePoint >> 0xC | 0xE0,
                          codePoint >> 0x6 & 0x3F | 0x80,
                          codePoint & 0x3F | 0x80
                      )
                  } else if (codePoint < 0x110000) {
                      if ((units -= 4) < 0) break
                      bytes.push(
                          codePoint >> 0x12 | 0xF0,
                          codePoint >> 0xC & 0x3F | 0x80,
                          codePoint >> 0x6 & 0x3F | 0x80,
                          codePoint & 0x3F | 0x80
                      )
                  } else {
                      throw new Error('Invalid code point')
                  }
              }

              return bytes
          }

          function asciiToBytes(str) {
              var byteArray = []
              for (var i = 0; i < str.length; ++i) {
                  // Node's code seems to be doing this and not & 0x7F..
                  byteArray.push(str.charCodeAt(i) & 0xFF)
              }
              return byteArray
          }

          function utf16leToBytes(str, units) {
              var c, hi, lo
              var byteArray = []
              for (var i = 0; i < str.length; ++i) {
                  if ((units -= 2) < 0) break

                  c = str.charCodeAt(i)
                  hi = c >> 8
                  lo = c % 256
                  byteArray.push(lo)
                  byteArray.push(hi)
              }

              return byteArray
          }

          function base64ToBytes(str) {
              return base64.toByteArray(base64clean(str))
          }

          function blitBuffer(src, dst, offset, length) {
              for (var i = 0; i < length; ++i) {
                  if ((i + offset >= dst.length) || (i >= src.length)) break
                  dst[i + offset] = src[i]
              }
              return i
          }

          // ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
          // the `instanceof` check but they should be treated as of that type.
          // See: https://github.com/feross/buffer/issues/166
          function isInstance(obj, type) {
              return obj instanceof type ||
                  (obj != null && obj.constructor != null && obj.constructor.name != null &&
                      obj.constructor.name === type.name)
          }
          function numberIsNaN(obj) {
              // For IE11 support
              return obj !== obj // eslint-disable-line no-self-compare
          }

      }, { "base64-js": 6, "ieee754": 14 }], 9: [function (require, module, exports) {
          var BufferReader = require('./lib/buffer-reader')

          var XIPH_LACING = 1
          var EBML_LACING = 3
          var FIXED_SIZE_LACING = 2

          module.exports = function (buffer) {
              var block = {}
              var reader = new BufferReader(buffer)

              block.trackNumber = reader.nextUIntV()
              block.timecode = reader.nextInt16BE()

              var flags = reader.nextUInt8()

              block.invisible = !!(flags & 0x8)

              // only valid for SimpleBlock
              block.keyframe = !!(flags & 0x80)
              block.discardable = !!(flags & 0x1)

              var lacing = (flags & 0x6) >> 1

              block.frames = readLacedData(reader, lacing)

              return block
          }

          function readLacedData(reader, lacing) {
              if (!lacing) return [reader.nextBuffer()]

              var i, frameSize
              var frames = []
              var framesNum = reader.nextUInt8() + 1 // number of frames

              if (lacing === FIXED_SIZE_LACING) {
                  // remaining data should be divisible by the number of frames
                  if (reader.length % framesNum !== 0) throw new Error('Fixed-Size Lacing Error')

                  frameSize = reader.length / framesNum
                  for (i = 0; i < framesNum; i++) {
                      frames.push(reader.nextBuffer(frameSize))
                  }
                  return frames
              }

              var frameSizes = []

              if (lacing === XIPH_LACING) {
                  for (i = 0; i < framesNum - 1; i++) {
                      var val
                      frameSize = 0
                      do {
                          val = reader.nextUInt8()
                          frameSize += val
                      } while (val === 0xff)
                      frameSizes.push(frameSize)
                  }
              } else if (lacing === EBML_LACING) {
                  // first frame
                  frameSize = reader.nextUIntV()
                  frameSizes.push(frameSize)

                  // middle frames
                  for (i = 1; i < framesNum - 1; i++) {
                      frameSize += reader.nextIntV()
                      frameSizes.push(frameSize)
                  }
              }

              for (i = 0; i < framesNum - 1; i++) {
                  frames.push(reader.nextBuffer(frameSizes[i]))
              }

              // last frame (remaining buffer)
              frames.push(reader.nextBuffer())

              return frames
          }

      }, { "./lib/buffer-reader": 10 }], 10: [function (require, module, exports) {
          var vint = require('./vint')

          function BufferReader(buffer) {
              this.buffer = buffer
              this.offset = 0
          }

          // a super limited subset of the node buffer API
          BufferReader.prototype.nextInt16BE = function () {
              var value = this.buffer.readInt16BE(this.offset)
              this.offset += 2
              return value
          }

          BufferReader.prototype.nextUInt8 = function () {
              var value = this.buffer.readUInt8(this.offset)
              this.offset += 1
              return value
          }

          // EBML variable sized integers
          BufferReader.prototype.nextUIntV = function () {
              var v = vint(this.buffer, this.offset)
              this.offset += v.length
              return v.value
          }

          BufferReader.prototype.nextIntV = function () {
              var v = vint(this.buffer, this.offset, true)
              this.offset += v.length
              return v.value
          }

          // buffer slice
          BufferReader.prototype.nextBuffer = function (length) {
              var buffer = length
                  ? this.buffer.slice(this.offset, this.offset + length)
                  : this.buffer.slice(this.offset)
              this.offset += length || this.length
              return buffer
          }

          // remaining bytes to read
          Object.defineProperty(BufferReader.prototype, 'length', {
              get: function () { return this.buffer.length - this.offset }
          })

          module.exports = BufferReader

      }, { "./vint": 11 }], 11: [function (require, module, exports) {
          // https://github.com/themasch/node-ebml/blob/master/lib/ebml/tools.js
          module.exports = function (buffer, start, signed) {
              start = start || 0
              for (var length = 1; length <= 8; length++) {
                  if (buffer[start] >= Math.pow(2, 8 - length)) {
                      break
                  }
              }
              if (length > 8) {
                  throw new Error('Unrepresentable length: ' + length + ' ' +
                      buffer.toString('hex', start, start + length))
              }
              if (start + length > buffer.length) {
                  return null
              }
              var i
              var value = buffer[start] & (1 << (8 - length)) - 1
              for (i = 1; i < length; i++) {
                  if (i === 7) {
                      if (value >= Math.pow(2, 53 - 8) && buffer[start + 7] > 0) {
                          return {
                              length: length,
                              value: -1
                          }
                      }
                  }
                  value *= Math.pow(2, 8)
                  value += buffer[start + i]
              }
              if (signed) {
                  value -= Math.pow(2, length * 7 - 1) - 1
              }
              return {
                  length: length,
                  value: value
              }
          }

      }, {}], 12: [function (require, module, exports) {
          (function (Buffer) {
              var tools = {
                  readVint: function (buffer, start) {
                      start = start || 0;
                      for (var length = 1; length <= 8; length++) {
                          if (buffer[start] >= Math.pow(2, 8 - length)) {
                              break;
                          }
                      }
                      if (length > 8) {
                          throw new Error("Unrepresentable length: " + length + " " +
                              buffer.toString('hex', start, start + length));
                      }
                      if (start + length > buffer.length) {
                          return null;
                      }
                      var value = buffer[start] & (1 << (8 - length)) - 1;
                      for (var i = 1; i < length; i++) {
                          if (i === 7) {
                              if (value >= Math.pow(2, 53 - 8) && buffer[start + 7] > 0) {
                                  return {
                                      length: length,
                                      value: -1
                                  };
                              }
                          }
                          value *= Math.pow(2, 8);
                          value += buffer[start + i];
                      }
                      return {
                          length: length,
                          value: value
                      };
                  },

                  writeVint: function (value) {
                      if (value < 0 || value > Math.pow(2, 53)) {
                          throw new Error("Unrepresentable value: " + value);
                      }
                      for (var length = 1; length <= 8; length++) {
                          if (value < Math.pow(2, 7 * length) - 1) {
                              break;
                          }
                      }
                      var buffer = new Buffer(length);
                      for (var i = 1; i <= length; i++) {
                          var b = value & 0xFF;
                          buffer[length - i] = b;
                          value -= b;
                          value /= Math.pow(2, 8);
                      }
                      buffer[0] = buffer[0] | (1 << (8 - length));
                      return buffer;
                  }
              };

              module.exports = tools;

          }).call(this, require("buffer").Buffer)
      }, { "buffer": 7 }], 13: [function (require, module, exports) {
          // Copyright Joyent, Inc. and other Node contributors.
          //
          // Permission is hereby granted, free of charge, to any person obtaining a
          // copy of this software and associated documentation files (the
          // "Software"), to deal in the Software without restriction, including
          // without limitation the rights to use, copy, modify, merge, publish,
          // distribute, sublicense, and/or sell copies of the Software, and to permit
          // persons to whom the Software is furnished to do so, subject to the
          // following conditions:
          //
          // The above copyright notice and this permission notice shall be included
          // in all copies or substantial portions of the Software.
          //
          // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
          // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
          // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
          // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
          // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
          // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
          // USE OR OTHER DEALINGS IN THE SOFTWARE.

          function EventEmitter() {
              this._events = this._events || {};
              this._maxListeners = this._maxListeners || undefined;
          }
          module.exports = EventEmitter;

          // Backwards-compat with node 0.10.x
          EventEmitter.EventEmitter = EventEmitter;

          EventEmitter.prototype._events = undefined;
          EventEmitter.prototype._maxListeners = undefined;

          // By default EventEmitters will print a warning if more than 10 listeners are
          // added to it. This is a useful default which helps finding memory leaks.
          EventEmitter.defaultMaxListeners = 10;

          // Obviously not all Emitters should be limited to 10. This function allows
          // that to be increased. Set to zero for unlimited.
          EventEmitter.prototype.setMaxListeners = function (n) {
              if (!isNumber(n) || n < 0 || isNaN(n))
                  throw TypeError('n must be a positive number');
              this._maxListeners = n;
              return this;
          };

          EventEmitter.prototype.emit = function (type) {
              var er, handler, len, args, i, listeners;

              if (!this._events)
                  this._events = {};

              // If there is no 'error' event listener then throw.
              if (type === 'error') {
                  if (!this._events.error ||
                      (isObject(this._events.error) && !this._events.error.length)) {
                      er = arguments[1];
                      if (er instanceof Error) {
                          throw er; // Unhandled 'error' event
                      } else {
                          // At least give some kind of context to the user
                          var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
                          err.context = er;
                          throw err;
                      }
                  }
              }

              handler = this._events[type];

              if (isUndefined(handler))
                  return false;

              if (isFunction(handler)) {
                  switch (arguments.length) {
                      // fast cases
                      case 1:
                          handler.call(this);
                          break;
                      case 2:
                          handler.call(this, arguments[1]);
                          break;
                      case 3:
                          handler.call(this, arguments[1], arguments[2]);
                          break;
                      // slower
                      default:
                          args = Array.prototype.slice.call(arguments, 1);
                          handler.apply(this, args);
                  }
              } else if (isObject(handler)) {
                  args = Array.prototype.slice.call(arguments, 1);
                  listeners = handler.slice();
                  len = listeners.length;
                  for (i = 0; i < len; i++)
                      listeners[i].apply(this, args);
              }

              return true;
          };

          EventEmitter.prototype.addListener = function (type, listener) {
              var m;

              if (!isFunction(listener))
                  throw TypeError('listener must be a function');

              if (!this._events)
                  this._events = {};

              // To avoid recursion in the case that type === "newListener"! Before
              // adding it to the listeners, first emit "newListener".
              if (this._events.newListener)
                  this.emit('newListener', type,
                      isFunction(listener.listener) ?
                          listener.listener : listener);

              if (!this._events[type])
                  // Optimize the case of one listener. Don't need the extra array object.
                  this._events[type] = listener;
              else if (isObject(this._events[type]))
                  // If we've already got an array, just append.
                  this._events[type].push(listener);
              else
                  // Adding the second element, ne
