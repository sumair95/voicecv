import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  Svg,
  Path,
  Circle,
  Line,
} from "@react-pdf/renderer";
import type { CVData, Language, TemplateId } from "@/types/cv";

// Register fonts. @react-pdf needs explicit registration; Google Fonts CDN URLs work.
// Current Google Fonts TTF URLs (verified 2026-06-04). Google rotates
// these URL hashes every few months; if PDF generation 404s again, refresh
// them with:
//   curl -s "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700"
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf", fontWeight: 700 },
  ],
});

Font.register({
  family: "NotoArabic",
  fonts: [
    { src: "https://fonts.gstatic.com/s/notosansarabic/v33/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5l3sQWIHPqzCfyGyvuw.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/notosansarabic/v33/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5l3sQWIHPqzCfL2uvuw.ttf", fontWeight: 700 },
  ],
});

Font.register({
  family: "NotoUrdu",
  fonts: [
    { src: "https://fonts.gstatic.com/s/notonastaliqurdu/v23/LhWNMUPbN-oZdNFcBy1-DJYsEoTq5pudQ9L940pGPkB3Qt_-DK0.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/notonastaliqurdu/v23/LhWNMUPbN-oZdNFcBy1-DJYsEoTq5pudQ9L940pGPkB3Qjj5DK0.ttf", fontWeight: 700 },
  ],
});

const FONT_BY_LANG: Record<Language, string> = {
  en: "Inter",
  it: "Inter",
  ar: "NotoArabic",
  ur: "NotoUrdu",
};

const SECTION_LABELS: Record<Language, Record<string, string>> = {
  en: {
    contact: "Contact",
    nationality: "Nationality",
    skills: "Skills",
    languages: "Languages",
    hobbies: "Hobbies",
    objective: "Summary",
    experience: "Work Experience",
    education: "Education",
    certificates: "Certificates & Training",
    achievement: "Key Achievements",
  },
  it: {
    contact: "Contatti",
    nationality: "Nazionalità",
    skills: "Competenze",
    languages: "Lingue",
    hobbies: "Hobby",
    objective: "Sintesi",
    experience: "Esperienza lavorativa",
    education: "Istruzione",
    certificates: "Certificati e formazione",
    achievement: "Risultati principali",
  },
  ar: {
    contact: "التواصل",
    nationality: "الجنسية",
    skills: "المهارات",
    languages: "اللغات",
    hobbies: "الهوايات",
    objective: "الملخص",
    experience: "الخبرة العملية",
    education: "التعليم",
    certificates: "الشهادات والتدريب",
    achievement: "أبرز الإنجازات",
  },
  ur: {
    contact: "رابطہ",
    nationality: "قومیت",
    skills: "مہارتیں",
    languages: "زبانیں",
    hobbies: "مشاغل",
    objective: "خلاصہ",
    experience: "کام کا تجربہ",
    education: "تعلیم",
    certificates: "سرٹیفکیٹ اور تربیت",
    achievement: "اہم کامیابیاں",
  },
};

const NAVY = "#0F172A";
const TEAL = "#14B8A6";
const MUTED = "#64748B";

