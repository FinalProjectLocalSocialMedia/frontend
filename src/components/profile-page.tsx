import { useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Bell,
  Bookmark,
  Camera,
  Check,
  Edit3,
  Flag,
  Home,
  MessageCircle,
  MoreHorizontal,
  Navigation,
  Search,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  X,
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

const ownerProfile: ProfileData = {
  id: "me",
  name: "Nguyễn Minh",
  username: "@minhnguyen",
  bio: "Sharing the local pulse around Cầu Giấy. Coffee, traffic, and good neighborhood energy.",
  initials: "NM",
  color: "bg-amber-100 text-amber-700",
  location: "Cầu Giấy, Hanoi",
  followers: 248,
  following: 186,
  posts: nearbyPosts.filter((post) => post.handle === "@minhnguyen"),
};

const people = [
  { id: "huy", name: "Huy Phạm", username: "@huypham", initials: "HP", color: "bg-sky-100 text-sky-700" },
  { id: "linh", name: "Linh Trần", username: "@linh.works", initials: "LT", color: "bg-rose-100 text-rose-700" },
  { id: "anh", name: "Mai Anh", username: "@maianh", initials: "MA", color: "bg-violet-100 text-violet-700" },
];

function Sidebar({ page, onNavigate }: { page: string; onNavigate: (page: string) => void }) {
  const items = [
    ["Home", Home],
    ["Explore", Search],
    ["Notifications", Bell],
    ["Messages", MessageCircle],
    ["Saved posts", Bookmark],
    ["Profile", UserRound],
  ] as const;

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[84px] flex-col items-center border-r border-border bg-white px-3 py-4 lg:flex">
      <button
        aria-label="Home"
        onClick={() => onNavigate("Home")}
        className="flex size-10 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground"
      >
        nearby.
      </button>
      <nav aria-label="Primary navigation" className="mt-16 flex flex-col items-center gap-6">
        {items.map(([label, Icon]) => (
          <button
            key={label}
            aria-label={label}
            onClick={() => onNavigate(label)}
            className={`flex size-12 items-center justify-center rounded-full transition-colors ${page === label ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"}`}
          >
            <Icon className="size-5" />
          </button>
        ))}
      </nav>
    </aside>
  );
}

function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={onClose}>
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 id="dialog-title" className="text-lg font-semibold">{title}</h2>
          <button aria-label="Close dialog" onClick={onClose} className="rounded-lg p-2 hover:bg-muted"><X className="size-4" /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

