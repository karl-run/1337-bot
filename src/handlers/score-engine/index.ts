import { UserLeetRow } from "../../db/types";
import { LeetStatus } from "../daily-leet/row-utils";

export type ScoredMessage = {
  points: number;
  message: UserLeetRow;
};

export type ScoredDay = Record<LeetStatus, ScoredMessage[]>;
