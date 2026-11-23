import { handle } from "../server/api.js";
export default function handler(req, res) {
  return handle(req, res, process.env);
}
