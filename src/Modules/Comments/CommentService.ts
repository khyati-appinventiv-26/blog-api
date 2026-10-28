import mongoose from "mongoose";
import { AppError } from "../../utils/AppError";
import { invalidatePostCaches } from "../../utils/postCache";
import { CommentRepository } from "../../Repository/CommentRepository";
import { PostRepository } from "../../Repository/PostRepository";
import { IComment } from "../../model/Comment";
import { IUser } from "../../model/User";

export type PublicComment = {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
};

export class CommentService {
  private readonly comments = new CommentRepository();
  private readonly posts = new PostRepository();

  public toPublic(comment: IComment | Record<string, unknown>): PublicComment {
    const doc = comment as IComment & { _id: mongoose.Types.ObjectId };
    return {
      id: String(doc._id),
      postId: String(doc.postId),
      userId: String(doc.userId),
      userName: doc.userName,
      text: doc.text,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  public assertObjectId(id: string, label = "id"): void {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(`Invalid ${label}`, 400);
    }
  }

  public async create(
    user: IUser,
    postId: string,
    textInput: unknown
  ): Promise<PublicComment> {
    this.assertObjectId(postId, "post id");
    const text = this.requireText(textInput);

    const post = await this.posts.findById(postId);
    if (!post || post.status !== "published") {
      throw new AppError("Post not found", 404);
    }

    const comment = await this.comments.create({
      postId,
      userId: String(user._id),
      userName: user.name,
      text,
    });
    await this.comments.incrementPostCommentCount(postId);
    await this.onCommentChanged(postId);

    return this.toPublic(comment);
  }

  public async list(
    postId: string,
    raw: { page?: unknown; limit?: unknown }
  ): Promise<{
    data: PublicComment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    this.assertObjectId(postId, "post id");

    const post = await this.posts.findById(postId);
    if (!post) {
      throw new AppError("Post not found", 404);
    }

    const page = this.parsePage(raw.page);
    const limit = this.parseLimit(raw.limit);
    const { comments, total } = await this.comments.listByPost({
      postId,
      page,
      limit,
    });

    return {
      data: comments.map((c) => this.toPublic(c)),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  public async remove(user: IUser, commentId: string): Promise<void> {
    this.assertObjectId(commentId, "comment id");

    const comment = await this.comments.findById(commentId);
    if (!comment) {
      throw new AppError("Comment not found", 404);
    }

    const post = await this.posts.findById(String(comment.postId));
    if (!post) {
      throw new AppError("Post not found", 404);
    }

    const isCommentAuthor = String(comment.userId) === String(user._id);
    const isPostAuthor = String(post.author) === String(user._id);
    if (!isCommentAuthor && !isPostAuthor) {
      throw new AppError("Forbidden", 403);
    }

    await this.comments.deleteById(commentId);
    await this.comments.decrementPostCommentCount(String(comment.postId));
    await this.onCommentChanged(String(comment.postId));
  }

  protected async onCommentChanged(postId: string): Promise<void> {
    await invalidatePostCaches(postId);
  }

  private requireText(value: unknown): string {
    if (typeof value !== "string") {
      throw new AppError("Text is required", 400);
    }
    const text = value.trim();
    if (text.length < 1 || text.length > 500) {
      throw new AppError("Text must be between 1 and 500 characters", 400);
    }
    return text;
  }

  private parsePage(value: unknown): number {
    if (value === undefined || value === null || value === "") return 1;
    const page = Number(value);
    if (!Number.isInteger(page) || page < 1) {
      throw new AppError("page must be a positive integer", 400);
    }
    return page;
  }

  private parseLimit(value: unknown): number {
    if (value === undefined || value === null || value === "") return 10;
    const limit = Number(value);
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw new AppError("limit must be an integer between 1 and 50", 400);
    }
    return limit;
  }
}
