import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { 
  DatePickerComponent, 
  IconComponent 
} from '@goat-bravos/intern-hub-layout';
import { forkJoin, map, of } from 'rxjs';
import { NewsService } from '../../services/news.service';
import { NewsResponse } from '../../models/news';
import { PopUpConfirmComponent } from '../pop-up-confirm/pop-up-confirm.component';
import { UserProfileService } from '../../services/user-profile.service';

@Component({
  selector: 'app-admin-news-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    IconComponent,
    FormsModule,
    DatePickerComponent,
    PopUpConfirmComponent,
  ],
  templateUrl: './admin-news-dashboard.component.html',
  styleUrl: './admin-news-dashboard.component.scss',
})
export class AdminNewsDashboardComponent implements OnInit {
  newsList: NewsResponse[] = [];
  authorNameMap: Record<string, string> = {};
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  loading = false;
  startDate: string = '';
  endDate: string = '';
  sortColumn: string = 'createdAt';
  sortDirection: string = 'desc';

  showConfirmDelete = false;
  selectedNewsId: string | null = null;

  constructor(
    private readonly newsService: NewsService,
    private readonly userProfileService: UserProfileService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDataFromServer();
  }

  loadDataFromServer(): void {
    this.loading = true;
    const startMs = this.startDate ? new Date(this.startDate).getTime() : undefined;
    const endMs = this.endDate ? new Date(this.endDate).getTime() : undefined;

    this.newsService.getAll(
      this.pageIndex - 1, 
      this.pageSize, 
      startMs, 
      endMs, 
      this.sortColumn, 
      this.sortDirection
    ).subscribe({
      next: (res) => {
        this.newsList = res.data?.items || [];
        this.resolveAuthorNames(this.newsList);
        this.total = Number(res.data?.totalItems) || 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  getAuthorName(news: NewsResponse): string {
    const directName = (news.createdByName || news.fullName || '').trim();
    if (directName) {
      return directName;
    }

    const cachedName = this.authorNameMap[news.id];
    if (cachedName) {
      return cachedName;
    }

    return news.createdBy != null ? String(news.createdBy) : '-';
  }

  private resolveAuthorNames(items: NewsResponse[]): void {
    if (!items.length) {
      this.authorNameMap = {};
      return;
    }

    const requests = items.map((item) => {
      const directName = (item.createdByName || item.fullName || '').trim();
      if (directName) {
        return of({ id: item.id, name: directName });
      }

      if (item.createdBy == null) {
        return of({ id: item.id, name: '-' });
      }

      return this.userProfileService.getFullNameByUserId(String(item.createdBy)).pipe(
        map((name) => ({ id: item.id, name: name || String(item.createdBy) })),
      );
    });

    forkJoin(requests).subscribe({
      next: (results) => {
        const nextMap: Record<string, string> = {};
        results.forEach((result) => {
          nextMap[result.id] = result.name;
        });
        this.authorNameMap = nextMap;
        this.cdr.markForCheck();
      },
      error: () => {
        this.authorNameMap = {};
      },
    });
  }

  onRangeChange(range: [Date, Date] | null): void {
    if (range?.length === 2) {
      this.startDate = range[0].toISOString();
      this.endDate = range[1].toISOString();
    } else {
      this.startDate = '';
      this.endDate = '';
    }
    this.onFilterChange();
  }

  onFilterChange(): void {
    this.pageIndex = 1;
    this.loadDataFromServer();
  }

  onSortChange(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'desc';
    }
    this.loadDataFromServer();
  }

  onPageSizeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value;
    const nextSize = Number(value) || 10;
    if (nextSize === this.pageSize) return;
    this.pageSize = nextSize;
    this.pageIndex = 1;
    this.loadDataFromServer();
  }

  prevPage(): void {
    if (this.pageIndex <= 1) return;
    this.pageIndex -= 1;
    this.loadDataFromServer();
  }

  nextPage(): void {
    const totalPages = this.totalPages;
    if (this.pageIndex >= totalPages) return;
    this.pageIndex += 1;
    this.loadDataFromServer();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  deleteNews(event: Event, id: string): void {
    event.stopPropagation();
    this.selectedNewsId = id;
    this.showConfirmDelete = true;
    this.cdr.detectChanges();
  }

  confirmDelete(): void {
    if (this.selectedNewsId) {
      this.newsService.delete(this.selectedNewsId).subscribe({
        next: () => {
          this.showConfirmDelete = false;
          this.selectedNewsId = null;
          this.loadDataFromServer();
          this.cdr.detectChanges();
        },
        error: () => {
          this.showConfirmDelete = false;
          this.cdr.detectChanges();
          globalThis.alert('Xóa thất bại. Vui lòng thử lại.');
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
    this.selectedNewsId = null;
    this.cdr.detectChanges();
  }


}
