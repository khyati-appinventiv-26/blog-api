import mongoose from "mongoose";
import { PostSort, RedisKeys, RedisTTL } from "../../constants";
import { AppError } from "../../utils/AppError";
import { cache } from "../../utils/redisCache";
import { invalidatePostCaches } from "../../utils/postCache";
import { PostRepository } from "../../Repository/PostRepository";
import { CommentRepository } from "../../Repository/CommentRepository";
import { IPost, PostStatus } from "../../model/Post";
import { IUser } from "../../model/User";

export type PublicPost = {
  id: string;
  title: string;
  body?: string;
  tags: string[];
  author: string;
  authorName: string;
  status: PostStatus;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export class PostService {
  private readonly posts = new PostRepository();
  private readonly comments = new CommentRepository();

  public toPublicPost(post: IPost, includeBody = true): PublicPost {
    const base: PublicPost = {
      id: String(post._id),
      title: post.title,
      tags: post.tags,
      author: String(post.author),
      authorName: post.authorName,
      status: post.status,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
    if (includeBody) {
      base.body = post.body;
    }
    return base;
  }

  public assertObjectId(id: string): void {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid post id", 400);
    }
  }

  public async create(
    user: IUser,
    input: {
      title: unknown;
      body: unknown;
      tags?: unknown;
      status?: unknown;
    }
  ): Promise<PublicPost> {
    const title = this.requireTitle(input.title);
    const body = this.requireBody(input.body);
    const tags = this.normalizeTags(input.tags);
    const status = this.normalizeStatus(input.status, "draft");

    const post = await this.posts.create({
      title,
      body,
      tags,
      author: String(user._id),
      authorName: user.name,
      status,
    });

    await cache.incr(RedisKeys.postListVersion());
    return this.toPublicPost(post);
  }

  public async getPublishedById(
    id: string
  ): Promise<{ data: PublicPost; cache: "HIT" | "MISS" }> {
    this.assertObjectId(id);

    const cached = await cache.getJSON<PublicPost>(RedisKeys.post(id));
    if (cached) {
      return { data: cached, cache: "HIT" };
    }

    const post = await this.posts.findById(id);
    if (!post || post.status !== "published") {
      throw new AppError("Post not found", 404);
    }

    const publicPost = this.toPublicPost(post);
    await cache.setJSON(RedisKeys.post(id), publicPost, RedisTTL.post);
    return { data: publicPost, cache: "MISS" };
  }

  public async update(
    user: IUser,
    id: string,
    input: {
      title?: unknown;
      body?: unknown;
      tags?: unknown;
      status?: unknown;
    }
  ): Promise<PublicPost> {
    this.assertObjectId(id);

    const post = await this.posts.findById(id);
    if (!post) {
      throw new AppError("Post not found", 404);
    }
    if (String(post.author) !== String(user._id)) {
      throw new AppError("Forbidden", 403);
    }

    const update: Partial<{
      title: string;
      body: string;
      tags: string[];
      status: PostStatus;
    }> = {};

    if (input.title !== undefined) {
      update.title = this.requireTitle(input.title);
    }
    if (input.body !== undefined) {
      update.body = this.requireBody(input.body);
    }
    if (input.tags !== undefined) {
      update.tags = this.normalizeTags(input.tags);
    }
    if (input.status !== undefined) {
      update.status = this.normalizeStatus(input.status);
    }

    const updated = await this.posts.updateById(id, update);
    if (!updated) {
      throw new AppError("Post not found", 404);
    }

    await invalidatePostCaches(id);
    return this.toPublicPost(updated);
  }

  public async remove(user: IUser, id: string): Promise<void> {
    this.assertObjectId(id);

    const post = await this.posts.findById(id);
    if (!post) {
      throw new AppError("Post not found", 404);
    }
    if (String(post.author) !== String(user._id)) {
      throw new AppError("Forbidden", 403);
    }

    await this.comments.deleteByPostId(id);
    await this.posts.deleteById(id);
    await invalidatePostCaches(id);
  }

  public async listMine(user: IUser): Promise<PublicPost[]> {
    const posts = await this.posts.findByAuthor(String(user._id));
    return posts.map((post) => this.toPublicPost(post));
  }

  public async listPublished(raw: {
    page?: unknown;
    limit?: unknown;
    search?: unknown;
    tag?: unknown;
    sort?: unknown;
  }): Promise<{
    data: Array<Record<string, unknown>>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    cache: "HIT" | "MISS";
  }> {
    const page = this.parsePage(raw.page);
    const limit = this.parseLimit(raw.limit);
    const search =
      typeof raw.search === "string" ? raw.search.trim().toLowerCase() : "";
    const tag =
      typeof raw.tag === "string" ? raw.tag.trim().toLowerCase() : "";
    const sort = this.parseSort(raw.sort);

    const versionRaw = await cache.getString(RedisKeys.postListVersion());
    const version = versionRaw === null ? 0 : Number(versionRaw) || 0;
    const cacheKey = RedisKeys.postList({
      version,
      page,
      limit,
      search,
      tag,
      sort,
    });

    type ListPayload = {
      data: Array<Record<string, unknown>>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };

    const cached = await cache.getJSON<ListPayload>(cacheKey);
    if (cached) {
      return { ...cached, cache: "HIT" };
    }

    const { posts, total } = await this.posts.listPublished({
      page,
      limit,
      search,
      tag,
      sort,
    });

    const payload: ListPayload = {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };

    await cache.setJSON(cacheKey, payload, RedisTTL.postList);
    return { ...payload, cache: "MISS" };
  }

  private requireTitle(value: unknown): string {
    if (typeof value !== "string") {
      throw new AppError("Title is required", 400);
    }
    const title = value.trim();
    if (title.length < 5 || title.length > 120) {
      throw new AppError("Title must be between 5 and 120 characters", 400);
    }
    return title;
  }

  private requireBody(value: unknown): string {
    if (typeof value !== "string") {
      throw new AppError("Body is required", 400);
    }
    if (value.trim().length < 20) {
      throw new AppError("Body must be at least 20 characters", 400);
    }
    return value;
  }

  private normalizeTags(value: unknown): string[] {
    if (value === undefined || value === null) {
      return [];
    }
    if (!Array.isArray(value)) {
      throw new AppError("Tags must be an array of strings", 400);
    }
    if (value.length > 5) {
      throw new AppError("Maximum 5 tags allowed", 400);
    }
    const tags = value.map((tag) => {
      if (typeof tag !== "string" || !tag.trim()) {
        throw new AppError("Each tag must be a non-empty string", 400);
      }
      return tag.trim().toLowerCase();
    });
    return [...new Set(tags)];
  }

  private normalizeStatus(
    value: unknown,
    fallback?: PostStatus
  ): PostStatus {
    if (value === undefined || value === null) {
      if (fallback) return fallback;
      throw new AppError("Status is required", 400);
    }
    if (value !== "draft" && value !== "published") {
      throw new AppError('Status must be "draft" or "published"', 400);
    }
    return value;
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

  private parseSort(value: unknown): PostSort {
    if (value === undefined || value === null || value === "") {
      return "newest";
    }
    if (
      value !== "newest" &&
      value !== "oldest" &&
      value !== "mostCommented"
    ) {
      throw new AppError(
        'sort must be "newest", "oldest", or "mostCommented"',
        400
      );
    }
    return value;
  }
}
