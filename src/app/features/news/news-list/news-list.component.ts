import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsResponse } from '../../../models/news/news-response.model';
import { NewsService } from '@services/news.service';

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './news-list.component.html',
  styleUrls: ['./news-list.component.scss'],
})
export class NewsListComponent implements OnInit {
  news: NewsResponse[] = [];
  loading = false;

  constructor(private readonly newsService: NewsService) {}

  ngOnInit(): void {
    this.loading = true;
    this.newsService.getAll().subscribe({
      next: (res) => {
        this.news = res.data?.items || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  getTopicNames(item: NewsResponse): string {
    return item.topics?.map(t => t.name).join(', ') || '';
  }
}
