import { Agent as HttpAgent } from "node:http";
import { Agent as HttpsAgent } from "node:https";

const agentOpts = {
  keepAlive: true,
  keepAliveMsecs: 15_000,
  maxSockets: 100,
  maxFreeSockets: 20,
  timeout: 30_000,
  freeSocketTimeout: 15_000,
};

export const httpAgent = new HttpAgent(agentOpts);
export const httpsAgent = new HttpsAgent(agentOpts);
