import {
  Document,
  Page,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Language } from "@/types/cv";

// Same families/URLs as the CV PDF. Re-registering the same family is a no-op
// override, so this is safe whether or not the CV generator was loaded first.
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

export function CoverLetterDocument({
  name,
  body,
  language,
}: {
  name: string;
  body: string;
  language: Language;
}) {
  const rtl = language === "ar" || language === "ur";
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);

  const s = StyleSheet.create({
    page: {
      fontFamily: FONT_BY_LANG[language] ?? "Inter",
      fontSize: 11,
      color: "#1E293B",
      lineHeight: 1.6,
      paddingVertical: 64,
      paddingHorizontal: 56,
      direction: rtl ? "rtl" : "ltr",
    },
    name: {
      fontSize: 18,
      fontWeight: 700,
      color: "#0F172A",
      marginBottom: 6,
      textAlign: rtl ? "right" : "left",
    },
    rule: {
      borderBottomWidth: 2,
      borderBottomColor: "#14B8A6",
      width: 48,
      marginBottom: 22,
      alignSelf: rtl ? "flex-end" : "flex-start",
    },
    para: { marginBottom: 12, textAlign: rtl ? "right" : "left" },
  });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{name}</Text>
        <Text style={s.rule}> </Text>
        {paragraphs.map((p, i) => (
          <Text key={i} style={s.para}>
            {p}
          </Text>
        ))}
      </Page>
    </Document>
  );
}
