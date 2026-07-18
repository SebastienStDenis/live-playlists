"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  dateFormat,
  placeLabel,
  type ArtistRelation,
  type UserEvent,
} from "./events-panel";

function relationLabel(relation: ArtistRelation | undefined): string | null {
  switch (relation) {
    case "suggested":
      return "you might like";
    case "known":
      return "you listen to";
    default:
      return null;
  }
}

export function ConcertDialog({
  event,
  artistRelations,
  onOpenChange,
}: {
  event: UserEvent | null;
  artistRelations: Record<string, ArtistRelation>;
  onOpenChange: (open: boolean) => void;
}) {
  // Keep showing the last concert while the dialog animates closed, so the
  // content doesn't blank out before the fade-out finishes.
  const [displayed, setDisplayed] = useState(event);
  useEffect(() => {
    if (event) {
      setDisplayed(event);
    }
  }, [event]);

  return (
    <Dialog open={event !== null} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="flex max-h-[calc(100dvh-4rem)] flex-col gap-4 overflow-hidden sm:max-w-lg"
      >
        {displayed && (
          <>
            <DialogHeader>
              <DialogTitle>
                {displayed.event.title ??
                  displayed.artists.map((artist) => artist.name).join(", ")}
              </DialogTitle>
              <DialogDescription>
                {dateFormat.format(new Date(displayed.event.starts_at))} ·{" "}
                {displayed.event.venue_name} · {placeLabel(displayed.event)}
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <h4 className="text-sm font-semibold">Artists</h4>
              <ul className="mt-2 grid gap-3 sm:grid-cols-2">
                {displayed.artists.map((artist) => {
                  const label = relationLabel(artistRelations[artist.id]);
                  return (
                    <li key={artist.id}>
                      <Card size="sm">
                        <CardHeader>
                          <CardTitle className="text-sm break-words">
                            {artist.name}
                          </CardTitle>
                        </CardHeader>
                        {label && (
                          <CardContent>
                            <Badge
                              variant={
                                artistRelations[artist.id] === "suggested"
                                  ? "secondary"
                                  : "outline"
                              }
                              className={
                                artistRelations[artist.id] === "suggested"
                                  ? "max-w-full font-normal"
                                  : "max-w-full font-normal text-muted-foreground"
                              }
                            >
                              <span className="truncate">{label}</span>
                            </Badge>
                          </CardContent>
                        )}
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
