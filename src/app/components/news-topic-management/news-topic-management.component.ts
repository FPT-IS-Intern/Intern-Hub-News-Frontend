import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewsTopicService } from '../../services/news-topic.service';
import { NewsTopicResponse } from '../../models/news';
import { RouterModule } from '@angular/router';

import { PopUpConfirmComponent } from '../pop-up-confirm/pop-up-confirm.component';

import { 
  IconComponent 
} from '@goat-bravos/intern-hub-layout';

@Component({
  selector: 'app-news-topic-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IconComponent,
    PopUpConfirmComponent,
  ],
  templateUrl: './news-topic-management.component.html',
  styleUrls: ['./news-topic-management.component.scss']
})
export class NewsTopicManagementComponent implements OnInit {
  private readonly topicService = inject(NewsTopicService);

  topics: NewsTopicResponse[] = [];
  loading = false;
  showModal = false;
  isEdit = false;

  showConfirmDelete = false;
  selectedTopicId: string | null = null;
  
  editingTopic: Partial<NewsTopicResponse> = {
    name: '',
    description: ''
  };

  ngOnInit(): void {
    this.loadTopics();
  }

  loadTopics(): void {
    this.loading = true;
    this.topicService.getAll().subscribe({
      next: (res) => {
        this.topics = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        console.error('Failed to load topics');
      }
    });
  }

  openCreateModal(): void {
    this.isEdit = false;
    this.editingTopic = { name: '', description: '' };
    this.showModal = true;
  }

  openEditModal(topic: NewsTopicResponse): void {
    this.isEdit = true;
    this.editingTopic = { ...topic };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveTopic(): void {
    if (!this.editingTopic.name) return;

    if (this.isEdit && this.editingTopic.id) {
      this.topicService.update(this.editingTopic.id, this.editingTopic).subscribe(() => {
        this.loadTopics();
        this.closeModal();
      });
    } else {
      this.topicService.create(this.editingTopic).subscribe(() => {
        this.loadTopics();
        this.closeModal();
      });
    }
  }

  deleteTopic(id: string): void {
    this.selectedTopicId = id;
    this.showConfirmDelete = true;
  }

  confirmDelete(): void {
    if (this.selectedTopicId) {
      this.topicService.delete(this.selectedTopicId).subscribe(() => {
        this.loadTopics();
        this.showConfirmDelete = false;
        this.selectedTopicId = null;
      });
    }
  }

  cancelDelete(): void {
    this.showConfirmDelete = false;
    this.selectedTopicId = null;
  }
}
