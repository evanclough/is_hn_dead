import { loadEnvFiles } from "./load-env";

type TaskResult = { name: string; ok: boolean };

async function run(): Promise<TaskResult> {
  loadEnvFiles();

  const taskName = process.argv[2] ?? "help";

  if (taskName === "help" || taskName === "--help" || taskName === "-h") {
    printUsage();
    return { name: "help", ok: true };
  }

  // Load after env so constants read the right values.
  const [
    { addFrontPage, refreshFrontPage },
    { addBotComments },
    { pruneOldStories },
    { seed, refresh },
  ] = await Promise.all([
    import("../src/jobs/refreshTopStories"),
    import("../src/jobs/addBotComments"),
    import("../src/lib/db"),
    import("../src/jobs"),
  ]);

  const tasks: Record<string, () => Promise<boolean>> = {
    frontpage: addFrontPage,
    "frontpage:add": addFrontPage,
    "frontpage:refresh": refreshFrontPage,
    bots: addBotComments,
    prune: pruneOldStories,
    seed: seed,
    refresh: refresh,
  };

  const task = tasks[taskName];
  if (!task) {
    console.error(`Unknown task: ${taskName}`);
    printUsage();
    return { name: taskName, ok: false };
  }

  const ok = await task();
  return { name: taskName, ok };
}

function printUsage() {
  console.log(
    [
      "Usage: npx tsx scripts/cron.ts <task>",
      "",
      "Tasks:",
      "  frontpage           add current HN front page",
      "  frontpage:add       alias for frontpage",
      "  frontpage:refresh   refresh existing front page",
      "  bots                generate bot comments",
      "  prune               prune old stories/comments",
      "  seed                run full seed pipeline",
      "  refresh             run full refresh pipeline",
    ].join("\n"),
  );
}

run()
  .then(({ name, ok }) => {
    if (name !== "help") {
      console.log(ok ? `Task ${name} succeeded` : `Task ${name} failed`);
    }
    process.exitCode = ok ? 0 : 1;
  })
  .catch((err) => {
    console.error("Task failed with error:", err);
    process.exitCode = 1;
  });
