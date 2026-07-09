export function createPool(createFn, resetFn = () => {}) {
  const pool = [];
  const active = [];

  return {
    acquire() {
      const item = pool.length > 0 ? pool.pop() : createFn();
      active.push(item);
      return item;
    },
    release(item) {
      const idx = active.indexOf(item);
      if (idx >= 0) active.splice(idx, 1);
      resetFn(item);
      pool.push(item);
    },
    releaseAll() {
      while (active.length) {
        const it = active.pop();
        resetFn(it);
        pool.push(it);
      }
    },
    activeCount() {
      return active.length;
    },
    poolSize() {
      return pool.length;
    },
  };
}
