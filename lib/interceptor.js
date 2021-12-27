// @ts-check

import net from "node:net";
import tls from "node:tls";
import { Agent } from "node:http";
import { EventEmitter } from "node:events";

import NODE_INTERNALS from "./node-internals.js";

import MitmTlsSocket from "./tls-socket.js";
import createRequestResponseHandlePair from "./stream-handles.js";

let isIntercepting = false;
let didPatchConnect = false;

export default class NetInterceptor extends EventEmitter {
  /**y
   * @returns {NetInterceptor}
   */
  start() {
    if (isIntercepting) return;
    isIntercepting = true;

    if (didPatchConnect) return;
    didPatchConnect = true;

    const netConnect = this.connect.bind(this, net.connect, net.Socket);
    const tlsConnect = this.connect.bind(this, tls.connect, MitmTlsSocket);

    net.connect = netConnect;
    net.createConnection = netConnect;
    // @ts-expect-error - createConnection is not typed
    Agent.prototype.createConnection = netConnect;
    tls.connect = tlsConnect;

    return this;
  }

  /**
   * @returns {NetInterceptor}
   */
  stop() {
    isIntercepting = false;
    return this;
  }

  /**
   * This method is called when a socket is established, either through `net`,
   * `tls`, or an `http.Agent` prototype. We create a new net/tls socket
   * and give the opportunity to bypass the interception in a `connect` listener.
   *
   * If the request is intercepted, we call the original connect method, otherwise
   * we create a mock `response` socket and emit the `connection` event.
   */
  connect(originalConnect, Socket, ...args) {
    if (!isIntercepting) {
      return originalConnect.call(this, ...args);
    }
    const [options, callback] = NODE_INTERNALS.normalizeConnectArgs(args);
    const { requestHandle, responseHandle } = createRequestResponseHandlePair();

    // request
    const requestSocket = new Socket({
      handle: requestHandle,
      ...options,
    });

    // give opportunity to bypass the intercept
    let bypassed = false;
    this.emit("connect", requestSocket, options, () => (bypassed = true));
    if (bypassed) {
      return originalConnect.call(this, ...args);
    }

    // response
    const responseSocket = new Socket({ handle: responseHandle });

    this.emit("connection", responseSocket, options);

    // Ensure connect is emitted asynchronously, otherwise it would be impossible
    // to listen to it after calling net.connect or listening to it after the
    // ClientRequest emits "socket".
    setTimeout(() => {
      requestSocket.emit("connect");
      responseSocket.emit("connect");
    });

    const callbackMethod = Socket === net.Socket ? "connect" : "secureConnect";
    if (callback) requestSocket.once(callbackMethod, callback);

    // If a TLS request is intercepted, we simulate a successful
    // handshake by emiting a "secureConnect" event asyncronously.
    if (callbackMethod === "secureConnect") {
      setTimeout(requestSocket.emit.bind(requestSocket, "secureConnect"));
    }

    return requestSocket;
  }
}
