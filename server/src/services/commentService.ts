import { CommentRepository } from '../repositories/commentRepository';

export class CommentService {
  private commentRepo = new CommentRepository();

  async getComments(taskId: string) {
    return await this.commentRepo.getByTask(taskId);
  }

  async addComment(taskId: string, userId: string, content: string) {
    return await this.commentRepo.create({ task_id: taskId, user_id: userId, content });
  }

  async deleteComment(id: string) {
    return await this.commentRepo.delete(id);
  }
}
