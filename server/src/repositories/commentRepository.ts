import { supabaseAdmin } from '../config/supabase';

export class CommentRepository {
  async getByTask(taskId: string) {
    const { data, error } = await supabaseAdmin
      .from('comments')
      .select(`
        *,
        profiles ( email )
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async create(commentData: { task_id: string; user_id: string; content: string }) {
    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert([commentData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async delete(id: string) {
    const { error } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
