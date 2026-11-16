const CURSOR_THROTTLE_MS = 40;

type CursorSender = (x: number, y: number) => void;

export type CursorThrottle = {
  move: CursorSender;
  stop: () => void;
};

export const throttleCursor = (send: CursorSender): CursorThrottle => {
  let lastSentAt = 0;
  let pending: ReturnType<typeof setTimeout> | null = null;
  const flush = (x: number, y: number) => {
    pending = null;
    lastSentAt = Date.now();
    send(x, y);
  };
  return {
    move: (x, y) => {
      if (pending) clearTimeout(pending);
      const wait = CURSOR_THROTTLE_MS - (Date.now() - lastSentAt);
      if (wait <= 0) flush(x, y);
      else pending = setTimeout(() => flush(x, y), wait);
    },
    stop: () => {
      if (pending) clearTimeout(pending);
      pending = null;
    },
  };
};
