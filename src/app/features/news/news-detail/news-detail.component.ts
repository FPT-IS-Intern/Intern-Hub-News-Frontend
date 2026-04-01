import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NewsResponse } from '../../../models/news/news-response.model';
import { NewsService } from '../../../services/news.service';
import { FileUrlPipe } from '../../../utils/file-url.pipe';

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
  
  private readonly route = inject(ActivatedRoute);
  private readonly newsService = inject(NewsService);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.newsService.getById(id).subscribe({
          next: (res) => {
            if (res.data) {
              this.news = res.data;
              this.createdAtDate = new Date(Number(this.news.createdAt));
            }
          },
          error: (err) => console.error('Failed to load news detail', err)
        });
      }
    });
  }
}
