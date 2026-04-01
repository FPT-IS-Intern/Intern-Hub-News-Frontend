export interface UpdateNewsRequest {
  title: string;
  body: string;
  shortDescription: string;
  topicIds: string[];
  featured: boolean;
  statusId: number;
  thumbnail?: string;
}
