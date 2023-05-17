export interface PagingInfo {
    first: number;
    last: number;
    prev?: number;
    next?: number;
}

export interface PaginatedCollection<M> {
    collection: M[];
    pagingInfo: PagingInfo;
}
