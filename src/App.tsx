import { useMemo, useState, FormEvent } from "react";

/* ========================================================================
   TĚLESNÝ ZÁPIS — Webová aplikace pro zápis z hodiny TV
   - Odesílá JSON na Google Apps Script Web App
   - Ošetřená logika pro "jiné / other" ve všech polích
   ======================================================================== */

/** === CONFIG: your Apps Script Web App URL === */
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxkGwelTvzfJNaojdrPmkm_PhzaqhoBi3rzKxyKfM5moDp_2jgu7K31rq7RSOCbUEjv/exec";

/* ===================== DATOVÉ TYPY A POMOCNÉ STRUKTURY ===================== */

type Option = { value: string; label: string };

type SchoolId = "LA" | "HE" | "MO" | "LO" | "ZE" | "RU" | "LY" | "PL" | "VEP";

type School = {
  id: SchoolId;
  name: string;
};

const schools: School[] = [
  { id: "LA", name: "ZŠ Laudova" },
  { id: "HE", name: "ZŠ Heřmánkova" },
  { id: "MO", name: "ZŠ Mohylová" },
  { id: "LO", name: "ZŠ Lobkovicovo náměstí" },
  { id: "ZE", name: "ZŠ Žernosecká" },
  { id: "RU", name: "ZŠ Ruská" },
  { id: "LY", name: "ZŠ Lýskova" },
  { id: "PL", name: "ZŠ Plamínkové" },
  { id: "VEP", name: "ZŠ Věry Čáslavské" },
];

const classOptions: Option[] = ["3A", "3B", "3C", "3D", "3E", "3F"].map(
  (c) => ({ value: c, label: c })
);

const placeOptions: Option[] = [
  { value: "telocvicna", label: "Tělocvična" },
  { value: "venku", label: "Venkovní hřiště" },
  { value: "jine", label: "Jiné (doplňte)" },
];

const warmupOptions: Option[] = [
  { value: "volna_hra", label: "Volná hra" },
  { value: "behaci_hry", label: "Běhací / honičky" },
  { value: "protažení", label: "Protažení" },
  { value: "poskoky", label: "Poskoky / rozcvička" },
  { value: "jine", label: "Jiný typ (doplňte do popisu hodiny)" },
];

const characterOptions: Option[] = [
  { value: "rozvoj", label: "Rozvoj dovednosti" },
  { value: "zpevnovani", label: "Zpevňování / upevňování" },
  { value: "opakovani", label: "Opakování / upevňování v hře" },
  { value: "souteze", label: "Soutěže / hra" },
];

const areaOptions: Option[] = [
  { value: "gymnastika", label: "Gymnastika" },
  { value: "atletika", label: "Atletika" },
  { value: "mice", label: "Míčové hry" },
  { value: "hry", label: "Pohybové hry" },
  { value: "tanec", label: "Taneční / rytmická" },
  { value: "kondice", label: "Kondiční cvičení" },
  { value: "other", label: "Jiná oblast (doplňte)" },
];

const disciplineOptionsByArea: Record<string, Option[]> = {
  gymnastika: [
    { value: "kotoul_vpred", label: "Kotoul vpřed" },
    { value: "stoj_na_lopech", label: "Stoj na čtyřech, vzpor" },
    { value: "různe_sestavy", label: "Jednoduché sestavy" },
    { value: "other", label: "Jiná gymnastická disciplína" },
  ],
  atletika: [
    { value: "beh", label: "Běh" },
    { value: "skok_daleka", label: "Skok daleký" },
    { value: "hod_micem", label: "Hod míčkem / vrh" },
    { value: "other", label: "Jiná atletická disciplína" },
  ],
  mice: [
    { value: "basketbal", label: "Basketbal" },
    { value: "fotbal", label: "Fotbal" },
    { value: "volejbal", label: "Volejbal" },
    { value: "florbal", label: "Florbal" },
    { value: "other", label: "Jiná míčová disciplína" },
  ],
  hry: [
    { value: "pohybova_hra", label: "Pohybová hra" },
    { value: "pravidla_hry", label: "Nácvik pravidel hry" },
    { value: "other", label: "Jiná hra" },
  ],
  tanec: [
    { value: "tanecni_kroky", label: "Základní taneční kroky" },
    { value: "sestava", label: "Jednoduchá sestava" },
    { value: "other", label: "Jiná taneční činnost" },
  ],
  kondice: [
    { value: "kruhovy_trenink", label: "Kruhový trénink" },
    { value: "posilovani", label: "Posilování s vlastním tělem" },
    { value: "obratnost", label: "Obratnost / koordinace" },
    { value: "other", label: "Jiná kondiční činnost" },
  ],
};

