import * as net from "net";

import { expectType } from "tsd";

import netInterceptor from "./index.js";

netInterceptor.stop();

netInterceptor.addListener("connect", (socket, options, bypass): void => {
  expectType<() => void>(bypass);

  expectType<number>(options.port);
  expectType<string | undefined>(options.host);
});

netInterceptor.addListener("connection", (socket, options): void => {
  expectType<net.Socket>(socket);

  expectType<number>(options.port);
  expectType<string | undefined>(options.host);
});
