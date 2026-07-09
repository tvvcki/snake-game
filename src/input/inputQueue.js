export function createInputQueue(max = 16) {
  const queue = [];

  return {
    enqueue(x, y) {
      if (queue.length >= max) return;
      const last = queue[queue.length - 1];
      if (last && last.x === x && last.y === y) return;
      queue.push({ x, y });
    },
    flushForTick(flushCallback) {
      if (queue.length === 0) return;
      const cmd = queue.shift();
      try {
        flushCallback(cmd.x, cmd.y);
      } catch (e) {
        // swallow errors from callback to keep simulation robust
        console.error('Error flushing input command', e);
      }
    },
    size() {
      return queue.length;
    },
  };
}
