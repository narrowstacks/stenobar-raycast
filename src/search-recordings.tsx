import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { useMemo, useState } from "react";
import { IndexMissing } from "./components/index-missing";
import { IndexNotFoundError, Recording, useStenobarIndex } from "./lib";
import { byNewest, formatDate, formatDuration, formatShortDate } from "./lib/format";

const ALL = "__all__";
const UNGROUPED = "__ungrouped__";

export default function Command() {
  const { data, isLoading, error, revalidate } = useStenobarIndex();
  const [project, setProject] = useState(ALL);
  const [showingDetail, setShowingDetail] = useState(false);

  const recordings = useMemo(
    () => (data?.recordings ?? []).slice().sort((a, b) => byNewest(a.startedAt, b.startedAt)),
    [data],
  );

  const projects = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of recordings) {
      if (r.projectSlug && r.project) seen.set(r.projectSlug, r.project);
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [recordings]);

  const hasUngrouped = useMemo(() => recordings.some((r) => !r.projectSlug), [recordings]);

  const filtered = useMemo(() => {
    if (project === ALL) return recordings;
    if (project === UNGROUPED) return recordings.filter((r) => !r.projectSlug);
    return recordings.filter((r) => r.projectSlug === project);
  }, [recordings, project]);

  if (error instanceof IndexNotFoundError) {
    return <IndexMissing onRefresh={revalidate} />;
  }

  return (
    <List
      isLoading={isLoading}
      isShowingDetail={showingDetail}
      searchBarPlaceholder="Search recordings by title or tag…"
      searchBarAccessory={
        <List.Dropdown tooltip="Filter by project" value={project} onChange={setProject} storeValue>
          <List.Dropdown.Item title="All Projects" value={ALL} />
          {hasUngrouped && <List.Dropdown.Item title="Ungrouped" value={UNGROUPED} />}
          {projects.length > 0 && (
            <List.Dropdown.Section title="Projects">
              {projects.map(([slug, name]) => (
                <List.Dropdown.Item key={slug} title={name} value={slug} />
              ))}
            </List.Dropdown.Section>
          )}
        </List.Dropdown>
      }
    >
      <List.EmptyView
        title={data ? "No Recordings" : "Loading…"}
        description={data ? "Nothing matches the current filter." : undefined}
        icon={Icon.Microphone}
      />
      {filtered.map((recording) => (
        <RecordingItem
          key={recording.id}
          recording={recording}
          showingDetail={showingDetail}
          onToggleDetail={() => setShowingDetail((v) => !v)}
          onRefresh={revalidate}
        />
      ))}
    </List>
  );
}

function RecordingItem({
  recording,
  showingDetail,
  onToggleDetail,
  onRefresh,
}: {
  recording: Recording;
  showingDetail: boolean;
  onToggleDetail: () => void;
  onRefresh: () => void;
}) {
  const accessories: List.Item.Accessory[] = [];
  if (!showingDetail) {
    if (recording.starred)
      accessories.push({ icon: { source: Icon.Star, tintColor: Color.Yellow }, tooltip: "Starred" });
    if (recording.hasTranscript) accessories.push({ icon: Icon.Text, tooltip: "Has transcript" });
    accessories.push({ text: formatShortDate(recording.startedAt), tooltip: formatDate(recording.startedAt) });
  }

  return (
    <List.Item
      title={recording.title}
      subtitle={showingDetail ? undefined : (recording.project ?? undefined)}
      keywords={recording.tags}
      icon={recording.starred ? { source: Icon.Star, tintColor: Color.Yellow } : Icon.Microphone}
      accessories={accessories}
      detail={<RecordingDetail recording={recording} />}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.Open title="Open in Stenobar" target={recording.url} icon={Icon.AppWindow} />
            <Action.CopyToClipboard
              title="Copy Link"
              content={recording.url}
              shortcut={{ modifiers: ["cmd"], key: "." }}
            />
            <Action.CopyToClipboard
              title="Copy Title"
              content={recording.title}
              shortcut={{ modifiers: ["cmd", "shift"], key: "." }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action
              title={showingDetail ? "Hide Details" : "Show Details"}
              icon={Icon.Sidebar}
              shortcut={{ modifiers: ["cmd", "shift"], key: "d" }}
              onAction={onToggleDetail}
            />
            {recording.projectSlug && (
              <Action.Open
                title="Open Project in Stenobar"
                target={`stenobar://project/${recording.projectSlug}`}
                icon={Icon.Folder}
                shortcut={{ modifiers: ["cmd"], key: "p" }}
              />
            )}
            <Action.Open title="Open Library in Stenobar" target="stenobar://library" icon={Icon.List} />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action
              title="Refresh"
              icon={Icon.ArrowClockwise}
              shortcut={{ modifiers: ["cmd"], key: "r" }}
              onAction={onRefresh}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function RecordingDetail({ recording }: { recording: Recording }) {
  const { Label, TagList, Separator } = List.Item.Detail.Metadata;
  return (
    <List.Item.Detail
      metadata={
        <List.Item.Detail.Metadata>
          <Label title="Title" text={recording.title} />
          <Label title="Project" text={recording.project ?? "Ungrouped"} />
          <Label title="Source" text={recording.source} />
          <Label title="Duration" text={formatDuration(recording.duration)} />
          <Label title="Started" text={formatDate(recording.startedAt)} />
          <Separator />
          <Label
            title="Transcript"
            icon={recording.hasTranscript ? Icon.Check : Icon.Xmark}
            text={recording.hasTranscript ? "Available" : "None"}
          />
          <Label
            title="Starred"
            icon={recording.starred ? { source: Icon.Star, tintColor: Color.Yellow } : Icon.Circle}
            text={recording.starred ? "Yes" : "No"}
          />
          {recording.imported && <Label title="Imported" icon={Icon.Download} text="Yes" />}
          {recording.tags.length > 0 ? (
            <TagList title="Tags">
              {recording.tags.map((tag) => (
                <TagList.Item key={tag} text={tag} color={Color.Blue} />
              ))}
            </TagList>
          ) : (
            <Label title="Tags" text="None" />
          )}
        </List.Item.Detail.Metadata>
      }
    />
  );
}
