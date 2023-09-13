import { GenericMessageEvent } from "@slack/bolt";

export type UserLeetRow = {
  id: number;
  ts: string;
  channel: string;
  ts_as_date: Date;
  inserted_at: Date;
  message: GenericMessageEvent;
};
