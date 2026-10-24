# The unslop catalog

Edit text to remove AI patterns. Scan for the patterns below, then rewrite. Preserve the meaning and match the intended tone.

Rule numbers are stable ids that other skills cite. A removed rule leaves a gap in the numbering.

## Content

3. **Superficial -ing phrases.** "highlighting...", "ensuring...", "reflecting...", "showcasing...", "fostering...". Delete them, or expand them with real sources.
5. **Vague attributions.** "Experts believe", "Industry reports suggest", "Some critics argue". Name the source or delete the claim.

## Language

7. **AI vocabulary.** Additionally, crucial, delve, enduring, enhance, fostering, garner, interplay, intricate, landscape (abstract), pivotal, showcase, tapestry (abstract), testament, underscore, vibrant. Replace each with a plain word.
8. **Fancy ways to say "is".** "serves as", "stands as", "boasts", "features". Say "is" or "has".
9. **"Not just X, but Y."** State the point directly instead.
10. **Rule of three.** Do not force ideas into groups of three. Use the natural number.
11. **Synonym cycling.** Protagonist, main character, central figure, and hero all in one paragraph. Pick one name and repeat it.
12. **False ranges.** "from X to Y" where X and Y are not on a meaningful scale. List the topics directly.

## Style

13. **Long dashes.** Never use the em dash (U+2014) or the en dash (U+2013). Use a period, a comma, or parentheses. Do not substitute a hyphen used as a dash. If a thought needs separation, end the sentence.
14. **Colon as a connector.** A colon is fine before a list or an example. It is not a mid-sentence connector. "If you're coming from traditional automation: instead of registering event handlers, you describe conditions" gains nothing from the colon. Rewrite so the point stands on its own without the comparison framing. "Describing when the scheduler should fire works best as plain English." Same meaning, no crutch punctuation.
15. **Boldface overuse.** Do not bold every proper noun or acronym.
16. **Inline-header lists.** The tell is a bold label and colon that restate the line, as in "**Performance:** Performance improved...". Convert those to prose. A bold lead-in that ends in a period, names the item, and is followed by new detail ("**Schema in TypeScript.** Tables live in one file.") is fine.
17. **Title case headings.** Use sentence case.
18. **Decorative emojis.** Remove them from headings and bullets.
19. **Curly quotes.** Use straight quotes.

## Communication artifacts

20. **Chatbot phrases.** "I hope this helps!", "Let me know if...", "Of course!", "Certainly!", "Found the smoking gun!" Remove them.
22. **Sycophantic tone.** "Great question! You're absolutely right!" Respond directly.

## Filler

23. **Filler phrases.** "In order to" becomes "to". "Due to the fact that" becomes "because". Delete "It is important to note that".
24. **Excessive hedging.** "could potentially possibly be argued that it might" becomes "may".
25. **Generic conclusions.** "The future looks bright." State specific plans or facts.

## Jargon

26. **Abstract metaphor nouns.** Substrate (base), wedge or wedge in (add), vector (way, method), locus, vantage, nexus, primitive as a noun, harness as a metaphor, surface as in "API surface", bedrock, scaffolding as a metaphor, modality, paradigm, gold-plating (more than the job needs), ratchet as a metaphor (the mechanism's real name, or a limit that only tightens), evacuate for moving code (move out), endgame (the last phase), north star, flywheel. These read as technical but usually have a plainer concrete word. Pick the concrete word.

## Plain speech

27. **Say what it does, not how it feels.** "the database stays close at hand", "SQL you can read", and "types that follow your schema" name a feeling. The fix names the mechanism or a number. "`.toSQL()` returns the exact string sent to the database." "A column rename fails the build." Ask what the sentence tells the reader to do or know, then write that. If you cannot restate it as a concrete instruction, fact, or number, cut it. One more check. If the sentence could appear unchanged in another project's docs, it says nothing about this one. Cut it.
28. **Shorten or split dense sentences.** If the reader has to backtrack to parse a sentence, break it in two or drop clauses. One idea per sentence.
29. **Active voice.** Prefer it. Catch "is/are/was/were + past participle" and name the actor. "Queries are validated" becomes "the compiler validates queries". "The file is parsed by the loader" becomes "the loader parses the file". Passive is fine only when the actor is unknown or does not matter.
30. **Cut adverbs, or use a stronger verb.** "Runs quickly" becomes "is fast" or the number. "Significantly improves" becomes the measured delta. An adverb propping up a weak verb means the verb is wrong.
31. **Prefer the plain word.** "Utilize" and "leverage" become "use". "Facilitate" becomes "help". "Numerous" becomes "many". "In the event that" becomes "if". The fancier synonym is rarely clearer.
32. **Mannered prose.** Metaphor or flourish where a literal phrase exists. That covers aphorisms ("wire it or delete it"), rhetorical fragments for effect, personified code ("the plan holds it"), figurative verbs ("rides along", "stands on"), and stock framing phrases. "A dial worth turning" becomes "a parameter worth varying". Say what you mean. Rule 26 covers the metaphor nouns.
33. **Over-compression.** Dropped articles, verbless fragments, symbol-speak, and abbreviations make the reader decode instead of read. "Parser rejects bad date → exit 2, no write" becomes "The parser rejects a bad date, exits with code 2, and writes nothing." Write whole sentences with their articles and verbs, and spell out arrows and abbreviations.

## Character voice is not slop

Team Avatar skills open with a short character framing. That paragraph may use the story's imagery. Everything after it follows this catalog with no exceptions.
