import open from "open";
import { KnownBlock } from "@slack/bolt";

export function createPermalink(channelId: string, ts: string) {
  return `https://systekkompis.slack.com/archives/${channelId}/p${ts.replace(
    ".",
    "",
  )}`;
}

export async function previewBlocks(blocks: KnownBlock[]): Promise<void> {
  await open(
    `https://app.slack.com/block-kit-builder/T04251BM1#${encodeURIComponent(
      JSON.stringify({ blocks }),
    )}`,
  );
}
