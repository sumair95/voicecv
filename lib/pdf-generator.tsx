import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { CVData, Language } from "@/types/cv";

// Embed an Arabic-supporting font (Noto Sans Arabic) and Inter for Latin.
// Using Google's hosted Noto Sans + Noto Sans Arabic so @react-pdf can render RTL text.
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

const NAVY = "#0F172A";
const TEAL = "#14B8A6";
const MUTED = "#64748B";

function styles(isRtl: boolean) {
  const fontFamily = isRtl ? "NotoArabic" : "Inter";
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
    city: { fontSize: 10, color: "rgba(255,255,255,0.8)", textAlign: "center", marginTop: 4 },
    sectionTitleDark: {
      fontSize: 9,
      fontWeight: 700,
      color: TEAL,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      marginTop: 18,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 9,
      fontWeight: 700,
      color: "#0F766E",
      letterSpacing: 1.5,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    contactRow: { color: "rgba(255,255,255,0.9)", fontSize: 10, marginBottom: 4 },
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
    sidebarLanguage: { color: "rgba(255,255,255,0.9)", fontSize: 10, marginBottom: 3 },
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
      fontStyle: "italic",
      color: "#475569",
      marginTop: 4,
      marginBottom: 16,
    },
    experienceItem: { marginBottom: 12 },
    role: { fontSize: 12, fontWeight: 700, color: NAVY },
    company: { fontSize: 10, fontWeight: 600, color: "#0F766E", marginTop: 2 },
    duration: { fontSize: 9, color: MUTED },
    description: { fontSize: 10, color: "#334155", marginTop: 4, lineHeight: 1.4 },
    educationItem: { marginBottom: 8 },
    educationDegree: { fontSize: 11, fontWeight: 700, color: NAVY },
    educationInstitution: { fontSize: 10, color: "#334155" },
    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
    skillRow: { flexDirection: "row", flexWrap: "wrap" },
    iconCircle: {
      width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFF",
      borderColor: TEAL, borderWidth: 2,
      marginRight: 6,
    },
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export function CVDocument({ cv, language }: { cv: CVData; language: Language }) {
  const isRtl = language === "ar";
  const s = styles(isRtl);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.sidebar}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials(cv.personal.full_name)}</Text>
          </View>
          <Text style={s.name}>{cv.personal.full_name || ""}</Text>
          {cv.personal.city ? <Text style={s.city}>{cv.personal.city}</Text> : null}
          <View style={s.divider} />

          <Text style={s.sectionTitleDark}>Contact</Text>
          {cv.personal.email ? <Text style={s.contactRow}>{cv.personal.email}</Text> : null}
          {cv.personal.phone ? <Text style={s.contactRow}>{cv.personal.phone}</Text> : null}

          {cv.skills.length > 0 && (
            <>
              <Text style={s.sectionTitleDark}>Skills</Text>
              <View style={s.skillRow}>
                {cv.skills.map((skill, i) => (
                  <Text key={i} style={s.skill}>{skill}</Text>
                ))}
              </View>
            </>
          )}

          {cv.languages.length > 0 && (
            <>
              <Text style={s.sectionTitleDark}>Languages</Text>
              {cv.languages.map((lng, i) => (
                <Text key={i} style={s.sidebarLanguage}>{lng}</Text>
              ))}
            </>
          )}
        </View>

        <View style={s.main}>
          {cv.objective ? (
            <>
              <Text style={s.sectionTitle}>{isRtl ? "الهدف المهني" : "Objective"}</Text>
              <Text style={s.objectiveBox}>{cv.objective}</Text>
            </>
          ) : null}

          {cv.experience.length > 0 && (
            <>
              <Text style={s.sectionTitle}>{isRtl ? "الخبرة العملية" : "Work Experience"}</Text>
              {cv.experience.map((exp, i) => (
                <View key={i} style={s.experienceItem}>
                  <View style={s.rowBetween}>
                    <Text style={s.role}>{exp.role}</Text>
                    <Text style={s.duration}>{exp.duration}</Text>
                  </View>
                  <Text style={s.company}>{exp.company}</Text>
                  {exp.description ? <Text style={s.description}>{exp.description}</Text> : null}
                </View>
              ))}
            </>
          )}

          {cv.education.length > 0 && (
            <>
              <Text style={s.sectionTitle}>{isRtl ? "التعليم" : "Education"}</Text>
              {cv.education.map((edu, i) => (
                <View key={i} style={s.educationItem}>
                  <View style={s.rowBetween}>
                    <Text style={s.educationDegree}>{edu.degree}</Text>
                    <Text style={s.duration}>{edu.year}</Text>
                  </View>
                  <Text style={s.educationInstitution}>{edu.institution}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      </Page>
    </Document>
  );
}
