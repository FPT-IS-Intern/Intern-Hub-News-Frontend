import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { forkJoin, map, switchMap, of } from 'rxjs';
import { NewsService } from '../../services/news.service';
import { NewsTopicService } from '../../services/news-topic.service';
import { NewsResponse } from '../../models/news';

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './news-list.component.html',
  styleUrl: './news-list.component.scss',
})
export class NewsListComponent implements OnInit {
  featuredMain?: NewsResponse;
  featuredMinors: NewsResponse[] = [];
  categories: { id: string; name: string; posts: NewsResponse[] }[] = [];

  constructor(
    private readonly newsService: NewsService,
    private readonly topicService: NewsTopicService,
  ) {}

  ngOnInit(): void {
    // 1. Fetch Featured News
    this.newsService.getAllFeatured(0, 5).subscribe({
      next: (res) => {
        const items = res.data?.items || [];
        if (items.length > 0) {
          this.featuredMain = items[0];
          this.featuredMinors = items.slice(1, 5);
        }
      }
    });

    // 2. Fetch Topics and their latest news
    this.topicService.getAll().pipe(
      switchMap(res => {
        const topics = res.data?.slice(0, 3) || []; // Take top 3 topics
        if (topics.length === 0) return of([]);

        const requests = topics.map(topic => 
          this.newsService.getApprovedNewsByTopic(topic.id, 0, 5).pipe(
            map(newsRes => ({
              id: topic.id,
              name: topic.name,
              posts: newsRes.data?.items || []
            }))
          )
        );
        return forkJoin(requests);
      })
    ).subscribe({
      next: (cats) => {
        this.categories = cats;
      }
    });
  }
}
