import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { getPreferenceValues } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";

/** The index schema version this extension was written against. */
export const SUPPORTED_VERSION = 1;

/** Canonical, install-stable location of Stenobar's index snapshot. */
export const DEFAULT_INDEX_PATH = join(homedir(), "Library/Application Support/Stenobar/index.json");

export type Recording = {
  id: string;
  title: string;
  startedAt: string;
  duration: number;
  source: string;
  /** Absent on ungrouped / some imported recordings. */
  project?: string | null;
  projectSlug?: string | null;
  tags: string[];
  starred: boolean;
  imported: boolean;
  hasTranscript: boolean;
  url: string;
};

export type ThoughtCategory = "task" | "note" | "reminder" | "review_later";
export type ThoughtStatus =
  | "classifying"
  | "pending_preview"
  | "sending"
  | "sent"
  | "pending"
  | "failed"
  | "review_later";

export type Thought = {
  id: string;
  capturedAt: string;
  text: string;
  title?: string | null;
  category?: ThoughtCategory | string;
  status?: ThoughtStatus | string;
  destination?: string | null;
  dueDate?: string | null;
  externalURL?: string | null;
  url: string;
};

export type StenobarIndex = {
  version: number;
  generatedAt: string;
  recordings: Recording[];
  thoughts: Thought[];
  /** Set when `version` differs from {@link SUPPORTED_VERSION}. */
  versionWarning?: boolean;
};

/** Thrown when the index file does not exist yet (Stenobar never launched). */
export class IndexNotFoundError extends Error {
  constructor(public readonly path: string) {
    super(`Stenobar index not found at ${path}`);
    this.name = "IndexNotFoundError";
  }
}

function resolveIndexPath(): string {
  const { indexPath } = getPreferenceValues<{ indexPath?: string }>();
  const trimmed = indexPath?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_INDEX_PATH;
}

export async function loadIndex(): Promise<StenobarIndex> {
  const path = resolveIndexPath();
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new IndexNotFoundError(path);
    }
    throw error;
  }

  const parsed = JSON.parse(raw) as StenobarIndex;
  return {
    version: parsed.version,
    generatedAt: parsed.generatedAt,
    recordings: Array.isArray(parsed.recordings) ? parsed.recordings : [],
    thoughts: Array.isArray(parsed.thoughts) ? parsed.thoughts : [],
    versionWarning: parsed.version !== SUPPORTED_VERSION,
  };
}

/** Caching loader hook used by the view commands. */
export function useStenobarIndex() {
  return useCachedPromise(loadIndex, [], { keepPreviousData: true });
}
