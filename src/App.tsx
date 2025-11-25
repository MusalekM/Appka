import { useMemo, useState } from "react";

/* ========================================================================
   TĚLESNÝ ZÁPIS — PROTOTYP (with fixed Apps Script POST)
   ======================================================================== */

/** === CONFIG: your Apps Script Web App URL === */
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxkGwelTvzfJNaojdrPmkm_PhzaqhoBi3rzKxyKfM5moDp_2jgu7K31rq7RSOCbUEjv/exec";

/* ===================== ZÁKLADNÍ DATOVÉ TYPY A POMOCNÉ LABELY ===================== */

type SchoolId = "LA" | "HE" | "MO" | "LO" | "ZE" | "RU" | "LY" | "PL" | "VEP";

type School = {
  id: SchoolId;
  name: string;
  teachers: string[];
};

const ALL_SCHOOLS: School[] = [
  { id: "LA",  name: "ZŠ Laštůvkova",          teachers: ["LAPeštálová","LAŠebková","LABuršíková","LAKašpárková"] },
  { id: "HE",  name: "ZŠ Heyrovského",         teachers: ["HEKročilová","HEStudená"] },
  { id: "MO",  name: "ZŠ Mohelnice",           teachers: ["MOZeman"] },
  { id: "LO",  name: "ZŠ Lomnice",             teachers: ["LOHyánková"] },
  { id: "ZE",  name: "ZŠ Žernosecká",          teachers: ["ZETvrdá"] },
  { id: "RU",  name: "ZŠ Rudná",               teachers: ["RUučitelA","RUučitelB"] },
  { id: "LY",  name: "ZŠ Lyčkovo náměstí",     teachers: ["LYučitelA","LYučitelB"] },
  { id: "PL",  name: "ZŠ Plzeň",               teachers: ["PLučitelA","PLučitelB"] },
  { id: "VEP", name: "ZŠ Velké Popovice",      teachers: ["VEPučitel"] },
];

// Mapa: typ školy → povolené školy
const SCHOOLS_BY_TYPE: Record<"" | "tandem5" | "tandem2" | "notandem", SchoolId[]> = {
  "": [],
  tandem5: ["LA","HE"],
  tandem2: ["MO","LO","ZE"],
  notandem: ["RU","LY","PL","VEP"],
};

/* --- Hlavní část: výčty pro oblasti / disciplíny / obsahy --- */

// 1) SPORTOVNÍ HRY
const GAMES = [
  "hazena","fotbal","basketbal","vybijena","med","rele","jine_hry",
] as const;
type Game = typeof GAMES[number];

const GAME_LABEL: Record<Game,string> = {
  hazena:     "Házená / pohazování míčem",
  fotbal:     "Fotbal",
  basketbal:  "Basketbal",
  vybijena:   "Vybíjená",
  med:        "Medvědí / pronásledovací hry",
  rele:       "Štafety",
  jine_hry:   "Jiné hry",
};

const GAME_CONTENT: Record<Game, { value: string; label: string }[]> = {
  hazena: [
    { value: "prihravky",         label: "Přihrávky (obě ruce, jedna ruka)" },
    { value: "chytani",           label: "Chytání míče" },
    { value: "nahazovani_na_cil", label: "Nahazování na cíl" },
    { value: "hra",               label: "Hra (jednoduchá pravidla)" },
  ],
  fotbal: [
    { value: "vedeni_mice", label: "Vedení míče" },
    { value: "prihravky",   label: "Přihrávky" },
    { value: "strela",      label: "Střelba" },
    { value: "hra",         label: "Hra" },
  ],
  basketbal: [
    { value: "dribling",     label: "Dribling" },
    { value: "prihravky",    label: "Přihrávky" },
    { value: "strelba_kos",  label: "Střelba na koš" },
    { value: "hra",          label: "Hra" },
  ],
  vybijena: [
    { value: "hody_na_cil", label: "Hody na cíl / na protihráče" },
    { value: "chyby",       label: "Chytání míče" },
    { value: "hra",         label: "Hra" },
  ],
  med: [
    { value: "honicky", label: "Honěné hry" },
    { value: "schovky", label: "Hry na schovávanou / úkryty" },
  ],
  rele: [
    { value: "stafety_rovne", label: "Štafety v přímém směru" },
    { value: "stafety_preklady", label: "Štafety s předávkou" },
  ],
  jine_hry: [
    { value: "podle_popisu", label: "Dle popisu v poli 'Co se dělo'" },
  ],
};

