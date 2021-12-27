// @ts-check

import net from "node:net";
import tls from "node:tls";

/**
 * TlsSocket is not extending `tls.TLSSocket` because the
 * logic is a lot different to `net.Socket`. So we inherit
 * from `net.Socket` instead and then only apply the instances
 * methods from `tls.TLSSocket`.
 */
export default class NetInterceptorTlsSocket extends net.Socket {
  encrypted = true;
  authorized = true;

  constructor(...args) {
    super(...args);
    Object.assign(this, tls.TLSSocket.prototype);
  }
}
