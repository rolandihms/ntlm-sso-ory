import { GlobalWithFetchMock } from 'jest-fetch-mock';

declare global {
    var fetchMock: GlobalWithFetchMock;
}
