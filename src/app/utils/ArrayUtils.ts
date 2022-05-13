export function rotateLeft<T>(array: Array<T>, count: number) {
  for (let i = 0; i < count; i++) {
    const first = array.shift();
    array.push(first!);
  }
}
