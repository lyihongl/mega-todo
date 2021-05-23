async function asyncForEach<T>(
  array: T[],
  callback: (a: T, b: number, c: T[]) => void
) {
  for (let i = 0; i < array.length; i++) {
    await callback(array[i], i, array);
  }
}

export { asyncForEach };