// 2) ATLETIKA
const ATHLETICS = ["beh","skok","hod"] as const;
type Athletics = typeof ATHLETICS[number];

const ATHLETICS_LABEL: Record<Athletics,string> = {
  beh:  "Běh",
  skok: "Skok",
  hod:  "Hod / vrh",
};

const ATHLETICS_CONTENT: Record<Athletics,{ value: string; label: string }[]> = {
  beh: [
    { value: "rychlost",    label: "Rychlostní běh" },
    { value: "vytrvalost",  label: "Vytrvalostní běh" },
    { value: "prekazky",    label: "Běh přes překážky" },
  ],
  skok: [
    { value: "dalka", label: "Skok do dálky" },
    { value: "vyka",  label: "Skok do výšky (základní)" },
  ],
  hod: [
    { value: "micek", label: "Hod míčkem" },
    { value: "gulicka", label: "Vrh koulí (základní nácvik)" },
  ],
};

// 3) GYMNASTIKA
const GYM = ["kotoul","rovnovaha","visy"] as const;
type Gym = typeof GYM[number];

const GYM_LABEL: Record<Gym,string> = {
  kotoul:   "Kotouly a přemety (základy)",
  rovnovaha:"Rovnovážná cvičení",
  visy:     "Visy a hrazda",
};

const GYM_CONTENT: Record<Gym,{ value: string; label: string }[]> = {
  kotoul: [
    { value: "kotoul_vpred", label: "Kotoul vpřed" },
    { value: "kotoul_vzad",  label: "Kotoul vzad (základy)" },
  ],
  rovnovaha: [
    { value: "chuze_kladina", label: "Chůze po kladině / lavičce" },
    { value: "stoj",          label: "Stoj na jedné / jiná rovnováha" },
  ],
  visy: [
    { value: "vis_sed", label: "Vis, sed na hrazdě" },
    { value: "prirucky", label: "Příručky (přitahy)" },
  ],
};

// 4) ÚPOLY
const UPOLY = ["sparing","tahani","prehazovani"] as const;
type Upoly = typeof UPOLY[number];

const UPOLY_LABEL: Record<Upoly,string> = {
  sparing:     "Jednoduché úpolové hry / sparing",
  tahani:      "Tahání a přetahování",
  prehazovani: "Přetlačování / přehazování",
};

const UPOLY_CONTENT: Record<Upoly,{ value: string; label: string }[]> = {
  sparing: [
    { value: "postoj",  label: "Základní postoj" },
    { value: "uchopy",  label: "Základní úchopy" },
  ],
  tahani: [
    { value: "preprene", label: "Přetahovaná" },
    { value: "tahani",   label: "Tahání partnera" },
  ],
  prehazovani: [
    { value: "tlaceni", label: "Přetlačování" },
  ],
};

/* ===================== CHARAKTER A ÚVOD ===================== */

const CHARACTERS = [
  { value: "rozvoj",    label: "Rozvoj dovednosti" },
  { value: "upevneni",  label: "Upevnění / nácvik" },
  { value: "aplikace",  label: "Aplikace ve hře" },
  { value: "soutez",    label: "Soutěž / hra" },
];

const WARMUPS = [
  { value: "volna_hra", label: "Volná hra" },
  { value: "behaci",    label: "Běhací / honičky" },
  { value: "prota",     label: "Protažení" },
  { value: "jine",      label: "Jiné (doplňte v popisu)" },
];

/* ===================== HLAVNÍ KOMPONENTA ===================== */

