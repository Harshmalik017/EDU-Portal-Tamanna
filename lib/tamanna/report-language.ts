import { AREAS, DESCRIPTIONS, NOTES, SUBJECTS } from "@/lib/tamanna/booklet";
import type { Band } from "@/lib/tamanna/norms";
import type { Profile } from "@/lib/tamanna/profile";

export type ReportLanguage = "hi" | "en";
export type ReportStudent = Omit<import("@/lib/types").Student, "name">;

const en = {
  title: "Aptitude Test Report", roll: "Roll", page: "Page", of: "of", rollNo: "Roll No.",
  class: "Class", gender: "Gender", school: "School", block: "Block", district: "District",
  recorded: "As recorded on answer sheet", missing: "Not recorded", serial: "S. No.", test: "Sub-Test",
  score: "Score Obtained", sten: "Sten Score", performance: "Performance", profile: "Aptitude Profile",
  norms: "Norms applied", bands: "Performance bands as per Appendix VI: Sten 1–3 Low, 4–7 Average, 8–10 High.",
  meaning: "What each score means", nearHigh: "Near high", subjects: "Subjects", fields: "Related fields",
  noSten: "Review Pending: no final Sten score available for this sub-test.", remarks: "Suggestions / Remarks",
  occupations: "Recommended occupations", signature: "Teacher's Signature",
  meaningSource: "Source: Tamanna Guide for Teachers and Parents, Section 2 and Appendices VI–VIII.",
  remarksSource: "Source: Tamanna Guide for Teachers and Parents, Section 5 (p. 11), Appendices VII–VIII.",
  tick: "✓ marks an aptitude where the student scored High (Sten 8–10) or Average close to High (Sten 7). No recommendations are given for other Average or Low scores.",
  chart: "Sten scores by sub-test, grouped into Low, Average and High performance bands",
  legend: "Sten performance bands", language: "Report language", print: "Print or save as PDF",
  close: "Close report", excluded: "Excluded sheet: no interpretation is available.",
  reviewPending: "Review Pending", reviewRequired: "Complete OMR sheet review before opening the report.", reviewSheet: "Review OMR sheet",
};
const hi: typeof en = {
  reviewPending: "समीक्षा लंबित", reviewRequired: "रिपोर्ट खोलने से पहले ओएमआर उत्तर पत्रक की समीक्षा पूरी करें।", reviewSheet: "ओएमआर उत्तर पत्रक की समीक्षा करें",
  title: "अभिक्षमता परीक्षण रिपोर्ट", roll: "अनुक्रमांक", page: "पृष्ठ", of: "में से", rollNo: "अनुक्रमांक",
  class: "कक्षा", gender: "लिंग", school: "विद्यालय", block: "विकास खंड", district: "जनपद",
  recorded: "उत्तर पुस्तिका के अनुसार", missing: "दर्ज नहीं है", serial: "क्र. सं.", test: "उप-परीक्षण",
  score: "प्राप्त अंक", sten: "स्टेन स्कोर", performance: "निष्पादन", profile: "अभिक्षमता प्रोफाइल",
  norms: "प्रयुक्त मानक", bands: "परिशिष्ट VI के अनुसार निष्पादन स्तर: स्टेन 1–3 निम्न, 4–7 औसत, 8–10 उच्च।",
  meaning: "प्रत्येक स्कोर का अर्थ", nearHigh: "उच्च स्तर के निकट", subjects: "विषय", fields: "संबंधित क्षेत्र",
  noSten: "समीक्षा लंबित: इस उप-परीक्षण का अंतिम स्टेन स्कोर उपलब्ध नहीं है।", remarks: "सुझाव / टिप्पणियाँ",
  occupations: "सुझाए गए व्यवसाय", signature: "शिक्षक के हस्ताक्षर",
  meaningSource: "स्रोत: तमन्ना शिक्षक एवं अभिभावक मार्गदर्शिका, खंड 2 तथा परिशिष्ट VI–VIII।",
  remarksSource: "स्रोत: तमन्ना शिक्षक एवं अभिभावक मार्गदर्शिका, खंड 5 (पृ. 11), परिशिष्ट VII–VIII।",
  tick: "✓ उस अभिक्षमता को दर्शाता है जिसमें उच्च (स्टेन 8–10) या उच्च के निकट औसत (स्टेन 7) स्कोर है। अन्य औसत या निम्न स्कोर के लिए सुझाव नहीं दिए गए हैं।",
  chart: "उप-परीक्षण के स्टेन स्कोर: निम्न, औसत और उच्च निष्पादन स्तर",
  legend: "स्टेन निष्पादन स्तर", language: "रिपोर्ट की भाषा", print: "प्रिंट करें या PDF सहेजें",
  close: "रिपोर्ट बंद करें", excluded: "पुस्तिका बाहर रखी गई है: व्याख्या उपलब्ध नहीं है।",
};
export const reportLabels = (language: ReportLanguage) => language === "hi" ? hi : en;
export const bandLabel = (band: Band, language: ReportLanguage) => language === "en" ? band : ({ Low: "निम्न", Average: "औसत", High: "उच्च" } as const)[band];
export const genderLabel = (gender: string, language: ReportLanguage) => language === "en" ? gender : gender === "Male" ? "बालक" : gender === "Female" ? "बालिका" : "निर्दिष्ट नहीं";
const names: Record<string, string> = { LA: "भाषा अभिक्षमता", AR: "अमूर्त तर्क", VR: "शाब्दिक तर्क", MR: "यांत्रिक तर्क", NA: "संख्यात्मक अभिक्षमता", SA: "स्थानिक अभिक्षमता", PA: "अवधारणात्मक अभिक्षमता" };
export const testLabel = (code: string, english: string, language: ReportLanguage) => language === "en" ? english : required(names, code);
function required(dictionary: Record<string, string>, key: string): string {
  const value = dictionary[key];
  if (!value) throw new Error(`Could not find Hindi report translation for ${key}.`);
  return value;
}

