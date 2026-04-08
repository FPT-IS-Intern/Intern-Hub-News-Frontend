import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NewsResponse } from '../../../models/news/news-response.model';
import { NewsService } from '../../../services/news.service';
import { FileUrlPipe } from '../../../utils/file-url.pipe';
import { UserProfileService } from '../../../services/user-profile.service';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, FileUrlPipe],
  templateUrl: './news-detail.component.html',
  styleUrls: ['./news-detail.component.scss']
})
export class NewsDetailComponent implements OnInit {
  news?: NewsResponse;
  createdAtDate?: Date;
  authorName = 'Người dùng';
  
  private readonly route = inject(ActivatedRoute);
  private readonly newsService = inject(NewsService);
  private readonly userProfileService = inject(UserProfileService);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.newsService.getById(id).subscribe({
          next: (res) => {
            if (res.data) {
              this.news = res.data;
              this.createdAtDate = new Date(Number(this.news.createdAt));
              this.resolveAuthorName(this.news);
            }
          },
          error: (err) => console.error('Failed to load news detail', err)
        });
      }
    });
  }

  private resolveAuthorName(news: NewsResponse): void {
    const directName = (news.createdByName || news.fullName || '').trim();
    if (directName) {
      this.authorName = directName;
      return;
    }

    const creatorId = news.createdBy != null ? String(news.createdBy) : '';
    if (!creatorId) {
      this.authorName = 'Người dùng';
      return;
    }

    this.userProfileService.getFullNameByUserId(creatorId).subscribe({
      next: (name) => {
        this.authorName = name || creatorId;
      },
      error: () => {
        this.authorName = creatorId;
      },
    });
  }
}
