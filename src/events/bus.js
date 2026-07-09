const subscribers = new Map();

export const bus = {
  subscribe(event, cb) {
    if (!subscribers.has(event)) subscribers.set(event, []);
    subscribers.get(event).push(cb);
    return () => {
      const arr = subscribers.get(event) || [];
      const idx = arr.indexOf(cb);
      if (idx >= 0) arr.splice(idx, 1);
    };
  },
  publish(event, data) {
    const arr = subscribers.get(event) || [];
    arr.slice().forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error('Event handler error', e);
      }
    });
  },
};
