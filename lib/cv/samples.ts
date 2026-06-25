/**
 * Realistic sample CVs for the public `/samples` gallery. These mirror the
 * kind of worker VoiceCV is built for (Gulf labour & hospitality) so visitors
 * see a believable, finished result before they sign up. CVs always render in
 * English (the product's output language), so the data is English here too.
 */

import type { CVData } from "@/types/cv";

export const SAMPLE_CONSTRUCTION: CVData = {
  personal: {
    full_name: "Mohammed Imran",
    nationality: "Pakistani",
    city: "Riyadh",
    country: "Saudi Arabia",
    email: "m.imran@example.com",
    phone: "+966 50 123 4567",
  },
  socials: [],
  objective:
    "Reliable, safety-focused construction worker with 4 years of on-site experience in masonry and concrete work. Known for attention to detail and finishing projects on time.",
  experience: [
    {
      company: "Al-Rajhi Construction",
      role: "Mason",
      duration: "2021 – Present · 3 years",
      description:
        "Built and plastered brick and block walls for residential towers.\nMixed and poured concrete to specification.\nMentored two junior helpers on site safety.",
    },
    {
      company: "Saudi Build Co.",
      role: "Site Helper",
      duration: "2020 – 2021 · 1 year",
      description:
        "Assisted masons and carpenters with daily tasks.\nMoved materials and kept the site clean and safe.",
    },
  ],
  education: [
    {
      institution: "Government High School, Lahore",
      degree: "Secondary School Certificate",
      year: "2014",
    },
  ],
  certificates: [
    {
      name: "Basic Site Safety Training",
      issuer: "Contractor Safety Program",
      year: "2022",
    },
  ],
  skills: [
    "Masonry & bricklaying",
    "Plastering",
    "Concrete mixing",
    "Scaffolding",
    "Blueprint reading",
    "Forklift operation",
  ],
  languages: [
    { name: "Urdu", proficiency: "Fluent" },
    { name: "Arabic", proficiency: "Conversational" },
    { name: "English", proficiency: "Beginner" },
  ],
  hobbies: ["Cricket", "Volunteering at the local community centre"],
  achievement: {
    situation: "A residential tower was behind schedule before handover.",
    task: "Complete the block-work for three floors in two weeks.",
    action:
      "Organised the team into shifts and pre-staged materials each evening.",
    result: "Finished two days early with zero safety incidents.",
  },
};

export const SAMPLE_HOSPITALITY: CVData = {
  personal: {
    full_name: "Maria Santos",
    nationality: "Filipino",
    city: "Jeddah",
    country: "Saudi Arabia",
    email: "maria.santos@example.com",
    phone: "+966 55 987 6543",
  },
  socials: [],
  objective:
    "Dedicated housekeeping supervisor with 6 years in 5-star hospitality. Passionate about guest comfort, cleanliness standards, and training new team members.",
  experience: [
    {
      company: "Hilton Jeddah",
      role: "Housekeeping Supervisor",
      duration: "2020 – Present · 4 years",
      description:
        "Supervised a team of 8 room attendants across 120 rooms.\nMaintained 5-star cleanliness and inspection standards.\nReduced guest complaints by improving the turndown checklist.",
    },
    {
      company: "Mövenpick Hotel",
      role: "Room Attendant",
      duration: "2018 – 2020 · 2 years",
      description:
        "Cleaned and prepared guest rooms to brand standard.\nManaged linen and minibar inventory.",
    },
  ],
  education: [
    {
      institution: "STI College, Manila",
      degree: "Diploma in Hospitality Management",
      year: "2017",
    },
  ],
  certificates: [
    {
      name: "Food Safety & Hygiene, Level 2",
      issuer: "Highfield",
      year: "2021",
    },
  ],
  skills: [
    "Room inspection",
    "Team supervision",
    "Inventory management",
    "Guest service",
    "Laundry operations",
    "Health & safety",
  ],
  languages: [
    { name: "English", proficiency: "Fluent" },
    { name: "Tagalog", proficiency: "Fluent" },
    { name: "Arabic", proficiency: "Beginner" },
  ],
  hobbies: ["Cooking", "Reading"],
  achievement: {
    situation: "Guest satisfaction scores for cleanliness had dropped.",
    task: "Raise the housekeeping score above 90%.",
    action:
      "Introduced a double-check inspection and retrained the team on standards.",
    result: "Cleanliness scores rose to 94% within three months.",
  },
};
