import {
  Document,
  Page,
  Text,
  View,
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
  contact,
}: {
  name: string;
  body: string;
  language: Language;
  contact?: string;
}) {
  const rtl = language === "ar" || language === "ur";
  // Split into blocks on blank lines; KEEP single line breaks inside a block
  // (react-pdf <Text> honours \n) so the recipient block + signature stack.
  const blocks = body
    .split(/\n{2,}/)
    .map((b) => b.replace(/[ \t]+\n/g, "\n").trim())
    .filter(Boolean);

  const s = StyleSheet.create({
    page: {
      fontFamily: FONT_BY_LANG[language] ?? "Inter",
      fontSize: 11,
      color: "#334155",
      lineHeight: 1.55,
      paddingVertical: 56,
      paddingHorizontal: 56,
      direction: rtl ? "rtl" : "ltr",
    },
    name: {
      fontSize: 22,
      fontWeight: 700,
      color: "#0F766E", // teal
      textAlign: rtl ? "right" : "left",
    },
    contact: {
      fontSize: 9.5,
      color: "#64748B",
      marginTop: 4,
      textAlign: rtl ? "right" : "left",
    },
    rule: {
      borderBottomWidth: 1.5,
      borderBottomColor: "#0F766E",
      marginTop: 8,
      marginBottom: 20,
    },
    para: { marginBottom: 11, textAlign: rtl ? "right" : "left" },
    reLine: {
      marginBottom: 11,
      fontWeight: 700,
      color: "#0F766E",
      textAlign: rtl ? "right" : "left",
    },
  });

  const isRe = (b: string) => /^re\s*:/i.test(b);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{name}</Text>
        {contact ? <Text style={s.contact}>{contact}</Text> : null}
        <View style={s.rule} />
        {blocks.map((b, i) => (
          <Text key={i} style={isRe(b) ? s.reLine : s.para}>
            {b}
          </Text>
        ))}
      </Page>
    </Document>
  );
}
