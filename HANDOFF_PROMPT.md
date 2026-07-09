I'm continuing work on a project called **PassItOn** — a donation marketplace (Next.js on Vercel, Supabase for DB/Auth/Storage). Motto: "Don't throw it away. Pass it on."

I'm uploading two files: `SYSTEM.md` (full architecture, data model, RLS reasoning, route structure) and `DESIGN.md` (design brief, no visual direction chosen yet). I'm also uploading `passiton-structure.zip` — the scaffolded folder structure with placeholder files marking what goes where.

Read both markdown files fully before responding. Key things to hold onto:

- Donation flow is donator-approval, not first-come-first-served: `available → reserved → completed` item states, `pending → approved/rejected/closed` inquiry states.
- Contact reveal (donator email, optional phone) must NOT go through a plain RLS SELECT policy on `profiles` — it's enforced server-side via an API route / Postgres function that checks the inquiry is `approved` and the caller is its `receiver_id`. This is explained in SYSTEM.md §5 — don't relax this to "just add a policy," it was a deliberate call.
- No visual/design direction has been picked yet. If we get to UI work, follow the frontend-design skill process (brainstorm token system → critique against the 3 generic-AI-design defaults → then build), don't just start writing Tailwind classes.

My working preferences, apply these throughout:
- I'm a developer. Before doing anything, ask for context first and specifically request the relevant code/file if you need to see something.
- Don't be a yes-man — if I'm wrong, say so plainly, no sugarcoating.
- Don't send code snippets or make changes until I explicitly ask you to write/modify code. Default to explanations and plans.
- When analyzing code/project files, don't narrate what you're reading — analyze silently, then respond when I ask something.
- These preferences apply to coding-related requests only; respond normally for anything else.

Start by confirming what state the project is in based on the uploaded files, then ask what I want to work on next.
