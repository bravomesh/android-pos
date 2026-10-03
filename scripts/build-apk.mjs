#!/usr/bin/env node
/**
 * Build an installable APK: `npm run apk`
 *
 * Builds the web app, copies it into the Android project, runs Gradle and
 * leaves the result as Daisys-Baby-Shop.apk in the project folder, ready to copy
 * onto a phone, or pass `--install` (`npm run apk:install`) to put it on
 * the phone plugged in over USB.
 *
 * This is a debug-signed APK: it installs on any phone that allows apps
 * from outside the Play Store, which is all a shop's own till needs. A
 * release build for the Play Store is signed with your own key instead
 * (see BUILDING.md).
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, statSync } from "node:fs";
import { androidEnv, connectedDevices, fail, say, NO_DEVICE } from "./android-env.mjs";

const install = process.argv.includes("--install");
const OUT = "Daisys-Baby-Shop.apk";
const env = androidEnv();

if (install && connectedDevices(env).length === 0) fail(NO_DEVICE);

const step = (label, cmd, args, cwd) => {
  say(label);
  const run = spawnSync(cmd, args, { stdio: "inherit", env, cwd });
  if (run.status !== 0) fail(`${label} failed.`);
};

step("Building the web app…", "npx", ["vite", "build"]);
step("Copying it into the Android project…", "npx", ["cap", "sync", "android"]);
step("Building the APK (the first time downloads Gradle and takes a few minutes)…", "./gradlew", ["assembleDebug", "--console=plain", "-q"], "android");

copyFileSync("android/app/build/outputs/apk/debug/app-debug.apk", OUT);
const mb = (statSync(OUT).size / 1024 / 1024).toFixed(1);
say(`Done: ${OUT} (${mb} MB)`);

if (install) {
  step("Installing on the phone…", "adb", ["install", "-r", OUT]);
  say("Installed. Open Mobile POS on the phone.");
} else {
  say("Copy it to the phone (USB, Drive, email…), open it there and allow installing from that source.");
  say("Or plug the phone in and run: npm run apk:install");
}
