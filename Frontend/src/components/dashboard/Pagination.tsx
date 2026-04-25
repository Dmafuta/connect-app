import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface PageMeta {
  number: number;       // 0-indexed current page
  totalPages: number;
  totalElements: number;
  size: number;
}

interface Props {
  meta: PageMeta;
  onPageChange: (page: number) => void;
}

export default function Pagination({ meta, onPageChange }: Props) {
  const { number, totalPages, totalElements, size } = meta;
  if (totalPages <= 1) return null;

  const from = number * size + 1;
  const to   = Math.min((number + 1) * size, totalElements);

  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>
        {from}–{to} of {totalElements}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 rounded-none p-0"
          disabled={number === 0}
          onClick={() => onPageChange(number - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2 tabular-nums">
          {number + 1} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 rounded-none p-0"
          disabled={number >= totalPages - 1}
          onClick={() => onPageChange(number + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