function styles(fontFamily: string) {
  return StyleSheet.create({
    page: {
      fontFamily,
      fontSize: 10,
      color: "#1E293B",
      flexDirection: "row",
      // Page-level padding gives every page (including page 2+) a clean
      // top/bottom margin so continuation pages don't start flush at the
      // edge of the paper.
      paddingTop: 30,
      paddingBottom: 30,
    },
    sidebar: {
      width: "32%",
      backgroundColor: NAVY,
      color: "#FFFFFF",
      padding: 28,
    },
    main: {
      width: "68%",
      padding: 32,
      backgroundColor: "#FFFFFF",
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: TEAL,
      alignSelf: "center",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 10,
    },
    avatarText: { color: "#FFF", fontSize: 22, fontWeight: 700 },
    avatarPhoto: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignSelf: "center",
      marginBottom: 10,
      objectFit: "cover",
    },
    name: { fontSize: 18, fontWeight: 700, textAlign: "center", color: "#FFF" },
    sub: { fontSize: 10, color: "rgba(255,255,255,0.8)", textAlign: "center", marginTop: 3 },
    sectionTitleRowDark: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 16,
      marginBottom: 4,
    },
    sectionTitleDark: {
      fontSize: 9,
      fontWeight: 700,
      color: TEAL,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      marginLeft: 4,
    },
    sectionTitleRuleDark: {
      borderBottomColor: "rgba(20, 184, 166, 0.3)",
      borderBottomWidth: 1,
      marginBottom: 6,
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 9,
      fontWeight: 700,
      color: "#0F766E",
      letterSpacing: 1.5,
      textTransform: "uppercase",
      marginLeft: 4,
    },
    sectionTitleRule: {
      borderBottomColor: "rgba(20, 184, 166, 0.35)",
      borderBottomWidth: 1,
      marginBottom: 8,
    },
    contactRow: {
      flexDirection: "row",
      alignItems: "center",
      color: "rgba(255,255,255,0.9)",
      fontSize: 10,
      marginBottom: 4,
    },
    contactRowText: {
      color: "rgba(255,255,255,0.9)",
      fontSize: 9,
      marginLeft: 5,
      flex: 1,
    },
    skill: {
      backgroundColor: "rgba(20,184,166,0.25)",
      color: "#CCFBF1",
      paddingVertical: 3,
      paddingHorizontal: 7,
      borderRadius: 4,
      fontSize: 9,
      marginRight: 4,
      marginBottom: 4,
    },
    hobby: {
      backgroundColor: "rgba(255,255,255,0.1)",
      color: "rgba(255,255,255,0.9)",
      paddingVertical: 3,
      paddingHorizontal: 7,
      borderRadius: 4,
      fontSize: 9,
      marginRight: 4,
      marginBottom: 4,
    },
    sidebarLanguage: {
      color: "rgba(255,255,255,0.9)",
      fontSize: 10,
      marginBottom: 3,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    languageProf: { color: "rgba(255,255,255,0.6)", fontSize: 9 },
    divider: {
      borderBottomColor: "rgba(255,255,255,0.15)",
      borderBottomWidth: 1,
      marginVertical: 10,
    },
    objectiveBox: {
      borderLeftColor: TEAL,
      borderLeftWidth: 2,
      paddingLeft: 10,
      fontSize: 10,
      color: "#475569",
      marginTop: 4,
      marginBottom: 12,
      lineHeight: 1.5,
    },
    experienceItem: { marginBottom: 12 },
    role: { fontSize: 12, fontWeight: 700, color: NAVY },
    company: { fontSize: 10, fontWeight: 600, color: "#0F766E", marginTop: 2 },
    duration: { fontSize: 9, color: MUTED },
    description: { fontSize: 10, color: "#334155", marginTop: 4, lineHeight: 1.4 },
    bulletRow: { flexDirection: "row", marginTop: 3 },
    bulletText: { flex: 1, fontSize: 10, color: "#334155", lineHeight: 1.4 },
    educationItem: { marginBottom: 8, flexDirection: "row" },
    educationLeft: { flexDirection: "row", flex: 1 },
    educationContent: { flex: 1 },
    educationDegree: { fontSize: 11, fontWeight: 700, color: NAVY },
    educationInstitution: { fontSize: 10, color: "#334155" },
    timelineDot: {
      width: 8, fontSize: 10, color: TEAL, lineHeight: 1.4, marginRight: 6,
    },
    certName: { fontSize: 10, fontWeight: 700, color: NAVY },
    certIssuer: { fontSize: 10, color: MUTED },
    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
    skillRow: { flexDirection: "row", flexWrap: "wrap" },
    starBox: {
      backgroundColor: "#F0FDFA",
      borderColor: "rgba(20,184,166,0.3)",
      borderWidth: 1,
      borderRadius: 6,
      padding: 10,
      marginTop: 4,
    },
    starRow: { flexDirection: "row", marginBottom: 4 },
    starLabel: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: TEAL,
      color: "#FFF",
      fontSize: 8,
      fontWeight: 700,
      textAlign: "center",
      lineHeight: 16,
      marginRight: 6,
    },
    starText: { flex: 1, fontSize: 10, color: "#334155", lineHeight: 1.4 },
  });
}

// ─── PDF icon primitives ───────────────────────────────────────────
// @react-pdf doesn't accept React/lucide icons — we render inline SVG.
// Sized to match the 9-10pt text around them.

interface IconProps {
  size?: number;
  color?: string;
}

function MailIcon({ size = 10, color = TEAL }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      <Path d="M2 6l10 7 10-7" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

function PhoneIcon({ size = 10, color = TEAL }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
    </Svg>
  );
}

function GlobeIcon({ size = 10, color = TEAL }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={2} y1={12} x2={22} y2={12} stroke={color} strokeWidth={2} />
      <Path
        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
    </Svg>
  );
}

function BriefcaseIcon({ size = 10, color = TEAL }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M20 7h-4V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      <Line x1={2} y1={13} x2={22} y2={13} stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function GraduationCapIcon({ size = 10, color = TEAL }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M2 9l10-5 10 5-10 5L2 9z"
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      <Path
        d="M6 11v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
    </Svg>
  );
}

function AwardIcon({ size = 10, color = TEAL }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={9} r={6} stroke={color} strokeWidth={2} fill="none" />
      <Path
        d="M8.21 13.89L7 22l5-3 5 3-1.21-8.11"
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
    </Svg>
  );
}

function TrophyIcon({ size = 10, color = TEAL }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 4h3v3a3 3 0 0 1-3 3M7 4H4v3a3 3 0 0 0 3 3"
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
    </Svg>
  );
}

