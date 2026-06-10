import { runDeepLink } from "./lib/stenobar";

export default async function Command() {
  await runDeepLink("stenobar://thought", "Toggled Stenobar thought capture");
}
