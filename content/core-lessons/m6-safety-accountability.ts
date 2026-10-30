import type { CoreLesson } from "./types";

export const lessonM6: CoreLesson = {
  id: "cl-m6",
  legacyModuleId: "m6",
  moduleMatch: ["what you earn", "tells you the truth", "truth", "psychological safety"],
  title: "Psychological Safety and Accountability",
  estimatedMinutes: 20,

  bigIdea:
    "The best teams aren't the ones that make the fewest mistakes. They're the ones where people speak up about mistakes early, and are still held to a high standard.",

  whyNow: [
    "Over the last eleven weeks you've built trust, coached, and held people to a standard. This lesson ties it together. Safety without standards becomes a comfortable team that doesn't improve. Standards without safety become a team that hides problems from you.",
    "In patient care, hidden problems are dangerous. The way you respond when someone brings you bad news decides whether you'll hear the next piece of bad news, or whether you'll find out from a report, a client or a patient.",
  ],

  model: {
    type: "matrix",
    name: "The four zones",
    oneLine: "High safety and high accountability together create a learning team. Either one alone falls short.",
    instructions:
      "Tap each zone to see what it feels like on a team and how a leader moves the team toward the learning zone. Then place your own team.",
    axes: {
      x: { label: "Accountability and standards", low: "Low expectations", high: "High expectations" },
      y: { label: "Psychological safety", low: "Speaking up feels risky", high: "Speaking up feels safe" },
    },
    quadrants: [
      {
        id: "learning",
        position: "topRight",
        name: "Learning zone",
        description: "People raise problems, ask for help and admit mistakes early, and the bar stays high. The team gets better every month.",
        soundsLike: "“I think I missed an escalation yesterday. Can we look at what happened?”",
        move: "This is the goal. Keep thanking people for bad news, and keep the standard clear.",
      },
      {
        id: "comfort",
        position: "topLeft",
        name: "Comfort zone",
        description: "It's friendly and safe, but nobody pushes. Missed standards get a pass, and good people quietly get frustrated.",
        soundsLike: "“It's fine, everyone's doing their best.”",
        move: "Raise the bar. Make expectations clear and follow up when they're missed.",
      },
      {
        id: "anxiety",
        position: "bottomRight",
        name: "Anxiety zone",
        description: "Standards are high, but speaking up feels risky. People work hard and hide problems, so mistakes surface late, when they're bigger.",
        soundsLike: "“I'm not telling her. I'll just fix it and hope she doesn't notice.”",
        move: "Lower the fear. Thank people for raising problems, and respond to mistakes with curiosity before anything else.",
      },
      {
        id: "apathy",
        position: "bottomLeft",
        name: "Apathy zone",
        description: "Low safety and low standards. People go through the motions and protect themselves.",
        soundsLike: "“Why bother? Nothing changes anyway.”",
        move: "Start with safety. Listen, act visibly on what you hear, then build standards together.",
      },
    ],
    target: "learning",
    selfPlacement: {
      id: "cl-m6-place",
      intro: "Now place your own team.",
      questions: [
        { id: "cl-m6-place-1", prompt: "Which zone is your team in today?", placeholder: "I think we're in the… zone." },
        { id: "cl-m6-place-2", prompt: "What's one piece of evidence, something someone said or didn't say, that tells you that?", placeholder: "I noticed…" },
        { id: "cl-m6-place-3", prompt: "What's one move you'll make this month to get closer to the learning zone?", placeholder: "This month I'll…" },
      ],
    },
  },

  whyItWorks: {
    paragraphs: [
      "Psychological safety is a term from Harvard professor Amy Edmondson. It means people believe they can speak up, ask questions, admit mistakes and raise concerns without being punished or humiliated. In a study of hospital nursing units, she found that the better-led units reported more medication errors, not fewer. They weren't making more mistakes. People felt safe enough to report them, which meant the mistakes could be caught and fixed.",
      "Edmondson is clear that safety is not about being nice or lowering standards. Her four-zone model shows that safety has to be paired with accountability. A team with safety but no standards sits in the comfort zone. A team with standards but no safety sits in the anxiety zone, which is common in high-pressure healthcare settings. Only the combination creates a learning zone.",
      "Just culture, widely used in healthcare and aviation, puts this into practice. The American Nurses Association describes it as three kinds of behavior, each with a different response. A simple human error, an unintended slip, calls for consoling the person and reviewing the process. An at-risk behavior, such as a shortcut whose risk wasn't recognized, calls for coaching. Only reckless behavior, consciously ignoring a serious risk, calls for remedial or punitive action. The response depends on the behavior, not on how bad the outcome was.",
    ],
    sources: [
      { label: "Amy Edmondson, “Building a psychologically safe workplace,” TEDxHGSE", url: "https://www.youtube.com/watch?v=LhoLuui9gX8" },
      { label: "American Nurses Association, Just Culture position statement (2010)", url: "https://anaprodsite1.nursingworld.org/globalassets/practiceandpolicy/health-and-safety/just_culture.pdf" },
      { label: "AHRQ Patient Safety Network, “Culture of Safety” primer", url: "https://psnet.ahrq.gov/primer/culture-safety" },
      { label: "Amy Edmondson, The Fearless Organization (2018)" },
    ],
  },

  seeItInAction: {
    setup:
      "Leah, a nurse on your team, tells you she forgot to escalate an abnormal blood pressure reading yesterday. She caught it this morning, and the patient is fine.",
    weak: {
      label: "Anxiety zone response",
      lines: [
        { speaker: "leader", text: "Leah, this is serious. That patient could have been harmed.", note: "True, but leading with it teaches her that telling you is risky." },
        { speaker: "teamMember", text: "I know. I'm so sorry. It won't happen again." },
        { speaker: "leader", text: "I'll need to document this.", note: "The process may need documenting, but with no curiosity about why it happened, the cause stays hidden." },
      ],
      result: "Leah never makes that mistake again, and she also never tells you about the next one.",
    },
    strong: {
      label: "Learning zone response",
      lines: [
        { speaker: "leader", text: "Thank you for telling me. I know that wasn't easy.", note: "Safety first. You're rewarding the report." },
        { speaker: "leader", text: "Is the patient's follow-up complete? Let's make sure of that first.", note: "The standard and patient safety still come first." },
        { speaker: "leader", text: "Walk me through what happened yesterday.", note: "Curiosity before judgment." },
        { speaker: "teamMember", text: "The alert came in during a stretch of about 20 new alerts in an hour, and it got buried." },
        { speaker: "leader", text: "That helps. Let's look at whether others have had the same problem, and I'll file it through our safety reporting process so we can fix how alerts show up.", note: "Just culture: a human error in a system that made it easy, so fix the system and report it properly." },
      ],
      result: "The patient is safe, the alert workflow gets fixed, and Leah and her teammates keep bringing problems to you early.",
    },
    takeaway:
      "How you respond to the first reported mistake decides whether you hear about the next one. Thank them, protect the patient, get curious, fix the system.",
  },

  traps: [
    { trap: "Thinking psychological safety means lowering the bar.", instead: "Safety and high standards go together. The goal is the learning zone, not the comfort zone." },
    { trap: "Asking “Any questions?” and taking silence as agreement.", instead: "Ask specific questions: “What's one thing that could go wrong with this?” Silence often means it doesn't feel safe to speak." },
    { trap: "Reacting to how bad the outcome was.", instead: "Respond to the behavior. An honest slip with a bad outcome still calls for consoling and fixing the process." },
    { trap: "Thanking people for bad news only when it's convenient.", instead: "Be consistent. People are watching how you react on your worst day, not your best." },
  ],

  check: [
    {
      id: "cl-m6-q1",
      question: "A team is friendly and supportive, nobody pushes back in huddles, and metrics have been slowly slipping for months. Which zone is it in?",
      options: [
        { text: "Learning zone", correct: false, explain: "There's safety, but the slipping metrics and lack of push suggest the standard isn't being held." },
        { text: "Comfort zone", correct: true, explain: "Right. High safety, low accountability. The move is to raise the bar clearly and follow up." },
        { text: "Anxiety zone", correct: false, explain: "The anxiety zone has high standards and low safety. This team is the opposite." },
      ],
    },
    {
      id: "cl-m6-q2",
      question: "In Edmondson's hospital study, why did the better-led nursing units report more medication errors?",
      options: [
        { text: "They were busier, so they made more mistakes.", correct: false, explain: "The research pointed to people reporting more errors, not making more of them." },
        { text: "People felt safe enough to report mistakes, so more were caught.", correct: true, explain: "Yes. Safety brought problems to the surface where they could be fixed." },
        { text: "Their leaders required more paperwork.", correct: false, explain: "It was about willingness to speak up, not paperwork." },
      ],
    },
    {
      id: "cl-m6-q3",
      question: "Under a just culture approach, how should a leader respond to a simple, unintended slip by a nurse?",
      options: [
        { text: "Console the nurse and review the process that allowed the slip.", correct: true, explain: "Right. Human error calls for support and a look at the system, not punishment." },
        { text: "Issue a written warning so it doesn't happen again.", correct: false, explain: "Punishing honest errors makes people hide the next one. Punitive action is for reckless behavior." },
        { text: "Say nothing, since the patient was fine.", correct: false, explain: "Skipping it misses the chance to fix the process and to follow your safety reporting steps." },
      ],
    },
  ],

  makeItYours: {
    id: "cl-m6-apply",
    intro: "Your answers are private unless you choose to share them.",
    questions: [
      { id: "cl-m6-apply-1", prompt: "Think of the last time someone brought you bad news or admitted a mistake. How did you respond?", placeholder: "When … told me…, I…" },
      { id: "cl-m6-apply-2", prompt: "Write exactly what you'll say the next time it happens.", placeholder: "Next time, my first words will be…" },
      { id: "cl-m6-apply-3", prompt: "What's one thing you'll do to keep the standard high at the same time?", placeholder: "To keep the bar high, I'll…" },
      { id: "cl-m6-apply-4", prompt: "Looking back at Week 0: what's changed in how you see your job as a leader?", placeholder: "When I started, I thought… Now I see…" },
    ],
  },

  fieldCard: {
    title: "A team that tells you the truth",
    lines: [
      "Safety + high standards = the learning zone.",
      "First words to bad news: “Thank you for telling me.”",
      "Protect the patient. Then get curious.",
      "Slip: console, fix the process. Shortcut: coach. Reckless: act.",
      "Respond to the behavior, not the outcome.",
      "Silence isn't agreement. Ask specific questions.",
    ],
  },

  practiceTieIn: {
    text:
      "This week's practice conversation is responding to Leah's reported mistake. Thank her, confirm patient safety, and explore the cause without blame.",
    relatedSkills: ["Thanked her for reporting", "Confirmed patient safety", "Explored causes without blame", "Mentioned the reporting process"],
  },

  goDeeper: [
    { kind: "video", title: "Building a psychologically safe workplace", by: "Amy Edmondson, TEDxHGSE", url: "https://www.youtube.com/watch?v=LhoLuui9gX8", minutes: 12, why: "Edmondson explains psychological safety and tells the story of the hospital study herself." },
    { kind: "article", title: "Culture of Safety (primer)", by: "AHRQ Patient Safety Network", url: "https://psnet.ahrq.gov/primer/culture-safety", minutes: 15, why: "How healthcare organizations build safety cultures, including just culture." },
    { kind: "article", title: "Just Culture position statement", by: "American Nurses Association", url: "https://anaprodsite1.nursingworld.org/globalassets/practiceandpolicy/health-and-safety/just_culture.pdf", minutes: 10, why: "The nursing profession's own statement on responding fairly to errors." },
    { kind: "article", title: "Strategies for Learning from Failure", by: "Amy Edmondson, Harvard Business Review", url: "https://hbr.org/2011/04/strategies-for-learning-from-failure", minutes: 20, access: "May require an HBR subscription", why: "Which failures to prevent, which to expect, and which to learn from." },
    { kind: "book", title: "The Fearless Organization", by: "Amy Edmondson", why: "The full research and practical steps for building psychological safety." },
  ],
};
