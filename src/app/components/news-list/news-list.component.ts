import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, map, switchMap, of, debounceTime, distinctUntilChanged } from 'rxjs';
import { NewsService } from '../../services/news.service';
import { NewsTopicService } from '../../services/news-topic.service';
import { NewsResponse } from '../../models/news';
import { FileUrlPipe } from '../../utils/file-url.pipe';

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, ReactiveFormsModule, FileUrlPipe],
  templateUrl: './news-list.component.html',
  styleUrl: './news-list.component.scss',
})
export class NewsListComponent implements OnInit {
  featuredMain?: NewsResponse;
  featuredMinors: NewsResponse[] = [];
  categories: { id: string; name: string; posts: NewsResponse[] }[] = [];
  
  // Search related
  searchControl = new FormControl('');
  searchResults: NewsResponse[] = [];
  isSearching = false;

  sortColumn = 'created_at';
  sortDirection = 'desc';

  constructor(
    private readonly newsService: NewsService,
    private readonly topicService: NewsTopicService,
  ) {}

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(value => {
      if (value && value.trim().length > 0) {
        this.performSearch(value.trim());
      } else {
        this.isSearching = false;
        this.loadData();
      }
    });

    this.loadData();
  }

  loadData(): void {
    if (this.isSearching) return;

    // 1. Fetch Featured News (Typically always by date/featured status, but we'll apply sort if applicable)
    this.newsService.getAllFeatured(0, 5, this.sortColumn, this.sortDirection).subscribe({
      next: (res) => {
        const items = res.data?.items || [];
        if (items.length > 0) {
          this.featuredMain = items[0];
          this.featuredMinors = items.slice(1, 4); // Limit to 3 minors + 1 main = 4
        } else {
          this.featuredMain = undefined;
          this.featuredMinors = [];
        }
      }
    });

    // 2. Fetch Topics and their news with current sort
    this.topicService.getAll().pipe(
      switchMap(res => {
        const topics = res.data?.slice(0, 3) || []; // Take top 3 topics
        if (topics.length === 0) return of([]);

        const requests = topics.map(topic => 
          this.newsService.getApprovedNewsByTopic(topic.id, 0, 4, this.sortColumn, this.sortDirection).pipe(
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

  performSearch(query: string): void {
    this.isSearching = true;
    this.newsService.searchByTitle(query, 0, 20, this.sortColumn, this.sortDirection).subscribe({
      next: (res) => {
        this.searchResults = res.data?.items || [];
      }
    });
  }

  onSortChange(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    if (this.isSearching && this.searchControl.value) {
      this.performSearch(this.searchControl.value);
    } else {
      this.loadData();
    }
  }
}