// Reusable section header: icon + uppercase title.
// `rule` (used by Minimalist) adds a subtle gray underline.
function SectionHeader({
  icon: Icon,
  title,
  dark,
  rule,
}: {
  icon?: React.ComponentType<IconProps>;
  title: string;
  dark?: boolean;
  rule?: boolean;
}) {
  // Match the on-screen CV: section titles are teal on both the navy sidebar
  // (light teal) and the white main column (teal-700, slightly darker).
  const titleColor = dark ? TEAL : "#0F766E";
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: dark ? 16 : 14,
          marginBottom: rule ? 4 : 6,
        }}
      >
        {Icon && <Icon color={titleColor} size={dark ? 9 : 11} />}
        <Text
          style={{
            fontSize: dark ? 10 : 13,
            fontWeight: 700,
            color: titleColor,
            letterSpacing: dark ? 1.5 : 1,
            textTransform: "uppercase",
            marginLeft: Icon ? 6 : 0,
          }}
        >
          {title}
        </Text>
      </View>
      {rule && (
        <View
          style={{
            borderBottomColor: "#E2E8F0",
            borderBottomWidth: 0.7,
            marginBottom: 8,
          }}
        />
      )}
    </View>
  );
}

/**
 * Detail bullet: a hollow teal ring, matching the larger ring that marks each
 * timeline entry so the whole document speaks one visual language.
 *
 * Sized and offset in points rather than inherited from the text: react-pdf has
 * no baseline alignment, so the ring is nudged down to sit on the first line of
 * a wrapped bullet instead of floating above it.
 */
function BulletDot() {
  return (
    <View style={{ width: 8, paddingTop: 4 }}>
      <View
        style={{
          width: 3.5,
          height: 3.5,
          borderRadius: 1.75,
          borderWidth: 0.8,
          borderColor: TEAL,
        }}
      />
    </View>
  );
}

// Timeline item — hollow teal circle + a vertical rail running the height of
// the entry, matching the web preview's `border-s + dot marker` pattern.
//
// The rail is drawn per item rather than as one line behind the whole list
// because react-pdf does not repeat a container's border/background on the
// continuation pages of a View that breaks — a single long line would vanish
// after the first page break. Per-item segments survive the break.
//
// Two details make those segments read as one continuous line:
//   - The rail is drawn for EVERY entry including the last, so the line runs to
//     the end of the section rather than stopping at the final marker.
//   - The gap between entries is `paddingBottom` on the CONTENT column, not
//     `marginBottom` on the row. Padding is inside the row's box, so the rail
//     (which stretches to the row height) covers the gap; a margin sits outside
//     it and would leave a break in the line at every entry boundary.
function TimelineItem({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row" }}>
      <View style={{ width: 14, alignItems: "center" }}>
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 3.5,
            borderWidth: 1.5,
            borderColor: TEAL,
            backgroundColor: "white",
            marginTop: 3,
          }}
        />
        <View
          style={{
            width: 1,
            flex: 1,
            backgroundColor: "#E2E8F0",
            marginTop: 2,
          }}
        />
      </View>
      {/*
        The padding is uniform, including on the last entry. Zeroing it there
        left a short final entry (a one-line certificate) with a 0.1pt rail —
        invisible, so the line still appeared to stop early. A consistent 10pt
        tail guarantees every entry's rail is visible and the section reads as
        one continuous line down to its end.
      */}
      <View style={{ flex: 1, paddingLeft: 6, paddingBottom: 10 }}>
        {children}
      </View>
    </View>
  );
}

