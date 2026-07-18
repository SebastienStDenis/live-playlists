"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

import type { City } from "./city-panel";
import { EmptyState } from "./empty-state";
import { dateFormat, placeLabel, type UserEvent } from "./events-panel";

type SimpleArtist = { id: string; name: string };

function eventsFor(artistId: string, events: UserEvent[]): UserEvent[] {
  return events.filter((userEvent) =>
    userEvent.artists.some((artist) => artist.id === artistId),
  );
}

function ShowRow({ userEvent }: { userEvent: UserEvent }) {
  const { event, url } = userEvent;
  return (
    <li className="flex">
      <Card size="sm" className="flex-1">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
            <span className="min-w-0">{event.title ?? event.venue_name}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {dateFormat.format(new Date(event.starts_at))}
            </span>
          </CardTitle>
          <CardDescription>
            {event.venue_name} · {placeLabel(event)}
          </CardDescription>
        </CardHeader>
        {url && (
          <CardContent>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground underline hover:text-foreground"
            >
              Tickets
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </CardContent>
        )}
      </Card>
    </li>
  );
}

function CitySection({
  city,
  home,
  artistName,
  events,
  loading,
  failed,
}: {
  city: City;
  home?: boolean;
  artistName: string;
  events: UserEvent[] | null;
  loading?: boolean;
  failed?: boolean;
}) {
  return (
    <section>
      <h4 className="text-sm font-semibold">
        {city.name}
        {home && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            (Home)
          </span>
        )}
      </h4>
      <div className="mt-2">
        {loading ? (
          <div className="flex justify-center py-6 text-muted-foreground">
            <Spinner />
          </div>
        ) : failed ? (
          <EmptyState>Failed to load concerts for {city.name}.</EmptyState>
        ) : events === null || events.length === 0 ? (
          <EmptyState>
            No concerts by {artistName} found near {city.name}.
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {events.map((userEvent) => (
              <ShowRow key={userEvent.event.id} userEvent={userEvent} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// Fetches the given pinned city's concerts (the same per-city route the
// concerts tab's city switcher uses) and filters them to this artist. Mounts
// fresh each time the dialog opens (the dialog unmounts its content while
// closed), so there's no cross-open cache to keep in sync.
function PinnedCitySection({
  city,
  artistId,
  artistName,
}: {
  city: City;
  artistId: string;
  artistName: string;
}) {
  const [events, setEvents] = useState<UserEvent[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/me/events?geonameid=${city.geonameid}`)
      .then((res) => (res.ok ? (res.json() as Promise<UserEvent[]>) : Promise.reject()))
      .then((data) => {
        if (!cancelled) {
          setEvents(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          toast.error(`Failed to load concerts for ${city.name}.`);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [city.geonameid, city.name]);

  return (
    <CitySection
      city={city}
      artistName={artistName}
      loading={events === null && !failed}
      failed={failed}
      events={events ? eventsFor(artistId, events) : null}
    />
  );
}

export function ArtistDialog({
  artist,
  homeCity,
  homeEvents,
  pinnedCities,
  onOpenChange,
}: {
  artist: SimpleArtist | null;
  homeCity: City;
  homeEvents: UserEvent[];
  pinnedCities: City[];
  onOpenChange: (open: boolean) => void;
}) {
  // Keep showing the last artist while the dialog animates closed, so the
  // content doesn't blank out before the fade-out finishes.
  const [displayed, setDisplayed] = useState(artist);
  useEffect(() => {
    if (artist) {
      setDisplayed(artist);
    }
  }, [artist]);

  return (
    <Dialog open={artist !== null} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="flex max-h-[calc(100dvh-4rem)] flex-col gap-4 overflow-hidden sm:max-w-lg"
      >
        {displayed && (
          <>
            <DialogHeader>
              <DialogTitle>{displayed.name}</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
              <CitySection
                city={homeCity}
                home
                artistName={displayed.name}
                events={eventsFor(displayed.id, homeEvents)}
              />
              {pinnedCities.map((city) => (
                <PinnedCitySection
                  key={city.geonameid}
                  city={city}
                  artistId={displayed.id}
                  artistName={displayed.name}
                />
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
