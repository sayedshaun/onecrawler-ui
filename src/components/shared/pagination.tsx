import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIBLING_COUNT = 1;

/** Builds a 1-indexed page list like `1 … 4 5 6 … 12`, collapsing runs of
 * pages outside the current page's neighborhood into a single ellipsis. */
function getPageItems(current: number, totalPages: number): (number | "ellipsis")[] {
  const totalSlots = SIBLING_COUNT * 2 + 5;
  if (totalPages <= totalSlots) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - SIBLING_COUNT, 1);
  const rightSibling = Math.min(current + SIBLING_COUNT, totalPages);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = Array.from({ length: 3 + SIBLING_COUNT * 2 }, (_, i) => i + 1);
    return [...leftRange, "ellipsis", totalPages];
  }
  if (showLeftEllipsis && !showRightEllipsis) {
    const size = 3 + SIBLING_COUNT * 2;
    const rightRange = Array.from({ length: size }, (_, i) => totalPages - size + i + 1);
    return [1, "ellipsis", ...rightRange];
  }
  const middleRange = Array.from({ length: rightSibling - leftSibling + 1 }, (_, i) => leftSibling + i);
  return [1, "ellipsis", ...middleRange, "ellipsis", totalPages];
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = page + 1;
  const hasNextPage = (page + 1) * pageSize < total;
  const rangeStart = total === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = Math.min(total, (page + 1) * pageSize);
  const pageItems = getPageItems(currentPage, totalPages);

  return (
    <div className="flex flex-col items-center gap-3 pt-1 sm:flex-row sm:justify-between">
      <span className="text-xs text-muted-foreground">
        {total === 0 ? "0 results" : `${rangeStart}–${rangeEnd} of ${total}`}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page === 0}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        {pageItems.map((item, i) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={item}
              variant="outline"
              size="icon"
              className={cn(
                "h-8 w-8 text-xs",
                item === currentPage && "border-primary/40 bg-primary/10 text-foreground",
              )}
              onClick={() => onPageChange(item - 1)}
              aria-label={`Page ${item}`}
              aria-current={item === currentPage ? "page" : undefined}
            >
              {item}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={!hasNextPage}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
