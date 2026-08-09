import { createServer } from "net";

const findFreePort = () =>
  new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });

const port = await findFreePort();
process.env.PORT = String(port);
console.log(`\n  Starting on http://localhost:${port}\n`);
const { spawn } = await import("child_process");
const child = spawn("npx", ["next", "dev", "--port", String(port)], {
  stdio: "inherit",
  env: { ...process.env },
});
child.on("exit", process.exit);
