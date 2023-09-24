import { PaginatedCollection, PagingInfo } from '../interfaces/paging.interface';
import { DEFAULT_PAGE_SIZE } from '../constants/paging.constants';

export const stringInEnum = <E extends Object>(enumObject: E, value?: string) => {
    return Object.values(enumObject).includes(value);
};

export const getSkipFromPageLimit = (page: number, limit: number): number => {
    return limit * (page - 1);
}

export const getLastPageFromCount = (count: number, limit: number): number => {
    return Math.max(1, Math.ceil(count / limit));
};

// Simpler version of paginateCollection for database daos
export const simplePaginateCollection = <T>(
    collection: T[],
    page: number,
    lastPage: number
): PaginatedCollection<T> => {
    const pagingInfo: PagingInfo = {
        first: 1,
        prev: Math.max(page - 1, 1),
        next: Math.min(page + 1, lastPage),
        last: lastPage
    }
    return {collection, pagingInfo};
};

// Sorts collection and applies limit & offset
export const paginateCollection = <T>(
    collection: T[],
    compareTo: (a: T, b: T) => number,
    limit?: number,
    offset?: number,
): PaginatedCollection<T> => {
    // building pagingInfo
    limit = limit || DEFAULT_PAGE_SIZE;
    const lastPage = Math.max(0, Math.ceil(collection.length / limit) - 1);
    offset = offset ? (lastPage > 0 ? (offset + lastPage + 1) % (lastPage + 1) : 0) : 0;
    const pagingInfo: PagingInfo = {
        first: 1,
        last: lastPage,
    };
    if (offset - 1 >= pagingInfo.first) pagingInfo.prev = offset - 1;
    if (offset + 1 <= pagingInfo.last) pagingInfo.next = offset + 1;

    if (collection.length <= 0) return { collection, pagingInfo };
    let newCollection = collection.sort(compareTo);
    const firstIndex = (offset * limit + newCollection.length) % newCollection.length;
    const lastIndex = firstIndex + limit;
    newCollection = newCollection.slice(firstIndex, lastIndex);
    return { collection: newCollection, pagingInfo };
};

// Removes duplicated from a collection
export const removeDuplicates = <T>(collection: T[]): T[] => {
    return collection.filter((value, index) => collection.indexOf(value) === index);
};

export const valuesIntersect = <T>(c1: T[], c2: T[]): boolean => {
    const intersected = c1.find((value) => c2.includes(value));
    return intersected !== undefined;
};