const focusOptionsByDiscipline: Record<string, Option[]> = {
  // gymnastika
  kotoul_vpred: [
    { value: "nacvik_kotoulu", label: "Nácvik kotoulu" },
    { value: "navazovani", label: "Navazování více kotoulů" },
    { value: "bezpecnost", label: "Bezpečné provedení" },
    { value: "other", label: "Jiná činnost" },
  ],
  // atletika
  beh: [
    { value: "technika_beh", label: "Technika běhu" },
    { value: "rychlost", label: "Rychlost" },
    { value: "vytrvalost", label: "Vytrvalost" },
    { value: "other", label: "Jiná činnost" },
  ],
  skok_daleka: [
    { value: "odraz", label: "Odraz" },
    { value: "rozbeh", label: "Rozběh" },
    { value: "dopad", label: "Dopad" },
    { value: "other", label: "Jiná činnost" },
  ],
  hod_micem: [
    { value: "technika_hodu", label: "Technika hodu" },
    { value: "rozbeh_hod", label: "Rozběh + hod" },
    { value: "other", label: "Jiná činnost" },
  ],

  // míčové – příklady:
  basketbal: [
    { value: "driblovani", label: "Driblování" },
    { value: "prihravky", label: "Přihrávky" },
    { value: "strelba", label: "Střelba" },
    { value: "hra", label: "Hra" },
    { value: "other", label: "Jiná činnost" },
  ],
  fotbal: [
    { value: "vedeni_mice", label: "Vedení míče" },
    { value: "prihravky", label: "Přihrávky" },
    { value: "strela", label: "Střela na bránu" },
    { value: "hra", label: "Hra" },
    { value: "other", label: "Jiná činnost" },
  ],
  volejbal: [
    { value: "odbiti_spodem", label: "Odbití spodem" },
    { value: "odbiti_vrchem", label: "Odbití vrchem" },
    { value: "podani", label: "Podání" },
    { value: "hra", label: "Hra" },
    { value: "other", label: "Jiná činnost" },
  ],
  florbal: [
    { value: "vedeni_micku", label: "Vedení míčku" },
    { value: "prihravky", label: "Přihrávky" },
    { value: "strela", label: "Střelba" },
    { value: "hra", label: "Hra" },
    { value: "other", label: "Jiná činnost" },
  ],

  // obecné fallbacky – pokud nějaká disciplína nebude výše
  pohybova_hra: [
    { value: "pravidla", label: "Pravidla" },
    { value: "spoluprace", label: "Spolupráce" },
    { value: "other", label: "Jiná činnost" },
  ],
};

/* ============================ HLAVNÍ KOMPONENTA ============================ */

