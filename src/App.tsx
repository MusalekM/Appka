import { useMemo, useState } from "react";

/* ========================================================================
   TĚLESNÝ ZÁPIS — PROTOTYP
   ======================================================================== */

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxkGwelTvzfJNaojdrPmkm_PhzaqhoBi3rzKxyKfM5moDp_2jgu7K31rq7RSOCbUEjv/exec";

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

const SCHOOLS_BY_TYPE: Record<"" | "tandem5" | "tandem2" | "notandem", SchoolId[]> = {
  "": [],
  tandem5: ["LA","HE"],
  tandem2: ["MO","LO","ZE"],
  notandem: ["RU","LY","PL","VEP"],
};

/* --- Hlavní část: výčty pro oblasti / disciplíny / obsahy --- */

const GAMES = [
  "fotbal","basketbal","florbal","vybijena","hazena","volejbal","hokejbal","korfbal",
] as const;
type Game = typeof GAMES[number];

const GAME_LABEL: Record<Game,string> = {
  fotbal:   "Fotbal",
  basketbal:"Basketbal",
  florbal:  "Florbal",
  vybijena: "Vybíjená",
  hazena:   "Házená",
  volejbal: "Volejbal",
  hokejbal: "Hokejbal",
  korfbal:  "Korfbal",
};

const GAME_CONTENT: Record<Game, { value: string; label: string }[]> = {
  fotbal: [
    { value: "prihravky", label: "Přihrávky" },
    { value: "strelba", label: "Střelba" },
    { value: "vedeni_mice", label: "Vedení míče" },
    { value: "obrana", label: "Obrana" },
    { value: "brankar", label: "Hra brankáře" },
    { value: "taktika", label: "Taktika / rozestavení" },
  ],
  basketbal: [
    { value: "dribling", label: "Dribling" },
    { value: "prihravky", label: "Přihrávky" },
    { value: "strelba", label: "Střelba" },
    { value: "obrana", label: "Obrana (individuální / zónová)" },
    { value: "pohyb_bez_mice", label: "Pohyb bez míče / uvolňování" },
    { value: "doskok", label: "Doskakování" },
  ],
  hazena: [
    { value: "prihravky", label: "Přihrávky" },
    { value: "strelba", label: "Střelba" },
    { value: "dribling", label: "Dribling" },
    { value: "obrana", label: "Obranná postavení" },
    { value: "pohyb_bez_mice", label: "Pohyb bez míče" },
  ],
  volejbal: [
    { value: "odbiti_spodem", label: "Odbití spodem" },
    { value: "odbiti_vrchem", label: "Odbití vrchem" },
    { value: "podani", label: "Podání" },
    { value: "postaveni", label: "Postavení / rotace" },
  ],
  florbal: [
    { value: "vedeni_micku", label: "Vedení míčku" },
    { value: "prihravky", label: "Přihrávky" },
    { value: "strelba", label: "Střelba" },
    { value: "obrana", label: "Obrana" },
  ],
  vybijena: [
    { value: "hody_na_cil", label: "Hody na cíl" },
    { value: "uhybani", label: "Uhýbání / krytí" },
    { value: "hra", label: "Hra" },
  ],
  hokejbal: [
    { value: "vedeni_micku", label: "Vedení míčku" },
    { value: "prihravky", label: "Přihrávky" },
    { value: "strelba", label: "Střelba" },
    { value: "obrana", label: "Obrana" },
  ],
  korfbal: [
    { value: "prihravky", label: "Přihrávky" },
    { value: "strelba", label: "Střelba" },
    { value: "blokovani", label: "Blokování / obrana" },
  ],
};

