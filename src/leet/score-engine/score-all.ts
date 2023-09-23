import { getAllLeets } from "../../db/queries";
import { scoreLeets } from "./score";

export async function scoreAll(channelId: string) {
  return scoreLeets(await getAllLeets(channelId));
}
