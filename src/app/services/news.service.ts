import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { getBaseUrl } from '../core/config/app-config';
import { ResponseApi, PaginatedData } from '../models/base';
import {
  NewsResponse,
  CreateNewsRequest,
  UpdateNewsRequest
} from '../models/news';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private readonly baseUrl = `${getBaseUrl()}/news`;
  private readonly editorUrl = `${getBaseUrl()}/news/author`;
  private readonly managementUrl = `${getBaseUrl()}/news/management`;

  constructor(private readonly http: HttpClient) {}

  create(request: CreateNewsRequest): Observable<ResponseApi<NewsResponse>> {
    return this.http.post<ResponseApi<NewsResponse>>(this.editorUrl, request);
  }

  getById(id: string): Observable<ResponseApi<NewsResponse>> {
    return this.http.get<ResponseApi<NewsResponse>>(`${this.baseUrl}/${id}`);
  }

  getAll(
    page: number = 0,
    size: number = 10,
    startDate?: number,
    endDate?: number,
    sortColumn: string = 'created_at',
    sortDirection: string = 'desc'
  ): Observable<ResponseApi<PaginatedData<NewsResponse>>> {
    let params = `page=${page}&size=${size}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`;
    if (startDate) params += `&startDate=${startDate}`;
    if (endDate) params += `&endDate=${endDate}`;
    return this.http.get<ResponseApi<PaginatedData<NewsResponse>>>(
      `${this.managementUrl}?${params}`
    );
  }

  getAllFeatured(
    page: number = 0,
    size: number = 10,
    sortColumn: string = 'created_at',
    sortDirection: string = 'desc'
  ): Observable<ResponseApi<PaginatedData<NewsResponse>>> {
    return this.http.get<ResponseApi<PaginatedData<NewsResponse>>>(
      `${this.baseUrl}/isFeatured?page=${page}&size=${size}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`
    );
  }

  getApprovedNews(
    page: number = 0,
    size: number = 10,
    sortColumn: string = 'created_at',
    sortDirection: string = 'desc'
  ): Observable<ResponseApi<PaginatedData<NewsResponse>>> {
    return this.http.get<ResponseApi<PaginatedData<NewsResponse>>>(
      `${this.baseUrl}/approved?page=${page}&size=${size}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`
    );
  }

  searchByTitle(
    title: string,
    page: number = 0,
    size: number = 10,
    sortColumn: string = 'created_at',
    sortDirection: string = 'desc'
  ): Observable<ResponseApi<PaginatedData<NewsResponse>>> {
    return this.http.post<ResponseApi<PaginatedData<NewsResponse>>>(
      `${this.baseUrl}/search`,
      {
        title,
        page,
        size,
        sortColumn,
        sortDirection
      }
    );
  }

  getApprovedNewsByTopic(
    topicId: string,
    page: number = 0,
    size: number = 10,
    sortColumn: string = 'created_at',
    sortDirection: string = 'desc'
  ): Observable<ResponseApi<PaginatedData<NewsResponse>>> {
    return this.http.get<ResponseApi<PaginatedData<NewsResponse>>>(
      `${this.baseUrl}/by-topic/${topicId}?page=${page}&size=${size}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`
    );
  }

  getPendingNews(
    page: number = 0,
    size: number = 10
  ): Observable<ResponseApi<PaginatedData<NewsResponse>>> {
    return this.http.get<ResponseApi<PaginatedData<NewsResponse>>>(
      `${this.managementUrl}/pending?page=${page}&size=${size}`
    );
  }

  getTop3(): Observable<ResponseApi<NewsResponse[]>> {
    return this.http.get<ResponseApi<NewsResponse[]>>(`${this.baseUrl}/latest`);
  }

  update(id: string, request: UpdateNewsRequest): Observable<ResponseApi<NewsResponse>> {
    return this.http.put<ResponseApi<NewsResponse>>(`${this.editorUrl}/${id}`, request);
  }

  approve(id: string): Observable<ResponseApi<NewsResponse>> {
    return this.http.post<ResponseApi<NewsResponse>>(`${this.managementUrl}/${id}/approve`, {});
  }

  delete(id: string): Observable<ResponseApi<string>> {
    return this.http.delete<ResponseApi<string>>(`${this.managementUrl}/${id}`);
  }
}