const ATHLETICS = ["beh","skoky","hody","koordinace"] as const;
type Athletics = typeof ATHLETICS[number];
const ATHLETICS_LABEL: Record<Athletics,string> = {
  beh: "Běhy", skoky: "Skoky", hody: "Hody a vrhy", koordinace: "Koordinace",
};
const ATHLETICS_CONTENT: Record<Athletics, { value: string; label: string }[]> = {
  beh: [
    { value: "beh_obecne", label: "Běh (obecně)" },
    { value: "sprinty", label: "Sprinty (krátké tratě)" },
    { value: "vytrvalost", label: "Vytrvalostní běh" },
    { value: "stafety", label: "Štafety (předávky)" },
    { value: "intervaly", label: "Intervalový běh" },
  ],
  skoky: [
    { value: "skok_daleky",   label: "Skok do dálky" },
    { value: "skok_z_mista",  label: "Skok do dálky z místa" },
    { value: "viceskoky",     label: "Víceskoky" },
    { value: "prekazky",      label: "Překážkový běh / překonávání překážek" },
  ],
  hody: [
    { value: "hod_mickem",       label: "Hod míčkem" },
    { value: "hod_plackou",      label: "Házení plackou / medicinbalem" },
    { value: "vrh",              label: "Vrh (základy bezpečného provedení)" },
  ],
  koordinace: [
    { value: "behaci_abeceda",   label: "Běžecká abeceda" },
    { value: "rychlost_obratnost", label: "Rychlost a obratnost" },
    { value: "koord_hry",          label: "Koordinační hry" },
  ],
};

const GYM = ["kotouly","rovnovaha","visy_stojky"] as const;
type Gym = typeof GYM[number];
const GYM_LABEL: Record<Gym,string> = {
  kotouly:    "Kotouly a přemety (základy)",
  rovnovaha:  "Rovnováha a překážkové dráhy",
  visy_stojky:"Visy, podpory, stojky (základy)",
};
const GYM_CONTENT: Record<Gym, { value: string; label: string }[]> = {
  kotouly: [
    { value: "kotoul_vpred", label: "Kotoul vpřed" },
    { value: "kotoul_vzad",  label: "Kotoul vzad (základy)" },
  ],
  rovnovaha: [
    { value: "chuze_kladina", label: "Chůze po kladině / lavičce" },
    { value: "stoj_na_jedne", label: "Stoj na jedné / balanční cvičení" },
  ],
  visy_stojky: [
    { value: "visy",      label: "Visy na hrazdě" },
    { value: "podpory",   label: "Podpory na nářadí / lavičce" },
    { value: "stojka_zaklady", label: "Stojka u stěny (základy)" },
  ],
};

const UPOLY = ["uchopy_hry","paky", "obranna_postaveni","kooperace_sila"] as const;
type Upoly = typeof UPOLY[number];
const UPOLY_LABEL: Record<Upoly,string> = {
  uchopy_hry: "Úpolové hry s úchopy",
  paky: "Základní páky a vyprošťování (bezpečné formy)",
  obranna_postaveni: "Obranná postavení a postoje",
  kooperace_sila: "Kooperační hry na sílu",
};
const UPOLY_CONTENT: Record<Upoly, { value: string; label: string }[]> = {
  uchopy_hry: [
    { value: "tahani", label: "Tahání a přetahování" },
    { value: "pretlacovani", label: "Přetlačování" },
  ],
  paky: [
    { value: "zakladni_paky", label: "Jednoduché páky (bezpečně, s kontrolou)" },
  ],
  obranna_postaveni: [
    { value: "obranna_pozice", label: "Obranné postavení" },
    { value: "prace_nohou",    label: "Práce nohou / odstupy" },
  ],
  kooperace_sila: [
    { value: "kooperacni_hry_sila", label: "Kooperační hry na sílu" },
    { value: "tahy_tlaky",          label: "Tahy a tlaky – bezpečně" },
  ],
};

const CHARACTERS = [
  { value: "rozvoj",    label: "Rozvoj dovednosti" },
  { value: "upevneni",  label: "Upevnění / nácvik" },
  { value: "aplikace",  label: "Aplikace ve hře" },
  { value: "soutez",    label: "Hra / soutěžní forma" },
];

