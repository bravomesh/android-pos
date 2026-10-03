#!/usr/bin/env node
/**
 * Live reload on a phone: `npm run dev:android`
 *
 * Runs the Vite dev server here and installs the app on the connected
 * phone pointed at it, so a saved change shows on the phone in a second
 * instead of after a rebuild. The phone reaches this machine over the USB
 * cable (adb reverse), so no Wi-Fi addresses or firewall rules are involved,
 * and the app still talks to the phone's real SQLite database.
 *
 * Ctrl+C stops both and puts the app's config back, so the next normal
 * build is a normal build. (If the terminal is killed instead, run
 * `npm run build:android` once to restore it.)
 *
 * Options: DEVICE=<id from `npx cap run android --list`> to pick a phone,
 *          PORT=3000 to change the port.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { androidEnv, connectedDevices, fail, say, NO_DEVICE } from "./android-env.mjs";

const PORT = process.env.PORT || "3000";
const env = androidEnv();

if (connectedDevices(env).length === 0) fail(NO_DEVICE);

// `cap run` syncs the built web app first, so there has to be one.
if (!existsSync("build/index.html")) {
  say("No web build yet, building once…");
  if (spawnSync("npx", ["vite", "build"], { stdio: "inherit", env }).status !== 0) fail("Build failed.");
}

say(`Starting the dev server on port ${PORT}…`);
const vite = spawn("npx", ["vite", "--port", PORT, "--strictPort"], { stdio: "inherit", env });

const capArgs = [
  "cap", "run", "android",
  "--live-reload", "--host", "localhost", "--port", PORT,
  "--forwardPorts", `${PORT}:${PORT}`,
];
if (process.env.DEVICE) capArgs.push("--target", process.env.DEVICE);

say("Building and installing on the phone (the first run takes a few minutes)…");
const cap = spawn("npx", capArgs, { stdio: "inherit", env });

const stop = (code) => {
  vite.kill("SIGINT");
  process.exit(code ?? 0);
};
// Ctrl+C reaches both children; cap reverts the config, then this exits.
cap.on("exit", (code) => stop(code));
vite.on("exit", (code) => {
  if (code) {
    cap.kill("SIGINT");
    fail(`The dev server stopped (is port ${PORT} already in use?).`);
  }
});
process.on("SIGINT", () => {});
