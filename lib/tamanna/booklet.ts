/**
 * Interpretation content taken ONLY from the Tamanna Guide for Teachers and Parents (NCERT):
 * Section 2 (what each test covers), Appendix VI (Sten descriptions), VII (occupations), VIII (areas).
 * Wording is condensed. Do not add content from any other source (see memory-bank/booklet-source.md).
 */
import type { Band } from "@/lib/tamanna/norms";

export const DESCRIPTIONS: Record<string, Record<Band, string>> = {
  LA: { Low: "Below average aptitude in understanding English words, spelling, synonyms, and the meaning of proverbs and idioms.",
        Average: "Average aptitude in understanding English vocabulary and using verbal skills in everyday life.",
        High: "High aptitude in understanding and using the English language. Indicates a good vocabulary and understanding of synonyms and proverbs." },
  AR: { Low: "Below average aptitude in logical reasoning through understanding relationships among patterns, symbols or shapes.",
        Average: "Average aptitude in applying logical reasoning, moving from specific information to a general concept.",
        High: "High aptitude in understanding abstract figures, including logical reasoning for relationships and solving problems quickly with abstract patterns in everyday life." },
  VR: { Low: "Below average aptitude in applying reasoning to word relations and drawing meaning from written information.",
        Average: "Average aptitude in understanding word relations and written information and applying them to other situations.",
        High: "High aptitude. Reflects well above average skill in understanding word relations and written information and applying them to similar situations." },
  MR: { Low: "Below average aptitude in applying reasoning to solve problems in practical situations that use mechanical concepts.",
        Average: "Average aptitude in being aware of basic mechanical concepts and applying them in daily life.",
        High: "High aptitude in successfully applying reasoning to solve problems in practical situations where mechanical concepts are used." },
  NA: { Low: "Below average aptitude in correctly and quickly solving problems of primary arithmetic operations and numerical relationships.",
        Average: "Average aptitude in quickly understanding and solving numerical computation tasks.",
        High: "High aptitude in rapidly and accurately working with numbers to solve arithmetic tasks in everyday life." },
  SA: { Low: "Below average aptitude in perceiving and judging relationships among visual patterns by imagining them mentally.",
        Average: "Average aptitude in judging the orientation of figures in different circumstances and visualising objects in 3 dimensions.",
        High: "High aptitude in understanding and grasping relationships among objects in 3 dimensions." },
  PA: { Low: "Below average aptitude in quickly and accurately perceiving visual information such as letters and numbers.",
        Average: "Average aptitude in comparing visual information and perceiving it accurately.",
        High: "High aptitude in quickly and accurately perceiving visual information." },
};

/** Section 2: courses and occupations for which each aptitude is important. */
export const SUBJECTS: Record<string, string[]> = {
  LA: ["Social sciences", "Economics", "Mathematics", "Teaching", "Journalism and media studies", "Advertising", "Law", "Library sciences", "Stenography", "Business development"],
  AR: ["Mathematics", "Economics", "Physics", "Chemistry", "Computer science", "Biotechnology", "Computer systems analysis", "Computer programming", "Architecture", "Medicine", "Mechanics", "Forensic science"],
  VR: ["Languages", "History", "Geography", "Economics", "Business studies", "Science", "Psychology", "Education", "Journalism", "Law", "Public relations", "Marketing", "Advertising", "Linguistics", "Medical and paramedical fields", "Administrative services", "Human resources management", "Auctioneering"],
  MR: ["Physics", "Chemistry", "Engineering", "Carpentry", "Masonry", "Plumbing"],
  NA: ["Mathematics", "Economics", "Accountancy", "Computer sciences", "Statistics", "All types of engineering", "Architecture", "Computer applications", "Oceanography", "Geology", "Meteorology", "Actuarial sciences"],
  SA: ["Visual and performing arts", "Engineering", "Physics", "Chemistry", "Geometry", "Geography", "Drafting", "Architecture", "Astronomy", "Animation", "Designing", "Urban and town planning", "Photography", "Multimedia"],
  PA: ["Traffic police", "Detective work", "Data entry operations", "Clerical and secretarial work", "Personal assistantship", "Assembly work", "Machine operating and coding", "Banking", "Proof reading", "Computer programming", "Record keeping"],
};

