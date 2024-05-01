import { startOfDay, startOfYear } from "date-fns";
import { app } from "../src/slack/slack";

// @ts-ignore Bun :)
const messages = await app.client.conversations.history({
  channel: "C04N7R2F8B0",
  oldest: `${startOfYear(new Date()).getTime() / 1000}`,
});

console.log(messages.has_more);
console.log(messages.response_metadata.next_cursor);
console.log(messages.messages.length);

let pages = 1;
let nextCursor = messages.response_metadata.next_cursor;

while (nextCursor != null) {
  try {
    // @ts-ignore Bun :)
    const nextMessages = await app.client.conversations.history({
      channel: "C04N7R2F8B0",
      oldest: `${startOfYear(new Date()).getTime() / 1000}`,
      cursor: nextCursor,
    });

    nextCursor = nextMessages.response_metadata.next_cursor;

    if (pages > 3) {
      break;
    }

    pages++;
    console.log(`Page: ${pages}`);
    console.log(messages.has_more);
    console.log(messages.response_metadata.next_cursor);
    console.log(messages.messages.length);

    console.log(messages.messages.map((it) => it.text));
  } catch (e) {
    console.error(e);
    break;
  }
}
