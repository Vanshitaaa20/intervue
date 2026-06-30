# Intervue

An AI-powered behavioral interview platform that thinks like a senior hiring manager.

## Architecture

```
Candidate Voice
    ↓
  Vapi (voice streaming only)
    ↓
/api/vapi/webhook  ← Custom LLM endpoint
    ↓
Single LLM Call (Claude claude-sonnet-4-6, structured JSON)
    ↓
Deterministic TypeScript Reducers
    ↓
Updated InterviewState → persisted to Postgres
    ↓
Spoken response streamed back to Vapi
```

**One LLM call per turn. No exceptions.** Everything else — coverage tracking, difficulty adjustment, memory, stage transitions, report generation — is pure TypeScript.

## Interview Engine (`src/engine/`)


| Module | Responsibility |
|---|---|
| `state.ts` | `InterviewState` initializer |
| `coverage-planner.ts` | Competency coverage + advancement logic |
| `answer-evaluator.ts` | Builds the LLM system prompt per turn |
| `decision-reducer.ts` | Applies structured LLM output → next state |
| `memory-manager.ts` | Salient fact storage + recall selection |
| `difficulty-controller.ts` | Difficulty ramp (1–5) from answer quality |
| `question-generator.ts` | Opening question prompts per competency |
| `report-generator.ts` | Derives full report from final state (no LLM) |

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js App Router |
| Language | TypeScript (strict) |
| Database | PostgreSQL via Supabase + Prisma |
| LLM | Anthropic Claude Sonnet |
| Voice | Vapi (Custom LLM mode) |
| Auth | JWT + bcrypt |
| UI | TailwindCSS v4 + Framer Motion |

## Getting Started

### 1. Install

```bash
git clone <repo> && cd intervue
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Fill in: DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY, NEXT_PUBLIC_VAPI_API_KEY, NEXT_PUBLIC_APP_URL
```

### 3. Database setup

```bash
npm run db:push    # Push Prisma schema to Supabase
npm run db:seed    # Seed interview templates
```

### 4. Dev server

```bash
npm run dev
# http://localhost:3000
```

### 5. Configure Vapi

1. Create an assistant in [Vapi dashboard](https://dashboard.vapi.ai)
2. Set LLM provider → **Custom LLM**
3. URL: `https://your-domain.vercel.app/api/vapi/webhook`
4. Pass `metadata.sessionId` when starting a call

## Developer Debug Mode

- Interview state (stage, turn, difficulty)
- Competency coverage %
- Memory log (stored + recalled facts)
- Last LLM evaluation (quality, STAR scores, follow-up reasoning)



## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register
│   ├── (app)/
│   │   ├── dashboard/   # Template selection + past sessions
│   │   ├── prepare/     # Pre-interview briefing screen
│   │   ├── interview/   # Live voice interview
│   │   └── report/      # Post-interview performance report
│   └── api/             # Route handlers
│       ├── auth/
│       ├── interview/
│       └── vapi/webhook # Custom LLM endpoint
├── engine/              # Pure interview engine — no React, no Next
├── features/
│   ├── auth/
│   ├── interview/       # VoiceOrb, TranscriptPanel, CompetencyProgress
│   └── debug/           # DebugPanel (Shift+D)
└── lib/                 # prisma.ts, jwt.ts, llm.ts, errors.ts
```
