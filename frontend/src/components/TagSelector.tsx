"use client";

import { Badge } from "@/components/ui/badge";

export const INTEREST_TAGS = [
  "Science & Technology",
  "Art & Culture",
  "Politics & Government",
  "War & Military",
  "Exploration & Discovery",
  "Philosophy & Religion",
  "Sports & Olympics",
  "Music & Entertainment",
  "Literature & Writing",
  "Economics & Business",
  "Medicine & Health",
  "Architecture & Engineering",
  "Mathematics",
  "Astronomy & Space",
  "Environmental History",
  "Social Movements",
  "Ancient History",
  "Medieval History",
  "Renaissance",
  "Modern History",
];

interface TagSelectorProps {
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
}

export default function TagSelector({ selected, onChange }: TagSelectorProps) {
  const toggle = (tag: string) => {
    const next = new Set(selected);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {INTEREST_TAGS.map((tag) => (
        <Badge
          key={tag}
          variant={selected.has(tag) ? "default" : "outline"}
          className="cursor-pointer px-4 py-2 text-sm select-none transition-all hover:scale-105"
          onClick={() => toggle(tag)}
        >
          {tag}
        </Badge>
      ))}
    </div>
  );
}
