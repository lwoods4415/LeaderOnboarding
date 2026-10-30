import type { CoreLesson } from "./types";

export const lessonM3: CoreLesson = {
  id: "cl-m3",
  legacyModuleId: "m3",
  moduleMatch: ["quick fix", "coach", "rescue"],
  title: "The GROW Coaching Model",
  estimatedMinutes: 20,

  bigIdea:
    "Every time you solve a problem someone could have solved, you teach them to bring you the next one. Coaching is a simple structure for helping them solve it instead.",

  whyNow: [
    "You were promoted partly because you're good at fixing things. That instinct now works against you. If you answer every question, your team stops thinking and starts waiting, and you become the bottleneck.",
    "Coaching isn't a personality trait or a long, formal process. It's a short conversation with four steps that you can use in a five-minute message exchange. This lesson teaches the most widely used one.",
  ],

  model: {
    type: "stages",
    name: "GROW",
    oneLine: "Goal, Reality, Options, Will: four steps that move someone from stuck to a plan they own.",
    instructions:
      "Work through the four steps in order. Each one shows what it's for, what it sounds like, and the mistake to watch for. The example follows one real situation from start to finish.",
    stages: [
      {
        id: "goal",
        name: "G: Goal",
        summary: "Get clear on what they want from this conversation.",
        detail:
          "Start by agreeing what you're trying to solve. People often bring you a symptom. A clear goal keeps you both from solving the wrong problem.",
        example:
          "Priya: “My patient won't take daily readings. What do I do?” You: “What would a good outcome look like with this patient?” Priya: “Honestly, just getting her to take them most days.”",
        questions: [
          "What would you like to get out of this?",
          "What would a good outcome look like?",
          "What's the real challenge here for you?",
        ],
        watchFor: "Jumping to solutions before you both know what problem you're solving.",
      },
      {
        id: "reality",
        name: "R: Reality",
        summary: "Understand what's actually happening.",
        detail:
          "Ask about the facts, what they've already tried, and what they've noticed. This is usually where people discover they know more than they thought.",
        example:
          "You: “What's happening right now, and what have you tried?” Priya: “I called twice. She says she forgets. Actually, she also said the cuff is confusing.”",
        questions: [
          "What's happening right now?",
          "What have you already tried?",
          "What do you think is getting in the way?",
          "And what else?",
        ],
        watchFor: "Accepting the first answer. “And what else?” almost always surfaces the real issue.",
      },
      {
        id: "options",
        name: "O: Options",
        summary: "Generate possible ways forward, theirs first.",
        detail:
          "Ask for their ideas before offering yours. If there's a real knowledge gap, this is where you teach, briefly, then hand it back.",
        example:
          "You: “What could you try?” Priya: “Maybe walk her through the device on video?” You: “Good idea. One thing that also helps: tying the reading to something she already does daily, like morning coffee.”",
        questions: [
          "What could you try?",
          "What else might work?",
          "Who or what could help?",
          "If you had no limits, what would you do?",
        ],
        watchFor: "Advice disguised as a question, like “Have you thought about calling her daughter?” Ask openly first.",
      },
      {
        id: "will",
        name: "W: Will",
        summary: "Agree on what they'll actually do, and when.",
        detail:
          "End with a commitment in their words: the next step, the timing, and how they'll know it worked. Then agree when you'll check in.",
        example:
          "You: “So what will you do first?” Priya: “Video call tomorrow to walk through the cuff, then link it to her morning routine.” You: “Great. Let me know Friday how it went.”",
        questions: [
          "What will you do first, and when?",
          "How confident are you, from 1 to 10?",
          "What support do you need from me?",
        ],
        watchFor: "Ending on “Let me know if you need anything.” Without a clear next step, nothing changes.",
      },
    ],
    closing:
      "Coach when the goal is growth. Tell when someone could be harmed, when time is critical, or when the person genuinely doesn't have the knowledge yet, and then debrief afterward so they learn for next time.",
  },

  whyItWorks: {
    paragraphs: [
      "GROW was developed in the 1980s by coaches including Sir John Whitmore, and became widely known through his book Coaching for Performance. It works because it follows how people actually solve problems: get clear on the goal, look honestly at the situation, consider options, then commit. When someone reaches a plan through their own thinking, they understand it better and are more likely to follow through.",
      "Google's long-running study of its own managers, Project Oxygen, found that the number one behavior of its best managers was being a good coach. Michael Bungay Stanier, author of The Coaching Habit, describes the urge to jump in with answers as your “advice monster.” His simplest tool is the question “And what else?”, because the first answer someone gives is rarely the whole story.",
      "Liz Wiseman's research on “multipliers” found that leaders who rescue too quickly shrink their team's capability without meaning to. People stop building their own judgment because someone else keeps doing it for them. Coaching feels slower today and saves you hours every week once your team can solve problems on their own.",
    ],
    sources: [
      { label: "Performance Consultants, “The GROW Model: A Complete Guide”", url: "https://www.performanceconsultants.com/resources/the-grow-model/" },
      { label: "Google re:Work, “Following the data: The research behind great managers”", url: "https://rework.withgoogle.com/intl/en/guides/following-the-data-the-research-behind-great-managers" },
      { label: "Michael Bungay Stanier, “How to tame your advice monster,” TEDxUniversityofNevada", url: "https://www.ted.com/talks/michael_bungay_stanier_how_to_tame_your_advice_monster" },
      { label: "John Whitmore, Coaching for Performance; Liz Wiseman, Multipliers" },
    ],
  },

  seeItInAction: {
    setup:
      "Priya, a newer nurse, messages you: “Patient keeps refusing daily readings. What should I do?” The patient isn't in any danger. Here are two ways to respond.",
    weak: {
      label: "Rescuing",
      lines: [
        { speaker: "leader", text: "Send me her name and I'll call her this afternoon.", note: "The classic rescue. The patient gets a call, and Priya learns hard calls go up the chain." },
        { speaker: "teamMember", text: "Thank you!! I have two more like that, could you take those too?" },
        { speaker: "leader", text: "Sure, send them over.", note: "Your workload just grew, and so will next week's." },
      ],
      result: "Three patients get calls. Priya doesn't learn anything, and she'll bring you the next one.",
    },
    strong: {
      label: "Coaching with GROW",
      lines: [
        { speaker: "leader", text: "What would a good outcome look like with her?", note: "Goal: clarify what you're solving." },
        { speaker: "leader", text: "What have you tried so far? And what else have you noticed?", note: "Reality, with “And what else?”" },
        { speaker: "teamMember", text: "I called twice. Oh, actually, she said the cuff confuses her." },
        { speaker: "leader", text: "That's a great catch. What could you try?", note: "Options: hers first. She's now solving the real problem." },
        { speaker: "teamMember", text: "Maybe walk her through it on video tomorrow?" },
        { speaker: "leader", text: "Love it. Let me know Friday how it goes.", note: "Will: a clear next step and a check-in." },
      ],
      result: "Priya solves it herself, and next time she may not need to message you at all.",
    },
    takeaway:
      "The goal of coaching isn't to withhold answers. It's to help someone find the answer they already half-know, and teach only what they're missing.",
  },

  traps: [
    { trap: "Thinking coaching means never giving an answer.", instead: "Ask first. If there's a real knowledge gap, teach it briefly, then hand the decision back." },
    { trap: "Asking advice disguised as a question.", instead: "“Have you tried calling her daughter?” is advice. Ask “What could you try?” first." },
    { trap: "Skipping the W.", instead: "Always end with a specific next step and a check-in time. Otherwise it's just a nice chat." },
    { trap: "Coaching in an emergency.", instead: "If a patient is at risk, act first. Debrief afterward so the nurse learns for next time." },
  ],

  check: [
    {
      id: "cl-m3-q1",
      question: "A nurse asks what to do about a patient who hasn't sent readings in five days. The patient isn't at risk. What's the best first response?",
      options: [
        { text: "Tell her the steps. It's faster.", correct: false, explain: "Faster today, but she'll ask again next time, and so will others." },
        { text: "Ask what she's tried so far and what she thinks the next step is.", correct: true, explain: "Right. Start with Reality and Options, then confirm or add to her plan." },
        { text: "Call the patient yourself.", correct: false, explain: "That's a rescue. She loses the chance to build the skill." },
      ],
    },
    {
      id: "cl-m3-q2",
      question: "Which question belongs in the Reality step?",
      options: [
        { text: "What would success look like?", correct: false, explain: "That's a Goal question." },
        { text: "What's happening right now, and what have you tried?", correct: true, explain: "Yes. Reality is about the facts and what's already been done." },
        { text: "What will you do first?", correct: false, explain: "That's a Will question." },
      ],
    },
    {
      id: "cl-m3-q3",
      question: "When should a leader tell instead of coach?",
      options: [
        { text: "Whenever it's faster.", correct: false, explain: "Telling is almost always faster in the moment. That's why rescuing is so tempting." },
        { text: "When a patient is at risk, time is critical, or the person truly lacks the knowledge.", correct: true, explain: "Right. In those cases, tell, and debrief afterward so they learn." },
        { text: "Never. Good leaders always coach.", correct: false, explain: "Coaching in an emergency can put patients at risk." },
      ],
    },
  ],

  makeItYours: {
    id: "cl-m3-apply",
    intro: "Think of the last problem someone brought you that you solved for them. Rewrite it as a coaching conversation. Your answers are private unless you choose to share them.",
    questions: [
      { id: "cl-m3-apply-1", prompt: "What was the problem, and what did you do?", placeholder: "They asked me… and I…" },
      { id: "cl-m3-apply-2", prompt: "Goal: what question could you have asked to clarify what they wanted?", placeholder: "I could have asked…" },
      { id: "cl-m3-apply-3", prompt: "Reality: what would you ask to understand what was really happening?", placeholder: "I could have asked…" },
      { id: "cl-m3-apply-4", prompt: "Options: how would you have drawn out their ideas first?", placeholder: "I could have asked…" },
      { id: "cl-m3-apply-5", prompt: "Will: how would you have ended with a clear next step and a check-in?", placeholder: "I could have closed with…" },
    ],
  },

  fieldCard: {
    title: "Coaching with GROW",
    lines: [
      "Goal: What would a good outcome look like?",
      "Reality: What's happening? What have you tried? And what else?",
      "Options: What could you try? (Theirs first. Teach only real gaps.)",
      "Will: What will you do first, and when? I'll check in on…",
      "Patient at risk? Act first, debrief after.",
    ],
  },

  practiceTieIn: {
    text:
      "This week's practice conversation is a coaching moment with Priya. Ask before you advise, use “And what else?”, and let her choose the next step.",
    relatedSkills: ["Asked before advising", "Used a follow-up like “And what else?”", "Taught only where needed", "Let her choose the next step"],
  },

  goDeeper: [
    { kind: "video", title: "How to tame your advice monster", by: "Michael Bungay Stanier, TEDxUniversityofNevada", url: "https://www.ted.com/talks/michael_bungay_stanier_how_to_tame_your_advice_monster", minutes: 14, why: "A funny, practical talk on why we rush to give advice and how to stay curious instead." },
    { kind: "article", title: "The GROW Model: A Complete Guide", by: "Performance Consultants", url: "https://www.performanceconsultants.com/resources/the-grow-model/", minutes: 10, why: "More questions for every step, from the organization that helped create GROW." },
    { kind: "article", title: "Seven questions that will change the way you lead", by: "University of St. Thomas", url: "https://news.stthomas.edu/seven-questions-that-will-change-the-way-you-lead", minutes: 5, why: "A quick summary of The Coaching Habit's seven questions." },
    { kind: "book", title: "The Coaching Habit", by: "Michael Bungay Stanier", why: "Short, practical and built around seven questions you can use tomorrow." },
    { kind: "book", title: "Multipliers", by: "Liz Wiseman", why: "Why well-meaning leaders shrink their teams, and how to grow them instead." },
  ],
};