const WARMUPS = [
  { value: "volna_hra", label: "Volná hra" },
  { value: "behaci",    label: "Běhací / honičky" },
  { value: "prota",     label: "Protažení" },
  { value: "jine",      label: "Neřízené zahřátí / jiné" },
];

export default function App() {
  const [date] = useState(() => new Date().toISOString());

  const [schoolType, setSchoolType] = useState<"" | "tandem5" | "tandem2" | "notandem">("");
  const [schoolId,   setSchoolId]   = useState<"" | SchoolId>("");
  const [teacher,    setTeacher]    = useState("");
  const [classId,    setClassId]    = useState("");
  const [place,      setPlace]      = useState<"tělocvična"|"hřiště"|"venku"|"jiné"|"">("");
  const [placeOther, setPlaceOther] = useState("");
  const [warmup,     setWarmup]     = useState("");

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

  const [leader, setLeader] = useState<"" | "ucitel" | "tandem" | "trener" | "zak">("");

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

  const focusOptions = useMemo(() => {
    if (!discipline || area === "other") return [];
    if (discipline === "other") return [];
    switch (area) {
      case "sportovni_hry": return GAME_CONTENT[discipline as Game] ?? [];
      case "atletika":      return ATHLETICS_CONTENT[discipline as Athletics] ?? [];
      case "gymnastika":    return GYM_CONTENT[discipline as Gym] ?? [];
      case "upoly":         return UPOLY_CONTENT[discipline as Upoly] ?? [];
      default:              return [];
    }
  }, [area, discipline]);

  const onChangeSchoolType = (val: "" | "tandem5" | "tandem2" | "notandem") => {
    setSchoolType(val);
    setSchoolId("");
    setTeacher("");
    setLeader("");
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
    setCharacter("");
  };

  const schoolLabel = (id: string) => ALL_SCHOOLS.find(s => s.id === id)?.name ?? "";

  const SCHOOL_TYPE_LABEL: Record<"" | "tandem5" | "tandem2" | "notandem", string> = {
    "": "",
    tandem5: "Tandem 5× týdně",
    tandem2: "Tandem 2× týdně",
    notandem: "Bez tandemu",
  };

  const areaLabel = (a: typeof area, other: string): string => {
    if (!a) return "";
    if (a === "other") return other || "(jiná oblast – prázdná)";
    return AREA_LABEL[a as Area] ?? String(a);
  };

  const disciplineLabel = (a: typeof area, d: string, dOther: string): string => {
    if (!a || !d) return "";
    if (d === "other") return dOther || "(jiná disciplína – prázdná)";
    switch (a) {
      case "sportovni_hry": return GAME_LABEL[d as Game] ?? d;
      case "atletika":      return ATHLETICS_LABEL[d as Athletics] ?? d;
      case "gymnastika":    return GYM_LABEL[d as Gym] ?? d;
      case "upoly":         return UPOLY_LABEL[d as Upoly] ?? d;
      default: return d;
    }
  };

  const focusPretty = (
    a: typeof area,
    d: typeof discipline,
    f: string,
    fOther: string
  ): string => {
    if (!a) return "";
    if (a === "other" || d === "other" || f === "other") {
      return fOther || "(jiná činnost – prázdná)";
    }
    const list =
      a === "sportovni_hry" ? GAME_CONTENT[d as Game] :
      a === "atletika"      ? ATHLETICS_CONTENT[d as Athletics] :
      a === "gymnastika"    ? GYM_CONTENT[d as Gym] :
      a === "upoly"         ? UPOLY_CONTENT[d as Upoly] : [];
    return list?.find(x => x.value === f)?.label ?? f;
  };

  const CHARACTER_LABEL: Record<string,string> = {
    rozvoj:   "Rozvoj dovednosti",
    upevneni: "Upevnění / nácvik",
    aplikace: "Aplikace ve hře",
    soutez:   "Hra / soutěžní forma",
  };

  const isMainFilled = (() => {
    if (!area) return false;

    if (area === "other") {
      return !!areaOther.trim() && !!discOther.trim() && !!focusOther.trim();
    }

    if (!discipline) return false;

    if (discipline === "other") {
      return !!discOther.trim() && !!focusOther.trim();
    }

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
    (!!leader || isLeaderLockedToTeacher);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold">Tělesný zápis</h1>
          <span className="text-xs text-gray-500">prototyp • {new Date(date).toLocaleString?.("cs-CZ") || date}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FORMULÁŘ */}
        <section className="bg-white rounded-lg shadow border p-4 space-y-6">
          {/* Identifikace hodiny */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Identifikace hodiny</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Typ školy / režim TV</label>
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
              <div>
                <label className="block text-sm font-medium mb-1">Škola</label>
                <select
                  className="w-full border rounded p-2"
                  value={schoolId}
                  onChange={(e) => { setSchoolId(e.target.value as SchoolId); setTeacher(""); }}
                  disabled={!schoolType}
                >
                  <option value="">{schoolType ? "Vyberte školu" : "Nejprve zvolte typ školy"}</option>
                  {filteredSchools.map((s) => (
                    <option key={s.id} value={s.id}>{s.id} — {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Učitel</label>
                <select
                  className="w-full border rounded p-2"
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  disabled={!schoolId}
                >
                  <option value="">{schoolId ? "Vyberte učitele" : "Nejprve vyberte školu"}</option>
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

            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">Úvodní část – zahřátí</label>
              <select
                className="w-full border rounded p-2"
                value={warmup}
                onChange={(e) => setWarmup(e.target.value)}
              >
                <option value="">Vyberte</option>
                {WARMUPS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </div>
          </div>

          {/* Hlavní část */}
          <div className="pt-4 border-t">
            <h2 className="text-lg font-semibold mb-3">Hlavní část</h2>

            {/* Oblast */}
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
                  placeholder="Zadejte oblast / sport…"
                  value={areaOther}
                  onChange={(e) => setAreaOther(e.target.value)}
                />
              )}
            </div>

            {/* Disciplína / hra */}
            {area && (
              <>
                <label className="block text-sm font-medium mt-4 mb-1">
                  {area === "sportovni_hry"
                    ? "Sportovní hra"
                    : area === "atletika"
                    ? "Atletická disciplína"
                    : area === "gymnastika"
                    ? "Gymnastická oblast"
                    : area === "upoly"
                    ? "Úpoly – oblast"
                    : "Disciplína / hra"}
                </label>

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
                      {disciplineOptions.map(d => (
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

            {/* Co se dělo */}
            {area && ((area === "other" && discOther.trim()) || (area !== "other" && discipline)) && (
              <>
                <label className="block text-sm font-medium mt-4 mb-1">Co se dělo (zaměření)</label>
                {area === "other" || discipline === "other" ? (
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

            {/* Charakter činnosti */}
            {((area === "other" && discOther.trim() && focusOther.trim()) ||
              (area !== "other" &&
                ((discipline === "other" && discOther.trim() && focusOther.trim()) ||
                 (discipline && (focus === "other" ? focusOther.trim() : focus))))) && (
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

            {/* Kdo vedl */}
            {character && (
              <>
                <div className="flex items-center justify-between mt-4">
                  <label className="block text-sm font-medium">Kdo vedl</label>
                  {isLeaderLockedToTeacher && (
                    <span className="text-xs text-gray-500">Bez tandemu – vede učitel(ka)</span>
                  )}
                </div>
                <select
                  className="w-full border rounded p-2 disabled:bg-gray-100 disabled:text-gray-500"
                  value={leader}
                  onChange={(e) => setLeader(e.target.value as any)}
                  disabled={isLeaderLockedToTeacher}
                >
                  <option value="">{isLeaderLockedToTeacher ? "Učitel (pevně)" : "Vyberte"}</option>
                  <option value="ucitel">Učitel</option>
                  {!isLeaderLockedToTeacher && (
                    <>
                      <option value="tandem">Tandem</option>
                      <option value="trener">Trenér</option>
                      <option value="zak">Žák</option>
                    </>
                  )}
                </select>
              </>
            )}

            {/* ODESLÁNÍ */}
            <button
              className="mt-4 w-full md:w-auto px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300"
              disabled={!canSubmit}
              onClick={async () => {
                const payload = {
                  schoolType,
                  schoolId,
                  teacher,
                  classId,
                  place,
                  placeOther,
                  warmup,
                  // >>> TADY JE OPRAVA <<<
                  area: area === "other" ? areaOther : area,
                  discipline:
                    area === "other" || discipline === "other"
                      ? discOther
                      : discipline,
                  disciplineOther: discOther,
                  focus:
                    area === "other" || discipline === "other" || focus === "other"
                      ? focusOther
                      : focus,
                  focusOther,
                  character,
                  leader,
                };

                try {
                  const body = "data=" + encodeURIComponent(JSON.stringify(payload));
                  await fetch(APPS_SCRIPT_URL, {
                    method: "POST",
                    mode: "no-cors",
                    headers: {
                      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    },
                    body,
                  });
                  alert("✅ Záznam byl odeslán do Google Sheets!");
                } catch (error) {
                  console.error("Chyba při odesílání:", error);
                  alert("❌ Nepodařilo se odeslat data. Zkontrolujte připojení nebo Google Script.");
                }
              }}
            >
              Odeslat záznam do Google Sheets
            </button>

            <div className="mt-3 flex gap-2 text-xs">
              <a
                className="underline text-blue-600"
                href={`${APPS_SCRIPT_URL}?ping=1`}
                target="_blank"
                rel="noreferrer"
              >
                Test: ping
              </a>
              <a
                className="underline text-blue-600"
                href={`${APPS_SCRIPT_URL}?whoami=1`}
                target="_blank"
                rel="noreferrer"
              >
                Test: whoami
              </a>
            </div>
          </div>
        </section>

        {/* NÁHLED */}
        <aside className="bg-white rounded-lg shadow border p-4">
          <h2 className="text-lg font-semibold mb-3">Náhled záznamu</h2>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Datum:</span> {new Date(date).toLocaleString("cs-CZ")}</p>
            <p><span className="font-medium">Typ školy:</span> {schoolType ? SCHOOL_TYPE_LABEL[schoolType] : "—"}</p>
            <p><span className="font-medium">Škola:</span> {schoolId ? `${schoolId} — ${schoolLabel(schoolId)}` : "—"}</p>
            <p><span className="font-medium">Učitel:</span> {teacher || "—"}</p>
            <p><span className="font-medium">Třída:</span> {classId || "—"}</p>
            <p>
              <span className="font-medium">Místo:</span>{" "}
              {place ? (place === "jiné" ? `Jiné — ${placeOther || "bez popisu"}` : place) : "—"}
            </p>
            <hr className="my-2" />
            <p><span className="font-medium">Zahřátí:</span> {warmup || "—"}</p>
            <hr className="my-2" />
            <p><span className="font-medium">Oblast:</span> {areaLabel(area, areaOther) || "—"}</p>
            <p><span className="font-medium">Disciplína / hra:</span> {disciplineLabel(area, discipline, discOther) || "—"}</p>
            <p><span className="font-medium">Zaměření:</span> {focusPretty(area, discipline, focus, focusOther) || "—"}</p>
            <p><span className="font-medium">Charakter:</span> {character ? CHARACTER_LABEL[character] : "—"}</p>
            <p><span className="font-medium">Vedl:</span> {leader || (isLeaderLockedToTeacher ? "ucitel" : "—")}</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