export default function App() {
  // Meta info
  const [schoolType, setSchoolType] = useState<"" | "tandem5" | "tandem2" | "notandem">("");
  const [schoolId, setSchoolId] = useState<SchoolId | "">("");
  const [teacher, setTeacher] = useState("");
  const [classId, setClassId] = useState("");
  const [place, setPlace] = useState("");
  const [placeOther, setPlaceOther] = useState("");

  // Úvod / zahřátí
  const [warmup, setWarmup] = useState("");

  // Hlavní část
  const [area, setArea] = useState("");
  const [areaOther, setAreaOther] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [discOther, setDiscOther] = useState("");
  const [focus, setFocus] = useState("");
  const [focusOther, setFocusOther] = useState("");

  const [character, setCharacter] = useState("");
  const [leader, setLeader] = useState("");
  const [isLeaderLockedToTeacher, setIsLeaderLockedToTeacher] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* --------------------------- Dynamické volby --------------------------- */

  const disciplineOptions = useMemo<Option[]>(() => {
    if (!area || area === "other") return [];
    return disciplineOptionsByArea[area] ?? [];
  }, [area]);

  const focusOptions = useMemo<Option[]>(() => {
    if (!discipline || discipline === "other") return [];
    return focusOptionsByDiscipline[discipline] ?? [
      { value: "other", label: "Jiná činnost (doplňte)" },
    ];
  }, [discipline]);

  /* ------------------------------ Validace ------------------------------ */

  const isMainFilled =
    (() => {
      // 1) Není vybraná oblast → ne
      if (!area) return false;

      // 2) Jiná oblast (other) – používáme čistě textová pole
      if (area === "other") {
        return !!areaOther.trim() && !!discOther.trim() && !!focusOther.trim();
      }

      // 3) Standardní oblast, ale není disciplína → ne
      if (!discipline) return false;

      // 4) Jiná disciplína (other) – musí být dopsaná disciplína i popis činnosti
      if (discipline === "other") {
        return !!discOther.trim() && !!focusOther.trim();
      }

      // 5) Standardní disciplína:
      //    - musí být vybraný "focus"
      //    - pokud je focus === "other", musí být doplněn text
      if (!focus) return false;
      if (focus === "other") return !!focusOther.trim();

      return true;
    })();

  const canSubmit =
    !!schoolType &&
    !!schoolId &&
    !!teacher.trim() &&
    !!classId &&
    !!place &&
    (place !== "jine" ? true : !!placeOther.trim()) &&
    !!warmup &&
    isMainFilled &&
    !!character &&
    (!!leader.trim() || isLeaderLockedToTeacher);

  /* -------------------------- Helper pro texty -------------------------- */

  const currentSchoolName = useMemo(() => {
    const s = schools.find((x) => x.id === schoolId);
    return s?.name ?? "";
  }, [schoolId]);

  const placeLabel = useMemo(() => {
    const opt = placeOptions.find((p) => p.value === place);
    if (opt?.value === "jine") {
      return placeOther.trim() || "(jiné místo – prázdné)";
    }
    return opt?.label ?? "";
  }, [place, placeOther]);

  const mainSummary = useMemo(() => {
    if (!area) return "Hlavní část zatím není vyplněna.";
    if (area === "other") {
      return `${areaOther || "(jiná oblast – prázdná)"} — ${
        discOther || "(jiná disciplína – prázdná)"
      } — ${focusOther || "(jiná činnost – prázdná)"}`;
    }

    const areaLabel =
      areaOptions.find((a) => a.value === area)?.label ?? area;

    let disciplineLabel = "";
    if (discipline === "other") {
      disciplineLabel = discOther || "(jiná disciplína – prázdná)";
    } else {
      disciplineLabel =
        disciplineOptions.find((d) => d.value === discipline)?.label ??
        discipline;
    }

    let focusLabel = "";
    if (area === "other" || discipline === "other" || focus === "other") {
      focusLabel = focusOther || "(jiná činnost – prázdná)";
    } else {
      focusLabel =
        focusOptions.find((f) => f.value === focus)?.label ?? focus;
    }

    return `${areaLabel} — ${disciplineLabel} — ${focusLabel}`;
  }, [
    area,
    areaOther,
    discipline,
    discOther,
    focus,
    focusOther,
    areaOptions,
    disciplineOptions,
    focusOptions,
  ]);

  /* ------------------------------ Odeslání ------------------------------ */

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitMessage(null);
    setSubmitError(null);

    if (!canSubmit) {
      setSubmitError("Formulář není kompletně vyplněn.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Hodnota pro uložení do Sheets (včetně "other" textů)
      const areaValueForSheet =
        area === "other" ? `other: ${areaOther.trim()}` : area;

      const disciplineValueForSheet =
        discipline === "other"
          ? `other: ${discOther.trim()}`
          : discipline;

      const focusValueForSheet =
        area === "other" || discipline === "other" || focus === "other"
          ? `other: ${focusOther.trim()}`
          : focus;

      const payload = {
        schoolType,
        schoolId,
        teacher: teacher.trim(),
        classId,
        place,
        placeOther: place === "jine" ? placeOther.trim() : "",
        warmup,
        area: areaValueForSheet,
        discipline: disciplineValueForSheet,
        disciplineOther: discipline === "other" ? discOther.trim() : "",
        focus: focusValueForSheet,
        focusOther:
          area === "other" || discipline === "other" || focus === "other"
            ? focusOther.trim()
            : "",
        character,
        leader: isLeaderLockedToTeacher ? teacher.trim() : leader.trim(),
      };

      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok) {
        throw new Error(
          data?.error || `Chyba při odesílání (HTTP ${res.status})`
        );
      }

      setSubmitMessage("Záznam byl úspěšně uložen.");
      // případně zde můžete formulář vyčistit (pokud chcete)
      // resetForm();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err?.message || "Došlo k chybě při odesílání.");
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ------------------------------- RENDER ------------------------------- */

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">
          Zápis z hodiny tělesné výchovy
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Vyplňte základní údaje, strukturu hodiny a uložte záznam do tabulky
          Google Sheets. Pole „Jiná / Other“ jsou nyní plně podporovaná.
        </p>

        <form
          onSubmit={handleSubmit}
          className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] gap-6 items-start"
        >
          {/* ------------------------ LEVÝ SLOUPEC: FORM ------------------------ */}
          <section className="space-y-4 bg-white rounded-xl shadow p-4 md:p-5">
            {/* Typ školy / tandem */}
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Typ školy / režim
                </label>
                <select
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={schoolType}
                  onChange={(e) =>
                    setSchoolType(
                      e.target.value as "" | "tandem5" | "tandem2" | "notandem"
                    )
                  }
                >
                  <option value="">Vyberte</option>
                  <option value="tandem5">Tandem 5× týdně</option>
                  <option value="tandem2">Tandem 2× týdně</option>
                  <option value="notandem">Bez tandemu</option>
                </select>
              </div>

              {/* Škola */}
              <div>
                <label className="block text-sm font-medium mb-1">Škola</label>
                <select
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value as SchoolId)}
                >
                  <option value="">Vyberte</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Třída */}
              <div>
                <label className="block text-sm font-medium mb-1">Třída</label>
                <select
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                >
                  <option value="">Vyberte</option>
                  {classOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Učitel + vedoucí hodiny */}
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Učitel / učitelka
                </label>
                <input
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={teacher}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTeacher(val);
                    if (isLeaderLockedToTeacher) {
                      setLeader(val);
                    }
                  }}
                  placeholder="Jméno a příjmení"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  Vedoucí hodiny
                  <span className="text-xs text-slate-500">
                    (lze odpojit od učitele)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 border rounded-md px-2 py-1 text-sm"
                    value={leader}
                    onChange={(e) => setLeader(e.target.value)}
                    disabled={isLeaderLockedToTeacher}
                    placeholder="Jméno a příjmení"
                  />
                  <label className="inline-flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={isLeaderLockedToTeacher}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsLeaderLockedToTeacher(checked);
                        if (checked) setLeader(teacher);
                      }}
                    />
                    <span>stejný jako učitel</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Místo + zahřátí */}
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Místo</label>
                <select
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                >
                  <option value="">Vyberte</option>
                  {placeOptions.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {place === "jine" && (
                  <input
                    className="mt-1 w-full border rounded-md px-2 py-1 text-sm"
                    value={placeOther}
                    onChange={(e) => setPlaceOther(e.target.value)}
                    placeholder="Upřesněte místo"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Úvod / zahřátí
                </label>
                <select
                  className="w-full border rounded-md px-2 py-1 text-sm"
                  value={warmup}
                  onChange={(e) => setWarmup(e.target.value)}
                >
                  <option value="">Vyberte</option>
                  {warmupOptions.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Hlavní část – oblast / disciplína / zaměření */}
            <div className="border-t pt-4 mt-2 space-y-3">
              <h2 className="font-semibold text-sm">Hlavní část hodiny</h2>

              {/* Oblast */}
              <div className="grid md:grid-cols-[2fr_2fr] gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Oblast
                  </label>
                  <select
                    className="w-full border rounded-md px-2 py-1 text-sm"
                    value={area}
                    onChange={(e) => {
                      const val = e.target.value;
                      setArea(val);
                      // reset podřízených polí
                      setDiscipline("");
                      setDiscOther("");
                      setFocus("");
                      setFocusOther("");
                    }}
                  >
                    <option value="">Vyberte</option>
                    {areaOptions.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                  {area === "other" && (
                    <input
                      className="mt-1 w-full border rounded-md px-2 py-1 text-sm"
                      value={areaOther}
                      onChange={(e) => setAreaOther(e.target.value)}
                      placeholder="Doplňte oblast (např. bruslení, plavání...)"
                    />
                  )}
                </div>

                {/* Disciplína */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Disciplína / hlavní činnost
                  </label>
                  {area && area !== "other" ? (
                    <select
                      className="w-full border rounded-md px-2 py-1 text-sm"
                      value={discipline}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDiscipline(val);
                        setDiscOther("");
                        setFocus("");
                        setFocusOther("");
                      }}
                    >
                      <option value="">Vyberte</option>
                      {disciplineOptions.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="w-full border rounded-md px-2 py-1 text-sm"
                      value={discOther}
                      onChange={(e) => setDiscOther(e.target.value)}
                      placeholder="Doplňte disciplínu / činnost"
                    />
                  )}
                  {discipline === "other" && (
                    <input
                      className="mt-1 w-full border rounded-md px-2 py-1 text-sm"
                      value={discOther}
                      onChange={(e) => setDiscOther(e.target.value)}
                      placeholder="Doplňte disciplínu"
                    />
                  )}
                </div>
              </div>

              {/* Zaměření */}
              <div className="grid md:grid-cols-[2fr_2fr] gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Konkrétní zaměření / dovednost
                  </label>
                  {area && area !== "other" && discipline && discipline !== "other" ? (
                    <select
                      className="w-full border rounded-md px-2 py-1 text-sm"
                      value={focus}
                      onChange={(e) => setFocus(e.target.value)}
                    >
                      <option value="">Vyberte</option>
                      {focusOptions.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                      <option value="other">Jiná (doplňte ručně)</option>
                    </select>
                  ) : (
                    <input
                      className="w-full border rounded-md px-2 py-1 text-sm"
                      value={focusOther}
                      onChange={(e) => setFocusOther(e.target.value)}
                      placeholder="Doplňte konkrétní zaměření"
                    />
                  )}
                  {(focus === "other" ||
                    area === "other" ||
                    discipline === "other") && (
                    <input
                      className="mt-1 w-full border rounded-md px-2 py-1 text-sm"
                      value={focusOther}
                      onChange={(e) => setFocusOther(e.target.value)}
                      placeholder="Doplňte zaměření / činnost"
                    />
                  )}
                </div>

                {/* Charakter hodiny */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Charakter hodiny
                  </label>
                  <select
                    className="w-full border rounded-md px-2 py-1 text-sm"
                    value={character}
                    onChange={(e) => setCharacter(e.target.value)}
                  >
                    <option value="">Vyberte</option>
                    {characterOptions.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Odeslání */}
            <div className="pt-2 border-t mt-4 flex items-center justify-between gap-3">
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                  canSubmit && !isSubmitting
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-slate-400 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? "Odesílám…" : "Odeslat do tabulky"}
              </button>

              {submitMessage && (
                <span className="text-xs text-emerald-600">{submitMessage}</span>
              )}
              {submitError && (
                <span className="text-xs text-red-600">{submitError}</span>
              )}
            </div>
          </section>

          {/* ------------------------ PRAVÝ SLOUPEC: NÁHLED ------------------------ */}
          <section className="space-y-3">
            <div className="bg-white rounded-xl shadow p-4 md:p-5 text-sm space-y-2">
              <h2 className="font-semibold mb-2">Náhled záznamu</h2>
              <p>
                <span className="font-medium">Škola: </span>
                {currentSchoolName || "(nevyplněno)"} —{" "}
                <span className="font-medium">Třída: </span>
                {classId || "(nevyplněno)"}
              </p>
              <p>
                <span className="font-medium">Místo: </span>
                {placeLabel || "(nevyplněno)"}
              </p>
              <p>
                <span className="font-medium">Učitel: </span>
                {teacher || "(nevyplněno)"}{" "}
                <span className="font-medium"> | Vedoucí hodiny: </span>
                {leader || "(nevyplněno)"}
              </p>
              <p>
                <span className="font-medium">Hlavní část: </span>
                {mainSummary}
              </p>
              <p>
                <span className="font-medium">Charakter hodiny: </span>
                {character || "(nevyplněno)"}
              </p>
            </div>

            <div className="text-xs text-slate-500">
              <p>
                Poznámka: Při volbě „Jiná / Other“ (oblast, disciplína,
                zaměření, místo) se text doplněný do políčka uloží do Google
                Sheets – odesílání je nyní povolené pro všechny kombinace
                „other“.
              </p>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}