/** Appendix VIII: educational and vocational areas. */
export const AREAS: Record<string, string> = {
  LA: "reading and writing, teaching, journalism and media studies, advertising, law, library science, stenography, business development, travel and tourism",
  AR: "mathematics, computer programming, architecture, law, medicine, economics, mechanics, forensic science",
  VR: "psychology, speech therapy, auctioneering, advertising, linguistics, business, law, education, public relations, marketing, journalism",
  MR: "machinery, electrical, civil and automobile engineering, carpentry, electrician, machine operator, physics, chemistry",
  NA: "all types of engineering, architecture, oceanography, geology, meteorology, biosciences, health sciences, statistics, natural sciences, banking",
  SA: "manufacturing industry, drafting, designing (fashion, interior, toys and games, jewellery, urban planning, landscape), architecture, astronomy, visual arts, animation, multimedia art",
  PA: "bank teller, accountancy, computer programming, police detective work, data entry, assembly work, record keeping, dispatching, filing",
};

/** Appendix VII: occupations and their related aptitudes (as printed). */
const O = (name: string, a: string) => ({ name, aptitudes: a.split(" ") });
export const OCCUPATIONS = [
  O("Accountant", "NA AR PA"), O("Agricultural Scientist", "AR NA MR LA"), O("Air Hostess", "LA VR AR"), O("Air Traffic Control Officer", "NA AR SA LA"),
  O("Animator", "SA AR VR"), O("Architect", "NA MR SA AR"), O("Banker", "NA AR PA LA"), O("Beautician", "LA VR SA"), O("BPO Associate", "LA PA AR VR"),
  O("Chartered Accountant", "NA PA AR"), O("Civil Servant", "AR VR LA PA"), O("Company Secretary", "AR VR NA PA"), O("Computer Programmer", "NA PA AR VR"),
  O("Corporate Lawyer", "VR LA AR NA PA"), O("Counsellor", "VR LA AR"), O("Dietician", "AR LA SA NA"), O("Event Planner", "LA SA AR NA"),
  O("Fashion Designer", "SA AR NA LA"), O("Forensic Scientist", "AR NA PA"), O("Graphic Designer", "SA PA NA AR"), O("Hotel Manager", "VR LA NA AR"),
  O("Jewellery Designer", "SA PA LA NA"), O("Journalist", "LA VR AR NA"), O("Laboratory Assistant", "MR NA AR"), O("Mobile App Developer", "NA MR AR SA PA LA"),
  O("Naval Officer", "NA AR SA VR LA PA"), O("Nurse", "AR LA PA NA"), O("Optician", "NA PA SA"), O("Photographer", "SA PA AR"), O("Physiotherapist", "NA LA AR VR"),
  O("Pilot", "AR PA SA NA MR LA"), O("Police Officer", "AR PA LA VR"), O("Retail Manager", "LA PA AR NA"), O("Radio and TV Anchor", "LA VR AR PA"),
  O("Tourist Guide", "LA AR NA"), O("Teacher", "LA VR AR PA"), O("Travel Agent", "LA AR VR NA"), O("Security Guard", "SA AR PA"),
];

export const NOTES = {
  suggestive: "These scores only suggest a student's potential. They should not be the only basis for choosing subjects, and the school and parents should not use them to choose subjects for the student.",
  cluster: "A cluster of aptitudes is needed to do well in a course of study or an occupation, so a choice should not rest on one aptitude alone. The courses and occupations listed are examples only.",
  noPassFail: "There is no pass or fail in this test.",
  noHigh: "Not scoring high on any sub-test does not mean a lack of ability to pursue further education or training. Self-exploration, taking part in school activities of interest, career-planning sessions and meeting the school counsellor can help in making suitable career choices.",
  source: "Prepared only from Tamanna: An Aptitude Test for Senior School Students, Guide for Teachers and Parents (NCERT): Sten norms (Appendix IV and V), descriptions (Appendix VI), occupations (Appendix VII) and areas (Appendix VIII).",
};
