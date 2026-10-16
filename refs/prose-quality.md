# Prose quality

The rules every agent writing prose in this repo follows. `agents/doc-writer.md`
and `agents/doc-reviewer.md` have pointed here since they were written; the file
itself was never created, so the rules below are recovered from the summaries in
those two role files and nothing else has been added to them.

`hooks/prose-check.py` enforces the banned-phrase section mechanically on every
`.md` write. The rest is judgement and is enforced by review.

## Banned phrases

A phrase is on this list because it is a tell: it reads as filler, as hedging,
or as a word reached for in place of the specific one. The ban is on the string,
not on the idea — say the specific thing instead.

The block below is the enforced list. `hooks/prose-check.py` parses exactly this
fence, so the two can never disagree; one phrase per line, matched
case-insensitively on word boundaries.

```banned-phrases
load-bearing
robust
nuanced
delve
tapestry
seamless
seamlessly
leverage
holistic
paradigm
unlock
navigate
empower
it's worth noting
it is worth noting
at the end of the day
in conclusion
```

`agents/doc-writer.md:70` describes this list as "and 20+ others". Those others
were never written down, so they are not on the list and are not enforced. Add
one here when you find it rather than leaving it to memory — a rule that lives
only in a count is not a rule.

### Replacements

| Banned | Say |
| --- | --- |
| load-bearing | what depends on it, and how it breaks |
| robust | the failure it survives |
| nuanced | the distinction itself |
| seamless / seamlessly | what the user does not have to do |
| leverage | use |
| unlock | what becomes possible, stated plainly |
| navigate | the actual action — click, open, read, choose |
| empower | what the user can now do |
| it's worth noting | the note, with nothing in front of it |
| in conclusion | nothing; delete the paragraph |

## Structure

- **No default-three lists.** A triad is a deliberate rhetorical device — three
  parallel clauses for rhythmic effect. The failure mode is defaulting to three
  items because three *feels* complete. Two items merged to reach three, or a
  third padded in, is the tell. Use the count the content needs.
- **Vary sentence length and construction.** Uniform 15–25 word subject-verb
  sentences are a tell. Mix short sentences with longer ones.
- **No throat-clearing.** Cut "This section describes…" and "The following
  explains…". Start with the content.
- **No empty summarization.** A closing paragraph that restates what came before
  gets deleted.
- **Commit to positions.** "Use X" beats "X may be appropriate depending on your
  needs."
- **No artificial balance on non-contested topics.** Two sides are worth giving
  when there are two sides.

## Verification

From `agents/doc-writer.md`, and the reason the prose rules and the accuracy
rules sit in one reference: polished prose about behaviour that was never read
is the worse failure.

- **Read-before-claim.** Every claim about a file, function, or behaviour needs a
  visible `Read` or `Grep` call in the same response. No tool call means the
  claim is inadmissible.
- **Quote the code.** Quote the implementation lines verbatim; paraphrase is
  inadmissible.
- **Tag every claim** `[tool-verified]` or `[inferred]`. Inferred behaviour is
  never documented as fact.