function ProfilePost({ post, onDelete }: { post: NearbyPost; onDelete: () => void }) {
  return (
    <article className="border-b border-border p-5 last:border-0">
      <div className="flex gap-3">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${post.color}`}>{post.initials}</div>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{post.name}</p>
              <p className="text-xs text-muted-foreground">{post.time} · {post.location}</p>
            </div>
            <button aria-label="Delete post" onClick={onDelete} className="rounded-lg p-2 hover:bg-muted"><Trash2 className="size-4 text-muted-foreground" /></button>
          </div>
          <p className="mt-3 leading-6">{post.text}</p>
          <p className="mt-2 text-xs font-semibold text-primary">{post.topic}</p>
          <div className="mt-4 flex gap-5 text-xs text-muted-foreground"><span>♡ {post.likes}</span><span>Comments {post.comments}</span><span>Share</span></div>
        </div>
      </div>
    </article>
  );
}

export function ProfilePage({ onNavigate, profile = ownerProfile, isOwnProfile = true }: { onNavigate: (page: string) => void; profile?: ProfileData; isOwnProfile?: boolean }) {
  const [data, setData] = useState(profile);
  const [tab, setTab] = useState("Posts");
  const [following, setFollowing] = useState(false);
  const [removed, setRemoved] = useState<string[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState<"followers" | "following" | null>(null);
  const [peopleSearch, setPeopleSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<"block" | "report" | "delete" | null>(null);
  const [reportDetails, setReportDetails] = useState("");
  const [draft, setDraft] = useState(data);
  const avatarInput = useRef<HTMLInputElement>(null);
  const posts = data.posts.filter((post) => !removed.includes(post.id));
  const visiblePeople = people.filter((person) => `${person.name} ${person.username}`.toLowerCase().includes(peopleSearch.toLowerCase()));
  const tabs = isOwnProfile ? ["Posts", "Liked", "Saved"] : ["Posts"];

  function openEdit() {
    setDraft(data);
    setEditOpen(true);
  }

  function saveProfile() {
    if (!draft.name.trim() || !draft.username.trim() || draft.bio.length > 160) return;
    setData({ ...draft, name: draft.name.trim(), username: draft.username.trim(), bio: draft.bio.trim() });
    setEditOpen(false);
  }

  function executeConfirm() {
    if (confirm === "delete") setRemoved([...removed, ...posts.slice(0, 1).map((post) => post.id)]);
    setConfirm(null);
    setReportDetails("");
  }

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <Sidebar page="Profile" onNavigate={onNavigate} />
      <main className="lg:pl-[84px]">
        <section className="border-b border-border bg-card px-5 py-8 sm:px-10">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your identity nearby</p>
            <div className="mt-5 flex gap-4">
              <div className={`flex size-20 shrink-0 items-center justify-center rounded-full text-lg font-bold ${data.color}`}>{data.initials}</div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold">{data.name}</h1><span className="text-sm text-muted-foreground">{data.username}</span></div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{data.bio}</p>
                <p className="mt-2 text-xs font-medium text-primary">{data.location}</p>
                <div className="mt-4 flex flex-wrap gap-5 text-sm"><button onClick={() => setPeopleOpen("followers")}><strong>{data.followers}</strong> followers</button><button onClick={() => setPeopleOpen("following")}><strong>{data.following}</strong> following</button><span><strong>{posts.length}</strong> posts</span></div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {isOwnProfile ? <Button onClick={openEdit}><Edit3 data-icon="inline-start" /> Edit profile</Button> : <><Button variant={following ? "outline" : "default"} onClick={() => setFollowing(!following)}>{following ? <Check data-icon="inline-start" /> : <UserPlus data-icon="inline-start" />} {following ? "Following" : "Follow"}</Button><Button variant="outline" onClick={() => onNavigate("Messages")}>Message</Button></>}
              <div className="relative"><Button variant="outline" aria-label="More actions" onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal /></Button>{menuOpen && <div className="absolute right-0 top-11 z-10 w-44 rounded-xl border border-border bg-card p-1 shadow-lg"><button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => { setMenuOpen(false); setConfirm("block"); }}><UserRound className="size-4" /> Block user</button><button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => { setMenuOpen(false); setConfirm("report"); }}><Flag className="size-4" /> Report profile</button></div>}</div>
            </div>
            <div className="mt-6 flex border-t border-border pt-3">{tabs.map((item) => <button key={item} role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={`flex-1 border-b-2 py-2 text-sm font-medium ${tab === item ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{item}</button>)}</div>
          </div>
        </section>
        <section className="mx-auto max-w-3xl px-5 py-6 sm:px-10"><div className="overflow-hidden rounded-2xl border border-border bg-card">{tab === "Posts" && posts.length ? posts.map((post) => <ProfilePost key={post.id} post={post} onDelete={() => setConfirm("delete")} />) : <div className="px-6 py-16 text-center"><Users className="mx-auto text-primary" /><h2 className="mt-4 font-semibold">{tab === "Posts" ? "No public posts yet" : `${tab} is empty`}</h2><p className="mt-2 text-sm text-muted-foreground">Content will appear here when available.</p></div>}</div></section>
      </main>

      {editOpen && <Dialog title="Edit profile" onClose={() => setEditOpen(false)}><div className="mt-5 space-y-4"><div className="flex items-center gap-3"><div className={`flex size-14 items-center justify-center rounded-full text-sm font-bold ${draft.color}`}>{draft.initials}</div><input ref={avatarInput} type="file" accept="image/*" className="hidden" /><Button variant="outline" onClick={() => avatarInput.current?.click()}><Camera data-icon="inline-start" /> Change avatar</Button></div><label className="block text-sm font-medium">Display name<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30" /></label><label className="block text-sm font-medium">Bio<textarea value={draft.bio} maxLength={160} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} className="mt-1 min-h-24 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30" /><span className="text-xs text-muted-foreground">{draft.bio.length}/160</span></label>{(!draft.name.trim() || draft.bio.length > 160) && <p className="text-sm text-destructive">Enter a display name and keep your bio under 160 characters.</p>}<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={saveProfile}>Save changes</Button></div></div></Dialog>}

      {peopleOpen && <Dialog title={peopleOpen === "followers" ? "Followers" : "Following"} onClose={() => { setPeopleOpen(null); setPeopleSearch(""); }}><div className="relative mt-4"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><input autoFocus value={peopleSearch} onChange={(e) => setPeopleSearch(e.target.value)} placeholder="Search people" className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 outline-none focus:ring-2 focus:ring-primary/30" /></div><div className="mt-3 max-h-64 overflow-y-auto">{visiblePeople.length ? visiblePeople.map((person) => <button key={person.id} onClick={() => onNavigate("Profile")} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted"><div className={`flex size-9 items-center justify-center rounded-full text-xs font-bold ${person.color}`}>{person.initials}</div><span><strong className="block text-sm">{person.name}</strong><span className="text-xs text-muted-foreground">{person.username}</span></span></button>) : <p className="px-2 py-8 text-center text-sm text-muted-foreground">No users found.</p>}</div></Dialog>}

      {confirm && <Dialog title={confirm === "report" ? "Report profile" : confirm === "block" ? "Block this user?" : "Delete this post?"} onClose={() => setConfirm(null)}><div className="mt-4 space-y-4"><p className="text-sm text-muted-foreground">{confirm === "report" ? "Tell us what is wrong with this profile. Our team will review your report." : confirm === "block" ? "This user will not be able to view or interact with you." : "This action cannot be undone."}</p>{confirm === "report" && <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Add details (optional)" className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30" />}<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="destructive" onClick={executeConfirm}>{confirm === "report" ? "Submit report" : confirm === "block" ? "Block" : "Delete"}</Button></div></div></Dialog>}
    </div>
  );
}

export default ProfilePage;
