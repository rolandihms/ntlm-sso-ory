import { FetchMock } from 'jest-fetch-mock';

declare global {
    namespace jest {
        interface Matchers<R> {
            toBe(expected: unknown): R;
            toEqual(expected: unknown): R;
            toBeDefined(): R;
        }
    }

    var fetchMock: FetchMock;
}

export {};