export default function App() {
  const [date] = useState(() => new Date().toISOString());

  /* --- Identifikace školy / učitele --- */
  const [schoolType, setSchoolType] = useState<"" | "tandem5" | "tandem2" | "notandem">("");
  const [schoolId,   setSchoolId]     = useState<"" | SchoolId>("");
  const [teacher,    setTeacher]      = useState("");
  const [classId,    setClassId]      = useState("");
  const [place,      setPlace]        = useState<"tělocvična"|"hřiště"|"venku"|"jiné"|"">("");
  const [placeOther, setPlaceOther]   = useState("");
  const [warmup, setWarmup] = useState("");

  /* --- Hlavní část --- */
  const AREAS = ["sportovni_hry","atletika","gymnastika","upoly"] as const;
  type Area = typeof AREAS[number];
  const AREA_LABEL: Record<Area,string> = {
    sportovni_hry: "Sportovní hry",
    atletika:      "Atletika",
    gymnastika:    "Gymnastika",
    upoly:         "Úpoly",
  };

  const [area,       setArea]       = useState<"" | Area | "other">("");
  const [areaOther,  setAreaOther]  = useState("");
  const [discipline, setDiscipline] = useState("");
  const [discOther,  setDiscOther]  = useState("");
  const [focus,      setFocus]      = useState("");
  const [focusOther, setFocusOther] = useState("");
  const [character,  setCharacter]  = useState("");

  /* --- Vedoucí hodiny --- */
  const [leader, setLeader] = useState<"" | "ucitel" | "druhy_ucitel">("");

  /* --- Odvozené seznamy --- */
  const filteredSchools = useMemo(() => {
    if (!schoolType) return [];
    const allowed = SCHOOLS_BY_TYPE[schoolType];
    return ALL_SCHOOLS.filter((s) => allowed.includes(s.id));
  }, [schoolType]);

  const teacherOptions = useMemo(() => {
    if (!schoolId) return [];
    return ALL_SCHOOLS.find((s) => s.id === schoolId)?.teachers ?? [];
  }, [schoolId]);

  const isLeaderLockedToTeacher = schoolType === "notandem";

  /* --- Odvozené (Hlavní část) — seznam disciplín dle zvolené oblasti --- */
  const disciplineOptions = useMemo(() => {
    if (area === "other" || !area) return [];
    switch (area) {
      case "sportovni_hry": return GAMES.map(g => ({ value: g, label: GAME_LABEL[g] }));
      case "atletika":      return ATHLETICS.map(a => ({ value: a, label: ATHLETICS_LABEL[a] }));
      case "gymnastika":    return GYM.map(g => ({ value: g, label: GYM_LABEL[g] }));
      case "upoly":         return UPOLY.map(u => ({ value: u, label: UPOLY_LABEL[u] }));
      default:              return [];
    }
  }, [area]);

  /* --- Odvozené (Hlavní část) — seznam zaměření dle disciplíny --- */
  const focusOptions = useMemo(() => {
    if (!discipline || area === "other") return [];
    if (discipline === "other") return [];
    switch (area) {
      case "sportovni_hry":
        return GAME_CONTENT[discipline as Game] ?? [];
      case "atletika":
        return ATHLETICS_CONTENT[discipline as Athletics] ?? [];
      case "gymnastika":
        return GYM_CONTENT[discipline as Gym] ?? [];
      case "upoly":
        return UPOLY_CONTENT[discipline as Upoly] ?? [];
      default:
        return [];
    }
  }, [area, discipline]);

  /* --- Reset závislostí při změnách --- */
  const onChangeSchoolType = (val: "" | "tandem5" | "tandem2" | "notandem") => {
    setSchoolType(val);
    setSchoolId("");
    setTeacher("");
    if (val === "notandem") setLeader("ucitel");
    else setLeader("");
  };

  const onChangeArea = (val: "" | Area | "other") => {
    setArea(val);
    setAreaOther("");
    setDiscipline("");
    setDiscOther("");
    setFocus("");
    setFocusOther("");
    setCharacter("");
  };

  const onChangeDiscipline = (val: string) => {
    setDiscipline(val);
    setDiscOther("");
    setFocus("");
    setFocusOther("");
    setCharacter("");
  };

  const onChangeFocus = (val: string) => {
    setFocus(val);
    if (val !== "other") setFocusOther("");
  };

  /* --- Utility pro labely do náhledu --- */
  const schoolLabel = (id: string) => ALL_SCHOOLS.find(s => s.id === id)?.name ?? "";

  const areaLabel = (a: typeof area, other: string): string => {
    if (!a) return "";
    if (a === "other") return other || "(jiná oblast – prázdná)";
    return AREA_LABEL[a as Area] ?? String(a);
  };

  const disciplineLabel = (a: typeof area, d: string, dOther: string): string => {
    if (!a || !d) return "";
    if (d === "other") return dOther || "(jiná disciplína – prázdná)";
    switch (a) {
      case "sportovni_hry":
        return GAME_LABEL[d as Game] ?? d;
      case "atletika":
        return ATHLETICS_LABEL[d as Athletics] ?? d;
      case "gymnastika":
        return GYM_LABEL[d as Gym] ?? d;
      case "upoly":
        return UPOLY_LABEL[d as Upoly] ?? d;
      default:
        return d;
    }
  };

  const focusLabel = (
    a: typeof area,
    d: typeof discipline,
    f: string,
    fOther: string
  ): string => {
    if (!a) return "";
    if (a === "other" || d === "other" || f === "other") return fOther || "(jiná činnost – prázdná)";
    const list =
      a === "sportovni_hry" ? GAME_CONTENT[d as Game] :
      a === "atletika"      ? ATHLETICS_CONTENT[d as Athletics] :
      a === "gymnastika"    ? GYM_CONTENT[d as Gym] :
      a === "upoly"         ? UPOLY_CONTENT[d as Upoly] : [];
    return list.find(x => x.value === f)?.label ?? f;
  };

  /* --- Validace odeslání --- */
  const isMainFilled = (() => {
    // 1) Bez oblasti nelze odeslat
    if (!area) return false;

    // 2) Oblast = "jiná oblast" – jedeme čistě přes textová pole
    if (area === "other") {
      return !!areaOther.trim() && !!discOther.trim() && !!focusOther.trim();
    }

    // 3) Standardní oblast, ale není vybraná disciplína
    if (!discipline) return false;

    // 4) Disciplína = "jiná disciplína" – musí být doplněna disciplína i zaměření
    if (discipline === "other") {
      return !!discOther.trim() && !!focusOther.trim();
    }

    // 5) Běžná disciplína:
    //    - musí být vybrané zaměření (focus)
    //    - pokud je focus = "other", musí být doplněno textové zaměření
    if (!focus) return false;
    if (focus === "other") return !!focusOther.trim();

    return true;
  })();

  const canSubmit =
    !!schoolType &&
    !!schoolId &&
    !!teacher &&
    !!classId &&
    !!place &&
    (place !== "jiné" ? true : !!placeOther.trim()) &&
    !!warmup &&
    isMainFilled &&
    !!character &&
    (isLeaderLockedToTeacher ? !!teacher : !!leader);

  /* --- Odeslání --- */
  const handleSubmit = async () => {
    if (!canSubmit) {
      alert("Formulář není kompletně vyplněn.");
      return;
    }

    const payload = {
      schoolType,
      schoolId,
      teacher,
      classId,
      place,
      placeOther,
      warmup,
      area,
      discipline,
      disciplineOther: discOther,
      focus,
      focusOther,
      character,
      leader,
      date,
    };

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) {
        console.error("Apps Script error:", data);
        alert("⚠️ Apps Script vrátil chybu: " + (data.error || "neznámá chyba"));
      } else {
        alert("✅ Záznam byl uložen do Google Sheet.");
      }
    } catch (error) {
      console.error("Chyba při odesílání:", error);
      alert("❌ Nepodařilo se odeslat data. Zkontrolujte připojení nebo Google Script.");
    }
  };

  /* ===================== UI ===================== */

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold">Tělesný zápis</h1>
          <span className="text-xs text-gray-500">prototyp • {new Date(date).toLocaleString?.("cs-CZ") || date}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========== Levý sloupec – FORMULÁŘ ========== */}
        <section className="bg-white rounded-lg shadow border p-4 space-y-6">
          {/* Identifikace */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Identifikace hodiny</h2>

            <div className="grid md:grid-cols-2 gap-3">
              {/* Typ školy */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Typ školy / režim TV
                </label>
                <select
                  className="w-full border rounded p-2"
                  value={schoolType}
                  onChange={(e) => onChangeSchoolType(e.target.value as any)}
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
                  className="w-full border rounded p-2"
                  value={schoolId}
                  onChange={(e) => {
                    setSchoolId(e.target.value as SchoolId);
                    setTeacher("");
                  }}
                >
                  <option value="">Vyberte</option>
                  {filteredSchools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Učitel + třída */}
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-sm font-medium mb-1">Učitel</label>
                <select
                  className="w-full border rounded p-2"
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  disabled={!schoolId}
                >
                  <option value="">Vyberte</option>
                  {teacherOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Třída</label>
                <select
                  className="w-full border rounded p-2"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                >
                  <option value="">Vyberte</option>
                  <option value="3A">3.A</option>
                  <option value="3B">3.B</option>
                  <option value="3C">3.C</option>
                  <option value="3D">3.D</option>
                  <option value="3E">3.E</option>
                  <option value="3F">3.F</option>
                </select>
              </div>
            </div>

            {/* Místo a úvod */}
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-sm font-medium mb-1">Místo</label>
                <select
                  className="w-full border rounded p-2"
                  value={place}
                  onChange={(e) => setPlace(e.target.value as any)}
                >
                  <option value="">Vyberte</option>
                  <option value="tělocvična">Tělocvična</option>
                  <option value="hřiště">Hřiště</option>
                  <option value="venku">Venku</option>
                  <option value="jiné">Jiné</option>
                </select>
              </div>

              {place === "jiné" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Popis místa (jiné)</label>
                  <input
                    className="w-full border rounded p-2"
                    value={placeOther}
                    onChange={(e) => setPlaceOther(e.target.value)}
                    placeholder="Krátký popis místa"
                  />
                </div>
              )}
            </div>

            {/* Úvod / zahřátí */}
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">Úvod / zahřátí</label>
              <select
                className="w-full border rounded p-2"
                value={warmup}
                onChange={(e) => setWarmup(e.target.value)}
              >
                <option value="">Vyberte</option>
                {WARMUPS.map((w) => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hlavní část */}
          <div className="pt-4 border-t">
            <h2 className="text-lg font-semibold mb-3">Hlavní část hodiny</h2>

            {/* 1) Oblast */}
            <div>
              <label className="block text-sm font-medium mb-1">Oblast / sport</label>
              <select
                className="w-full border rounded p-2"
                value={area}
                onChange={(e) => onChangeArea(e.target.value as any)}
              >
                <option value="">Vyberte oblast</option>
                <option value="sportovni_hry">Sportovní hry</option>
                <option value="atletika">Atletika</option>
                <option value="gymnastika">Gymnastika</option>
                <option value="upoly">Úpoly</option>
                <option value="other">Jiná oblast (doplňte ručně)</option>
              </select>

              {area === "other" && (
                <input
                  className="mt-2 w-full border rounded p-2"
                  placeholder="Zadejte oblast / sport… (např. plavání, bruslení…)"
                  value={areaOther}
                  onChange={(e) => setAreaOther(e.target.value)}
                />
              )}
            </div>

            {/* 2) DISCIPLÍNA / HRA */}
            {area && (
              <>
                <label className="block text-sm font-medium mt-4 mb-1">
                  {area === "sportovni_hry" ? "Sportovní hra" :
                   area === "atletika"      ? "Atletická disciplína" :
                   area === "gymnastika"    ? "Gymnastická oblast" :
                   area === "upoly"         ? "Úpoly – oblast" :
                   "Disciplína / hra"}
                </label>

                {/* Pokud je zvolena jiná oblast, rovnou „jinou disciplínu“ (pole) */}
                {area === "other" ? (
                  <input
                    className="w-full border rounded p-2"
                    placeholder="Zadejte disciplínu / hru…"
                    value={discOther}
                    onChange={(e) => setDiscOther(e.target.value)}
                  />
                ) : (
                  <>
                    <select
                      className="w-full border rounded p-2"
                      value={discipline}
                      onChange={(e) => onChangeDiscipline(e.target.value)}
                    >
                      <option value="">Vyberte</option>
                      {disciplineOptions.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                      <option value="other">Jiná disciplína (doplňte ručně)</option>
                    </select>

                    {discipline === "other" && (
                      <input
                        className="mt-2 w-full border rounded p-2"
                        placeholder="Zadejte jinou disciplínu / hru…"
                        value={discOther}
                        onChange={(e) => setDiscOther(e.target.value)}
                      />
                    )}
                  </>
                )}
              </>
            )}

            {/* 2) CO SE DĚLO (ZAMĚŘENÍ) */}
            {(area && ((area === "other" && discOther.trim()) || (area !== "other" && discipline))) && (
              <>
                <label className="block text-sm font-medium mt-4 mb-1">Co se dělo (zaměření)</label>

                {(area === "other" || discipline === "other") ? (
                  <input
                    className="w-full border rounded p-2"
                    placeholder="Popište činnost / zaměření…"
                    value={focusOther}
                    onChange={(e) => setFocusOther(e.target.value)}
                  />
                ) : (
                  <>
                    <select
                      className="w-full border rounded p-2"
                      value={focus}
                      onChange={(e) => onChangeFocus(e.target.value)}
                    >
                      <option value="">Vyberte zaměření</option>
                      {focusOptions.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                      <option value="other">Jiná (doplňte ručně)</option>
                    </select>

                    {focus === "other" && (
                      <input
                        className="mt-2 w-full border rounded p-2"
                        placeholder="Doplňte zaměření / činnost…"
                        value={focusOther}
                        onChange={(e) => setFocusOther(e.target.value)}
                      />
                    )}
                  </>
                )}
              </>
            )}

            {/* 3) CHARAKTER ČINNOSTI */}
            {((area === "other" && discOther.trim() && focusOther.trim()) ||
              (area !== "other" && (
                (discipline === "other" && discOther.trim() && focusOther.trim()) ||
                (discipline && (focus === "other" ? focusOther.trim() : focus))
              ))) && (
              <>
                <label className="block text-sm font-medium mt-4 mb-1">Charakter činnosti</label>
                <select
                  className="w-full border rounded p-2"
                  value={character}
                  onChange={(e) => setCharacter(e.target.value)}
                >
                  <option value="">Vyberte</option>
                  {CHARACTERS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </>
            )}

            {/* 4) VEDOUCÍ HODINY */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Vedoucí hodiny</label>
              {isLeaderLockedToTeacher ? (
                <p className="text-sm text-gray-600">
                  U škol bez tandemu je vedoucí hodiny vždy{" "}
                  <strong>třídní učitel</strong> ({teacher || "zatím nevybrán"}).
                </p>
              ) : (
                <select
                  className="w-full border rounded p-2"
                  value={leader}
                  onChange={(e) => setLeader(e.target.value as any)}
                >
                  <option value="">Vyberte</option>
                  <option value="ucitel">Hlavní učitel</option>
                  <option value="druhy_ucitel">Druhý učitel (tandem)</option>
                </select>
              )}
            </div>
          </div>

          {/* Odeslání */}
          <div className="pt-4 border-t flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`px-4 py-2 rounded text-white text-sm font-semibold ${
                canSubmit ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Odeslat záznam do Google Sheets
            </button>

          {/* Optional diagnostic buttons */}
          <div className="mt-3 flex gap-2 text-xs">
            <a
              className="underline text-blue-600"
              href={`${APPS_SCRIPT_URL}?ping=1`}
              target="_blank" rel="noreferrer"
            >
              Test: ping
            </a>
            <a
              className="underline text-blue-600"
              href={`${APPS_SCRIPT_URL}?whoami=1`}
              target="_blank" rel="noreferrer"
              title="Ukáže, do jakého souboru se bude zapisovat"
            >
              Test: whoami
            </a>
          </div>
        </section>

        {/* ========== Pravý sloupec – NÁHLED ========== */}
        <aside className="bg-white rounded-lg shadow border p-4 space-y-3 text-sm">
          <h2 className="text-lg font-semibold mb-1">Náhled záznamu</h2>

          <div>
            <div><span className="font-semibold">Škola:</span> {schoolId ? schoolLabel(schoolId) : "–"}</div>
            <div><span className="font-semibold">Třída:</span> {classId || "–"}</div>
            <div><span className="font-semibold">Učitel:</span> {teacher || "–"}</div>
            <div>
              <span className="font-semibold">Vedoucí hodiny:</span>{" "}
              {isLeaderLockedToTeacher ? (teacher || "– (podle učitele)") : (leader || "–")}
            </div>
            <div><span className="font-semibold">Místo:</span> {place || "–"} {place === "jiné" && placeOther ? `(${placeOther})` : ""}</div>
            <div><span className="font-semibold">Úvod / zahřátí:</span> {warmup || "–"}</div>
          </div>

          <div className="border-t pt-2">
            <div className="font-semibold mb-1">Hlavní část</div>
            <div>
              <span className="font-semibold">Oblast:</span>{" "}
              {areaLabel(area, areaOther) || "–"}
            </div>
            <div>
              <span className="font-semibold">Disciplína / hra:</span>{" "}
              {disciplineLabel(area, discipline, discOther) || "–"}
            </div>
            <div>
              <span className="font-semibold">Co se dělo:</span>{" "}
              {focusLabel(area, discipline, focus, focusOther) || "–"}
            </div>
            <div>
              <span className="font-semibold">Charakter činnosti:</span>{" "}
              {character || "–"}
            </div>
          </div>

          <div className="border-t pt-2 text-xs text-gray-500 space-y-1">
            <p>
              Odeslán bude JSON na Apps Script (POST). Skript potom zapíše data do listu
              <code>Data</code> podle FIELD_ORDER (schoolType, schoolId, teacher, classId, place, placeOther, warmup, area, discipline, disciplineOther, focus, focusOther, character, leader).
            </p>
            <p>
              Pokud formulář nejde odeslat, zkontrolujte, že jsou vyplněny všechny povinné části:
              typ školy, škola, učitel, třída, místo, úvod, oblast, disciplína / hra, zaměření a charakter.
              Pro varianty „jiná oblast / disciplína / zaměření“ je potřeba vyplnit textová pole.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
