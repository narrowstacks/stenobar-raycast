import { Action, ActionPanel, Icon, List, open } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";

/** Empty state shown when index.json doesn't exist yet (Stenobar never launched). */
export function IndexMissing({ onRefresh }: { onRefresh: () => void }) {
  return (
    <List>
      <List.EmptyView
        icon={Icon.QuestionMarkCircle}
        title="Stenobar Index Not Found"
        description="Launch Stenobar at least once to generate its library index, then refresh."
        actions={
          <ActionPanel>
            <Action
              title="Open Stenobar"
              icon={Icon.AppWindow}
              onAction={async () => {
                try {
                  await open("stenobar://library");
                } catch (error) {
                  await showFailureToast(error, { title: "Could not open Stenobar" });
                }
              }}
            />
            <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={onRefresh} />
          </ActionPanel>
        }
      />
    </List>
  );
}
