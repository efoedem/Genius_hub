import { Cpu, Code2, BookOpenText, Printer, type LucideIcon } from "lucide-react";

export interface ServiceInfo {
  key: "engineering" | "it" | "research" | "assignment";
  slug: string;
  title: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  offerings: { name: string; detail: string }[];
  formats: string[];
}

export const SERVICES: ServiceInfo[] = [
  {
    key: "engineering",
    slug: "engineering-projects",
    title: "Engineering Projects",
    tagline: "CAD, MATLAB & Simulink, design and analysis",
    description:
      "From detailed AutoCAD and SolidWorks drawings to MATLAB scripts and Simulink models, we deliver accurate, well-documented engineering work for final-year projects, coursework and industry jobs.",
    icon: Cpu,
    offerings: [
      { name: "CAD drawings", detail: "2D drafting, 3D models, assemblies and technical sheets." },
      { name: "MATLAB / Simulink", detail: ".m scripts and .slx models with plots and explanations." },
      { name: "Design & analysis", detail: "Circuit, structural, control and system calculations." },
      { name: "Project reports", detail: "Methodology, results and discussion write-ups." },
    ],
    formats: [".slx", ".m", ".dwg (zipped)", ".pdf", ".docx"],
  },
  {
    key: "it",
    slug: "it-services",
    title: "IT Services",
    tagline: "Software, code, websites & troubleshooting",
    description:
      "Need a website, an app feature, a bug fixed or a laptop sorted? Our IT desk handles programming assignments, small business software, web builds and on-site troubleshooting.",
    icon: Code2,
    offerings: [
      { name: "Programming", detail: "Python, Java, C/C++, JavaScript and database work." },
      { name: "Web development", detail: "Landing pages, portfolios and business sites." },
      { name: "Troubleshooting", detail: "OS installs, software setup, virus removal, networking." },
      { name: "Software installs", detail: "MATLAB, AutoCAD, Office and engineering tools." },
    ],
    formats: [".zip", ".pdf", ".docx", ".png", ".jpg"],
  },
  {
    key: "research",
    slug: "academic-research",
    title: "Academic Research Support",
    tagline: "Papers, data analysis & referencing",
    description:
      "Guidance and support for theses, project write-ups and research papers — structuring, data analysis (SPSS, Excel, Python), proofreading and APA/IEEE/Harvard referencing.",
    icon: BookOpenText,
    offerings: [
      { name: "Research structuring", detail: "Chapters, literature review outlines and methodology." },
      { name: "Data analysis", detail: "SPSS, Excel, Python and R with clear interpretations." },
      { name: "Referencing", detail: "APA, IEEE, Harvard — formatted and checked." },
      { name: "Proofreading", detail: "Grammar, flow and formatting to your school's template." },
    ],
    formats: [".pdf", ".docx", ".zip"],
  },
  {
    key: "assignment",
    slug: "assignments-typing",
    title: "Assignments & Typing",
    tagline: "Typing, formatting, printing & binding",
    description:
      "Fast, neat typing and formatting of handwritten or scanned work, plus high-quality printing, spiral and hard-cover binding — ready for pick-up at the shop.",
    icon: Printer,
    offerings: [
      { name: "Typing", detail: "Handwritten notes and scans typed and formatted." },
      { name: "Formatting", detail: "Cover pages, contents, headings, numbering." },
      { name: "Printing", detail: "Black & white and colour printing." },
      { name: "Binding", detail: "Spiral, comb and hard-cover binding." },
    ],
    formats: [".pdf", ".docx", ".png", ".jpg"],
  },
];

export const serviceBySlug = (slug: string) => SERVICES.find((s) => s.slug === slug);
export const serviceByKey = (key: string) => SERVICES.find((s) => s.key === key);

export const ORDER_STATUSES = [
  { key: "received", label: "Received" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
] as const;
