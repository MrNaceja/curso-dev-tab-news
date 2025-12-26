const { spawn } = require("node:child_process");

function runCommand(cmd, args) {
  if (process.platform === "win32" && ["npm", "npx"].includes(cmd)) {
    cmd = `${cmd}.cmd`;
  }
  return spawn(cmd, args, { stdio: "inherit" });
}
function withExitCode(process) {
  return new Promise((resolve, reject) => {
    process.on("exit", (code) => (code === 0 ? resolve(code) : reject(code)));
  });
}

let servicesStarted = false;
async function downServices() {
  if (servicesStarted) {
    await withExitCode(runCommand("npm", ["run", "services:down"]));
  }
}
async function upServices() {
  await withExitCode(runCommand("npm", ["run", "services:up"]));
  servicesStarted = true;
  await withExitCode(
    runCommand("npm", ["run", "scripts:check-postgres-is-ready"]),
  );
  await withExitCode(runCommand("npm", ["run", "migrations:up"]));
}

(async function () {
  try {
    await upServices();
    const nextDev = runCommand("npx", ["next", "dev"]);
    process.on("SIGINT", () => {
      nextDev.kill("SIGINT");
    });
    process.exit(await withExitCode(nextDev));
  } catch (err) {
    await downServices();
    process.exit(typeof err === "number" ? err : 1);
  }
})();
