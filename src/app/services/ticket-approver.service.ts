import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { getBaseUrl } from '../core/config/app-config';

interface TicketApproverPermissionData {
  approverId: string | number;
  maxApprovalLevel: number;
  canApproveLevel1: boolean;
  canApproveLevel2: boolean;
}

interface ResponseApi<T> {
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class TicketApproverService {
  private readonly baseUrl = getBaseUrl();

  constructor(private readonly http: HttpClient) {}

  getMyApproverPermission(): Observable<ResponseApi<TicketApproverPermissionData>> {
    return this.http.get<ResponseApi<TicketApproverPermissionData>>(
      `${this.baseUrl}/ticket/approvers/me`,
    );
  }
}
