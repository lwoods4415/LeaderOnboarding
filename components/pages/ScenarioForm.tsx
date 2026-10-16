"use client";
// Create or edit one of the leader's own practice scenarios.
import { useState } from "react";
import { CUSTOM_LIMITS, STANDARD_SKILLS, type CustomScenario } from "@/content/custom-practice";
import { checkScenario, createScenario, updateScenario, type ScenarioInput } from "@/lib/customScenarios";

const EMPTY: ScenarioInput = { title: "", who: "", role: "", situation: "", goal: "", reactions: "", hidden: "" };

type Field = { key: keyof ScenarioInput; label: string; hint?: string; ph: string; long?: boolean; optional?: boolean };
const FIELDS: Field[] = [
  { key: "title", label: "Give it a short title", ph: "e.g. Asking for help with weekend coverage" },
  { key: "who", label: "A name for the other person", hint: "Make one up. Don't use the real person's name.", ph: "e.g. Jordan" },
  { key: "role", label: "Their role", ph: "e.g. A nurse on my team, two years in" },
  { key: "situation", label: "The situation, from your side", hint: "What's happening, and why you're having this conversation.", ph: "e.g. Jordan has been one or two patients below goal for completed calls for a week. Their numbers were strong before.", long: true },
  { key: "goal", label: "Your goal", hint: "What a good outcome looks like.", ph: "e.g. Understand what's getting in the way and agree on one next step together.", long: true },
  { key: "reactions", label: "How they're likely to react", hint: "Optional. Helps the practice partner feel real.", ph: "e.g. Gets defensive at first and says the patient list is unfair.", long: true, optional: true },
  { key: "hidden", label: "What might really be going on", hint: "Optional. Something they haven't said. The partner reveals it only if you earn it by listening.", ph: "e.g. They're caring for a parent and leaving early to make appointments.", long: true, optional: true },
];

export function ScenarioForm({ initial, onSaved, onCancel }: { initial?: CustomScenario; onSaved: (c: CustomScenario) => void; onCancel: () => void }) {
  const [v, setV] = useState<ScenarioInput>(initial ? { ...EMPTY, ...initial } : EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const problem = checkScenario(v);
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    try {
      if (initial) {
        await updateScenario(initial.id, v);
        onSaved({ ...initial, ...v });
      } else {
        onSaved(await createScenario(v));
      }
    } catch {
      setError(`Couldn't save the scenario. Check your connection and try again. You can keep up to ${CUSTOM_LIMITS.maxScenarios} scenarios.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="tool" onSubmit={save}>
      <h3>{initial ? "Edit your scenario" : "Create your own scenario"}</h3>
      <p className="lede">Describe a conversation you&apos;ve had or expect to have. The practice partner plays the other person, and you get scored feedback like the other conversations.</p>
      <div className="warn" style={{ marginBottom: 16 }}>Never include real patient names or details, or real names of people on your team. Change anything that could identify someone. Your scenarios are private to you; your program leader sees only your scores and feedback.</div>
      <div className="grid2">
        {FIELDS.map((f) => {
          const max = CUSTOM_LIMITS[f.key as keyof typeof CUSTOM_LIMITS];
          const props = {
            id: `cs-${f.key}`, value: v[f.key], placeholder: f.ph, maxLength: max,
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [f.key]: e.target.value }),
          };
          return (
            <label key={f.key} htmlFor={props.id} style={f.long ? { gridColumn: "1 / -1" } : undefined}>
              <span>{f.label}{f.optional ? " (optional)" : ""}</span>
              {f.hint ? <small className="note" style={{ fontWeight: 400 }}>{f.hint}</small> : null}
              {f.long ? <textarea {...props} /> : <input type="text" {...props} />}
            </label>
          );
        })}
      </div>
      <p className="note" style={{ marginTop: 12 }}>You&apos;ll be scored on: {STANDARD_SKILLS.join(" · ")}.</p>
      {error ? <p className="msg-err" style={{ marginTop: 10 }}>{error}</p> : null}
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn primary" disabled={busy}>{busy ? "Saving…" : initial ? "Save changes" : "Save and start practicing"}</button>
        <button type="button" className="btn ghost" disabled={busy} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
