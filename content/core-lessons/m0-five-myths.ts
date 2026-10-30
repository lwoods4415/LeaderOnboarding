import type { CoreLesson } from "./types";

export const lessonM0: CoreLesson = {
  id: "cl-m0",
  legacyModuleId: "m0",
  moduleMatch: ["before day one", "week 0", "on purpose"],
  title: "The Five Myths New Managers Believe",
  estimatedMinutes: 20,

  bigIdea:
    "Most new leaders struggle not because they lack skill, but because they start with the wrong picture of what the job is.",

  whyNow: [
    "Before you lead anyone, you already carry a picture of what leading looks like. Usually it comes from bosses you've had, good and bad. That picture shapes your first conversations, your first decisions, and how your team decides to see you.",
    "Harvard professor Linda Hill followed new managers through their first year and found that most of them started with the same five beliefs. Each one sounds reasonable. Each one quietly causes problems. Spotting them now, before day one, saves you months of learning them the hard way.",
  ],

  model: {
    type: "flipcards",
    name: "Myth vs. reality",
    oneLine: "Five beliefs most new managers start with, and what the job actually asks.",
    instructions:
      "Read each myth and decide whether you believe it, at least a little. Then flip the card to see what Hill's research found.",
    cards: [
      {
        id: "myth-authority",
        front: "Myth 1: Managers have a lot of authority.",
        back:
          "Reality: New managers are surprised by how dependent they become. Results now depend on your team, your peers and your own leader. You have less control over outcomes than you did in your old role, not more.",
        example:
          "As a nurse, your call completion depended on you. As a lead, it depends on seven people, a schedule, a system and a patient population you don't control.",
      },
      {
        id: "myth-title",
        front: "Myth 2: Authority comes with the title.",
        back:
          "Reality: The title gives you a job. Your team decides whether to give you authority, based on three things: your character (do you mean well and do what's right?), your competence (do you know the work?), and your follow-through (do things actually happen when you say they will?).",
        example:
          "A nurse doesn't follow your new workflow because you're the lead. She follows it because she trusts you understand her day and that you'll fix what isn't working.",
      },
      {
        id: "myth-control",
        front: "Myth 3: Managers need to control their team.",
        back:
          "Reality: Control gets you compliance, and compliance lasts only as long as you're watching. What you actually need is commitment: people who do the right thing because they understand why and helped shape how.",
        example:
          "Checking every chart gets charts done this week. Explaining why documentation matters for patients, and asking how to make it easier, gets charts done every week.",
      },
      {
        id: "myth-one-on-one",
        front: "Myth 4: Leading means building great one-on-one relationships.",
        back:
          "Reality: Individual relationships matter, but they aren't enough. If you only lead person by person, the team can splinter, and people start comparing how they're treated. You also have to lead the team as a whole: shared norms, fair treatment and a culture everyone is part of.",
        example:
          "A lead who is close with two nurses and distant with the rest will hear about “favorites,” even if she's never treated anyone unfairly.",
      },
      {
        id: "myth-smooth",
        front: "Myth 5: My job is to keep things running smoothly.",
        back:
          "Reality: Keeping things running is only half the job. The other half is making things better: noticing what's broken, raising it, and improving how the team works, even when that's messier than leaving it alone.",
        example:
          "A smooth month with the same workaround everyone complains about isn't success. Fixing the workaround is.",
      },
    ],
  },

  whyItWorks: {
    paragraphs: [
      "Hill followed 19 new managers through their first year. Almost all of them described the transition as more painful and confusing than they expected. One said, “I never knew a promotion could be so painful.” Most of that pain came from the gap between what they thought the job was and what it really was. They learned by trial and error, often without realizing they were learning. The good news in her research: struggling early is normal, and the vast majority of new managers come through it.",
      "The stakes are real. Gallup estimates that managers account for at least 70% of the difference in employee engagement between teams. In other words, how you lead shapes how your team feels about their work more than almost anything else.",
      "Google's long-running study of its own managers, Project Oxygen, found that the top behavior of its best managers was being a good coach. It wasn't technical expertise or control. That's the shift this program is built around: from being great at the work to helping others be great at it.",
    ],
    sources: [
      { label: "Linda A. Hill, “Becoming the Boss,” Harvard Business Review, January 2007", url: "https://hbr.org/2007/01/becoming-the-boss" },
      { label: "Gallup, “Managers Account for 70% of Variance in Employee Engagement”", url: "https://news.gallup.com/businessjournal/182792/managers-account-variance-employee-engagement.aspx" },
      { label: "Google re:Work, “Following the data: The research behind great managers”", url: "https://rework.withgoogle.com/intl/en/guides/following-the-data-the-research-behind-great-managers" },
    ],
  },

  seeItInAction: {
    setup:
      "It's your first team huddle as the new lead. Until last week, you were a nurse on this same team. Here are two ways to open.",
    weak: {
      label: "Leading from the myths",
      lines: [
        { speaker: "leader", text: "Hi everyone. So, as you know, I'm the lead now.", note: "Myth 2: leaning on the title. It also puts distance between you and the team on day one." },
        { speaker: "leader", text: "Things are going to tighten up. I'll be checking everyone's numbers every day.", note: "Myth 3: control. The team hears “I don't trust you,” and nobody has done anything wrong yet." },
        { speaker: "leader", text: "I want everyone documenting the way I always did. It just works better.", note: "Myth 1: assuming authority to change how people work before you understand why they work that way." },
        { speaker: "teamMember", text: "(Silence. A few cameras go off.)" },
      ],
      result: "The team complies on the surface and starts talking about you in side chats. You've made your first weeks harder.",
    },
    strong: {
      label: "Leading from reality",
      lines: [
        { speaker: "leader", text: "I know this is a change for all of us, me included. I'm still the same person, and my job is different now.", note: "Honest about the change, without pretending nothing is different." },
        { speaker: "leader", text: "Over the next two weeks I'll set up a one-on-one with each of you. I want to hear what's working, what's frustrating, and what you need from me.", note: "Building credibility through listening and follow-through, not the title." },
        { speaker: "leader", text: "I'm not planning to change how you work right away. I want to understand it first.", note: "Commitment before control." },
        { speaker: "leader", text: "One thing I do want us to work on together is making coverage fair for everyone. I'll bring ideas, and I want yours too.", note: "Leading the team as a whole, and naming one thing to make better." },
      ],
      result: "The team relaxes. People start booking their one-on-ones. You've begun earning authority instead of announcing it.",
    },
    takeaway:
      "In the first weeks, your team is deciding who you are as a leader. Listening, following through and treating everyone the same earns you more authority than any announcement.",
  },

  traps: [
    { trap: "Proving yourself by working harder at your old job.", instead: "Your old job is no longer how you'll be measured. Put the extra hours into your people, not into being the best nurse on the team." },
    { trap: "Swinging to one extreme: the strict boss or the best friend.", instead: "Aim for warm and clear. You can care about people and still hold a standard." },
    { trap: "Changing a lot in your first month to show you're in charge.", instead: "Learn first. Change one or two things that the team agrees need fixing." },
    { trap: "Treating early confusion as proof you're not cut out for this.", instead: "Feeling lost early is the normal experience. Talk about it with your own leader instead of hiding it." },
  ],

  check: [
    {
      id: "cl-m0-q1",
      question:
        "A new lead announced a documentation change two weeks ago. Most of the team still isn't following it. What's the most likely problem?",
      options: [
        { text: "She doesn't have enough authority yet.", correct: false, explain: "More authority would get, at best, compliance while she's watching. That's myth 1 and myth 3." },
        { text: "She announced the change instead of explaining why and involving the team.", correct: true, explain: "Right. Commitment comes from understanding why and having a say in how. Announcements get compliance at best." },
        { text: "She needs to check charts more often.", correct: false, explain: "Monitoring might bump the numbers briefly, but it teaches the team that the change only matters when she's looking." },
      ],
    },
    {
      id: "cl-m0-q2",
      question: "Which is the best sign that a new leader is earning real authority?",
      options: [
        { text: "The team follows the rules when the leader is watching.", correct: false, explain: "That's compliance, which disappears when you look away." },
        { text: "Team members bring problems to the leader early, before they grow.", correct: true, explain: "Yes. People bring problems early to leaders they trust and respect. That's authority you've earned." },
        { text: "Everyone on the team likes the leader.", correct: false, explain: "Being liked is nice but isn't the goal. Teams can like a leader they don't trust to handle hard things." },
      ],
    },
    {
      id: "cl-m0-q3",
      question:
        "A lead has strong one-on-one relationships with each nurse, but the team keeps splitting into groups who only cover for each other. Which myth is she most likely stuck in?",
      options: [
        { text: "Myth 4: leading means building great one-on-one relationships.", correct: true, explain: "Right. She's leading person by person but not leading the team as a whole: shared norms, fair coverage, one culture." },
        { text: "Myth 5: my job is to keep things running smoothly.", correct: false, explain: "Close, but the core issue is that she isn't building the team as a team." },
        { text: "Myth 2: authority comes with the title.", correct: false, explain: "Her relationships suggest she's earning trust individually. The gap is at the team level." },
      ],
    },
  ],

  makeItYours: {
    id: "cl-m0-apply",
    intro: "Write your answers here. They're private unless you choose to share them.",
    questions: [
      { id: "cl-m0-apply-1", prompt: "Which of the five myths do you believe most right now, even a little?", placeholder: "The myth I hold most is…" },
      { id: "cl-m0-apply-2", prompt: "Where do you think that belief came from? Think of a leader you've worked for, good or bad.", placeholder: "I think I picked this up from…" },
      { id: "cl-m0-apply-3", prompt: "What's one thing you'll do differently in your first two weeks if you let that myth go?", placeholder: "In my first two weeks, I'll…" },
    ],
  },

  fieldCard: {
    title: "Before you start leading",
    lines: [
      "Your title gives you a job, not authority.",
      "Authority is earned through character, competence and follow-through.",
      "Aim for commitment, not compliance.",
      "Lead the team as a whole, not just person by person.",
      "Keep things running, and make them better.",
      "Feeling lost early is normal. Talk about it.",
    ],
  },

  practiceTieIn: {
    text:
      "This week's practice conversation is the former-peer reset. You'll practice being honest about what changes, without leaning on your title, while keeping the relationship.",
    relatedSkills: ["Opened with the relationship", "Was honest about what changes", "Named what stays the same"],
  },

  goDeeper: [
    { kind: "article", title: "Becoming the Boss", by: "Linda A. Hill, Harvard Business Review", url: "https://hbr.org/2007/01/becoming-the-boss", minutes: 20, access: "May require an HBR subscription", why: "The original research behind this lesson, with stories from real first-year managers." },
    { kind: "book", title: "Becoming a Manager: How New Managers Master the Challenges of Leadership", by: "Linda A. Hill", why: "The full study of new managers' first year, in depth." },
    { kind: "book", title: "The Making of a Manager", by: "Julie Zhuo", url: "https://www.penguinrandomhouse.com/books/isbn/9780735219564", why: "A warm, practical guide written by someone who became a manager at 25 and learned it all in real time." },
    { kind: "article", title: "Following the data: The research behind great managers", by: "Google re:Work", url: "https://rework.withgoogle.com/intl/en/guides/following-the-data-the-research-behind-great-managers", minutes: 10, why: "What Google learned by studying its best and worst managers." },
  ],
};
