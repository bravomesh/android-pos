/**
 * What the Android build scripts share: finding a JDK 21 and the Android
 * SDK, and saying clearly what is missing.
 */
import { spawnSync } from "node:child_process";

export const say = (msg) => console.log(`\x1b[32m[android]\x1b[0m ${msg}`);

export const fail = (msg) => {
  console.error(`\x1b[31m[android]\x1b[0m ${msg}`);
  process.exit(1);
};

const javaVersion = (home) =>
  spawnSync(`${home}/bin/java`, ["-version"], { encoding: "utf8" }).stderr?.match(/version "(\d+)/)?.[1];

/**
 * Environment for Gradle and adb. Gradle 8.11 cannot run on the JDK 25
 * that recent Android Studio bundles, so a JDK 21 is found unless
 * JAVA_HOME already points at one.
 */
export function androidEnv() {
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
  return {
    ...process.env,
    JAVA_HOME: javaHome,
    ANDROID_HOME: androidHome,
    PATH: `${androidHome}/platform-tools:${process.env.PATH}`,
  };
}

/** Phones and emulators adb can see, ready to install on. */
export function connectedDevices(env) {
  const adb = spawnSync("adb", ["devices"], { encoding: "utf8", env });
  return (adb.stdout || "").split("\n").slice(1).filter((l) => /\tdevice$/.test(l)).map((l) => l.split("\t")[0]);
}

export const NO_DEVICE =
  "No phone found. Plug it in with USB debugging on (Settings → System → Developer options), " +
  "accept the prompt on the phone, and check `adb devices` lists it.";