// Contact row: icon + text on a single line (used in the dark sidebar).
function ContactRow({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<IconProps>;
  text: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
      }}
    >
      <Icon color={TEAL} />
      <Text
        style={{
          color: "rgba(255,255,255,0.9)",
          fontSize: 9,
          marginLeft: 6,
          flex: 1,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

function bulletsFrom(text: string): string[] {
  return text
    .split(/\r?\n+/)
    .map((line) => line.replace(/^\s*[-•*·–—]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function CVDocument({
  cv,
  language,
  template = "modern",
}: {
  cv: CVData;
  language: Language;
  template?: TemplateId;
}) {
  if (template === "minimalist") {
    return <MinimalistDocument cv={cv} language={language} />;
  }
  if (template === "classic") {
    return <ClassicDocument cv={cv} language={language} />;
  }
  if (template === "executive") {
    return <ExecutiveDocument cv={cv} language={language} />;
  }
  return <ModernDocument cv={cv} language={language} />;
}

function ModernDocument({
  cv,
  language,
}: {
  cv: CVData;
  language: Language;
}) {
  const fontFamily = FONT_BY_LANG[language];
  const s = styles(fontFamily);
  const L = SECTION_LABELS[language];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.sidebar}>
          {cv.personal.photo_url ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop
            <Image src={cv.personal.photo_url} style={s.avatarPhoto} />
          ) : (
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials(cv.personal.full_name)}</Text>
            </View>
          )}
          <Text style={s.name}>{cv.personal.full_name || ""}</Text>
          {cv.personal.job_title ? (
            <Text style={{ fontSize: 10, textAlign: "center", color: TEAL, marginTop: 2 }}>
              {cv.personal.job_title}
            </Text>
          ) : null}
          {[cv.personal.city, cv.personal.country].filter(Boolean).length > 0 ? (
            <Text style={s.sub}>
              {[cv.personal.city, cv.personal.country].filter(Boolean).join(", ")}
            </Text>
          ) : null}
          <View style={s.divider} />

          {(cv.personal.email || cv.personal.phone || cv.socials.length > 0) && (
            <>
              <SectionHeader title={L.contact} dark />
              {cv.personal.email ? (
                <ContactRow icon={MailIcon} text={cv.personal.email} />
              ) : null}
              {cv.personal.phone ? (
                <ContactRow icon={PhoneIcon} text={cv.personal.phone} />
              ) : null}
              {cv.socials
                .filter((soc) => soc.url.trim())
                .map((soc, i) => {
                  let txt = soc.url;
                  try {
                    const u = new URL(
                      soc.url.startsWith("http") ? soc.url : `https://${soc.url}`,
                    );
                    txt = (u.hostname.replace(/^www\./, "") + u.pathname).replace(/\/$/, "");
                  } catch {}
                  return <ContactRow key={i} icon={GlobeIcon} text={txt} />;
                })}
            </>
          )}

          {cv.skills.length > 0 && (
            <>
              <SectionHeader title={L.skills} dark />
              <View style={s.skillRow}>
                {cv.skills.map((skill, i) => (
                  <Text key={i} style={s.skill}>
                    {skill}
                  </Text>
                ))}
              </View>
            </>
          )}

          {cv.languages.length > 0 && (
            <>
              <SectionHeader title={L.languages} dark />
              {cv.languages.map((lng, i) => (
                <View key={i} style={s.sidebarLanguage}>
                  <Text>{lng.name}</Text>
                  <Text style={s.languageProf}>{lng.proficiency}</Text>
                </View>
              ))}
            </>
          )}

          {cv.hobbies.length > 0 && (
            <>
              <SectionHeader title={L.hobbies} dark />
              <View style={s.skillRow}>
                {cv.hobbies.map((h, i) => (
                  <Text key={i} style={s.hobby}>
                    {h}
                  </Text>
                ))}
              </View>
            </>
          )}
        </View>

        <View style={s.main}>
          {cv.objective ? (
            <>
              <SectionHeader title={L.objective} />
              <Text style={s.objectiveBox}>{cv.objective}</Text>
            </>
          ) : null}

          {cv.experience.length > 0 && (
            <>
              <SectionHeader icon={BriefcaseIcon} title={L.experience} />
              {cv.experience.map((exp, i) => (
                <TimelineItem key={i}>
                  <View style={s.rowBetween}>
                    <Text style={s.role}>{exp.role}</Text>
                    <Text style={s.duration}>{exp.duration}</Text>
                  </View>
                  <Text style={s.company}>{exp.company}</Text>
                  {bulletsFrom(exp.description).map((line, bi) => (
                    <View key={bi} style={s.bulletRow}>
                      <BulletDot />
                      <Text style={s.bulletText}>{line}</Text>
                    </View>
                  ))}
                </TimelineItem>
              ))}
            </>
          )}

          {cv.education.length > 0 && (
            <>
              <SectionHeader icon={GraduationCapIcon} title={L.education} />
              {cv.education.map((edu, i) => (
                <TimelineItem key={i}>
                  <View style={s.rowBetween}>
                    <Text style={s.educationDegree}>{edu.degree}</Text>
                    <Text style={s.duration}>{edu.year}</Text>
                  </View>
                  <Text style={s.educationInstitution}>{edu.institution}</Text>
                </TimelineItem>
              ))}
            </>
          )}

          {cv.certificates.length > 0 && (
            <>
              <SectionHeader icon={AwardIcon} title={L.certificates} />
              {cv.certificates.map((c, i) => (
                <TimelineItem key={i}>
                  <View style={s.rowBetween}>
                    <Text style={s.certName}>
                      {c.name}
                      {c.issuer ? <Text style={s.certIssuer}> · {c.issuer}</Text> : null}
                    </Text>
                    <Text style={s.duration}>{c.year}</Text>
                  </View>
                </TimelineItem>
              ))}
            </>
          )}

          {cv.achievements.length > 0 && (
            <>
              <SectionHeader icon={TrophyIcon} title={L.achievement} />
              <View style={s.starBox}>
                {cv.achievements
                  .filter((a) => a.trim())
                  .map((a, i) => (
                    <View key={i} style={s.bulletRow}>
                      <BulletDot />
                      <Text style={s.bulletText}>{a}</Text>
                    </View>
                  ))}
              </View>
            </>
          )}
        </View>
      </Page>
    </Document>
  );
}

// ─── Minimalist template ───────────────────────────────────────────
const minStyles = (fontFamily: string) =>
  StyleSheet.create({
    page: {
      fontFamily,
      fontSize: 10,
      color: NAVY,
      paddingTop: 40,
      paddingBottom: 40,
      paddingLeft: 56,
      paddingRight: 56,
    },
    name: {
      fontSize: 22,
      fontWeight: 400,
      textAlign: "center",
      letterSpacing: 1.5,
      color: NAVY,
    },
    headerContact: {
      marginTop: 8,
      fontSize: 9,
      color: MUTED,
      textAlign: "center",
    },
    headerRule: {
      marginTop: 14,
      borderBottomColor: "#CBD5E1",
      borderBottomWidth: 1,
      marginBottom: 6,
    },
    sectionTitle: {
      fontSize: 9,
      fontWeight: 700,
      color: "#1E293B",
      letterSpacing: 2,
      textTransform: "uppercase",
      borderBottomColor: "#E2E8F0",
      borderBottomWidth: 1,
      paddingBottom: 3,
      marginTop: 18,
      marginBottom: 8,
    },
    body: { fontSize: 10, color: "#334155", lineHeight: 1.5 },
    rowBetween: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
    },
    expRole: { fontSize: 11, fontWeight: 700, color: NAVY },
    expCompany: { fontSize: 10, fontWeight: 600, color: "#0F766E", marginTop: 1 },
    expDuration: {
      fontSize: 8,
      color: MUTED,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    expBlock: { marginBottom: 10 },
    bulletRow: { flexDirection: "row", marginTop: 2 },
    bulletText: { flex: 1, fontSize: 10, color: "#334155", lineHeight: 1.4 },
    listRow: { marginBottom: 4, flexDirection: "row", justifyContent: "space-between" },
    skillsLine: { fontSize: 10, color: "#334155", lineHeight: 1.5 },
  });

function MinimalistDocument({
  cv,
  language,
}: {
  cv: CVData;
  language: Language;
}) {
  const fontFamily = FONT_BY_LANG[language];
  const s = minStyles(fontFamily);
  const L = SECTION_LABELS[language];

  const location = [cv.personal.city, cv.personal.country]
    .filter(Boolean)
    .join(", ");
  const contactBits = [
    cv.personal.email,
    cv.personal.phone,
    location,
  ].filter(Boolean);
  const socialBits = cv.socials
    .filter((s) => s.url.trim())
    .map((s) => {
      try {
        const u = new URL(s.url.startsWith("http") ? s.url : `https://${s.url}`);
        return (u.hostname.replace(/^www\./, "") + u.pathname).replace(/\/$/, "");
      } catch {
        return s.url;
      }
    });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {cv.personal.photo_url ? (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */}
            <Image
              src={cv.personal.photo_url}
              style={{ width: 60, height: 60, borderRadius: 30, objectFit: "cover", marginRight: 12 }}
            />
            <View>
              <Text style={s.name}>{cv.personal.full_name || ""}</Text>
              {cv.personal.job_title ? (
                <Text style={{ fontSize: 12, textAlign: "center", color: TEAL, marginTop: 2 }}>
                  {cv.personal.job_title}
                </Text>
              ) : null}
            </View>
          </View>
        ) : (
          <>
            <Text style={s.name}>{cv.personal.full_name || ""}</Text>
            {cv.personal.job_title ? (
              <Text style={{ fontSize: 12, textAlign: "center", color: TEAL, marginTop: 2 }}>
                {cv.personal.job_title}
              </Text>
            ) : null}
          </>
        )}
        {contactBits.length > 0 ? (
          <Text style={s.headerContact}>{contactBits.join("   •   ")}</Text>
        ) : null}
        {socialBits.length > 0 ? (
          <Text style={s.headerContact}>{socialBits.join("   •   ")}</Text>
        ) : null}
        <View style={s.headerRule} />

        {cv.objective ? (
          <>
            <SectionHeader title={L.objective} />
            <Text style={s.body}>{cv.objective}</Text>
          </>
        ) : null}

        {cv.experience.length > 0 && (
          <>
            <SectionHeader title={L.experience} />
            {cv.experience.map((exp, i) => (
              <View key={i} style={s.expBlock}>
                <View style={s.rowBetween}>
                  <Text style={s.expRole}>{exp.role}</Text>
                  <Text style={s.expDuration}>{exp.duration}</Text>
                </View>
                <Text style={s.expCompany}>{exp.company}</Text>
                {bulletsFrom(exp.description).map((line, bi) => (
                  <View key={bi} style={s.bulletRow}>
                    <BulletDot />
                    <Text style={s.bulletText}>{line}</Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        {cv.education.length > 0 && (
          <>
            <SectionHeader title={L.education} />
            {cv.education.map((edu, i) => (
              <View key={i} style={s.expBlock}>
                <View style={s.rowBetween}>
                  <Text style={s.expRole}>{edu.degree}</Text>
                  <Text style={s.expDuration}>{edu.year}</Text>
                </View>
                <Text style={s.expCompany}>{edu.institution}</Text>
              </View>
            ))}
          </>
        )}

        {cv.certificates.length > 0 && (
          <>
            <SectionHeader title={L.certificates} />
            {cv.certificates.map((c, i) => (
              <View key={i} style={s.listRow}>
                <Text style={s.body}>
                  {c.name}
                  {c.issuer ? ` · ${c.issuer}` : ""}
                </Text>
                <Text style={s.expDuration}>{c.year}</Text>
              </View>
            ))}
          </>
        )}

        {cv.skills.length > 0 && (
          <>
            <SectionHeader title={L.skills} />
            <Text style={s.skillsLine}>
              {cv.skills.filter((sk) => sk.trim()).join("  ·  ")}
            </Text>
          </>
        )}

        {cv.languages.length > 0 && (
          <>
            <SectionHeader title={L.languages} />
            <Text style={s.skillsLine}>
              {cv.languages
                .filter((l) => l.name.trim())
                .map((l) =>
                  l.proficiency ? `${l.name} (${l.proficiency})` : l.name,
                )
                .join("  ·  ")}
            </Text>
          </>
        )}

        {cv.hobbies.length > 0 && (
          <>
            <SectionHeader title={L.hobbies} />
            <Text style={s.skillsLine}>
              {cv.hobbies.filter((h) => h.trim()).join("  ·  ")}
            </Text>
          </>
        )}

        {cv.achievements.length > 0 && (
          <>
            <SectionHeader title={L.achievement} />
            {cv.achievements
              .filter((a) => a.trim())
              .map((a, i) => (
                <View key={i} style={s.bulletRow}>
                  <BulletDot />
                  <Text style={s.bulletText}>{a}</Text>
                </View>
              ))}
          </>
        )}
      </Page>
    </Document>
  );
}

// ── Premium PDF documents (Classic, Executive). Premium output is always
//    English or Italian (LTR/Latin), so no RTL handling is needed here. ──

function contactBitsOf(cv: CVData) {
  const location = [cv.personal.city, cv.personal.country].filter(Boolean).join(", ");
  return [cv.personal.email, cv.personal.phone, location].filter(Boolean);
}
function socialBitsOf(cv: CVData) {
  return cv.socials
    .filter((s) => s.url.trim())
    .map((s) => {
      try {
        const u = new URL(s.url.startsWith("http") ? s.url : `https://${s.url}`);
        return (u.hostname.replace(/^www\./, "") + u.pathname).replace(/\/$/, "");
      } catch {
        return s.url;
      }
    });
}

function classicStyles(fontFamily: string) {
  return StyleSheet.create({
    page: { fontFamily, paddingVertical: 48, paddingHorizontal: 56 },
    name: { fontSize: 24, fontWeight: 600, textAlign: "center", letterSpacing: 1.5, color: NAVY },
    headerRule: { alignSelf: "center", width: 90, borderBottomWidth: 1, borderBottomColor: "#94A3B8", marginTop: 10, marginBottom: 6 },
    contact: { fontSize: 9, color: MUTED, textAlign: "center", marginTop: 4 },
    sectionTitle: { fontSize: 9, fontWeight: 700, color: NAVY, letterSpacing: 2.5, textTransform: "uppercase", textAlign: "center", marginTop: 18 },
    sectionRule: { alignSelf: "center", width: 36, borderBottomWidth: 1, borderBottomColor: "#94A3B8", marginTop: 3, marginBottom: 9 },
    body: { fontSize: 10, color: "#334155", lineHeight: 1.5 },
    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
    expRole: { fontSize: 11, fontWeight: 700, color: NAVY },
    expCompany: { fontSize: 10, fontWeight: 600, color: "#0F766E", marginTop: 1 },
    expDuration: { fontSize: 8, color: MUTED, letterSpacing: 1, textTransform: "uppercase" },
    expBlock: { marginBottom: 10 },
    bulletRow: { flexDirection: "row", marginTop: 2 },
    bulletText: { flex: 1, fontSize: 10, color: "#334155", lineHeight: 1.4 },
    listRow: { marginBottom: 4, flexDirection: "row", justifyContent: "space-between" },
    line: { fontSize: 10, color: "#334155", lineHeight: 1.5 },
    skillWrap: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
    skillPill: {
      backgroundColor: "#F1F5F9",
      borderRadius: 4,
      paddingVertical: 2,
      paddingHorizontal: 6,
      fontSize: 9.5,
      color: "#334155",
      marginRight: 5,
      marginBottom: 5,
    },
  });
}

function ClassicDocument({ cv, language }: { cv: CVData; language: Language }) {
  const s = classicStyles(FONT_BY_LANG[language]);
  const L = SECTION_LABELS[language];
  const contact = contactBitsOf(cv);
  const socials = socialBitsOf(cv);
  const Sec = ({ title }: { title: string }) => (
    <>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionRule} />
    </>
  );
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {cv.personal.photo_url ? (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */}
            <Image
              src={cv.personal.photo_url}
              style={{ width: 62, height: 62, borderRadius: 31, objectFit: "cover", marginRight: 12 }}
            />
            <View>
              <Text style={s.name}>{cv.personal.full_name || ""}</Text>
              {cv.personal.job_title ? (
                <Text style={{ fontSize: 12, textAlign: "center", color: "#64748B", marginTop: 3, letterSpacing: 1 }}>
                  {cv.personal.job_title}
                </Text>
              ) : null}
            </View>
          </View>
        ) : (
          <>
            <Text style={s.name}>{cv.personal.full_name || ""}</Text>
            {cv.personal.job_title ? (
              <Text style={{ fontSize: 12, textAlign: "center", color: "#64748B", marginTop: 3, letterSpacing: 1 }}>
                {cv.personal.job_title}
              </Text>
            ) : null}
          </>
        )}
        <View style={s.headerRule} />
        {contact.length > 0 && <Text style={s.contact}>{contact.join("   ·   ")}</Text>}
        {socials.length > 0 && <Text style={s.contact}>{socials.join("   ·   ")}</Text>}

        {cv.objective ? (
          <>
            <Sec title={L.objective} />
            <Text style={s.body}>{cv.objective}</Text>
          </>
        ) : null}

        {cv.experience.length > 0 && (
          <>
            <Sec title={L.experience} />
            {cv.experience.map((exp, i) => (
              <View key={i} style={s.expBlock}>
                <View style={s.rowBetween}>
                  <Text style={s.expRole}>{exp.role}</Text>
                  <Text style={s.expDuration}>{exp.duration}</Text>
                </View>
                <Text style={s.expCompany}>{exp.company}</Text>
                {bulletsFrom(exp.description).map((line, bi) => (
                  <View key={bi} style={s.bulletRow}>
                    <BulletDot />
                    <Text style={s.bulletText}>{line}</Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        {cv.education.length > 0 && (
          <>
            <Sec title={L.education} />
            {cv.education.map((edu, i) => (
              <View key={i} style={s.expBlock}>
                <View style={s.rowBetween}>
                  <Text style={s.expRole}>{edu.degree}</Text>
                  <Text style={s.expDuration}>{edu.year}</Text>
                </View>
                <Text style={s.expCompany}>{edu.institution}</Text>
              </View>
            ))}
          </>
        )}

        {cv.certificates.length > 0 && (
          <>
            <Sec title={L.certificates} />
            {cv.certificates.map((c, i) => (
              <View key={i} style={s.listRow}>
                <Text style={s.body}>{c.name}{c.issuer ? ` · ${c.issuer}` : ""}</Text>
                <Text style={s.expDuration}>{c.year}</Text>
              </View>
            ))}
          </>
        )}

        {cv.skills.length > 0 && (
          <>
            <Sec title={L.skills} />
            <View style={s.skillWrap}>
              {cv.skills.filter((sk) => sk.trim()).map((sk, i) => (
                <Text key={i} style={s.skillPill}>{sk}</Text>
              ))}
            </View>
          </>
        )}

        {cv.languages.length > 0 && (
          <>
            <Sec title={L.languages} />
            <Text style={s.line}>
              {cv.languages
                .filter((l) => l.name.trim())
                .map((l) => (l.proficiency ? `${l.name} (${l.proficiency})` : l.name))
                .join("  ·  ")}
            </Text>
          </>
        )}

        {cv.hobbies.length > 0 && (
          <>
            <Sec title={L.hobbies} />
            <Text style={s.line}>{cv.hobbies.filter((h) => h.trim()).join("  ·  ")}</Text>
          </>
        )}

        {cv.achievements.length > 0 && (
          <>
            <Sec title={L.achievement} />
            {cv.achievements.filter((a) => a.trim()).map((a, i) => (
              <View key={i} style={s.bulletRow}>
                <BulletDot />
                <Text style={s.bulletText}>{a}</Text>
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}

function execStyles(fontFamily: string) {
  return StyleSheet.create({
    // Page padding gives every page — including page 2+ — a clean top/bottom
    // margin so continuation pages don't start flush against the paper edge.
    page: { fontFamily, paddingTop: 36, paddingBottom: 36 },
    // Full-bleed header: pull it up out of the page's top padding so it still
    // sits flush at the very top of page 1 (page-1 layout is unchanged).
    header: { backgroundColor: NAVY, marginTop: -36, paddingVertical: 28, paddingHorizontal: 48, borderBottomWidth: 4, borderBottomColor: TEAL },
    name: { fontSize: 24, fontWeight: 700, color: "#FFFFFF", letterSpacing: 0.5 },
    headerContact: { fontSize: 9, color: "rgba(255,255,255,0.75)", marginTop: 6 },
    content: { paddingVertical: 26, paddingHorizontal: 48 },
    sectionRow: { flexDirection: "row", alignItems: "center", marginTop: 16, marginBottom: 8 },
    sectionBar: { width: 3, height: 11, backgroundColor: TEAL, marginRight: 6, borderRadius: 2 },
    sectionTitle: { fontSize: 9, fontWeight: 700, color: NAVY, letterSpacing: 1.5, textTransform: "uppercase" },
    body: { fontSize: 10, color: "#334155", lineHeight: 1.5 },
    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
    expRole: { fontSize: 11, fontWeight: 700, color: NAVY },
    expCompany: { fontSize: 10, fontWeight: 600, color: "#0F766E", marginTop: 1 },
    expDuration: { fontSize: 8, color: MUTED, letterSpacing: 1, textTransform: "uppercase" },
    expBlock: { marginBottom: 10, paddingLeft: 9 },
    bulletRow: { flexDirection: "row", marginTop: 2 },
    bulletText: { flex: 1, fontSize: 10, color: "#334155", lineHeight: 1.4 },
    listRow: { marginBottom: 4, paddingLeft: 9, flexDirection: "row", justifyContent: "space-between" },
    line: { fontSize: 10, color: "#334155", lineHeight: 1.5, paddingLeft: 9 },
    skillWrap: { flexDirection: "row", flexWrap: "wrap", paddingLeft: 9 },
    skillPill: {
      backgroundColor: "#F1F5F9",
      borderRadius: 4,
      paddingVertical: 2,
      paddingHorizontal: 6,
      fontSize: 9.5,
      color: "#334155",
      marginRight: 5,
      marginBottom: 5,
    },
  });
}

function ExecutiveDocument({ cv, language }: { cv: CVData; language: Language }) {
  const s = execStyles(FONT_BY_LANG[language]);
  const L = SECTION_LABELS[language];
  const contact = contactBitsOf(cv);
  const socials = socialBitsOf(cv);
  const Sec = ({ title }: { title: string }) => (
    <View style={s.sectionRow}>
      <View style={s.sectionBar} />
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{cv.personal.full_name || ""}</Text>
              {cv.personal.job_title ? (
                <Text style={{ fontSize: 12, color: TEAL, marginTop: 3 }}>{cv.personal.job_title}</Text>
              ) : null}
              {contact.length > 0 && <Text style={s.headerContact}>{contact.join("   ·   ")}</Text>}
              {socials.length > 0 && <Text style={s.headerContact}>{socials.join("   ·   ")}</Text>}
            </View>
            {cv.personal.photo_url ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop
              <Image
                src={cv.personal.photo_url}
                style={{ width: 72, height: 72, borderRadius: 36, objectFit: "cover", marginLeft: 16 }}
              />
            ) : null}
          </View>
        </View>

        <View style={s.content}>
          {cv.objective ? (
            <>
              <Sec title={L.objective} />
              <Text style={[s.body, { paddingLeft: 9 }]}>{cv.objective}</Text>
            </>
          ) : null}

          {cv.experience.length > 0 && (
            <>
              <Sec title={L.experience} />
              {cv.experience.map((exp, i) => (
                <View key={i} style={s.expBlock}>
                  <View style={s.rowBetween}>
                    <Text style={s.expRole}>{exp.role}</Text>
                    <Text style={s.expDuration}>{exp.duration}</Text>
                  </View>
                  <Text style={s.expCompany}>{exp.company}</Text>
                  {bulletsFrom(exp.description).map((line, bi) => (
                    <View key={bi} style={s.bulletRow}>
                      <BulletDot />
                      <Text style={s.bulletText}>{line}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </>
          )}

          {cv.education.length > 0 && (
            <>
              <Sec title={L.education} />
              {cv.education.map((edu, i) => (
                <View key={i} style={s.expBlock}>
                  <View style={s.rowBetween}>
                    <Text style={s.expRole}>{edu.degree}</Text>
                    <Text style={s.expDuration}>{edu.year}</Text>
                  </View>
                  <Text style={s.expCompany}>{edu.institution}</Text>
                </View>
              ))}
            </>
          )}

          {cv.certificates.length > 0 && (
            <>
              <Sec title={L.certificates} />
              {cv.certificates.map((c, i) => (
                <View key={i} style={s.listRow}>
                  <Text style={s.body}>{c.name}{c.issuer ? ` · ${c.issuer}` : ""}</Text>
                  <Text style={s.expDuration}>{c.year}</Text>
                </View>
              ))}
            </>
          )}

          {cv.skills.length > 0 && (
            <>
              <Sec title={L.skills} />
              <View style={s.skillWrap}>
                {cv.skills.filter((sk) => sk.trim()).map((sk, i) => (
                  <Text key={i} style={s.skillPill}>{sk}</Text>
                ))}
              </View>
            </>
          )}

          {cv.languages.length > 0 && (
            <>
              <Sec title={L.languages} />
              <Text style={s.line}>
                {cv.languages
                  .filter((l) => l.name.trim())
                  .map((l) => (l.proficiency ? `${l.name} (${l.proficiency})` : l.name))
                  .join("  ·  ")}
              </Text>
            </>
          )}

          {cv.hobbies.length > 0 && (
            <>
              <Sec title={L.hobbies} />
              <Text style={s.line}>{cv.hobbies.filter((h) => h.trim()).join("  ·  ")}</Text>
            </>
          )}

          {cv.achievements.length > 0 && (
            <>
              <Sec title={L.achievement} />
              {cv.achievements.filter((a) => a.trim()).map((a, i) => (
                <View key={i} style={[s.bulletRow, { paddingLeft: 9 }]}>
                  <BulletDot />
                  <Text style={s.bulletText}>{a}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      </Page>
    </Document>
  );
}