const descriptions: typeof DESCRIPTIONS = {
  LA: { Low: "अंग्रेजी शब्दों, वर्तनी, समानार्थी शब्दों, कहावतों और मुहावरों का अर्थ समझने की अभिक्षमता औसत से कम है।", Average: "अंग्रेजी शब्दावली समझने और दैनिक जीवन में शाब्दिक कौशल का उपयोग करने की औसत अभिक्षमता है।", High: "अंग्रेजी भाषा को समझने और उपयोग करने की उच्च अभिक्षमता है। अच्छी शब्दावली तथा समानार्थी शब्दों और कहावतों की समझ दर्शाती है।" },
  AR: { Low: "प्रतिरूपों, प्रतीकों या आकृतियों के संबंध समझकर तार्किक चिंतन करने की अभिक्षमता औसत से कम है।", Average: "विशिष्ट जानकारी से सामान्य अवधारणा तक पहुँचते हुए तार्किक चिंतन लागू करने की औसत अभिक्षमता है।", High: "अमूर्त आकृतियों और उनके संबंधों को समझने तथा दैनिक जीवन में अमूर्त प्रतिरूपों से समस्याएँ जल्दी हल करने की उच्च अभिक्षमता है।" },
  VR: { Low: "शब्द संबंधों पर तर्क करने और लिखित जानकारी का अर्थ निकालने की अभिक्षमता औसत से कम है।", Average: "शब्द संबंधों और लिखित जानकारी को समझकर अन्य स्थितियों में लागू करने की औसत अभिक्षमता है।", High: "शब्द संबंधों और लिखित जानकारी को समझकर समान स्थितियों में लागू करने का कौशल औसत से काफी अधिक है।" },
  MR: { Low: "यांत्रिक अवधारणाओं वाली व्यावहारिक स्थितियों की समस्याएँ तर्क द्वारा हल करने की अभिक्षमता औसत से कम है।", Average: "मूल यांत्रिक अवधारणाओं को जानने और दैनिक जीवन में लागू करने की औसत अभिक्षमता है।", High: "यांत्रिक अवधारणाओं वाली व्यावहारिक स्थितियों में समस्याएँ तर्क द्वारा सफलतापूर्वक हल करने की उच्च अभिक्षमता है।" },
  NA: { Low: "प्रारंभिक अंकगणितीय संक्रियाओं और संख्यात्मक संबंधों की समस्याएँ सही और शीघ्र हल करने की अभिक्षमता औसत से कम है।", Average: "संख्यात्मक गणना के कार्यों को शीघ्र समझने और हल करने की औसत अभिक्षमता है।", High: "दैनिक जीवन के अंकगणितीय कार्यों में संख्याओं का शीघ्र और सही उपयोग करने की उच्च अभिक्षमता है।" },
  SA: { Low: "दृश्य प्रतिरूपों के संबंधों को मन में कल्पना करके समझने और परखने की अभिक्षमता औसत से कम है।", Average: "अलग-अलग परिस्थितियों में आकृतियों की दिशा समझने और वस्तुओं की त्रिआयामी कल्पना करने की औसत अभिक्षमता है।", High: "त्रिआयामी वस्तुओं के बीच संबंधों को समझने की उच्च अभिक्षमता है।" },
  PA: { Low: "अक्षरों और अंकों जैसी दृश्य जानकारी को शीघ्र और सही पहचानने की अभिक्षमता औसत से कम है।", Average: "दृश्य जानकारी की तुलना करने और उसे सही पहचानने की औसत अभिक्षमता है।", High: "दृश्य जानकारी को शीघ्र और सही पहचानने की उच्च अभिक्षमता है।" },
};
export const descriptionFor = (code: string, band: Band, language: ReportLanguage) => (language === "hi" ? descriptions : DESCRIPTIONS)[code][band];
const terms: Record<string, string> = {
  "Social sciences": "सामाजिक विज्ञान", "Economics": "अर्थशास्त्र", "Mathematics": "गणित", "Teaching": "शिक्षण",
  "Journalism and media studies": "पत्रकारिता एवं मीडिया अध्ययन", "Advertising": "विज्ञापन", "Law": "विधि",
  "Library sciences": "पुस्तकालय विज्ञान", "Stenography": "आशुलिपि", "Business development": "व्यवसाय विकास",
  "Physics": "भौतिक विज्ञान", "Chemistry": "रसायन विज्ञान", "Computer science": "कंप्यूटर विज्ञान", "Biotechnology": "जैव प्रौद्योगिकी",
  "Computer systems analysis": "कंप्यूटर प्रणाली विश्लेषण", "Computer programming": "कंप्यूटर प्रोग्रामिंग", "Architecture": "वास्तुकला",
  "Medicine": "चिकित्सा", "Mechanics": "यांत्रिकी", "Forensic science": "न्यायालयिक विज्ञान",
  "Languages": "भाषाएँ", "History": "इतिहास", "Geography": "भूगोल", "Business studies": "व्यवसाय अध्ययन",
  "Science": "विज्ञान", "Psychology": "मनोविज्ञान", "Education": "शिक्षा", "Journalism": "पत्रकारिता",
  "Public relations": "जनसंपर्क", "Marketing": "विपणन", "Linguistics": "भाषाविज्ञान",
  "Medical and paramedical fields": "चिकित्सा एवं सहायक चिकित्सा क्षेत्र", "Administrative services": "प्रशासनिक सेवाएँ",
  "Human resources management": "मानव संसाधन प्रबंधन", "Auctioneering": "नीलामी संचालन",
  "Engineering": "अभियांत्रिकी", "Carpentry": "बढ़ई कार्य", "Masonry": "राजमिस्त्री कार्य", "Plumbing": "नलसाजी",
  "Accountancy": "लेखांकन", "Computer sciences": "कंप्यूटर विज्ञान", "Statistics": "सांख्यिकी",
  "All types of engineering": "सभी प्रकार की अभियांत्रिकी", "Computer applications": "कंप्यूटर अनुप्रयोग",
  "Oceanography": "समुद्र विज्ञान", "Geology": "भूविज्ञान", "Meteorology": "मौसम विज्ञान", "Actuarial sciences": "बीमांकिक विज्ञान",
  "Visual and performing arts": "दृश्य एवं प्रदर्शन कलाएँ", "Geometry": "ज्यामिति", "Drafting": "प्रारूपण",
  "Astronomy": "खगोल विज्ञान", "Animation": "एनीमेशन", "Designing": "अभिकल्पना", "Urban and town planning": "नगर नियोजन",
  "Photography": "फोटोग्राफी", "Multimedia": "मल्टीमीडिया", "Traffic police": "यातायात पुलिस",
  "Detective work": "जासूसी कार्य", "Data entry operations": "डेटा प्रविष्टि कार्य", "Clerical and secretarial work": "लिपिकीय एवं सचिवीय कार्य",
  "Personal assistantship": "निजी सहायक कार्य", "Assembly work": "संयोजन कार्य", "Machine operating and coding": "मशीन संचालन एवं कोडिंग",
  "Banking": "बैंकिंग", "Proof reading": "प्रूफ पठन", "Record keeping": "अभिलेख रखरखाव",
  "Accountant": "लेखाकार", "Agricultural Scientist": "कृषि वैज्ञानिक", "Air Hostess": "विमान परिचारिका",
  "Air Traffic Control Officer": "वायु यातायात नियंत्रण अधिकारी", "Animator": "एनीमेटर", "Architect": "वास्तुकार",
  "Banker": "बैंक अधिकारी", "Beautician": "सौंदर्य विशेषज्ञ", "BPO Associate": "बीपीओ सहयोगी",
  "Chartered Accountant": "चार्टर्ड अकाउंटेंट", "Civil Servant": "सिविल सेवा अधिकारी", "Company Secretary": "कंपनी सचिव",
  "Computer Programmer": "कंप्यूटर प्रोग्रामर", "Corporate Lawyer": "कॉर्पोरेट अधिवक्ता", "Counsellor": "परामर्शदाता",
  "Dietician": "आहार विशेषज्ञ", "Event Planner": "कार्यक्रम नियोजक", "Fashion Designer": "फैशन अभिकल्पक",
  "Forensic Scientist": "न्यायालयिक वैज्ञानिक", "Graphic Designer": "ग्राफिक अभिकल्पक", "Hotel Manager": "होटल प्रबंधक",
  "Jewellery Designer": "आभूषण अभिकल्पक", "Journalist": "पत्रकार", "Laboratory Assistant": "प्रयोगशाला सहायक",
  "Mobile App Developer": "मोबाइल ऐप विकासकर्ता", "Naval Officer": "नौसेना अधिकारी", "Nurse": "नर्स",
  "Optician": "दृष्टि उपकरण विशेषज्ञ", "Photographer": "फोटोग्राफर", "Physiotherapist": "फिजियोथेरेपिस्ट",
  "Pilot": "पायलट", "Police Officer": "पुलिस अधिकारी", "Retail Manager": "खुदरा प्रबंधक", "Radio and TV Anchor": "रेडियो एवं टीवी प्रस्तोता",
  "Tourist Guide": "पर्यटक मार्गदर्शक", "Teacher": "शिक्षक", "Travel Agent": "यात्रा अभिकर्ता", "Security Guard": "सुरक्षा कर्मी",
};
export const termLabel = (term: string, language: ReportLanguage) => language === "en" ? term : required(terms, term);
export const subjectsFor = (code: string, language: ReportLanguage) => SUBJECTS[code].map((s) => termLabel(s, language));
const areas: Record<string, string> = {
  LA: "पठन एवं लेखन, शिक्षण, पत्रकारिता एवं मीडिया अध्ययन, विज्ञापन, विधि, पुस्तकालय विज्ञान, आशुलिपि, व्यवसाय विकास, यात्रा एवं पर्यटन",
  AR: "गणित, कंप्यूटर प्रोग्रामिंग, वास्तुकला, विधि, चिकित्सा, अर्थशास्त्र, यांत्रिकी, न्यायालयिक विज्ञान",
  VR: "मनोविज्ञान, वाक् चिकित्सा, नीलामी संचालन, विज्ञापन, भाषाविज्ञान, व्यवसाय, विधि, शिक्षा, जनसंपर्क, विपणन, पत्रकारिता",
  MR: "मशीनरी, विद्युत, सिविल एवं वाहन अभियांत्रिकी, बढ़ई कार्य, बिजली का काम, मशीन संचालन, भौतिक विज्ञान, रसायन विज्ञान",
  NA: "सभी प्रकार की अभियांत्रिकी, वास्तुकला, समुद्र विज्ञान, भूविज्ञान, मौसम विज्ञान, जैव विज्ञान, स्वास्थ्य विज्ञान, सांख्यिकी, प्राकृतिक विज्ञान, बैंकिंग",
  SA: "विनिर्माण उद्योग, प्रारूपण, अभिकल्पना (फैशन, आंतरिक सज्जा, खिलौने एवं खेल, आभूषण, नगर नियोजन, भूदृश्य), वास्तुकला, खगोल विज्ञान, दृश्य कलाएँ, एनीमेशन, मल्टीमीडिया कला",
  PA: "बैंक कैशियर, लेखांकन, कंप्यूटर प्रोग्रामिंग, पुलिस जाँच, डेटा प्रविष्टि, संयोजन कार्य, अभिलेख रखरखाव, प्रेषण, फाइलिंग",
};
export const areasFor = (code: string, language: ReportLanguage) => language === "en" ? AREAS[code] : required(areas, code);
const notes: typeof NOTES = {
  suggestive: "अभिक्षमता परीक्षण के स्कोर संकेत मात्र हैं। विषय चुनने का निर्णय केवल इन स्कोर पर नहीं होना चाहिए। विद्यालय और अभिभावक इन स्कोर के आधार पर विद्यार्थी के विषय न चुनें। (मार्गदर्शिका, पृ. 12–13)",
  cluster: "किसी पाठ्यक्रम या व्यवसाय में अच्छा करने के लिए अभिक्षमताओं का समूह आवश्यक है। चयन केवल एक अभिक्षमता पर आधारित न हो। दिए गए पाठ्यक्रम और व्यवसाय केवल उदाहरण हैं।",
  noPassFail: "इस परीक्षण में उत्तीर्ण या अनुत्तीर्ण होने का प्रावधान नहीं है।",
  noHighBody: "किसी उप-परीक्षण में उच्च स्कोर न होना आगे की शिक्षा या प्रशिक्षण की क्षमता का अभाव नहीं दर्शाता। विद्यार्थी को आत्म-अन्वेषण से अपनी क्षमताएँ समझने के लिए सहायता और अवसर चाहिए। पढ़ाई के साथ रुचि की विद्यालयी गतिविधियों में भाग लेने के लिए प्रोत्साहित करें। उपयुक्त व्यवसाय का चयन करने के लिए भावी पाठ्यक्रमों और व्यवसायों की जानकारी में सहायता दें।",
  noHighAction: "विद्यार्थी को शैक्षिक एवं व्यवसाय नियोजन सत्रों में भाग लेने और व्यवसाय परामर्श के लिए विद्यालय परामर्शदाता से मिलने का सुझाव दिया जाता है।",
  noHighSource: "स्रोत: शिक्षक एवं अभिभावक मार्गदर्शिका, खंड 5, शिक्षक एवं अभिभावक के लिए टिप्पणी (पृ. 11)।",
  noHigh: "उच्च स्कोर न होना आगे की शिक्षा या प्रशिक्षण की क्षमता का अभाव नहीं है। आत्म-अन्वेषण, रुचि की विद्यालयी गतिविधियाँ, व्यवसाय नियोजन सत्र और विद्यालय परामर्शदाता से मिलना सहायक हो सकते हैं।",
  source: "केवल तमन्ना: वरिष्ठ विद्यालयी विद्यार्थियों के लिए अभिक्षमता परीक्षण, शिक्षक एवं अभिभावक मार्गदर्शिका (एनसीईआरटी) पर आधारित: स्टेन मानक (परिशिष्ट IV एवं V), विवरण (VI), व्यवसाय (VII), क्षेत्र (VIII)।",
};
export const reportNotes = (language: ReportLanguage) => language === "hi" ? notes : NOTES;

