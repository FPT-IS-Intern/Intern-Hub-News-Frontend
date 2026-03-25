import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { getBaseUrl } from '../core/config/app-config';
import { ResponseApi } from '../models/base';
import { NewsTopicResponse } from '../models/news';

@Injectable({
  providedIn: 'root'
})
export class NewsTopicService {
  private readonly baseUrl = `${getBaseUrl()}/news/topic`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ResponseApi<NewsTopicResponse[]>> {
    return this.http.get<ResponseApi<NewsTopicResponse[]>>(this.baseUrl);
  }
}
