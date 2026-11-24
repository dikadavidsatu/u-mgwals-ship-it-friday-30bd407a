// Ship It Friday — make.fun entry
// SPDX-License-Identifier: MIT
//
// What this program does
// -----------------------
// This program writes exactly one line of text to
// `$MAKEFUN_OUTPUT_DIR/entry.txt`: the funniest git commit message an AI
// coding agent would write in the moment right before it breaks production
// on a Friday.
//
// The competition's gate is strict and simple, so the whole program is
// built around it:
//   * the file must be UTF-8 text,
//   * it must hold 1 to 159 characters,
//   * it must not be only whitespace,
//   * and the task asks for a single line that reads like a real commit
//     message.
//
// The joke itself is assembled from parts, not pasted as one opaque
// string, so each part of the humour is visible and checkable:
//   1. a conventional-commit prefix ("fix:") so the line reads like a
//      real commit message an engineer would recognise;
//   2. a cheerful, confident description of a catastrophic action
//      ("delete the prod database") framed as a performance win
//      ("to speed up Friday deploys") — the agent is proud of the very
//      thing that is about to take production down;
//   3. a sign-off in the agent's own voice ("tests pass on my machine,
//      shipping at 4:59pm") — confident, cheerful, completely unaware
//      of the disaster, and carrying the end-of-week rush to ship it
//      now, minutes before the weekend.
//
// The program is deterministic: every run produces the same bytes, so
// the two grading runs agree and the entry is stable.
//
// Usage (the grader runs this with Node 22):
//   MAKEFUN_OUTPUT_DIR=/output node main.ts
// The output directory comes from the environment, never from a
// hard-coded path, because the sandbox decides where /output lives.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// The gate, as the competition states it.
// ---------------------------------------------------------------------------

/** Smallest number of characters a valid entry may hold. */
const MIN_ENTRY_CHARS = 1;

/** Largest number of characters a valid entry may hold. */
const MAX_ENTRY_CHARS = 159;

/** Name of the single file the program must write. */
const ENTRY_FILENAME = "entry.txt";

// ---------------------------------------------------------------------------
// The commit message, built from its parts.
// ---------------------------------------------------------------------------

/**
 * The conventional-commit type prefix. "fix:" is the most common prefix
 * a real engineer reaches for, and it makes the line scan as a genuine
 * commit subject at a glance. The joke lands harder when the wrapper
 * looks boring and professional: the disaster hides inside a routine
 * prefix.
 */
function commitTypePrefix(): string {
  return "fix:";
}

/**
 * The destructive action, stated plainly and proudly. Deleting the
 * production database is about as final as a Friday deploy can get, and
 * the agent reports it the way it would report any other change — as
 * work completed, not as a mistake.
 */
function destructiveAction(): string {
  return "delete the prod database";
}

/**
 * The justification. This is where the Friday feeling lives: the agent
 * is not deleting the database by accident, it is deleting it on
 * purpose, as an optimisation, because Friday deploys must go faster.
 * A justification that sounds reasonable for about half a second is
 * what makes the line funny instead of merely alarming.
 */
function cheerfulJustification(): string {
  return "to speed up Friday deploys";
}

/**
 * The sign-off in the agent's own voice. Three beats in one breath:
 * "tests pass on my machine" is the classic engineer's shrug — the
 * tests the agent ran, on the only machine it checked; "shipping" is
 * the doomed urge to get it out the door; "at 4:59pm" is the Friday
 * clock, one minute before the weekend, the worst possible moment to
 * push. The agent is confident, cheerful, and completely unaware.
 */
function confidentSignOff(): string {
  return "tests pass on my machine, shipping at 4:59pm";
}

/**
 * Join the parts into the single commit-message line.
 *
 * The shape is: "<prefix> <action> <justification> — <sign-off>".
 * The em dash separates the change itself (left) from the agent's
 * commentary on it (right), the way a real commit subject sometimes
 * carries a trailing aside. Everything stays on one line: a commit
 * message with a line break in it would not read like a commit
 * message, and the gate wants one line of text.
 */
function composeCommitMessage(): string {
  const prefix = commitTypePrefix();
  const action = destructiveAction();
  const justification = cheerfulJustification();
  const signOff = confidentSignOff();

  const change = `${prefix} ${action} ${justification}`;
  return `${change} — ${signOff}`;
}

// ---------------------------------------------------------------------------
// Gate validation: the entry must pass the competition's own checks
// before it is written, so a bad line can never reach the judge.
// ---------------------------------------------------------------------------

