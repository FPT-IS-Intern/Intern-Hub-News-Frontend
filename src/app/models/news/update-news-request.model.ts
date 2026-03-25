export interface UpdateNewsRequest {
  title: string;
  body: string;
  topicIds: string[];
  featured: boolean;
}
