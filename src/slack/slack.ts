import { App } from "@slack/bolt";
import { config } from "dotenv";

config();

export const app = new App({
  token: process.env.BOT_TOKEN,
  appToken: process.env.APP_TOKEN,
  socketMode: true,
});
