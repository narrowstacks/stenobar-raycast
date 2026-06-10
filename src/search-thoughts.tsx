import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { useMemo } from "react";
import { IndexMissing } from "./components/index-missing";
import { IndexNotFoundError, Thought, useStenobarIndex } from "./lib";
import { byNewest, formatShortDate } from "./lib/format";

const CATEGORY_ICON: Record<string, Icon> = {
  task: Icon.CheckCircle,
  note: Icon.Document,
  reminder: Icon.Bell,
  review_later: Icon.Clock,
};

const STATUS_COLOR: Record<string, Color> = {
  sent: Color.Green,
  sending: Color.Blue,
  classifying: Color.Blue,
  pending: Color.Yellow,
  pending_preview: Color.Yellow,
  review_later: Color.Orange,
  failed: Color.Red,
};

export default function Command() {
  const { data, isLoading, error, revalidate } = useStenobarIndex();

  const thoughts = useMemo(
    () => (data?.thoughts ?? []).slice().sort((a, b) => byNewest(a.capturedAt, b.capturedAt)),
    [data],
  );

  if (error instanceof IndexNotFoundError) {
    return <IndexMissing onRefresh={revalidate} />;
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search thoughts…">
      <List.EmptyView
        icon={Icon.Tray}
        title={data ? "No Thoughts" : "Loading…"}
        description={data ? "Captured thoughts will appear here." : undefined}
      />
      {thoughts.map((thought) => (
        <ThoughtItem key={thought.id} thought={thought} onRefresh={revalidate} />
      ))}
    </List>
  );
}

function ThoughtItem({ thought, onRefresh }: { thought: Thought; onRefresh: () => void }) {
  const title = thought.title?.trim() || thought.text;
  const category = thought.category ?? "";
  const status = thought.status ?? "";

  const accessories: List.Item.Accessory[] = [];
  if (thought.destination) accessories.push({ tag: thought.destination, icon: Icon.ArrowRight });
  if (status)
    accessories.push({ tag: { value: status.replace(/_/g, " "), color: STATUS_COLOR[status] ?? Color.SecondaryText } });
  accessories.push({ text: formatShortDate(thought.capturedAt) });

  return (
    <List.Item
      title={title}
      subtitle={thought.title ? thought.text : undefined}
      keywords={[category, status, thought.destination ?? ""].filter(Boolean)}
      icon={CATEGORY_ICON[category] ?? Icon.Dot}
      accessories={accessories}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.Open title="Open Thoughts Inbox" target="stenobar://thoughts" icon={Icon.Tray} />
            {thought.externalURL && (
              <Action.OpenInBrowser
                title="Open Routed Item"
                url={thought.externalURL}
                shortcut={{ modifiers: ["cmd"], key: "o" }}
              />
            )}
            <Action.CopyToClipboard
              title="Copy Text"
              content={thought.text}
              shortcut={{ modifiers: ["cmd"], key: "." }}
            />
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
