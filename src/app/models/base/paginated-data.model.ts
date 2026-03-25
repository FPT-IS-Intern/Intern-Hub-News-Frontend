export interface PaginatedData<T> {
  items: T[];
  totalItems: number | string;
  totalPages: number;
}
