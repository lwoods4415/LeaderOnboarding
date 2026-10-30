import type { CoreLesson } from "./types";

export const lessonM2: CoreLesson = {
  id: "cl-m2",
  legacyModuleId: "m2",
  moduleMatch: ["scoreboard", "measures", "metrics"],
  title: "Lead Measures and Lag Measures",
  estimatedMinutes: 20,

  bigIdea:
    "Month-end numbers tell you whether your team won. Lead measures tell you, this week, whether you're going to.",

  whyNow: [
    "As a nurse, your scoreboard was clear and fast. You knew by the end of each day whether you were on track. As a leader, your results arrive weeks later, through other people's work. By the time a month-end report shows a problem, the month is over.",
    "That gap is why so many new leaders feel less capable and drift back to doing the work themselves. This lesson gives you a new scoreboard: a few things you control every week that predict your team's results.",
  ],

  model: {
    type: "sort",
    name: "Lead or lag?",
    oneLine: "Lag measures report the result. Lead measures predict it and are in your control this week.",
    instructions:
      "Sort each measure. Ask two questions: “Will I only know this after it's too late to change?” (lag) and “Can I act on this every week, and does it predict the result?” (lead).",
    buckets: [
      { id: "lag", label: "Lag measure", description: "The result. You find out after the fact, when it can't be changed." },
      { id: "lead", label: "Lead measure", description: "An action you control this week that predicts the result." },
    ],
    items: [
      { id: "i1", text: "The pod's monitoring-call completion at month end", answer: "lag", explain: "This is the result you care about, but by the time you see it the month is over." },
      { id: "i2", text: "Number of one-on-ones you held this week", answer: "lead", explain: "You control it every week, and regular one-on-ones predict problems reaching you early." },
      { id: "i3", text: "Patients with controlled blood pressure at quarter end", answer: "lag", explain: "An important outcome, but it reports what already happened." },
      { id: "i4", text: "Days between noticing a missed standard and talking about it", answer: "lead", explain: "Fully in your control, and prompt conversations predict fewer repeat problems." },
      { id: "i5", text: "Your team's engagement survey score", answer: "lag", explain: "It reflects months of experience. You can't change it the week it arrives." },
      { id: "i6", text: "Mid-month pace check-ins with nurses who are behind", answer: "lead", explain: "You can do this every week, and it predicts who will hit the month-end target." },
      { id: "i7", text: "Turnover on your team this year", answer: "lag", explain: "A long-term result of how the team has been led." },
      { id: "i8", text: "Times this week you named a specific thing someone did well", answer: "lead", explain: "In your control, and specific recognition predicts engagement and repeated good work." },
      { id: "i9", text: "Client complaints this quarter", answer: "lag", explain: "You only learn about these after something has gone wrong." },
    ],
  },

  whyItWorks: {
    paragraphs: [
      "This idea comes from The 4 Disciplines of Execution (4DX) by Chris McChesney, Sean Covey and Jim Huling. Their research found that teams often fail at important goals not because the goal is wrong, but because daily urgent work, which they call the whirlwind, swallows the time. A lag measure tells you whether you reached the goal. A good lead measure has two qualities: it predicts the lag measure, and the team can influence it directly.",
      "The four disciplines build on each other. Focus on one or two wildly important goals. Act on the lead measures. Keep a scoreboard people can see at a glance. Then create a cadence of accountability: a short, regular check-in where people report on last week's commitments and make new ones.",
      "For a new leader, lead measures solve a second problem. They replace the daily proof you used to get from your own numbers. Each week you can see that you did the things that make your team succeed, even before the results show up.",
    ],
    sources: [
      { label: "FranklinCovey, “Discipline 2: Act on the Lead Measures”", url: "https://www.franklincovey.com/the-4-disciplines/discipline-2-act/" },
      { label: "Chris McChesney, Sean Covey and Jim Huling, The 4 Disciplines of Execution (2012; revised 2021)" },
    ],
  },

  seeItInAction: {
    setup:
      "It's the middle of the month. Your own leader asks, “How's the pod tracking this month?” Here are two answers.",
    weak: {
      label: "Lag-only thinking",
      lines: [
        { speaker: "leader", text: "I think we're okay. Last month we finished at 93%.", note: "Last month's lag measure tells you nothing about this month." },
        { speaker: "leader", text: "I'll know more when the month-end report comes out.", note: "By then it's too late to help anyone who's behind." },
        { speaker: "leader", text: "I've been really busy covering alerts, so I haven't had a chance to look closely.", note: "The whirlwind won. The urgent work pushed out the work that predicts results." },
      ],
      result: "At month end, two nurses miss target. You learn about it at the same time as your leader.",
    },
    strong: {
      label: "Lead-measure thinking",
      lines: [
        { speaker: "leader", text: "We're at 51% of calls with half the month gone, so slightly ahead of pace overall.", note: "Tracking the lag measure as it builds, not only at the end." },
        { speaker: "leader", text: "Two nurses are behind pace. I checked in with both on Tuesday.", note: "A lead measure: mid-month pace check-ins." },
        { speaker: "leader", text: "One has a panel issue we're fixing. The other is catching up and we're checking in again Friday.", note: "Acting on it while there's still time." },
        { speaker: "leader", text: "I also held all six one-on-ones this week.", note: "Another lead measure that predicts problems reaching you early." },
      ],
      result: "Both nurses finish the month on target. You saw the problem with two weeks to spare.",
    },
    takeaway:
      "You can't manage a lag measure directly. You manage the lead measures that drive it, every week, and the lag measure follows.",
  },

  traps: [
    { trap: "Tracking ten things.", instead: "Pick two or three lead measures. Too many measures means none of them get attention." },
    { trap: "Choosing lead measures you don't actually control.", instead: "If you can't act on it this week, it's not a lead measure for you." },
    { trap: "Using the scoreboard to watch people.", instead: "A scoreboard is for the team to see if it's winning, not for you to catch people out." },
    { trap: "Letting the whirlwind skip your weekly check.", instead: "Put your lead-measure review on the calendar at the same time each week and protect it." },
  ],

  check: [
    {
      id: "cl-m2-q1",
      question: "The goal is for every nurse to reach 95% monitoring-call completion. Which of these is a lead measure?",
      options: [
        { text: "Each nurse's completion percentage at month end", correct: false, explain: "That's the lag measure: the result itself." },
        { text: "Weekly pace check-ins with any nurse who's falling behind", correct: true, explain: "Right. You control it weekly, and it predicts who will reach 95%." },
        { text: "The number of nurses at 95% last month", correct: false, explain: "That's a past lag measure. It can't be changed." },
      ],
    },
    {
      id: "cl-m2-q2",
      question: "What two qualities make a good lead measure?",
      options: [
        { text: "It's easy to count and it looks good in reports.", correct: false, explain: "Easy to count helps, but a lead measure has to drive the result and be in your control." },
        { text: "It predicts the result, and your team can influence it directly.", correct: true, explain: "Yes. Predictive and influenceable are the two tests." },
        { text: "Leadership chose it, and it's reported monthly.", correct: false, explain: "Measures reported monthly are usually lag measures." },
      ],
    },
    {
      id: "cl-m2-q3",
      question: "A lead found out from the month-end report that her pod dropped 8 points. What would have helped most?",
      options: [
        { text: "A more detailed month-end report", correct: false, explain: "More detail on a lag measure still arrives too late." },
        { text: "Tracking a few lead measures every week, with a regular check-in", correct: true, explain: "Right. That would have shown the drop while there was still time to act." },
        { text: "Covering more alerts herself", correct: false, explain: "That's the whirlwind. It usually makes the problem worse." },
      ],
    },
  ],

  makeItYours: {
    id: "cl-m2-apply",
    intro: "Build your own scoreboard. Your answers are private unless you choose to share them.",
    questions: [
      { id: "cl-m2-apply-1", prompt: "What is your team's most important lag measure right now?", placeholder: "Our most important result is…" },
      { id: "cl-m2-apply-2", prompt: "What's the first lead measure you'll track every week? How does it predict that result?", placeholder: "Lead measure 1: … It predicts the result because…" },
      { id: "cl-m2-apply-3", prompt: "What's a second lead measure you'll track?", placeholder: "Lead measure 2: …" },
      { id: "cl-m2-apply-4", prompt: "What day and time each week will you check them, and what usually gets in the way?", placeholder: "Every … at … What could get in the way: …" },
    ],
  },

  fieldCard: {
    title: "Your leader scoreboard",
    lines: [
      "Lag = the result. You find out after it's too late to change.",
      "Lead = an action you control this week that predicts the result.",
      "Test: Is it predictive? Can I influence it directly?",
      "Track two or three lead measures, not ten.",
      "Check them at the same time every week.",
      "Don't let the whirlwind skip the check.",
    ],
  },

  practiceTieIn: {
    text:
      "This week's practice conversation is setting clear expectations with Jen. Describe what good looks like in specific terms and explain why it matters for patients.",
    relatedSkills: ["Described what good looks like specifically", "Explained why it matters for patients", "Checked understanding", "Agreed on a check-in"],
  },

  goDeeper: [
    { kind: "article", title: "Discipline 2: Act on the Lead Measures", by: "FranklinCovey", url: "https://www.franklincovey.com/the-4-disciplines/discipline-2-act/", minutes: 5, why: "A short explanation of lead and lag measures from the people who developed 4DX." },
    { kind: "book", title: "The 4 Disciplines of Execution", by: "Chris McChesney, Sean Covey and Jim Huling", why: "The full system: wildly important goals, lead measures, scoreboards and a weekly cadence." },
    { kind: "book", title: "Measure What Matters", by: "John Doerr", why: "Another widely used approach to setting goals and tracking progress, with real company examples." },
  ],
};