export function normLabel(p: Profile, language: ReportLanguage) {
  if (language === "en") return p.normLabel;
  if (!p.cls) return "मानक लागू करने के लिए कक्षा IX या X होनी चाहिए";
  const group = p.group === "combined" ? "बालक एवं बालिका संयुक्त" : p.group === "girls" ? "बालिका" : "बालक";
  const table = (p.cls === "IX" ? 0 : 3) + (p.group === "combined" ? 1 : p.group === "girls" ? 2 : 3);
  return `कक्षा ${p.cls}, ${group} (शिक्षक एवं अभिभावक मार्गदर्शिका, परिशिष्ट ${p.cls === "IX" ? "IV" : "V"}, सारणी ${table})`;
}

export function reportRemarks(p: Profile, s: ReportStudent, language: ReportLanguage): string[] {
  if (s.excluded) return [reportLabels(language).excluded];
  if (language === "en") return p.remarks;
  if (!p.cls && p.rows.every((r) => r.raw !== null)) return ["स्कोर को स्टेन स्कोर में बदलने के लिए कक्षा IX या X होनी चाहिए। विद्यार्थी की कक्षा अद्यतन करें।"];
  if (p.rows.some((r) => r.sten === null)) return [`अनुक्रमांक ${s.roll_number}: समीक्षा लंबित है। रिपोर्ट की व्याख्या से पहले उत्तर पुस्तिका की जाँच और स्कोरिंग पूरी करें।`];
  const labels = (rows: Profile["rows"]) => rows.map((r) => testLabel(r.code, r.name, language)).join(", ");
  const remarks: string[] = [];
  const summary = [p.avgs.length ? `${labels(p.avgs)} में औसत` : "", p.lows.length ? `${labels(p.lows)} में निम्न` : ""].filter(Boolean).join(" तथा ");
  if (!p.highs.length) remarks.push(`अनुक्रमांक ${s.roll_number} ने सात उप-परीक्षणों में से किसी में उच्च स्कोर (स्टेन 8–10) प्राप्त नहीं किया है।${summary ? ` निष्पादन ${summary} है।` : ""}`);
  else remarks.push(`अनुक्रमांक ${s.roll_number} की ${labels(p.highs)} में उच्च अभिक्षमता है।${summary ? ` निष्पादन ${summary} है।` : ""} रुचि के अनुसार ${Array.from(new Set(p.highs.flatMap((r) => subjectsFor(r.code, language)))).slice(0, 12).join(", ")} जैसे विषयों पर विचार किया जा सकता है।`);
  if (p.nearHighs.length) remarks.push(`${labels(p.nearHighs)} का औसत स्कोर उच्च स्तर के निकट है। रुचि के अनुसार ${Array.from(new Set(p.nearHighs.flatMap((r) => subjectsFor(r.code, language)))).slice(0, 10).join(", ")} जैसे विषयों पर विचार किया जा सकता है। अन्य औसत या निम्न स्कोर के लिए सुझाव नहीं दिए गए हैं।`);
  if (!p.highs.length) remarks.push(notes.noHighBody, notes.noHighAction);
  else remarks.push(`रुचि और रुझान के अनुसार ${p.occupations.slice(0, 10).map((o) => termLabel(o.name, language)).join(", ")} से संबंधित पाठ्यक्रमों और व्यवसायों की जानकारी ली जा सकती है। अन्य औसत या निम्न स्कोर के लिए सुझाव नहीं दिए गए हैं।`);
  return remarks;
}
