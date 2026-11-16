import { describe, test, expect } from "bun:test";
import { join } from "path";

const CONFIG_PATH = join(import.meta.dir, "../../src/lib/config.ts");

const loadConfig = (emulatorHost: string, projectId: string) =>
  Bun.spawnSync(["bun", CONFIG_PATH], {
    env: {
      ...process.env,
      DATABASE_URL: "postgresql://localhost/test",
      FIREBASE_AUTH_EMULATOR_HOST: emulatorHost,
      FIREBASE_PROJECT_ID: projectId,
    },
  });

describe("config", () => {
  test.each([
    ["no emulator with a real project", "", "home-design-studio", 0],
    ["the emulator with a demo project", "localhost:9099", "demo-home-design", 0],
    ["the emulator with a real project", "localhost:9099", "home-design-studio", 1],
    ["the emulator with no project", "localhost:9099", "", 1],
  ])("%s exits with %d", (_label, emulatorHost, projectId, exitCode) => {
    const result = loadConfig(emulatorHost, projectId);
    expect(result.exitCode).toBe(exitCode);
    if (exitCode) expect(result.stderr.toString()).toContain("FIREBASE_AUTH_EMULATOR_HOST");
  });
});
