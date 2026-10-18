import { parsePrNumber } from "./types.ts";
import type {
  CiClean,
  GitHubMergeAllowed,
  PrContext,
  ReadyPr,
  TerminalVerdict,
} from "./types.ts";

type ReadyVerdict = Extract<TerminalVerdict, { readonly kind: "READY" }>;

const context = {
  owner: "octocat",
  repo: "hello-world",
  number: parsePrNumber(123),
} satisfies PrContext;
const cleanCi = {
  kind: "ci-clean",
  source: "gh-pr-checks",
  all: [
    {
      kind: "passed",
      name: "ci",
      reportedState: "SUCCESS",
      description: "",
      link: "",
      workflow: "",
    },
  ],
  failed: [],
  pending: [],
  hadPreviousPassingCi: false,
  github: {
    kind: "allowed",
    basis: "merge-state",
    mergeStateStatus: "CLEAN",
    headRollupState: "SUCCESS",
  },
} satisfies CiClean;
const readyPr = {
  kind: "ready-pr",
  context,
  proof: {
    revision: { context, headRefOid: "head", baseRefName: "main", baseRefOid: "base" },
    mergeability: "clear",
    threads: [],
    ci: cleanCi,
    gate: {
      state: "OPEN",
      reviewDecision: "APPROVED",
      draft: "not-draft",
    },
  },
} satisfies ReadyPr;
const ready = {
  schemaVersion: 1,
  sequence: 1,
  observedAt: "2026-07-26T00:00:00.000Z",
  mode: "single",
  kind: "READY",
  terminal: true,
  exitCode: 0,
  scope: { kind: "single", pr: readyPr },
} satisfies ReadyVerdict;

void ready;

// PR 179929's shape. Each check below asserts that a shape the policy must
// refuse is not assignable to the type that would allow it.
type Assignable<T, U> = [T] extends [U] ? true : false;
type Refused<T extends false> = T;
type With<T, K extends PropertyKey, V> = Omit<T, K> & { [P in K]: V };

const refused = {
  kind: "allowed",
  basis: "rollup",
  mergeStateStatus: "BLOCKED",
  headRollupState: "FAILURE",
} as const;

// BLOCKED with a failing rollup is a refusal, not an allowance.
type RefusalIsNotAllowed = Refused<Assignable<typeof refused, GitHubMergeAllowed>>;

// CI cannot be clean while GitHub refuses the merge.
type RefusalIsNotClean = Refused<Assignable<With<typeof cleanCi, "github", typeof refused>, CiClean>>;

// READY cannot carry the failing-checks exit code.
type ReadyWithBlockerExit = Refused<Assignable<With<typeof ready, "exitCode", 4>, ReadyVerdict>>;

const unprovenPr = { kind: "ready-pr", context } as const;

// An open READY row must carry positive readiness proof.
type ReadyWithoutProof = Refused<Assignable<typeof unprovenPr, ReadyPr>>;

const unreportedProof = {
  ...readyPr.proof,
  ci: {
    kind: "ci-unreported",
    failed: [],
    pending: [],
    hadPreviousPassingCi: false,
  },
} as const;

// A first sighting of no checks is not readiness proof.
type ReadyBeforeConfirmation = Refused<Assignable<With<typeof readyPr, "proof", typeof unreportedProof>, ReadyPr>>;

export type RefusedShapes = [
  RefusalIsNotAllowed,
  RefusalIsNotClean,
  ReadyWithBlockerExit,
  ReadyWithoutProof,
  ReadyBeforeConfirmation,
];
