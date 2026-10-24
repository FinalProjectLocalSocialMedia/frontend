import { usePosts } from '@/lib/posts-context'

import { PostHeader } from "./post-header";
import { PostActions } from "./post-actions";
import { PostMediaGrid } from "./post-media-grid";
import { PostEngagement } from "./post-engagement";
import { PostContent } from './post-content';
import { useNavigate } from 'react-router-dom';
import { PostSearchItem } from '../types/post';





interface PostCardProps {
  post: PostSearchItem;
  currentUserId?: string;
}

export function PostCard({ post, currentUserId}: PostCardProps) {
  const {savedIds,likedIds,toggleLiked, toggleSaved,removePost,} = usePosts();
  const navigate = useNavigate();
  const liked = likedIds.includes(post.id);
  const saved = savedIds.includes(post.id);
  const isOwn =
    currentUserId !== undefined &&
    post.author.id === currentUserId;

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_-26px_rgba(15,23,42,0.35)]"
       onClick={() => navigate(`/posts/${post.id}`)}
    >
      <div className="flex items-start gap-3">
        <PostHeader post={post} />
       
      <div onClick={(e) => e.stopPropagation()}>
          <PostActions
            post={post}
            saved={saved}
            isOwn={isOwn}
            toggleSaved={toggleSaved}
            removePost={removePost}
          />
        </div>
      </div>
       <div className="mt-4 text-[15px] leading-6 text-foreground/90">
          <PostContent content={post.content} />
        </div>

      <div onClick={(e) => e.stopPropagation()}>
        <PostMediaGrid media={post.media} />
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <PostEngagement
          post={post}
          liked={liked}
          toggleLiked={toggleLiked}
        />
      </div>
    </article>
  );
}
