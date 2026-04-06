import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { getBaseUrl } from '../core/config/app-config';

export interface DmsResponse {
  id: number;
  objectKey: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  status: string;
  actorId: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface DmsApiResult<T> {
  status: {
    code: string;
    message: string;
    errors: { field: string; message: string }[];
  };
  data: T;
  metaData: {
    requestId: string;
    traceId: string;
    signature: string;
    timestamp: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class DmsService {
  private readonly baseUrl = `${getBaseUrl()}/dms/admin`;

  constructor(private readonly http: HttpClient) {}

  upload(file: File, destinationPath: string = 'news'): Observable<DmsApiResult<DmsResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<DmsApiResult<DmsResponse>>(
      `${this.baseUrl}?destinationPath=${encodeURIComponent(destinationPath)}`,
      formData,
    );
  }

  delete(key: string): Observable<DmsApiResult<string>> {
    return this.http.delete<DmsApiResult<string>>(`${this.baseUrl}?key=${encodeURIComponent(key)}`);
  }
}
