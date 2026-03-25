export interface ResponseApi<T> {
  code?: number;
  message?: string;
  data: T;
}
