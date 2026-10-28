import { RedisKeys, RedisTTL } from "../../constants";
import { cache } from "../../utils/redisCache";
import { Post } from "../../model/Post";

export type StatsPayload = {
  totalPublishedPosts: number;
  topTags: Array<{ tag: string; count: number }>;
  topAuthors: Array<{ authorId: string; name: string; posts: number }>;
  topCommentedPosts: Array<{
    id: string;
    title: string;
    commentCount: number;
  }>;
};

export class StatsService {
  public async getStats(): Promise<{
    data: StatsPayload;
    cache: "HIT" | "MISS";
  }> {
    const cached = await cache.getJSON<StatsPayload>(RedisKeys.stats());
    if (cached) {
      return { data: cached, cache: "HIT" };
    }

    const data = await this.aggregateStats();
    await cache.setJSON(RedisKeys.stats(), data, RedisTTL.stats);
    return { data, cache: "MISS" };
  }

  private async aggregateStats(): Promise<StatsPayload> {
    const [result] = await Post.aggregate([
      { $match: { status: "published" } },
      {
        $facet: {
          totalPublishedPosts: [{ $count: "count" }],
          topTags: [
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $project: { _id: 0, tag: "$_id", count: 1 } },
          ],
          topAuthors: [
            { $group: { _id: "$author", posts: { $sum: 1 } } },
            { $sort: { posts: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user",
              },
            },
            { $unwind: "$user" },
            {
              $project: {
                _id: 0,
                authorId: { $toString: "$_id" },
                name: "$user.name",
                posts: 1,
              },
            },
          ],
          topCommentedPosts: [
            { $sort: { commentCount: -1, createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                _id: 0,
                id: { $toString: "$_id" },
                title: 1,
                commentCount: 1,
              },
            },
          ],
        },
      },
    ]);

    return {
      totalPublishedPosts: result?.totalPublishedPosts?.[0]?.count ?? 0,
      topTags: result?.topTags ?? [],
      topAuthors: result?.topAuthors ?? [],
      topCommentedPosts: result?.topCommentedPosts ?? [],
    };
  }
}
