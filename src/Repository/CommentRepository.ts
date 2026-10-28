import { Types } from "mongoose";
import { Comment, IComment } from "../model/Comment";
import { Post } from "../model/Post";

export class CommentRepository {
  public async create(data: {
    postId: string;
    userId: string;
    userName: string;
    text: string;
  }): Promise<IComment> {
    return Comment.create(data);
  }

  public async findById(id: string): Promise<IComment | null> {
    return Comment.findById(id);
  }

  public async deleteById(id: string): Promise<IComment | null> {
    return Comment.findByIdAndDelete(id);
  }

  public async deleteByPostId(postId: string): Promise<void> {
    await Comment.deleteMany({ postId });
  }

  public async listByPost(params: {
    postId: string;
    page: number;
    limit: number;
  }): Promise<{ comments: IComment[]; total: number }> {
    const skip = (params.page - 1) * params.limit;

    const [result] = await Comment.aggregate([
      { $match: { postId: new Types.ObjectId(params.postId) } },
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: params.limit },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const comments = (result?.data ?? []) as IComment[];
    const total = result?.totalCount?.[0]?.count ?? 0;
    return { comments, total };
  }

  public async incrementPostCommentCount(postId: string): Promise<void> {
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });
  }

  public async decrementPostCommentCount(postId: string): Promise<void> {
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: -1 } });
  }
}
