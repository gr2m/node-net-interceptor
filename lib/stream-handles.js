// @ts-check

import stream from "node:stream";

import NODE_INTERNALS from "./node-internals.js";

const NO_ERROR_CODE = 0;
const UV_EOF = NODE_INTERNALS.UV_EOF;
const kRemote = Symbol("Remote");

let uniqueId = 0;
let STREAM_STATE = NODE_INTERNALS.STREAM_STATE;
let STREAM_BYTES_READ = NODE_INTERNALS.STREAM_BYTES_READ;

export default function createRequestResponseHandlePair() {
  const requestHandle = new StreamHandle();
  const responseHandle = new StreamHandle();
  requestHandle[kRemote] = responseHandle;
  responseHandle[kRemote] = requestHandle;
  return { requestHandle, responseHandle };
}

/**
 * Sockets write to StreamHandle via write*String functions. The
 * WritableStream.prototype.write function is just used internally by
 * StreamHandle to queue data before pushing it to the other end via
 * ReadableStream.prototype.push. The receiver will then forward it to its
 * owner Socket via the onread property.
 *
 * StreamHandle is created for both the request side and the response side.
 */
class StreamHandle extends stream.Duplex {
  remote = null;

  constructor() {
    super();
    this.id = ++uniqueId;

    // The "end" event follows ReadableStream.prototype.push(null).
    this.on("data", readData.bind(this));
    this.on("end", readEof.bind(this));

    // The "finish" event follows  WritableStream.prototype.end.
    //
    // There's WritableStream.prototype._final for processing before "finish" is
    // emitted, but that's only available in Node v8 and later.
    this.on(
      "finish",
      this._write.bind(this, null, null, () => {})
    );

    this.pause();
  }

  readStart() {
    this.resume();
  }
  readStop() {
    this.pause();
  }

  // noops
  _read() {}
  ref() {}
  unref() {}

  // Introduced in Node v8
  getAsyncId() {
    return this.id;
  }

  _write(data, encoding, done) {
    const remote = this[kRemote];
    process.nextTick(function () {
      remote.push(data, encoding);
      done();
    });
  }

  // Node v10 requires writev to be set on the handler because, while
  // WritableStream expects _writev, internal/stream_base_commons.js calls
  // req.handle.writev directly. It's given a flat array of data+type pairs.
  writev(_req, data) {
    for (let i = 0; i < data.length; ++i)
      this._write(data[i], data[++i], () => {});
    return NO_ERROR_CODE;
  }

  // Introduced in Node v6.4.
  writeLatin1String(_req, data) {
    this.write(data, "latin1");
    return NO_ERROR_CODE;
  }

  writeBuffer(request, data) {
    this.write(data);
    return NO_ERROR_CODE;
  }

  writeUtf8String(request, data) {
    this.write(data, "utf8");
    return NO_ERROR_CODE;
  }

  writeAsciiString(request, data) {
    this.write(data, "ascii");
    return NO_ERROR_CODE;
  }

  writeUcs2String(request, data) {
    this.write(data, "ucs2");
    return NO_ERROR_CODE;
  }

  // While it seems to have existed since Node v0.10, Node v11.2 requires
  // "shutdown". AFAICT, "shutdown" is for shutting the writable side down and
  // hence the use of WritableStream.prototype.end and waiting for the "finish"
  // event.
  shutdown(request) {
    this.once(
      "finish",
      request.oncomplete.bind(request, NO_ERROR_CODE, request.handle)
    );
    this.end();

    // Since v11.8 `.shutdown()` must return an error code, where `1`
    // indicating a "synchronous finish" (as per Node's net.js) and `0`
    // presumably success.
    return 0;
  }

  // Unsure of the relationship between StreamHandle.prototype.shutdown and
  // StreamHandle.prototype.close.
  close(done) {
    // @ts-expect-error - `._writeableState` is an internal API and not typed
    if (!this._writableState.finished) {
      this.end(done);
      return;
    }

    /* istanbul ignore next */
    if (done) done();
  }
}

function readData(data) {
  // A system written not in 1960 that passes arguments to functions through
  // _global_ mutable data structures…
  STREAM_STATE[STREAM_BYTES_READ] = data.length;
  this.onread(data);
}

function readEof() {
  STREAM_STATE[STREAM_BYTES_READ] = UV_EOF;
  this.onread();
}
