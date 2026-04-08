import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { getBaseUrl } from '../core/config/app-config';
import { ResponseApi } from '../models/base';

interface HrmUserProfileResponse {
  fullName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private readonly baseUrl = `${getBaseUrl()}/hrm/users`;

  constructor(private readonly http: HttpClient) {}

  getFullNameByUserId(userId: string): Observable<string | null> {
    if (!userId) {
      return of(null);
    }

    const normalizedId = String(userId).trim();
    if (!normalizedId) {
      return of(null);
    }

    return this.http
      .get<ResponseApi<HrmUserProfileResponse>>(`${this.baseUrl}/admin/profile/${normalizedId}`)
      .pipe(
        map((res) => res?.data?.fullName?.trim() || null),
        catchError(() =>
          this.http
            .get<ResponseApi<HrmUserProfileResponse>>(`${this.baseUrl}/profile/${normalizedId}`)
            .pipe(
              map((res) => res?.data?.fullName?.trim() || null),
              catchError(() => of(null)),
            ),
        ),
      );
  }
}
