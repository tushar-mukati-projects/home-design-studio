import { describe, expect, test } from "bun:test";
import { HocuspocusProvider, HocuspocusProviderWebsocket, MessageType } from "@hocuspocus/provider";

process.env.NEXT_PUBLIC_API_URL ??= "http://design.test/api";
process.env.NEXT_PUBLIC_WS_URL ??= "ws://design.test/collaboration";
const { destroyProvider } = await import("@/lib/yjs-provider");

const OPEN = 1;
const CLOSED = 3;
const sockets: FakeSocket[] = [];

class FakeSocket {
  readyState = OPEN;
  binaryType = "";
  identifier = 0;
  sent: Uint8Array[] = [];
  constructor() {
    sockets.push(this);
  }
  addEventListener() {}
  removeEventListener() {}
  send(message: Uint8Array) {
    this.sent.push(message);
  }
  close() {
    this.readyState = CLOSED;
  }
}

const messageType = (message: Uint8Array): number => message[1 + message[0]];

const connect = () => {
  const websocketProvider = new HocuspocusProviderWebsocket({
    url: "ws://design.test/collaboration",
    WebSocketPolyfill: FakeSocket,
  });
  const provider = new HocuspocusProvider({ name: "design:test", websocketProvider });
  return { provider, websocketProvider, socket: sockets[sockets.length - 1] };
};

describe("destroyProvider", () => {
  test("closes the socket, stops reconnecting and tells the server the member left", () => {
    const { provider, websocketProvider, socket } = connect();
    expect(websocketProvider.shouldConnect).toBe(true);
    expect(socket.readyState).toBe(OPEN);

    destroyProvider(provider);

    expect(websocketProvider.shouldConnect).toBe(false);
    expect(websocketProvider.webSocket).toBeNull();
    expect(socket.readyState).toBe(CLOSED);
    expect(new Set(socket.sent.map(messageType))).toEqual(
      new Set([MessageType.Awareness, MessageType.CLOSE]),
    );
  });
});
