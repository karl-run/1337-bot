// Format:  https://systekkompis.slack.com/archives/<channel-id>/p<ts-without-period>
export function createPermalink(channelId: string, ts: string) {
  return `https://systekkompis.slack.com/archives/${channelId}/p${ts.replace(
    ".",
    "",
  )}`;
}
