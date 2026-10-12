import { useState } from "react";
import {
  Edit3,
  MoreHorizontal,
  Settings,
  UserPlus,
  Flag,
  Lock,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { nearbyPosts, type NearbyPost } from "@/lib/mock-nearby";

export type ProfileData = {
  id: string;
  name: string;
  username: string;
  bio: string;
  initials: string;
  color: string;
  location: string;
  followers: number;
  following: number;
  posts: NearbyPost[];
};
export const ownerProfile: ProfileData = {
  id: "me",
  name: "Nguyễn Minh",
  username: "@minhnguyen",
  bio: "Sharing the local pulse around Cầu Giấy. Coffee, traffic, and good neighborhood energy.",
  initials: "NM",
  color: "bg-primary/15 text-primary",
  location: "Cầu Giấy, Hanoi",
  followers: 248,
  following: 186,
  posts: nearbyPosts.filter((post) => post.handle === "@minhnguyen"),
};

function ProfilePost({
  post,
  own,
  onDelete,
}: {
  post: NearbyPost;
  own: boolean;
  onDelete: () => void;
}) {
  return (
    <article className="border-b border-border p-5 last:border-0">
      <div className="flex gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${post.color}`}
        >
          {post.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-semibold">{post.name}</p>
              <p className="text-xs text-muted-foreground">
                {post.time} · {post.location}
              </p>
            </div>
            {own && (
              <button aria-label="Delete post" onClick={onDelete}>
                <Trash2 className="size-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <p className="mt-3 leading-6">{post.text}</p>
          <p className="mt-2 text-xs font-semibold text-primary">
            {post.topic}
          </p>
          <div className="mt-4 flex gap-5 text-xs text-muted-foreground">
            <span>♡ {post.likes}</span>
            <span>Comments {post.comments}</span>
            <span>Share</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProfilePage({
  onNavigate,
  profile = ownerProfile,
  isOwnProfile = true,
}: {
  onNavigate: (page: string) => void;
  profile?: ProfileData;
  isOwnProfile?: boolean;
}) {
  const [data, setData] = useState(profile);
  const [tab, setTab] = useState("Bài viết");
  const [following, setFollowing] = useState(false);
  const [removed, setRemoved] = useState<string[]>([]);
  const [locationLabels, setLocationLabels] = useState(true);
  const posts = data.posts.filter((post) => !removed.includes(post.id));
  const tabs = isOwnProfile ? ["Bài viết", "Đã thích", "Đã lưu"] : ["Bài viết"];
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <aside className="fixed hidden h-screen w-[72px] border-r border-border bg-white/80 p-4 lg:block">
        <div className="rounded-xl bg-primary p-2 text-center text-xs font-bold text-white">
          nearby.
        </div>
        <nav className="mt-10 flex flex-col gap-2">
          <button
            aria-label="Home"
            onClick={() => onNavigate("Home")}
            className="rounded-xl p-3 hover:bg-muted"
          >
            ←
          </button>
          <button
            aria-label="Explore"
            onClick={() => onNavigate("Explore")}
            className="rounded-xl p-3 hover:bg-muted"
          >
            ⌕
          </button>
          <button
            aria-label="Messages"
            onClick={() => onNavigate("Messages")}
            className="rounded-xl p-3 hover:bg-muted"
          >
            •••
          </button>
          <button
            aria-label="Profile"
            onClick={() => onNavigate("Profile")}
            className="rounded-xl bg-primary/10 p-3 text-primary hover:bg-primary/20"
          >
            <UserRound className="size-5" />
          </button>
        </nav>
      </aside>
      <div className="lg:pl-[72px]">
        <section className="border-b border-border bg-card px-5 py-6 sm:px-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Your identity nearby
            </p>
            <div className="mt-4 flex gap-4">
              <div
                className={`flex size-20 shrink-0 items-center justify-center rounded-full text-lg font-bold ${data.color}`}
              >
                {data.initials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold">{data.name}</h1>
                  <span className="text-sm text-muted-foreground">
                    {data.username}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {data.bio}
                </p>
                {locationLabels && (
                  <p className="mt-2 text-xs font-medium text-primary">
                    {data.location}
                  </p>
                )}
                <div className="mt-4 flex gap-5 text-sm">
                  <strong>
                    {data.followers}{" "}
                    <span className="font-normal">followers</span>
                  </strong>
                  <strong>
                    {data.following}{" "}
                    <span className="font-normal">following</span>
                  </strong>
                  <strong>
                    {posts.length} <span className="font-normal">posts</span>
                  </strong>
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {isOwnProfile ? (
                <>
                  <Button
                    onClick={() => setData({ ...data, bio: `${data.bio} ` })}
                  >
                    <Edit3 data-icon="inline-start" />
                    Chỉnh sửa trang cá nhân
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocationLabels(!locationLabels)}
                  >
                    <Settings data-icon="inline-start" />
                    {locationLabels ? "Hide location" : "Show location"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant={following ? "outline" : "default"}
                    onClick={() => setFollowing(!following)}
                  >
                    <UserPlus data-icon="inline-start" />
                    {following ? "Following" : "Follow"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onNavigate("Messages")}
                  >
                    Message
                  </Button>
                  <Button variant="outline" aria-label="More actions">
                    <MoreHorizontal />
                  </Button>
                </>
              )}
            </div>
            <div className="mt-6 flex border-t border-border pt-3">
              {tabs.map((item) => (
                <button
                  key={item}
                  role="tab"
                  aria-selected={tab === item}
                  onClick={() => setTab(item)}
                  className={`flex-1 border-b-2 py-2 text-sm font-medium ${tab === item ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>
        <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
          <section className="overflow-hidden rounded-2xl border border-border bg-card">
            {tab === "Bài viết" && posts.length ? (
              posts.map((post) => (
                <ProfilePost
                  key={post.id}
                  post={post}
                  own={isOwnProfile}
                  onDelete={() => setRemoved([...removed, post.id])}
                />
              ))
            ) : (
              <div className="px-6 py-16 text-center">
                <Edit3 className="mx-auto text-primary" />
                <h2 className="mt-4 font-semibold">
                  {tab === "Bài viết" && isOwnProfile
                    ? "Share your first local update"
                    : tab === "Bài viết"
                      ? "No public posts yet"
                      : `${tab} chưa có nội dung`}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Content will appear here when available.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
