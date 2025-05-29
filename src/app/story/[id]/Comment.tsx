import type { Comment as CommentType } from "@/types";

/**
 * Plain-text recursive renderer for one comment subtree.
 * No client interactivity, so this remains a Server Component.
 */
export default function Comment({
  comment,
  depth,
}: {
  comment: CommentType;
  depth: number;
}) {
  return (
    <div style={{ paddingLeft: depth * 20 }}>
      <p>{comment.text}</p>

      {comment.children.map((child) => (
        <Comment key={child.id} comment={child} depth={depth + 1} />
      ))}
    </div>
  );
}