export interface NewsResponse {
  id: string;
  title: string;
  body: string;
  shortDescription: string;
  topics: import('./news-topic-response.model').NewsTopicResponse[];
  thumbNail: string;
  status: string;
  featured: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy?: string | number;
  createdByName?: string;
  fullName?: string;
}
