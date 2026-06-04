import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { CVData, Language } from "@/types/cv";

// Register fonts. @react-pdf needs explicit registration; Google Fonts CDN URLs work.
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.ttf", fontWeight: 700 },
  ],
});

Font.register({
  family: "NotoArabic",
  fonts: [
    { src: "https://fonts.gstatic.com/s/notosansarabic/v18/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5l3sQWIHPqzCfyGyvuw.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/notosansarabic/v18/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5l3sQWIHPqzCfyGyvuw.ttf", fontWeight: 700 },
  ],
});

Font.register({
  family: "NotoUrdu",
  fonts: [
    { src: "https://fonts.gstatic.com/s/notonastaliqurdu/v20/LhWNMUPbN-oZdNFcBy1-DJYsEoTq5pudQ9L940pGPkB3Qg.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/notonastaliqurdu/v20/LhWNMUPbN-oZdNFcBy1-DJYsEoTq5pudQ9L940pGPkB3Qg.ttf", fontWeight: 700 },
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
    sectionTitleDark: {
      fontSize: 9,
      fontWeight: 700,
      color: TEAL,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      marginTop: 16,
      marginBottom: 6,
    },
    sectionTitle: {
      fontSize: 9,
      fontWeight: 700,
      color: "#0F766E",
      letterSpacing: 1.5,
      textTransform: "uppercase",
      marginBottom: 6,
      marginTop: 6,
    },
    contactRow: { color: "rgba(255,255,255,0.9)", fontSize: 10, marginBottom: 3 },
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
              <Text style={s.sectionTitleDark}>{L.contact}</Text>
              {cv.personal.email ? (
                <Text style={s.contactRow}>{cv.personal.email}</Text>
              ) : null}
              {cv.personal.phone ? (
                <Text style={s.contactRow}>{cv.personal.phone}</Text>
              ) : null}
              {cv.socials
                .filter((soc) => soc.url.trim())
                .map((soc, i) => {
                  try {
                    const u = new URL(
                      soc.url.startsWith("http") ? soc.url : `https://${soc.url}`,
                    );
                    const txt = (u.hostname.replace(/^www\./, "") + u.pathname).replace(/\/$/, "");
                    return <Text key={i} style={s.contactRow}>{txt}</Text>;
                  } catch {
                    return <Text key={i} style={s.contactRow}>{soc.url}</Text>;
                  }
                })}
            </>
          )}

          {cv.skills.length > 0 && (
            <>
              <Text style={s.sectionTitleDark}>{L.skills}</Text>
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
              <Text style={s.sectionTitleDark}>{L.languages}</Text>
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
              <Text style={s.sectionTitleDark}>{L.hobbies}</Text>
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
              <Text style={s.sectionTitle}>{L.objective}</Text>
              <Text style={s.objectiveBox}>{cv.objective}</Text>
            </>
          ) : null}

          {cv.experience.length > 0 && (
            <>
              <Text style={s.sectionTitle}>{L.experience}</Text>
              {cv.experience.map((exp, i) => (
                <View key={i} style={s.experienceItem}>
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
                </View>
              ))}
            </>
          )}

          {cv.education.length > 0 && (
            <>
              <Text style={s.sectionTitle}>{L.education}</Text>
              {cv.education.map((edu, i) => (
                <View key={i} style={s.educationItem}>
                  <Text style={s.timelineDot}>•</Text>
                  <View style={s.educationContent}>
                    <View style={s.rowBetween}>
                      <Text style={s.educationDegree}>{edu.degree}</Text>
                      <Text style={s.duration}>{edu.year}</Text>
                    </View>
                    <Text style={s.educationInstitution}>{edu.institution}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {cv.certificates.length > 0 && (
            <>
              <Text style={s.sectionTitle}>{L.certificates}</Text>
              {cv.certificates.map((c, i) => (
                <View key={i} style={s.educationItem}>
                  <Text style={s.timelineDot}>•</Text>
                  <View style={s.educationContent}>
                    <View style={s.rowBetween}>
                      <Text style={s.certName}>
                        {c.name}
                        {c.issuer ? <Text style={s.certIssuer}> · {c.issuer}</Text> : null}
                      </Text>
                      <Text style={s.duration}>{c.year}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}

          {cv.achievement && (
            <>
              <Text style={s.sectionTitle}>{L.achievement}</Text>
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
