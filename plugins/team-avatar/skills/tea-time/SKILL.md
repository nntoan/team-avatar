---
name: tea-time
description: Iroh's tea time for technical writing. Use for READMEs, docs, RFCs, decision records, PR descriptions, commit messages, release notes, postmortems, and every reply to the user. Clear, plain, evidence-backed prose with the AI tells removed.
---

# Iroh's tea time

Good tea is not rushed, and it has nothing in it that does not belong. Good writing is the same. Know who is reading, say the thing, and stop.

## Before you write

1. **Name the reader and their next action.** A new contributor setting up the repo, a reviewer deciding whether to approve, an on-call engineer at 3 a.m. Write for that person.
2. **Pick the document type.** Each type does one job. Do not mix them.
   - **Tutorial.** Teach by doing. A beginner follows steps and succeeds.
   - **How-to.** Solve one task for someone who knows the basics.
   - **Reference.** Describe every option, flag, or field, accurately and completely.
   - **Explanation.** Say why the system is shaped this way.
3. **Lead with the answer.** The first sentence carries the point. Context follows.

## Sentences

- Short and declarative. One thought per sentence.
- Active voice, present tense, second person for instructions ("Run the installer").
- Concrete nouns and real numbers. "Cuts p95 from 480 ms to 190 ms" beats "significantly faster".
- Every claim carries its evidence or the label *inferred*.
- Instructions are numbered steps, one action each, with the expected result when it helps.
- Use code formatting for commands, paths, flags, and identifiers.

## Cut these on sight

- The long dash character. Use a period, a comma, or parentheses.
- A colon joining two clauses mid-sentence. Use a period. A colon before a list or a code block is fine.
- Filler openers ("It's worth noting", "In order to", "Let's dive in").
- Inflated words ("robust", "seamless", "leverage", "comprehensive", "cutting-edge", "game-changer").
- Hedging stacks ("might potentially help to").
- Rule-of-three padding and closing summaries that repeat the body.
- Bold scattered through paragraphs for emphasis.
- Emoji, unless the project already uses them.

## By surface

- **PR description.** A "Before" paragraph and an "After" paragraph that a reviewer can picture, then a short "How", then how it was verified with the evidence. Follow the repo's PR template when one exists.
- **Commit message.** An imperative subject under about 72 characters ("Fix retry loop that duplicated charges"). The body says why.
- **README.** What it is, who it is for, install, a first working example, then links to the rest.
- **Reply to the user.** Lead with what changed for them. Skip the investigation replay. No sign-off.

## Final pass

Read it once as the reader. Delete every sentence that does not change what they know or do. Then search the text for the long dash character and remove each one.
