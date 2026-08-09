import { createServer } from "node:net";

const port = await new Promise((resolve, reject) => {
  const srv = createServer();
  srv.listen(0, () => {
    const p = srv.address().port;
    srv.close(() => resolve(p));
  });
  srv.on("error", reject);
});

process.env.PORT = String(port);

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const { spawn } = await import("node:child_process");
const __dirname = dirname(fileURLToPath(import.meta.url));
const binDir = resolve(__dirname, "node_modules", ".bin");
const child = spawn("next", ["dev", "--port", String(port)], {
  stdio: "inherit",
  env: { ...process.env, PATH: `${binDir}:${process.env.PATH ?? ""}` },
  shell: true,
});
child.on("exit", (code) => process.exit(code ?? 0));