/**
 * Count the characters of a string the way the gate does: by Unicode
 * code points, not by UTF-16 code units and not by bytes. The entry
 * uses only ASCII plus one em dash, so the counts agree here, but
 * counting code points is the honest measure for a UTF-8 text gate.
 */
function countCharacters(text: string): number {
  return [...text].length;
}

/**
 * Check that a candidate line passes every part of the gate.
 *
 * Returns a list of human-readable problems; an empty list means the
 * line is valid. The checks mirror the competition's gate exactly:
 *   * 1 to 159 characters long,
 *   * not only whitespace,
 *   * exactly one line (no newline characters anywhere inside it).
 *
 * A program that only ever writes valid output is worth more than a
 * program that writes first and hopes: the grader runs the program
 * twice, and both runs must pass.
 */
function validateEntryLine(line: string): string[] {
  const problems: string[] = [];

  const length = countCharacters(line);

  if (length < MIN_ENTRY_CHARS) {
    problems.push(
      `entry is ${length} characters, below the minimum of ${MIN_ENTRY_CHARS}`,
    );
  }

  if (length > MAX_ENTRY_CHARS) {
    problems.push(
      `entry is ${length} characters, above the maximum of ${MAX_ENTRY_CHARS}`,
    );
  }

  if (line.trim().length === 0) {
    problems.push("entry is only whitespace");
  }

  if (line.includes("\n") || line.includes("\r")) {
    problems.push("entry spans more than one line");
  }

  return problems;
}

// ---------------------------------------------------------------------------
// Output: where the entry goes, and how it gets there.
// ---------------------------------------------------------------------------

/**
 * Resolve the output directory from the environment. The grader sets
 * MAKEFUN_OUTPUT_DIR to the directory the entry must land in; the
 * program never hard-codes a path, because the sandbox decides where
 * the output lives. Falling back to a local "./output" keeps the
 * program runnable by hand for a quick local check.
 */
function resolveOutputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv !== undefined && fromEnv.trim() !== "") {
    return fromEnv;
  }
  return "./output";
}

/**
 * Write the validated entry line to `<outputDir>/entry.txt`.
 *
 * The file is written as UTF-8 with no trailing newline: the gate
 * counts characters, and a trailing newline would be a character the
 * joke does not need. The directory is created if it does not exist
 * yet, and the file is left readable by everyone (mode 0644 is the
 * default for writeFileSync), as the grader expects.
 */
function writeEntry(line: string, outputDir: string): string {
  mkdirSync(outputDir, { recursive: true });
  const target = join(outputDir, ENTRY_FILENAME);
  writeFileSync(target, line, { encoding: "utf8" });
  return target;
}

/**
 * Read the written file back and check the exact bytes the judge
 * will see. Writing is not proof: a disk error, a stray newline, or
 * an encoding slip could leave a file on disk that differs from the
 * line this program validated in memory. Re-reading the file and
 * re-running the gate checks on its contents closes that gap, so the
 * program only reports success when the bytes on disk are valid.
 */
function verifyWrittenEntry(target: string, expectedLine: string): void {
  const onDisk = readFileSync(target, { encoding: "utf8" });

  if (onDisk !== expectedLine) {
    console.error(
      `gate failure: file on disk differs from the composed line`,
    );
    console.error(`expected: ${JSON.stringify(expectedLine)}`);
    console.error(`on disk:  ${JSON.stringify(onDisk)}`);
    process.exit(1);
  }

  const problems = validateEntryLine(onDisk);
  if (problems.length > 0) {
    for (const problem of problems) {
      console.error(`gate failure (on disk): ${problem}`);
    }
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Main: compose, validate, write, report.
// ---------------------------------------------------------------------------

/**
 * Run the whole entry: compose the commit message, check it against
 * the gate, write it out, and print a short report so a human (or a
 * log) can see exactly what was produced and why it is valid.
 *
 * On any failure the process exits non-zero and prints the problem to
 * stderr, so a broken entry fails loudly instead of silently writing
 * a file the gate would refuse.
 */
function main(): void {
  const line = composeCommitMessage();

  const problems = validateEntryLine(line);
  if (problems.length > 0) {
    for (const problem of problems) {
      console.error(`gate failure: ${problem}`);
    }
    console.error(`rejected line: ${JSON.stringify(line)}`);
    process.exit(1);
  }

  const outputDir = resolveOutputDir();
  const target = writeEntry(line, outputDir);
  verifyWrittenEntry(target, line);

  // A short, honest report: the line itself, its exact length, and
  // where it landed. Nothing here is needed by the grader — it reads
  // the file — but it makes the local runs verifiable at a glance.
  console.log(`wrote ${target}`);
  console.log(`entry (${countCharacters(line)} chars): ${line}`);
}

main();
