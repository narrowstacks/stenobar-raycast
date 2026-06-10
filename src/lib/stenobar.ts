import { open, showHUD } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";

/**
 * Fire a `stenobar://` deep link, then confirm with a HUD. Used by every
 * no-view command. The URL scheme is fire-and-forget: macOS launches Stenobar
 * if it isn't running, and unrecognized URLs are silently ignored by the app.
 */
export async function runDeepLink(url: string, hud: string): Promise<void> {
  try {
    await open(url);
    await showHUD(hud);
  } catch (error) {
    await showFailureToast(error, { title: "Could not reach Stenobar" });
  }
}
