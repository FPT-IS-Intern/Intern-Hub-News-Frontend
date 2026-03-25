export interface CreateNewsRequest {
  title: string;
  body: string;
  shortDescription: string;
  thumbnail?: string;
  topicIds?: string[];
  statusId: number;
  featured: boolean;
}
