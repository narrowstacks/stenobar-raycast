import { runDeepLink } from "./lib/stenobar";

export default async function Command() {
  await runDeepLink("stenobar://record/stop", "Stopped Stenobar recording");
}
