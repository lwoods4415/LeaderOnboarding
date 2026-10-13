"use client";
import type { PlannerTool } from "@/content";
import { raw } from "@/lib/html";
import { update, useLeader } from "@/lib/store";
import { CopyButton } from "./ui";

export function plannerText(tool: PlannerTool, planner: Record<string, string>) {
  let out = tool.template;
  tool.fields.forEach((f) => {
    const v = (planner[(tool.prefix || "") + f.key] || "").trim();
    out = out.split("{" + f.key + "}").join(v || "[" + f.blank + "]");
  });
  return out;
}

export function Planner({ t }: { t: PlannerTool }) {
  const planner = useLeader().planner;
  const pre = t.prefix || "";
  const text = plannerText(t, planner);
  return (
    <div className="tool" id={`tool-${t.id}`}>
      <h3 {...raw(t.title)} /><p className="lede" {...raw(t.lede)} />
      <div className="grid2">
        {t.fields.map((f) => {
          const key = pre + f.key;
          const props = {
            id: `pl-${key}`,
            value: planner[key] ?? "",
            placeholder: f.ph ?? "",
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const v = e.target.value; update((d) => { d.planner[key] = v; }); },
          };
          return (
            <label key={f.key} htmlFor={props.id}>
              <span {...raw(f.label)} />
              {f.input ? <input type="text" {...props} /> : <textarea {...props} />}
            </label>
          );
        })}
      </div>
      {t.note ? <p className="note" style={{ marginTop: 12 }} {...raw(t.note)} /> : null}
      <div className="out" id={`out-${t.id}`}>{text}</div>
      <CopyButton text={text} targetId={t.id} />
    </div>
  );
}
