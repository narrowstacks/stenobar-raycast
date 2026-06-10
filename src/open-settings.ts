import { runDeepLink } from "./lib/stenobar";

export default async function Command() {
  await runDeepLink("stenobar://settings", "Opened Stenobar settings");
}
