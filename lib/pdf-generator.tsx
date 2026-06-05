import {
  Document,
  Page,
  Text,
  View,
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
    objective: "Objective",
    experience: "Work Experience",
    education: "Education",
    certificates: "Certificates & Training",
    achievement: "Key Achievement",
  },
  ar: {
    contact: "التواصل",
    nationality: "الجنسية",
    skills: "المهارات",
    languages: "اللغات",
    hobbies: "الهوايات",
    objective: "الهدف المهني",
    experience: "الخبرة العملية",
    education: "التعليم",
    certificates: "الشهادات والتدريب",
    achievement: "إنجاز رئيسي",
  },
  ur: {
    contact: "رابطہ",
    nationality: "قومیت",
    skills: "مہارتیں",
    languages: "زبانیں",
    hobbies: "مشاغل",
    objective: "مقصد",
    experience: "کام کا تجربہ",
    education: "تعلیم",
    certificates: "سرٹیفکیٹ اور تربیت",
    achievement: "اہم کامیابی",
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
    bulletDot: { width: 8, fontSize: 10, color: TEAL, lineHeight: 1.4 },
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

function StarIcon({ size = 10, color = TEAL }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={color}
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
  icon: React.ComponentType<IconProps>;
  title: string;
  dark?: boolean;
  rule?: boolean;
}) {
  // Dark sidebar keeps teal so it shows on the navy background. Main column
  // uses navy so the title clearly outranks the sub-item text below it.
  const titleColor = dark ? TEAL : NAVY;
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
        <Icon color={titleColor} size={dark ? 9 : 11} />
        <Text
          style={{
            fontSize: dark ? 10 : 13,
            fontWeight: 700,
            color: titleColor,
            letterSpacing: dark ? 1.5 : 1,
            textTransform: "uppercase",
            marginLeft: 6,
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

// Timeline item — hollow teal circle + vertical line connecting to the
// next item, matching the web preview's `border-s + dot marker` pattern.
function TimelineItem({
  isLast,
  children,
}: {
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 10 }}>
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
        {!isLast && (
          <View
            style={{
              width: 1,
              flex: 1,
              backgroundColor: "#E2E8F0",
              marginTop: 2,
            }}
          />
        )}
      </View>
      <View style={{ flex: 1, paddingLeft: 6 }}>{children}</View>
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
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials(cv.personal.full_name)}</Text>
          </View>
          <Text style={s.name}>{cv.personal.full_name || ""}</Text>
          {[cv.personal.city, cv.personal.country].filter(Boolean).length > 0 ? (
            <Text style={s.sub}>
              {[cv.personal.city, cv.personal.country].filter(Boolean).join(", ")}
            </Text>
          ) : null}
          <View style={s.divider} />

          {(cv.personal.email || cv.personal.phone || cv.socials.length > 0) && (
            <>
              <SectionHeader icon={MailIcon} title={L.contact} dark />
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
              <SectionHeader icon={StarIcon} title={L.skills} dark />
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
              <SectionHeader icon={GlobeIcon} title={L.languages} dark />
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
              <SectionHeader icon={TrophyIcon} title={L.hobbies} dark />
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
              <SectionHeader icon={StarIcon} title={L.objective} />
              <Text style={s.objectiveBox}>{cv.objective}</Text>
            </>
          ) : null}

          {cv.experience.length > 0 && (
            <>
              <SectionHeader icon={BriefcaseIcon} title={L.experience} />
              {cv.experience.map((exp, i) => (
                <TimelineItem key={i} isLast={i === cv.experience.length - 1}>
                  <View style={s.rowBetween}>
                    <Text style={s.role}>{exp.role}</Text>
                    <Text style={s.duration}>{exp.duration}</Text>
                  </View>
                  <Text style={s.company}>{exp.company}</Text>
                  {bulletsFrom(exp.description).map((line, bi) => (
                    <View key={bi} style={s.bulletRow}>
                      <Text style={s.bulletDot}>•</Text>
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
                <TimelineItem key={i} isLast={i === cv.education.length - 1}>
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
                <TimelineItem key={i} isLast={i === cv.certificates.length - 1}>
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

          {cv.achievement && (
            <>
              <SectionHeader icon={TrophyIcon} title={L.achievement} />
              <View style={s.starBox}>
                {[
                  ["S", cv.achievement.situation],
                  ["T", cv.achievement.task],
                  ["A", cv.achievement.action],
                  ["R", cv.achievement.result],
                ]
                  .filter(([, v]) => Boolean(v))
                  .map(([label, txt], i) => (
                    <View key={i} style={s.starRow}>
                      <Text style={s.starLabel}>{label}</Text>
                      <Text style={s.starText}>{txt}</Text>
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
    bulletDot: { width: 8, fontSize: 10, color: TEAL },
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
        <Text style={s.name}>{cv.personal.full_name || ""}</Text>
        {contactBits.length > 0 ? (
          <Text style={s.headerContact}>{contactBits.join("   •   ")}</Text>
        ) : null}
        {socialBits.length > 0 ? (
          <Text style={s.headerContact}>{socialBits.join("   •   ")}</Text>
        ) : null}
        <View style={s.headerRule} />

        {cv.objective ? (
          <>
            <SectionHeader icon={StarIcon} title={L.objective} />
            <Text style={s.body}>{cv.objective}</Text>
          </>
        ) : null}

        {cv.experience.length > 0 && (
          <>
            <SectionHeader icon={BriefcaseIcon} title={L.experience} />
            {cv.experience.map((exp, i) => (
              <View key={i} style={s.expBlock}>
                <View style={s.rowBetween}>
                  <Text style={s.expRole}>{exp.role}</Text>
                  <Text style={s.expDuration}>{exp.duration}</Text>
                </View>
                <Text style={s.expCompany}>{exp.company}</Text>
                {bulletsFrom(exp.description).map((line, bi) => (
                  <View key={bi} style={s.bulletRow}>
                    <Text style={s.bulletDot}>•</Text>
                    <Text style={s.bulletText}>{line}</Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        {cv.education.length > 0 && (
          <>
            <SectionHeader icon={GraduationCapIcon} title={L.education} />
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
            <SectionHeader icon={AwardIcon} title={L.certificates} />
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
            <SectionHeader icon={StarIcon} title={L.skills} />
            <Text style={s.skillsLine}>
              {cv.skills.filter((sk) => sk.trim()).join("  ·  ")}
            </Text>
          </>
        )}

        {cv.languages.length > 0 && (
          <>
            <SectionHeader icon={GlobeIcon} title={L.languages} />
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
            <SectionHeader icon={TrophyIcon} title={L.hobbies} />
            <Text style={s.skillsLine}>
              {cv.hobbies.filter((h) => h.trim()).join("  ·  ")}
            </Text>
          </>
        )}

        {cv.achievement && (
          <>
            <SectionHeader icon={TrophyIcon} title={L.achievement} />
            {[
              ["S", cv.achievement.situation],
              ["T", cv.achievement.task],
              ["A", cv.achievement.action],
              ["R", cv.achievement.result],
            ]
              .filter(([, v]) => Boolean(v))
              .map(([label, txt], i) => (
                <View key={i} style={s.bulletRow}>
                  <Text style={[s.bulletDot, { fontWeight: 700 }]}>{label}</Text>
                  <Text style={s.bulletText}>{txt}</Text>
                </View>
              ))}
          </>
        )}
      </Page>
    </Document>
  );
}
