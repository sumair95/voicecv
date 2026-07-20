/**
 * Realistic sample CVs for the public `/samples` gallery. These mirror the
 * kind of worker VoiceCV is built for (Gulf labour & hospitality) so visitors
 * see a believable, finished result before they sign up. CVs always render in
 * English (the product's output language), so the data is English here too.
 *
 * Written to the house style: strong action verbs, quantified achievements,
 * no filler clichés — the same guidelines the AI follows.
 */

import type { CVData } from "@/types/cv";

export const SAMPLE_CONSTRUCTION: CVData = {
  personal: {
    full_name: "Mohammed Imran",
    job_title: "Mason & Construction Finisher",
    nationality: "Pakistani",
    city: "Riyadh",
    country: "Saudi Arabia",
    email: "m.imran@example.com",
    phone: "+966 50 123 4567",
  },
  socials: [],
  objective:
    "Mason with 4 years building residential and commercial structures across Riyadh, specialising in block-work, plastering, and concrete finishing. Completed multi-floor packages ahead of schedule while holding a zero-incident safety record over four years on site. Seeking a masonry role with an established Gulf contractor where quality finishing and reliable delivery matter.",
  experience: [
    {
      company: "Al-Rajhi Construction",
      role: "Mason",
      duration: "2021 – Present · 3 years",
      description:
        "Built and plastered brick and block walls for three 12-storey residential towers, meeting engineering tolerances on every handover.\nMixed and poured concrete to specification, keeping rework below 2% across all pours.\nRead structural drawings to set out walls, openings, and levels accurately without supervision.\nTrained and guided two junior helpers on finishing techniques and site-safety procedures.\nDelivered a three-floor block-work package two days ahead of the contract schedule.",
    },
    {
      company: "Saudi Build Co.",
      role: "Site Helper",
      duration: "2020 – 2021 · 1 year",
      description:
        "Supported masons and carpenters, keeping materials stocked and work stations ready before each shift.\nErected and dismantled scaffolding under supervision, following every safety check.\nMoved and stored materials efficiently, cutting the crew's daily material-search time.\nKept work areas clean and hazard-free, contributing to an incident-free site.",
    },
  ],
  education: [
    {
      institution: "Punjab Board of Technical Education, Lahore",
      degree: "Certificate in Masonry & Construction Trades",
      year: "2015",
    },
    {
      institution: "Government High School, Lahore",
      degree: "Secondary School Certificate (Matriculation), Science",
      year: "2014",
    },
  ],
  certificates: [
    {
      name: "Basic Site Safety Training (OSHA-aligned)",
      issuer: "Contractor Safety Program",
      year: "2022",
    },
    {
      name: "Scaffolding Awareness",
      issuer: "Al-Rajhi Construction",
      year: "2022",
    },
  ],
  skills: [
    "Masonry & bricklaying",
    "Plastering & rendering",
    "Concrete mixing & pouring",
    "Scaffolding",
    "Blueprint & drawing reading",
    "Forklift operation",
    "Site safety",
  ],
  languages: [
    { name: "Urdu", proficiency: "Fluent" },
    { name: "Arabic", proficiency: "Conversational" },
    { name: "English", proficiency: "Beginner" },
  ],
  hobbies: ["Cricket", "Volunteering at the local community centre"],
  achievements: [
    "Employee of the Month — Al-Rajhi Construction (2023)",
    "Completed a 3-floor block-work project two days ahead of schedule",
    "Maintained a zero-incident safety record across 4 years on site",
  ],
};

