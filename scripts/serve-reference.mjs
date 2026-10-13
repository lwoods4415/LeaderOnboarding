// Serves the reference page locally (http://localhost:4321) for side-by-side checks. Dev only.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { REFERENCE } from "./load-reference.mjs";

createServer((_, res) => {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(readFileSync(REFERENCE));
}).listen(4321, () => console.log("Reference page on http://localhost:4321"));
