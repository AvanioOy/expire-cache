/* eslint-disable @typescript-eslint/await-thenable */
/**
 * unwrap an iterator and async iterator into an array
 */
export async function iterAsArray<T>(iter: IterableIterator<T> | AsyncIterableIterator<T>): Promise<T[]> {
	const result: T[] = [];
	for await (const value of iter) {
		result.push(value);
	}
	return result;
}
