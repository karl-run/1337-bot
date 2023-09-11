// Format:  https://systekkompis.slack.com/archives/<channel-id>/p<ts-without-period>
export function createPermalink(channelId: string, ts: string) {
  return `https://systekkompis.slack.com/archives/${channelId}/p${ts.replace(
    ".",
    "",
  )}`;
}

export function createProgressBar(percent: number): string {
  return [
    "▒▒▒▒▒▒▒▒▒▒ 0%",
    "█▒▒▒▒▒▒▒▒▒ 10%",
    "██▒▒▒▒▒▒▒▒ 20%",
    "███▒▒▒▒▒▒▒ 30%",
    "████▒▒▒▒▒▒ 40%",
    "█████▒▒▒▒▒ 50%",
    "██████▒▒▒▒ 60%",
    "███████▒▒▒ 70%",
    "████████▒▒ 80%",
    "█████████▒ 90%",
    "██████████ 100%",
  ][Math.round(percent / 10)];
}
