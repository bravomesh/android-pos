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

const PORT = process.env.PORT || "3000";
const say = (msg) => console.log(`\x1b[32m[dev:android]\x1b[0m ${msg}`);
const fail = (msg) => {
  console.error(`\x1b[31m[dev:android]\x1b[0m ${msg}`);
  process.exit(1);
};

// Gradle 8.11 cannot run on the JDK 25 that recent Android Studio bundles,
// so find a JDK 21 unless JAVA_HOME already points at one.
const javaVersion = (home) =>
  spawnSync(`${home}/bin/java`, ["-version"], { encoding: "utf8" }).stderr?.match(/version "(\d+)/)?.[1];

let javaHome = process.env.JAVA_HOME;
if (!javaHome || javaVersion(javaHome) !== "21") {
  const found = spawnSync("/usr/libexec/java_home", ["-v", "21"], { encoding: "utf8" });
  javaHome = found.status === 0 ? found.stdout.trim() : "";
}
if (!javaHome) {
  fail(
    "JDK 21 not found. In Android Studio: Settings → Build, Execution, Deployment → Build Tools → " +
      "Gradle → Gradle JDK → Download JDK… → version 21. Or set JAVA_HOME to a JDK 21."
  );
}
say(`Using JDK 21 at ${javaHome}`);

const androidHome = process.env.ANDROID_HOME || `${process.env.HOME}/Library/Android/sdk`;
const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  ANDROID_HOME: androidHome,
  PATH: `${androidHome}/platform-tools:${process.env.PATH}`,
};

const adb = spawnSync("adb", ["devices"], { encoding: "utf8", env });
const devices = (adb.stdout || "").split("\n").slice(1).filter((l) => /\tdevice$/.test(l));
if (devices.length === 0) {
  fail(
    "No phone found. Plug it in with USB debugging on (Settings → System → Developer options), " +
      "accept the prompt on the phone, and check `adb devices` lists it."
  );
}

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
