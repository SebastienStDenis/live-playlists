"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const STORAGE_KEY = "dashboard-active-tab";
const CHANGE_EVENT = "dashboard-active-tab-change";

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function Tabs({
  tabs,
}: {
  tabs: {
    key: string;
    label: string;
    description?: string;
    content: ReactNode;
  }[];
}) {
  // Read the persisted tab from localStorage. The server snapshot returns null
  // so SSR always renders the first tab, then hydration swaps to the stored one
  // without a mismatch.
  const stored = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(STORAGE_KEY),
    () => null,
  );
  const active =
    stored && tabs.some((tab) => tab.key === stored) ? stored : tabs[0].key;

  const selectTab = (key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return (
    <div>
      <div
        role="tablist"
        className="flex gap-4 border-b border-gray-300 dark:border-gray-700"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => selectTab(tab.key)}
            className={`-mb-px border-b-2 px-1 pb-2 text-sm font-medium ${
              active === tab.key
                ? "border-foreground"
                : "border-transparent text-gray-500 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Inactive tabs stay mounted so their in-progress state (sync
          summaries, search inputs) survives switching. */}
      {tabs.map((tab) => (
        <div key={tab.key} hidden={active !== tab.key} className="mt-4">
          {tab.description && (
            <p key="description" className="mb-4 text-xs text-gray-500 italic">
              {tab.description}
            </p>
          )}
          <div key="content">{tab.content}</div>
        </div>
      ))}
    </div>
  );
}
