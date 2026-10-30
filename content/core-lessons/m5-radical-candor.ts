import type { CoreLesson } from "./types";

export const lessonM5: CoreLesson = {
  id: "cl-m5",
  legacyModuleId: "m5",
  moduleMatch: ["peers", "hold the standard", "people you like"],
  title: "Radical Candor and the Pattern Conversation",
  estimatedMinutes: 20,

  bigIdea:
    "Caring about someone and being honest with them aren't opposites. The kindest leaders do both at once, especially with the people they like most.",

  whyNow: [
    "Holding a friend or former peer to the same standard as everyone else is one of the hardest parts of a first leadership role. It's tempting to soften it, joke about it, or let it slide. Meanwhile, the rest of the team is watching to see whether the standard is real.",
    "This lesson gives you two tools: a simple way to see when you're being too soft or too harsh, and a way to know which conversation to have when the same problem keeps happening.",
  ],

  model: {
    type: "matrix",
    name: "Radical Candor",
    oneLine: "Care personally and challenge directly. Drop either one and you land in a quadrant that hurts people.",
    instructions:
      "Tap each quadrant to see what it looks like and how to move toward Radical Candor. Then use the exercise below the grid to place yourself with one real person on your team.",
    axes: {
      x: { label: "Challenge directly", low: "Avoid saying the hard thing", high: "Say it clearly" },
      y: { label: "Care personally", low: "Don't show you care", high: "Show you care" },
    },
    quadrants: [
      {
        id: "radical-candor",
        position: "topRight",
        name: "Radical Candor",
        description: "You say the hard thing clearly, and the person can tell you're on their side. Feedback lands as help.",
        soundsLike: "“I care about you and want you to do well here, which is why I need to be straight with you about the late notes.”",
        move: "This is the goal. Keep feedback specific, private and prompt.",
      },
      {
        id: "ruinous-empathy",
        position: "topLeft",
        name: "Ruinous Empathy",
        description: "You care, so you soften or skip the feedback. It feels kind, but the person never gets the information they need, and the problem grows.",
        soundsLike: "“Don't worry about it, just get them in when you can.”",
        move: "Add the challenge. Name the specific issue and the standard, kindly but clearly.",
      },
      {
        id: "obnoxious-aggression",
        position: "bottomRight",
        name: "Obnoxious Aggression",
        description: "You say the hard thing, but without care. It may be accurate, and it feels like an attack.",
        soundsLike: "“This is the third time. Honestly, it's unprofessional.”",
        move: "Add the care. Show you're on their side and ask what's going on before you judge.",
      },
      {
        id: "manipulative-insincerity",
        position: "bottomLeft",
        name: "Manipulative Insincerity",
        description: "Neither care nor challenge: vague hints, talking about the person instead of to them, or false praise to avoid a hard moment.",
        soundsLike: "A reminder to the whole team at huddle, aimed at one person.",
        move: "Go to the person directly, privately, with both care and the specific issue.",
      },
    ],
    target: "radical-candor",
    selfPlacement: {
      id: "cl-m5-place",
      intro: "Think of the person on your team you find hardest to give feedback to, often a friend or former peer. Use initials, not full names.",
      questions: [
        { id: "cl-m5-place-1", prompt: "Which quadrant are you in with them right now, and why?", placeholder: "With [initials], I'm in… because…" },
        { id: "cl-m5-place-2", prompt: "What would moving one step toward Radical Candor look like with this person?", placeholder: "One step closer would be…" },
      ],
    },
  },

  whyItWorks: {
    paragraphs: [
      "Radical Candor was developed by Kim Scott, a former manager at Google and Apple. Her core point is that the two things good feedback needs, caring personally and challenging directly, are usually treated as a trade-off. They aren't. People accept hard feedback from someone they know cares about them, and caring without honesty eventually lets them down. With people we like, the most tempting quadrant is ruinous empathy, because it feels kind in the moment.",
      "The second tool comes from Crucial Accountability by the authors of Crucial Conversations. They call it CPR: Content, Pattern, Relationship. The first time something happens, you talk about that one issue (content). If it keeps happening, you talk about the pattern instead of the latest example, which otherwise turns into a debate about special circumstances. If the pattern continues and starts to damage trust, you talk about the relationship: what the repeated problem is doing to your ability to rely on each other.",
      "Many leaders get stuck repeating the content conversation. Each one feels reasonable, but nothing changes, and resentment builds on both sides. Naming the pattern is more honest, and it gives the person a fair chance to change before anything becomes formal. That connects directly to the Performance pathway in your Resources.",
    ],
    sources: [
      { label: "Kim Scott, “Radical Candor: The Surprising Secret to Being a Good Boss,” First Round Review", url: "https://review.firstround.com/radical-candor-the-surprising-secret-to-being-a-good-boss" },
      { label: "Joseph Grenny, “Using CPR,” Crucial Learning", url: "https://cruciallearning.com/blog/using-cpr/" },
      { label: "Kim Scott, Radical Candor; Kerry Patterson, Joseph Grenny and others, Crucial Accountability" },
    ],
  },

  seeItInAction: {
    setup:
      "Tasha is your closest friend on the team. Three weeks ago you talked with her about late documentation. Since then it's happened twice more. This is the pattern conversation.",
    weak: {
      label: "Ruinous empathy",
      lines: [
        { speaker: "leader", text: "Hey, no big deal, but a couple of notes came in late again.", note: "“No big deal” tells her it doesn't matter. That's ruinous empathy." },
        { speaker: "teamMember", text: "Ugh, I know. I'll catch up this weekend!" },
        { speaker: "leader", text: "Okay, perfect. Thanks!", note: "Stuck at the content level again, with no pattern named and no next step." },
      ],
      result: "Nothing changes. The rest of the team notices, and in a month the conversation is much harder.",
    },
    strong: {
      label: "Radical candor, at the pattern level",
      lines: [
        { speaker: "leader", text: "This is a little awkward because we're close, and I'd rather name that than pretend it isn't there.", note: "Caring personally, and honest about the friendship." },
        { speaker: "leader", text: "We talked about late notes three weeks ago. Since then it's happened on Oct 3 and Oct 9. So this isn't about one note anymore. It's a pattern.", note: "Moving from content to pattern, with specific facts." },
        { speaker: "leader", text: "I hold everyone to the same standard, and I want to for you too. What's really going on?", note: "Challenging directly, then genuinely asking." },
        { speaker: "teamMember", text: "Honestly? I've been picking up extra shifts somewhere else and I'm exhausted." },
        { speaker: "leader", text: "Thank you for telling me. Let's figure out a plan that works. I'll also send you a short summary of what we agree, so we're both clear.", note: "Support plus transparency about next steps. No surprises." },
      ],
      result: "You learn what's really happening, the standard holds, and the friendship survives the honesty.",
    },
    takeaway:
      "Letting a friend slide feels kind, but it's unfair to them and to everyone else meeting the standard. Care enough to be honest.",
  },

  traps: [
    { trap: "Thinking candor means being blunt.", instead: "Candor without care is obnoxious aggression. Show you're on their side first." },
    { trap: "Only giving praise to people you like.", instead: "Specific praise and specific criticism both show you're paying attention. Give both." },
    { trap: "Addressing one person's issue in a team message.", instead: "That's manipulative insincerity. Talk to the person directly and privately." },
    { trap: "Having the same content conversation over and over.", instead: "The second time, name the pattern. The third time, talk about what it's doing to trust." },
  ],

  check: [
    {
      id: "cl-m5-q1",
      question: "A lead tells her close friend on the team, “Don't worry about it,” about repeated late documentation. Which quadrant is that?",
      options: [
        { text: "Radical Candor", correct: false, explain: "It's caring, but there's no challenge, so it's not candor." },
        { text: "Ruinous Empathy", correct: true, explain: "Right. Care without challenge. It feels kind but lets the problem grow." },
        { text: "Manipulative Insincerity", correct: false, explain: "Close, but she does care. She's just avoiding the challenge." },
      ],
    },
    {
      id: "cl-m5-q2",
      question: "You've already talked with a nurse once about missed follow-ups. It's happened twice more. Using CPR, which conversation should you have?",
      options: [
        { text: "Content: talk about the most recent missed follow-up.", correct: false, explain: "That invites a debate about that one instance. You've already had the content conversation." },
        { text: "Pattern: name that this has happened repeatedly since you last talked.", correct: true, explain: "Yes. The repetition is now the real issue." },
        { text: "Relationship: tell her you can't trust her anymore.", correct: false, explain: "That's for when a pattern continues and starts damaging trust. It's too early here." },
      ],
    },
    {
      id: "cl-m5-q3",
      question: "Which statement is the best example of Radical Candor?",
      options: [
        { text: "“Great job lately! Oh, and maybe watch the notes a bit.”", correct: false, explain: "The challenge is buried and vague, so it probably won't land." },
        { text: "“I want you to succeed here, so I need to be clear: notes have been late three times this month. What's getting in the way?”", correct: true, explain: "Right. Clear care, a specific challenge, and genuine curiosity." },
        { text: "“Your notes are late again. Fix it.”", correct: false, explain: "Direct, but with no care. That's obnoxious aggression." },
      ],
    },
  ],

  makeItYours: {
    id: "cl-m5-apply",
    intro: "Is there a conversation you keep having at the content level? Write the pattern-level version. Use initials, not full names. Your answers are private unless you choose to share them.",
    questions: [
      { id: "cl-m5-apply-1", prompt: "What's the issue that keeps coming up, and how many times have you talked about it?", placeholder: "With [initials], the issue is… We've talked about it…" },
      { id: "cl-m5-apply-2", prompt: "What are the specific facts and dates?", placeholder: "It happened on…" },
      { id: "cl-m5-apply-3", prompt: "How will you name the pattern, in one or two sentences?", placeholder: "This isn't about one time anymore. It's…" },
      { id: "cl-m5-apply-4", prompt: "How will you show you care, and what question will you ask?", placeholder: "I'll say… and then ask…" },
    ],
  },

  fieldCard: {
    title: "Holding the standard",
    lines: [
      "Care personally AND challenge directly.",
      "Soft and kind but vague = ruinous empathy.",
      "Clear but cold = obnoxious aggression.",
      "1st time: content. 2nd time: pattern. Still happening: relationship.",
      "Name the friendship. Then name the facts.",
      "Private, prompt and specific. No surprises later.",
    ],
  },

  practiceTieIn: {
    text:
      "This week's practice conversation is the pattern conversation with Tasha. Name the friendship, describe the pattern with facts, and keep the standard while staying warm.",
    relatedSkills: ["Named the friendship", "Described the pattern with facts", "Kept the standard while staying warm", "Explained next steps transparently"],
  },

  goDeeper: [
    { kind: "article", title: "Radical Candor: The Surprising Secret to Being a Good Boss", by: "Kim Scott, First Round Review", url: "https://review.firstround.com/radical-candor-the-surprising-secret-to-being-a-good-boss", minutes: 20, why: "Scott's original explanation of the framework, with stories from Google and Apple." },
    { kind: "article", title: "Using CPR", by: "Joseph Grenny, Crucial Learning", url: "https://cruciallearning.com/blog/using-cpr/", minutes: 5, why: "A short guide to choosing between the content, pattern and relationship conversations." },
    { kind: "book", title: "Radical Candor", by: "Kim Scott", why: "The full framework, including how to ask for feedback yourself and how to give praise well." },
    { kind: "book", title: "Crucial Accountability", by: "Kerry Patterson, Joseph Grenny and others", why: "How to address broken commitments and repeated problems without damaging the relationship." },
  ],
};
