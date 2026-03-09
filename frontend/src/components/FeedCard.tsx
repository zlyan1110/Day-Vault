"use client";

import Image from "next/image";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FeedCardData {
  event_id: number;
  year: number | null;
  title: string;
  reason: string;
  image_url: string | null;
  source_url: string | null;
}

interface FeedCardProps {
  card: FeedCardData;
  interaction?: "like" | "dislike";
  onInteract: (action: "like" | "dislike") => void;
  style?: React.CSSProperties;
}

export default function FeedCard({
  card,
  interaction,
  onInteract,
  style,
}: FeedCardProps) {
  return (
    <Card
      className="overflow-hidden animate-in fade-in-0 slide-in-from-bottom-2 duration-500 fill-mode-both"
      style={style}
    >
      {card.image_url && (
        <div className="relative w-full aspect-video">
          <Image
            src={card.image_url}
            alt={card.title}
            fill
            className="object-cover"
            sizes="(max-width: 672px) 100vw, 672px"
            unoptimized
          />
        </div>
      )}
      <CardContent className="p-6">
        {card.year !== null && (
          <p className="text-sm text-muted-foreground mb-1">{card.year}</p>
        )}
        <h2 className="text-xl font-semibold mb-3 leading-snug">
          {card.source_url ? (
            <a
              href={card.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {card.title}
            </a>
          ) : (
            card.title
          )}
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed mb-4">
          {card.reason}
        </p>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onInteract("like")}
            className={
              interaction === "like"
                ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                : ""
            }
          >
            <ThumbsUp className="h-4 w-4 mr-1.5" />
            Like
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onInteract("dislike")}
            className={
              interaction === "dislike"
                ? "text-red-500 hover:text-red-600 hover:bg-red-50"
                : ""
            }
          >
            <ThumbsDown className="h-4 w-4 mr-1.5" />
            Not for me
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
