import { _normalizeArgs as normalizeConnectArgs } from "node:net";

const UV_EOF = process.binding("uv").UV_EOF;
const STREAM_STATE = process.binding("stream_wrap").streamBaseState;
const STREAM_BYTES_READ = process.binding("stream_wrap").kReadBytesOrError;

export default {
  normalizeConnectArgs,
  UV_EOF,
  STREAM_STATE,
  STREAM_BYTES_READ,
};
