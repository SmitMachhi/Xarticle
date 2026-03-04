const lanes = new Map<string, Promise<void>>();

export const runInLane = async <T>(laneKey: string, task: () => Promise<T>): Promise<T> => {
  const previous = lanes.get(laneKey) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });

  lanes.set(laneKey, previous.then(() => current));
  await previous;
  try {
    return await task();
  } finally {
    release();
    if (lanes.get(laneKey) === current) {
      lanes.delete(laneKey);
    }
  }
};
