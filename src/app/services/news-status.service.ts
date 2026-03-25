import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { getBaseUrl } from '../core/config/app-config';
import { ResponseApi } from '../models/base';
import { NewsStatusResponse } from '../models/news';

@Injectable({
  providedIn: 'root'
})
export class NewsStatusService {
  private readonly baseUrl = `${getBaseUrl()}/news/status`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ResponseApi<NewsStatusResponse[]>> {
    return this.http.get<ResponseApi<NewsStatusResponse[]>>(this.baseUrl);
  }
}
