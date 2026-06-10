import { runDeepLink } from "./lib/stenobar";

export default async function Command() {
  await runDeepLink("stenobar://record/toggle", "Toggled Stenobar recording");
}
