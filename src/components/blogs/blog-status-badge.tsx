import { PostStatus } from "@/generated/prisma/enums";

import { Badge } from "@/components/ui/badge";

export function BlogStatusBadge({ status }: { status: PostStatus }) {
  return status === PostStatus.PUBLISHED ? (
    <Badge>Published</Badge>
  ) : (
    <Badge variant="secondary">Draft</Badge>
  );
}
