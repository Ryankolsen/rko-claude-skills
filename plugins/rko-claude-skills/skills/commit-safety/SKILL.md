---
name: commit-safety
description: The checklist for deciding whether a diff is safe to land — unmet acceptance criteria, leaked secrets, unintended side effects, a weakened gate, and drift from the surrounding codebase. Use when reviewing uncommitted or unmerged work before it lands, or when an agent needs the rules behind a green/red verdict. Judges the change, not the repository, and fixes nothing.
domain: commit-safety
disable-model-invocation: false
---

# Commit safety

What to look for in a diff before it lands. A caller applies these and issues the verdict; this skill supplies the bar, not the decision.

**Review the diff, not the repository.** A pre-existing problem in untouched code is not this change's finding. Say it exists if you trip over it, and label it pre-existing.

Establish what changed first: `git status`, `git diff HEAD` for uncommitted work, `git diff <base>...HEAD` when a base was named. Read added lines closely (`git diff -U0` isolates them); read the surrounding file only as the context you need to judge a hunk.

## Secrets and credentials — always blocking

Scan every added line for material that must not be in a repository:

- **Recognisable key shapes** — `AKIA`/`ASIA` prefixes, `sk-` and `sk_live_` tokens, `ghp_`/`gho_`/`github_pat_`, `xoxb-`/`xoxp-`, `-----BEGIN … PRIVATE KEY-----`, JWTs with a real payload, connection strings carrying a password, URLs of the form `scheme://user:pass@host`.
- **Assignment by name** — an added line where an identifier containing `secret`, `token`, `password`, `passwd`, `api_key`, `apikey`, `credential`, `private_key`, or `access_key` is assigned a literal string.
- **Files that should never be tracked** — a newly tracked `.env`, `.pem`, `.p12`, `.keystore`, `id_rsa`, a service-account JSON, a credentials or keychain file. Check `git status` as well as the diff; a file added to the index is committed whether or not you find a key inside it.
- **Long high-entropy literals** with no evident purpose — a 32-plus character mixed-case-and-digit string is a candidate even when nothing names it.

**Separate a real secret from a placeholder.** `sk-xxxxxxxx`, `password = "hunter2"` in a test fixture, an obvious dummy in an `.env.example`, a value read from the environment rather than written down — these are not findings, and reporting them trains the caller to ignore you. When you genuinely cannot tell a live credential from a fake one, report it as unresolved and say why, rather than picking a side.

**Never reproduce a secret you find.** Report the kind of credential and `path:line`, nothing more. Quoting it copies it into the transcript, the issue comment, and everywhere those travel — spreading the exposure while reporting it. Mark the finding as not for the tracker: withholding the value is worthless if the file and line still get pasted somewhere public.

Say whether the secret is only in the working tree or already committed. It changes the remedy entirely: an uncommitted line can be deleted, but a committed one is in the history and the credential must be treated as burned and rotated.

## Acceptance criteria — blocking

Work through the acceptance criteria the caller supplied, one at a time, and say for each whether the diff satisfies it: **met**, **unmet**, or **not verifiable from the diff**.

Check a criterion that carries a value — a timing, a threshold, a colour, an ordering, a piece of copy — against *that value*, not against the general shape of the feature. "There is a telegraph" does not satisfy "the telegraph stays quiet until the final 0.4s." Neither does a passing suite: the tests came from the same change, so they assert what it chose to build, which is the thing in question.

**An unmet criterion is blocking.** It is the one failure a gate structurally cannot produce — correct code, green tests, and the requested behaviour absent. Quote the criterion as written and say what the diff does instead.

**Not verifiable from the diff is not blocking.** Some criteria are about runtime feel and can only be judged by running the thing. Say which those are so the caller knows what a pass did not cover. Do not stretch to a verdict you cannot support, and do not fail a change for being unobservable.

Where no acceptance criteria were supplied, say so rather than inventing a bar. You are checking against a stated one, not designing it.

## Unintended side effects — blocking

A change should do what was asked and nothing else. Look for what the diff does beyond its stated purpose:

- **A weakened gate.** Tests deleted, renamed to stop matching the runner, or marked `skip`/`only`/`xfail`/`todo`. Assertions loosened or commented out. Snapshots wholesale re-recorded. A lint rule disabled, an `eslint-disable`, `@ts-ignore`, `# noqa`, `#[allow(…)]` added. A CI step removed, a coverage threshold lowered, a timeout raised to hide a flake. A gate edited by the same change it is meant to judge is the single highest-value thing here — it is how a red change is made to look green, and no other reviewer is guaranteed to look.
- **Blast radius past the brief.** Files changed that the task never implicated, a drive-by refactor riding along with a fix, a dependency added or a version bumped for no reason the diff explains, generated or vendored output committed by accident, a stray debug print or commented-out block left behind.
- **Irreversible or outward-facing changes.** A destructive migration (dropped column or table, non-additive rename), a deleted file, a `.gitignore` line that hides something now untracked, a changed default that alters behaviour for existing data, a public signature or exported API changed without its callers.
- **Secrets' quieter cousins** — an internal hostname, a customer name, a personal email, a real account identifier hardcoded where a config value belongs.

For each, say what the change does beyond what was asked, and whether it looks deliberate. "Deliberate but undeclared" is a real and common answer, and the caller decides.

## Consistency with the codebase — advisory

Judge the change against how this repository already does things: its established patterns for this kind of code, its error-handling and logging conventions, its naming and domain vocabulary (`CONTEXT.md` where one exists), its test layout and existing factories. Duplicating a helper that already exists, or inventing a second way to do something the codebase settled long ago, is the finding worth reporting here.

**These are judgement calls and they never block.** Report them under a heading that says so. Depth on this axis belongs to the `code-review` skill, which reads the repository's documented standards and the Fowler smell baseline properly; this is what is obvious from the diff, not that review. Where a finding needs that treatment, name it instead of straining to do its job.
