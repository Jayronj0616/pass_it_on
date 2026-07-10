# PassItOn Handoff

I'm continuing work on a project called **PassItOn** — a donation marketplace built with **Next.js** (deployed on Vercel) and **Supabase** (Database, Authentication, and Storage).

**Motto:** *"Don't throw it away. Pass it on."*

I'll be providing the following project documentation:

* `SYSTEM.md` — complete architecture, data model, RLS decisions, API design, route structure, and implementation notes.
* `DESIGN.md` — design brief. **No visual direction has been chosen yet.**
* `passiton-structure.zip` — scaffolded project structure containing placeholder files that indicate where each feature belongs.

## Before responding

Read **SYSTEM.md** and **DESIGN.md** completely before answering or making suggestions.

If you need to inspect or navigate the project itself, **use the MCP filesystem tools** to access the project directory:

`C:\Users\jay-ron.r.javier\Desktop\pass_it_on`

Use the MCP tools to read files whenever possible instead of asking me to paste file contents.

## Important architectural decisions

These decisions are intentional and should not be "simplified" or replaced without discussion.

### Donation flow

This is a **donator approval** system, **not** first-come-first-served.

Item lifecycle:

`available → reserved → completed`

Inquiry lifecycle:

`pending → approved / rejected / closed`

Only the donor decides who receives an item.

### Contact information

The donor's email (and optional phone number) **must not** be exposed through a normal RLS `SELECT` policy on `profiles`.

Contact information is revealed **server-side only** through an API route or PostgreSQL function that verifies:

* the inquiry is `approved`
* the authenticated user is the inquiry's `receiver_id`

This reasoning is documented in **SYSTEM.md §5**.

Do **not** suggest replacing this with "just add an RLS policy."

## UI / Design

No visual style has been selected.

When we begin UI work:

1. Brainstorm a design/token system.
2. Critique it against the three common generic AI design defaults.
3. Refine the direction.
4. Only then begin implementation.

Do **not** immediately start generating Tailwind classes or components.

## Coding workflow preferences

These apply to **coding-related requests only**.

* Assume I'm another developer.
* Before proposing implementation, ask for the necessary context if something is missing.
* If you need to inspect code, use the MCP tools to access the project first. If MCP cannot access what is needed, then ask me for the relevant file.
* Don't be a yes-man. If I'm mistaken, tell me directly and explain why.
* Don't generate code or modify files unless I explicitly ask you to write or edit code.
* Default to explanations, architecture discussions, debugging, planning, or design unless I request implementation.
* When reviewing project files, analyze them silently. Don't narrate what you're reading.

## First response

After reading the documentation, briefly confirm your understanding of the project's current state based on the uploaded files, then ask what I want to work on next.
