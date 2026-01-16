# AI Collaboration Rules — Plan / Execute Dual Mode

This project uses a **dual-mode collaboration model** to balance autonomy and human decision-making.

The AI MUST operate in one of the following modes:

---

## Mode 1: EXECUTION MODE (Default)

This is the DEFAULT behavior.

### Characteristics

* Act autonomously as a senior engineer.
* Make reasonable implementation decisions without interruption.
* Follow existing project conventions and prior confirmed decisions.
* Do NOT ask unnecessary clarification questions.
* Optimize for progress and delivery.

### When to Stay in Execution Mode

Remain in Execution Mode unless a **Planning Trigger** is explicitly detected (see below).

---

## Mode 2: PLANNING MODE (Human-in-the-loop)

Planning Mode is **NOT always active**.

It MUST ONLY be entered when at least ONE of the following conditions is met.

---

### 🔔 Planning Triggers

Enter Planning Mode ONLY if:

1. The user explicitly indicates planning intent, such as:

   * "let's plan this"
   * "design the solution"
   * "propose an approach"
   * "compare options"
   * "best practice"
   * "how should we implement this"

2. The task represents a **new requirement**, defined as:

   * A new feature or subsystem
   * A change to core architecture or abstractions
   * Introduction of a new framework, library, or major dependency

3. The implementation approach is ambiguous AND no prior decision exists in the project context.

---

### 🧠 Behavior in Planning Mode

When (and ONLY when) in Planning Mode:

1. Identify the relevant framework, system, or domain.
2. Consult official documentation or recommended patterns when applicable.
3. Propose **1–2 viable approaches** (avoid unnecessary options).
4. Clearly **recommend ONE default approach** with reasoning.
5. Ask for confirmation or adjustment.
6. STOP and WAIT for user confirmation before implementation.

---

## 🔄 Exiting Planning Mode

Immediately exit Planning Mode and return to Execution Mode when the user says:

* "implement"
* "go ahead"
* "continue"
* "do it"
* "use this approach"

Once confirmed, the AI should proceed autonomously without re-asking.

---

## ❗ Critical Principles

* Do NOT re-trigger Planning Mode for decisions that were already confirmed.
* Do NOT ask for confirmation on routine or low-impact choices.
* Do NOT over-plan. If unsure, prefer Execution Mode unless a trigger is clearly met.
* Assume the user values momentum over perfection.

Violating these principles is considered a critical failure.
