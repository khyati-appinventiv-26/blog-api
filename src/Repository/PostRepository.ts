import { Types } from "mongoose";
import { IPost, Post, PostStatus } from "../model/Post";
import { PostSort } from "../constants";

export type PostListQuery = {
  page: number;
  limit: number;
  search: string;
  tag: string;
  sort: PostSort;
};

export type PostListResult = {
  posts: Array<Record<string, unknown>>;
  total: number;
};

export class PostRepository {
  public async create(data: {
    title: string;
    body: string;
    tags: string[];
    author: string;
    authorName: string;
    status: PostStatus;
  }): Promise<IPost> {
    return Post.create(data);
  }

  public async findById(id: string): Promise<IPost | null> {
    return Post.findById(id);
  }

  public async updateById(
    id: string,
    data: Partial<{
      title: string;
      body: string;
      tags: string[];
      status: PostStatus;
    }>
  ): Promise<IPost | null> {
    return Post.findByIdAndUpdate(id, data, {
      returnDocument: "after",
      runValidators: true,
    });
  }

  public async deleteById(id: string): Promise<IPost | null> {
    return Post.findByIdAndDelete(id);
  }

  public async findByAuthor(authorId: string): Promise<IPost[]> {
    return Post.find({ author: authorId }).sort({ createdAt: -1 });
  }

  public async listPublished(query: PostListQuery): Promise<PostListResult> {
    const filter: Record<string, unknown> = { status: "published" };

    if (query.search) {
      filter.title = { $regex: query.search, $options: "i" };
    }

    if (query.tag) {
      filter.tags = query.tag;
    }

    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    if (query.sort === "oldest") {
      sort = { createdAt: 1 };
    } else if (query.sort === "mostCommented") {
      sort = { commentCount: -1, createdAt: -1 };
    }

    const skip = (query.page - 1) * query.limit;

    const [result] = await Post.aggregate([
      { $match: filter },
      {
        $facet: {
          data: [
            { $sort: sort },
            { $skip: skip },
            { $limit: query.limit },
            {
              $project: {
                title: 1,
                tags: 1,
                author: 1,
                authorName: 1,
                status: 1,
                commentCount: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const posts = (result?.data ?? []).map(
      (doc: Record<string, unknown> & { _id: Types.ObjectId }) => ({
        id: String(doc._id),
        title: doc.title,
        tags: doc.tags,
        author: String(doc.author),
        authorName: doc.authorName,
        status: doc.status,
        commentCount: doc.commentCount,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })
    );

    const total = result?.totalCount?.[0]?.count ?? 0;
    return { posts, total };
  }
}
