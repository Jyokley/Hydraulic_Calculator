"use client";

import { useMemo, useState } from "react";
import * as LS from "@/lib/lifeSafetyFormulas";
import * as F from "@/lib/spreadsheetFormulas";

type KpqMode = "k" | "q" | "p";

function parseNum(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function fmt(n: number | null, digits = 4): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
      ) : null}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  value,
  onChange,
  unit,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {label}
      </label>
      {hint ? <p className="text-xs text-zinc-500 dark:text-zinc-500">{hint}</p> : null}
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          placeholder="0"
        />
        {unit ? (
          <span className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">{unit}</span>
        ) : null}
      </div>
    </div>
  );
}

function ResultTable({ rows }: { rows: { label: string; value: string; detail?: string }[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
              <th
                scope="row"
                className="w-[45%] bg-zinc-50 px-3 py-2.5 text-left font-medium text-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300"
              >
                {r.label}
              </th>
              <td className="px-3 py-2.5 font-mono text-zinc-900 dark:text-zinc-100">
                <div>{r.value}</div>
                {r.detail ? (
                  <div className="mt-0.5 text-xs font-sans text-zinc-500 dark:text-zinc-500">
                    {r.detail}
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Home() {
  const [kpqMode, setKpqMode] = useState<KpqMode>("q");
  const [kIn, setKIn] = useState("25.2");
  const [pIn, setPIn] = useState("15");
  const [qIn, setQIn] = useState("25");

  const kpq = useMemo(() => {
    const k = parseNum(kIn);
    const p = parseNum(pIn);
    const q = parseNum(qIn);
    let resK: number | null = k;
    let resP: number | null = p;
    let resQ: number | null = q;
    let note: string | undefined;

    if (kpqMode === "q") {
      if (k === null || p === null || p < 0) {
        resQ = null;
        note = "Enter K and P (P ≥ 0) to compute Q = K × √P.";
      } else if (p === 0) {
        resQ = 0;
        note = "P = 0 ⇒ Q = 0.";
      } else {
        resQ = F.flowFromKAndP(k, p);
        note = "Matches Excel row 5: E5 = C5 × SQRT(D5).";
      }
    } else if (kpqMode === "k") {
      if (q === null || p === null || p <= 0) {
        resK = null;
        note = "Enter Q and P (P > 0) to compute K = Q ÷ √P.";
      } else {
        resK = F.kFromQAndP(q, p);
        note = "Matches Excel rows 11–12: E11 = C11 ÷ SQRT(D11).";
      }
    } else {
      if (q === null || k === null || k === 0) {
        resP = null;
        note = "Enter Q and K (K ≠ 0) to compute P = (Q ÷ K)².";
      } else {
        resP = F.pressureFromQAndK(q, k);
        note = "Matches Excel rows 8–9: E8 = (C8 ÷ D8)².";
      }
    }

    return {
      k: kpqMode === "k" ? resK : k,
      p: kpqMode === "p" ? resP : p,
      q: kpqMode === "q" ? resQ : q,
      note,
    };
  }, [kpqMode, kIn, pIn, qIn]);

  const [ceilingFt, setCeilingFt] = useState("13");
  const [baseArea, setBaseArea] = useState(String(F.DEFAULT_BASE_DESIGN_AREA));

  const areaRed = useMemo(() => {
    const c = parseNum(ceilingFt);
    const b = parseNum(baseArea);
    if (c === null || b === null || b <= 0) return null;
    return F.reducedDesignArea(c, b);
  }, [ceilingFt, baseArea]);

  const [hwQ, setHwQ] = useState("26");
  const [hwC, setHwC] = useState("150");
  const [hwD, setHwD] = useState("1.101");
  const [hwLen, setHwLen] = useState("53.5");

  const hw = useMemo(() => {
    const q = parseNum(hwQ);
    const c = parseNum(hwC);
    const d = parseNum(hwD);
    const len = parseNum(hwLen);
    if (q === null || c === null || d === null || len === null) return null;
    if (q <= 0 || c <= 0 || d <= 0 || len < 0) return null;
    const perFt = F.frictionLossPerFoot(q, c, d);
    const total = F.totalFrictionLoss(q, c, d, len);
    const num = F.hazenNumeratorTerm(q);
    return { perFt, total, num, cPow: F.cTermPow(c), dPow: F.dTermPow(d) };
  }, [hwQ, hwC, hwD, hwLen]);

  const [sprArea, setSprArea] = useState("1500");
  const [sprCov, setSprCov] = useState("140");

  const spr = useMemo(() => {
    const a = parseNum(sprArea);
    const cov = parseNum(sprCov);
    if (a === null || cov === null || cov <= 0 || a <= 0) return null;
    return {
      heads: F.sprinklerHeadCount(a, cov),
      side: F.squareSideLength(a),
    };
  }, [sprArea, sprCov]);

  const [occSqFt, setOccSqFt] = useState("1000");
  const [occTypeIdx, setOccTypeIdx] = useState(0);

  const occ = useMemo(() => {
    const sq = parseNum(occSqFt);
    const row = LS.OCCUPANT_LOAD_FACTORS[occTypeIdx];
    if (sq === null || !row) return null;
    if (sq < 0) return null;
    const load = LS.occupantLoadFromArea(sq, row.factor);
    return { sq, row, load };
  }, [occSqFt, occTypeIdx]);

  const [diagFt, setDiagFt] = useState("100");

  const exitSep = useMemo(() => {
    const d = parseNum(diagFt);
    if (d === null || d < 0) return null;
    return {
      withSprinklers: LS.exitSeparationSprinklered(d),
      withoutSprinklers: LS.exitSeparationNonSprinklered(d),
    };
  }, [diagFt]);

  const [exitOl, setExitOl] = useState("100");

  const exitWidth = useMemo(() => {
    const ol = parseNum(exitOl);
    if (ol === null || ol < 0) return null;
    const noVoiceIn = LS.exitWidthInches(ol, 0.2);
    const voiceIn = LS.exitWidthInches(ol, 0.15);
    return {
      noVoiceIn,
      noVoiceFt: LS.inchesToFeet(noVoiceIn),
      voiceIn,
      voiceFt: LS.inchesToFeet(voiceIn),
    };
  }, [exitOl]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 to-zinc-200 pb-16 pt-10 dark:from-zinc-950 dark:to-zinc-900">
      <div className="mx-auto max-w-3xl px-4">
        <header className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            Cheezebeard Productions Presents:
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Firelord Josh's Fire Calculations
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Same formulas as your workbook{" "}
            <span className="whitespace-nowrap font-mono text-xs text-zinc-500">
              Hazen Williams Formula and K,P,Q.xlsx
            </span>{" "}
            (Sheet1). Enter values on the left; results update instantly.
          </p>
        </header>

        <div className="flex flex-col gap-8">
          <Section
            title="K factor, pressure, and flow"
            subtitle="NFPA-style relationship Q = K × √P, so K = Q ÷ √P and P = (Q ÷ K)² with P in psi and Q in GPM."
          >
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["q", "Solve for Q"],
                  ["k", "Solve for K"],
                  ["p", "Solve for P"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setKpqMode(id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    kpqMode === id
                      ? "bg-emerald-600 text-white shadow"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="k" label="K" hint="GPM ÷ √psi" value={kIn} onChange={setKIn} unit="" />
              <Field id="p" label="P" hint="Pressure (psi)" value={pIn} onChange={setPIn} unit="psi" />
              <Field id="q" label="Q" hint="Flow (GPM)" value={qIn} onChange={setQIn} unit="GPM" />
            </div>

            <ResultTable
              rows={[
                { label: "K", value: fmt(kpq.k) },
                { label: "P", value: fmt(kpq.p), detail: "psi" },
                { label: "Q", value: fmt(kpq.q), detail: "GPM" },
              ]}
            />
            {kpq.note ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-500">{kpq.note}</p>
            ) : null}
          </Section>

          <Section
            title="Design area reduction (ceiling height)"
            subtitle="Matches Excel G5–G7: reduction % from ceiling, square-foot reduction, and remaining design area."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="ceiling"
                label="Ceiling height"
                hint="← Enter ceiling height (ft)"
                value={ceilingFt}
                onChange={setCeilingFt}
                unit="ft"
              />
              <Field
                id="baseArea"
                label="Base design area"
                value={baseArea}
                onChange={setBaseArea}
                unit="ft²"
              />
            </div>
            <ResultTable
              rows={
                areaRed
                  ? [
                      {
                        label: "Design reduction %",
                        value: fmt(areaRed.designReductionPercent, 2),
                        detail: "G5 = −(3 × ceiling) ÷ 2 + 55",
                      },
                      {
                        label: "Square foot reduction",
                        value: fmt(areaRed.squareFootReduction, 2),
                        detail: "G6 = (G5 ÷ 100) × base area",
                      },
                      {
                        label: "Reduced design area",
                        value: fmt(areaRed.reducedDesignArea, 2),
                        detail: "G7 = base area − G6",
                      },
                    ]
                  : [
                      {
                        label: "Results",
                        value: "—",
                        detail: "Enter valid ceiling height and base area.",
                      },
                    ]
              }
            />
          </Section>

          <Section
            title="Hazen–Williams friction loss"
            subtitle="Per foot and total loss using the same exponents as the sheet: 4.52 × Q^1.85 ÷ (C^1.85 × d^4.87)."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="hwq" label="Q (flow)" value={hwQ} onChange={setHwQ} unit="GPM" />
              <Field id="hwc" label="C (H–W coefficient)" value={hwC} onChange={setHwC} unit="" />
              <Field id="hwd" label="d (internal diameter)" value={hwD} onChange={setHwD} unit="in" />
              <Field id="hwlen" label="Pipe length" value={hwLen} onChange={setHwLen} unit="ft" />
            </div>
            <ResultTable
              rows={
                hw
                  ? [
                      {
                        label: "Numerator (4.52 × Q^1.85)",
                        value: fmt(hw.num, 6),
                      },
                      {
                        label: "C^1.85",
                        value: fmt(hw.cPow, 4),
                      },
                      {
                        label: "d^4.87",
                        value: fmt(hw.dPow, 6),
                      },
                      {
                        label: "Friction loss per foot",
                        value: fmt(hw.perFt, 6),
                        detail: "psi/ft (E16)",
                      },
                      {
                        label: "Total friction loss",
                        value: fmt(hw.total, 4),
                        detail: "psi (E22 = per ft × length)",
                      },
                    ]
                  : [
                      {
                        label: "Results",
                        value: "—",
                        detail: "Enter positive Q, C, d and non-negative length.",
                      },
                    ]
              }
            />
          </Section>

          <Section
            title="Remote area and heads"
            subtitle="Area ÷ coverage per head, and √area for a square layout (Excel F26 and D30)."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="sprA" label="Area" value={sprArea} onChange={setSprArea} unit="ft²" />
              <Field
                id="sprCov"
                label="Coverage per head"
                value={sprCov}
                onChange={setSprCov}
                unit="ft²/head"
              />
            </div>
            <ResultTable
              rows={
                spr
                  ? [
                      {
                        label: "Heads (area ÷ coverage)",
                        value: fmt(spr.heads, 4),
                        detail: "F26 = C26 ÷ D26",
                      },
                      {
                        label: "Square side √area",
                        value: fmt(spr.side, 4),
                        detail: "ft (D30 = SQRT(C30))",
                      },
                    ]
                  : [
                      {
                        label: "Results",
                        value: "—",
                        detail: "Enter positive area and coverage.",
                      },
                    ]
              }
            />
          </Section>

          <Section
            title="Occupant load"
            subtitle="Based on CBC/CFC Table 1004.5 occupant load factors (square feet per person). Always confirm against your adopted code edition."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="occSq" label="Square footage" value={occSqFt} onChange={setOccSqFt} unit="ft²" />
              <div className="space-y-1.5">
                <label htmlFor="occType" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Occupancy / use
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">Load factor (sq ft / person)</p>
                <select
                  id="occType"
                  value={occTypeIdx}
                  onChange={(e) => setOccTypeIdx(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {LS.OCCUPANT_LOAD_FACTORS.map((o, i) => (
                    <option key={o.name} value={i}>
                      {o.name} — {o.factor} ft²/person
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <ResultTable
              rows={
                occ
                  ? [
                      { label: "Square footage", value: fmt(occ.sq, 2), detail: "ft²" },
                      { label: "Load factor", value: String(occ.row.factor), detail: "ft² per person" },
                      {
                        label: "Calculated occupant load",
                        value: String(occ.load),
                        detail: "persons (rounded up)",
                      },
                    ]
                  : [
                      {
                        label: "Results",
                        value: "—",
                        detail: "Enter valid square footage.",
                      },
                    ]
              }
            />
          </Section>

          <Section
            title="Minimum exit separation"
            subtitle="From overall maximum diagonal dimension: one-third with sprinklers, one-half without (typical code-style check; verify locally)."
          >
            <Field
              id="diag"
              label="Maximum overall diagonal dimension"
              hint="Longest straight-line distance across the floor plan (ft)"
              value={diagFt}
              onChange={setDiagFt}
              unit="ft"
            />
            <ResultTable
              rows={
                exitSep
                  ? [
                      {
                        label: "With sprinklers",
                        value: fmt(exitSep.withSprinklers, 2),
                        detail: "ft (diagonal ÷ 3)",
                      },
                      {
                        label: "Without sprinklers",
                        value: fmt(exitSep.withoutSprinklers, 2),
                        detail: "ft (diagonal ÷ 2)",
                      },
                    ]
                  : [
                      {
                        label: "Results",
                        value: "—",
                        detail: "Enter a non-negative diagonal length.",
                      },
                    ]
              }
            />
          </Section>

          <Section
            title="Exit width (single story)"
            subtitle="Minimum required exit width from occupant load: × 0.20 in/person (without voice evacuation) and × 0.15 in/person (with sprinklers and voice evacuation), matching the prior worksheet layout."
          >
            <Field
              id="exitOl"
              label="Occupant load"
              value={exitOl}
              onChange={setExitOl}
              unit="persons"
            />
            <ResultTable
              rows={
                exitWidth
                  ? [
                      {
                        label: "Without voice evacuation",
                        value: fmt(exitWidth.noVoiceIn, 2),
                        detail: `in (OL × 0.20) · ${fmt(exitWidth.noVoiceFt, 2)} ft`,
                      },
                      {
                        label: "With sprinklers + voice evacuation",
                        value: fmt(exitWidth.voiceIn, 2),
                        detail: `in (OL × 0.15) · ${fmt(exitWidth.voiceFt, 2)} ft`,
                      },
                    ]
                  : [
                      {
                        label: "Results",
                        value: "—",
                        detail: "Enter a non-negative occupant load.",
                      },
                    ]
              }
            />
          </Section>

          <p className="text-center text-xs text-zinc-500 dark:text-zinc-500">
            Deploy on Vercel from the <code className="rounded bg-zinc-200 px-1 py-0.5 dark:bg-zinc-800">calculator-web</code>{" "}
            folder. Sheet2–3 in the workbook are empty in the source Excel file.
          </p>
        </div>
      </div>
    </div>
  );
}
