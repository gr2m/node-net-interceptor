import net from "node:net";
import tls from "node:net";
import { EventEmitter } from "node:events";

declare const interceptor: NetInterceptor;
export default interceptor;

declare class NetInterceptor extends EventEmitter {
  /**
   * Start intercepting net/tls socket connections.
   * No-op if already recording.
   */
  start: () => this;

  /**
   * Stop intercepting  net/tls socket connections.
   * No-op if not recording.
   */
  stop: () => this;

  /**
   * Subscribe to the "connect" event, emitted each time a net/tls socket connets
   */
  addListener(event: "connect", listener: ConnectEventListener): this;
  addListener(event: "connection", listener: ConnectionEventListener): this;

  /**
   * Unsubscribe from an event using the same listener function
   * that was used when subscribing.
   */
  removeListener(event: NetInterceptorEvents, listener: () => void): this;

  /**
   * Remove all listeners from all events
   */
  removeAllListeners(): this;

  /**
   * Remove all listeners from an events
   */
  removeAllListeners(event: NetInterceptorEvents): this;
}

type NetInterceptorEvents = "connect" | "connection";

type NetConnectOptions = net.TcpNetConnectOpts;

interface ConnectEventListener {
  (
    socket: net.Socket | tls.Socket,
    options: NetConnectOptions,
    bypass: () => void
  ): void;
}

interface ConnectionEventListener {
  (socket: net.Socket | tls.Socket, options: NetConnectOptions): void;
}
