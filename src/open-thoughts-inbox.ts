import { runDeepLink } from "./lib/stenobar";

export default async function Command() {
  await runDeepLink("stenobar://thoughts", "Opened Stenobar Thoughts inbox");
}