export const SAMPLE_DRIVER: CVData = {
  personal: {
    full_name: "Arjun Sharma",
    job_title: "Professional Delivery Driver",
    nationality: "Indian",
    city: "Dubai",
    country: "United Arab Emirates",
    email: "arjun.sharma@example.com",
    phone: "+971 50 222 3344",
  },
  socials: [],
  objective:
    "Professional driver with 5 years delivering goods and passengers across the UAE, holding a clean RTA record and detailed knowledge of Dubai's routes. Averaged 30+ deliveries a day at 98% on-time and earned a 4.9-star rating across 5,000+ passenger trips. Seeking a driving or last-mile logistics role with a growing delivery operation.",
  experience: [
    {
      company: "Talabat",
      role: "Delivery Driver",
      duration: "2021 – Present · 3 years",
      description:
        "Completed 30+ food and parcel deliveries per day at a 98% on-time rate through peak and Ramadan demand.\nPlanned efficient routes using GPS and live traffic data to cut average delivery time.\nHandled cash and digital payments accurately, reconciling daily takings with zero shortfalls.\nMaintained the vehicle to standard, logging daily checks and reporting faults early to avoid downtime.\nResolved delivery and address issues calmly, keeping customer ratings consistently high.",
    },
    {
      company: "Careem",
      role: "Captain (Driver)",
      duration: "2019 – 2021 · 2 years",
      description:
        "Drove passengers safely across Dubai, completing 5,000+ trips with no at-fault incidents.\nHeld a 4.9-star rider rating through courteous, on-time service.\nNavigated the city efficiently to minimise passenger wait and trip times.\nManaged fare collection and receipts accurately on every trip.",
    },
  ],
  education: [
    {
      institution: "Automobile Association of India",
      degree: "Certificate in Professional Driving & Road Safety",
      year: "2018",
    },
    {
      institution: "Delhi Public School",
      degree: "Higher Secondary Certificate (Commerce)",
      year: "2016",
    },
  ],
  certificates: [
    {
      name: "UAE Light Vehicle Driving Licence",
      issuer: "RTA Dubai",
      year: "2019",
    },
    {
      name: "Defensive Driving Course",
      issuer: "Emirates Driving Institute",
      year: "2020",
    },
  ],
  skills: [
    "Safe & defensive driving",
    "Route planning",
    "GPS navigation",
    "Customer service",
    "Cash & digital payments",
    "Vehicle maintenance checks",
    "Time management",
  ],
  languages: [
    { name: "Hindi", proficiency: "Fluent" },
    { name: "English", proficiency: "Conversational" },
    { name: "Arabic", proficiency: "Beginner" },
  ],
  hobbies: ["Cricket", "Cooking"],
  achievements: [
    "Top Driver of the Quarter — Talabat (Q2 2023)",
    "Maintained a 98% on-time delivery rate over 3 years",
    "4.9-star average customer rating across 5,000+ trips",
  ],
};

export const SAMPLE_HOSPITALITY: CVData = {
  personal: {
    full_name: "Maria Santos",
    job_title: "Housekeeping Supervisor",
    nationality: "Filipino",
    city: "Jeddah",
    country: "Saudi Arabia",
    email: "maria.santos@example.com",
    phone: "+966 55 987 6543",
  },
  socials: [],
  objective:
    "Housekeeping supervisor with 6 years in 5-star hotels, leading room-attendant teams and holding cleanliness and inspection standards. Raised audit scores from 82% to 94% and trained 12 new attendants to brand standard within their first two weeks. Seeking a supervisory housekeeping role with an international hospitality group in the Gulf.",
  experience: [
    {
      company: "Hilton Jeddah",
      role: "Housekeeping Supervisor",
      duration: "2020 – Present · 4 years",
      description:
        "Led a team of 8 room attendants servicing 120 rooms daily to 5-star standard.\nRaised housekeeping audit scores from 82% to 94% within three months by tightening inspection routines.\nCut guest cleanliness complaints by redesigning the turndown and room-inspection checklist.\nManaged linen, amenity, and cleaning-supply inventory, reducing waste and stockouts.\nTrained and onboarded 12 new attendants, bringing them to brand standard within two weeks.",
    },
    {
      company: "Mövenpick Hotel",
      role: "Room Attendant",
      duration: "2018 – 2020 · 2 years",
      description:
        "Cleaned and prepared up to 16 guest rooms per shift to brand standard.\nManaged linen and minibar inventory, reporting discrepancies promptly.\nResponded quickly to guest requests, supporting high satisfaction scores.\nFollowed health, safety, and hygiene procedures on every shift.",
    },
  ],
  education: [
    {
      institution: "STI College, Manila",
      degree: "Diploma in Hospitality Management",
      year: "2017",
    },
    {
      institution: "TESDA, Manila",
      degree: "National Certificate II (NC II) in Housekeeping",
      year: "2016",
    },
  ],
  certificates: [
    {
      name: "Food Safety & Hygiene, Level 2",
      issuer: "Highfield",
      year: "2021",
    },
    {
      name: "Guest Service Excellence",
      issuer: "Hilton Worldwide",
      year: "2022",
    },
  ],
  skills: [
    "Team supervision & training",
    "Room inspection & audits",
    "Inventory management",
    "Guest service",
    "Laundry & linen operations",
    "Health & safety compliance",
  ],
  languages: [
    { name: "English", proficiency: "Fluent" },
    { name: "Tagalog", proficiency: "Fluent" },
    { name: "Arabic", proficiency: "Beginner" },
  ],
  hobbies: ["Cooking", "Reading"],
  achievements: [
    "Raised housekeeping cleanliness scores from 82% to 94% in 3 months",
    "Employee of the Year nominee — Hilton Jeddah (2022)",
    "Trained 12 new room attendants to brand standard",
  ],
};
