# `@gr2m/net-interceptor`

[![Test](https://github.com/gr2m/node-net-interceptor/actions/workflows/test.yml/badge.svg)](https://github.com/gr2m/node-net-interceptor/actions/workflows/test.yml)

> Intercept outgoing network TCP/TLS connections

## Install

```
npm install @gr2m/http-recorder
```

## Usage

```js
import netInterceptor from "@gr2m/net-interceptor";

netInterceptor.start();
netInterceptor.on("intercept", (socket, options, bypass) => {
  // call bypass() to continue the unintercepted connection
  if (options.host === "db.example.com") return bypass();
});

netInterceptor.on("connection", (socket) => {
  // do something with the socket
  socket.write("Hello from @gr2m/net-interceptor!");
});
```

## API

`netInterceptor` is a singleton API.

### `netInterceptor.start()`

Hooks into the request life cycle and emits `connect` events for each socket that connects to a server as well as `connection` events for all intercepted socckets.

### `netInterceptor.stop()`

Removes the hooks. No `connect` events will be emitted.

### `netInterceptor.addListener(event, listener)`

#### `connect` event

The `listener` callback is called with 3 arguments

- `socket`: the intercepted net or TLS socket
- `options`: socket options: `{port, /* host, localAddress, localPort, family, allowHalfOpen */}`
- `bypass`: a function to call to continue the unintercepted connection

#### `connection` event

The `listener` callback is called with 2 arguments

- `socket`: the response net or TLS socket
- `options`: socket options: `{port, /* host, localAddress, localPort, family, allowHalfOpen */}`

### `netInterceptor.removeListener(event, listener)`

Remove an event listener.

### `netInterceptor.removeAllListeners(event)`

Removes all event listeners for the given event. Or when called without the `event` argument, remove all listeners for all events.

## How it works

Once started, `netInterceptor` hooks itself into [the `net.connect`](https://nodejs.org/api/net.html#netconnect) and [the `tls.connect`](https://nodejs.org/api/tls.html#tlsconnectoptions-callback) methods

When a socket is intercepted, we

1. we create a mock net/TLS socket
2. emit the `intercept` event with the mock socket
3. if `bypass()` was called in the `intercept` event listener, we let the socket continue unintercepted
4. if `bypass()` was not called
   1. we create another mock socket for the response and emit the "connection" event
   2. we emit `connect` on both mock sockets

and then emit a `record` event with the `request`, `response`, `requestBody` and `responseBody` options.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## Credits

`@gr2m/net-interceptor` is built upon code and concepts from [moll/node-mitm](https://github.com/moll/node-mitm) by [Andri Möll](http://themoll.com). [Monday Calendar](https://mondayapp.com) supported that engineering work.

**[Gregor Martynus](https://github.com/gr2m)** removed all `http(s)`-related code and made its focus on intercepting connections that use the lower-level `net` and `tls` modules.

## License

[LGPL]
