import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getUserBookmarks } from "@/actions/bookmark";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export const revalidate = 30;

export default async function BookmarksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const bookmarks = await getUserBookmarks(page, 20);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26", marginBottom: "24px" }}>Bookmarks</h1>

      {bookmarks.items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">
            No bookmarks yet. Bookmark posts from the feed to save them here.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {bookmarks.items.map((post) => (
              <div
                key={post.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  {post.author.profileImage && (
                    <img
                      src={post.author.profileImage}
                      alt={post.author.name || ""}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-semibold">
                      {post.author.name || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>

                <Link href={`/feed/${post.id}`}>
                  <p className="text-gray-800 line-clamp-3 hover:text-blue-600 cursor-pointer">
                    {post.content}
                  </p>
                </Link>

                {post.images.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {post.images.slice(0, 2).map((image) => (
                      <img
                        key={image.id}
                        src={image.imageUrl}
                        alt="Post image"
                        className="w-20 h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                )}

                <div className="mt-3 flex gap-4 text-sm text-gray-500">
                  <span>{post._count.comments} comments</span>
                  <span>{post._count.likes} likes</span>
                </div>
              </div>
            ))}
          </div>

          {bookmarks.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/bookmarks?page=${page - 1}`}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  Previous
                </Link>
              )}

              {Array.from({ length: bookmarks.totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, page - 2), Math.min(bookmarks.totalPages, page + 1))
                .map((p) => (
                  <Link
                    key={p}
                    href={`/bookmarks?page=${p}`}
                    className={`px-4 py-2 rounded ${
                      p === page
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </Link>
                ))}

              {page < bookmarks.totalPages && (
                <Link
                  href={`/bookmarks?page=${page + 1}`}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
