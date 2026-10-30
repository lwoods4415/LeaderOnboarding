import type { CoreLesson } from "./types";

export const lessonM1: CoreLesson = {
  id: "cl-m1",
  legacyModuleId: "m1",
  moduleMatch: ["my way", "connect first", "trust"],
  title: "The Trust Equation and the Marble Jar",
  estimatedMinutes: 25,

  bigIdea:
    "Trust isn't a feeling you wait for. It's built from four things you can see and change, and the one that matters most is how much you make it about yourself.",

  whyNow: [
    "Every hard thing you'll do as a leader runs on trust: giving feedback, asking for change, holding a standard. Feedback from someone you trust sounds like help. The same words from someone you don't trust sound like criticism.",
    "Trust can feel vague, as if people either click with you or they don't. This lesson breaks it into four parts you can actually work on, starting this week.",
  ],

  model: {
    type: "equation",
    name: "The trust equation",
    oneLine: "Trust grows with credibility, reliability and closeness, and shrinks with self-focus.",
    instructions:
      "Pick one person on your team. Move each slider to where you honestly think they'd rate you today, from 1 (low) to 10 (high). Watch what happens to the result, especially when you change self-focus.",
    formula: "Trust = (Credibility + Reliability + Closeness) ÷ Self-focus",
    factors: [
      {
        id: "credibility",
        label: "Credibility",
        role: "numerator",
        question: "Can I believe what you say?",
        lowSounds: "“She says she'll look into it, but I'm not sure she actually knows how the system works.”",
        highSounds: "“If she says that's the right workflow, it is. And if she doesn't know, she says so.”",
        buildIt: [
          "Say “I don't know, but I'll find out” instead of guessing.",
          "Get the facts right before you share an update.",
          "Know the work well enough to give useful help.",
        ],
      },
      {
        id: "reliability",
        label: "Reliability",
        role: "numerator",
        question: "Do you do what you say you'll do?",
        lowSounds: "“She said she'd fix the coverage schedule weeks ago.”",
        highSounds: "“If she says she'll get back to me Thursday, she does.”",
        buildIt: [
          "Make small promises and keep them, within 48 hours when you can.",
          "If you can't keep a promise, say so before the deadline, not after.",
          "Show up on time and on camera, consistently.",
        ],
      },
      {
        id: "closeness",
        label: "Closeness",
        role: "numerator",
        question: "Do I feel safe telling you the real thing?",
        lowSounds: "“I'd never tell her I'm struggling. It would end up in my review.”",
        highSounds: "“I told her I was overwhelmed, and she helped me sort it out.”",
        buildIt: [
          "Keep confidences. What's shared with you stays with you.",
          "Respond to hard news with curiosity, not judgment.",
          "Learn what matters to each person outside their metrics.",
        ],
      },
      {
        id: "selfFocus",
        label: "Self-focus",
        role: "denominator",
        question: "Is this about you, or about me?",
        lowSounds: "“She's genuinely trying to help me get better.”",
        highSounds: "“Everything she does is about making herself look good to leadership.”",
        buildIt: [
          "Listen more than you talk in one-on-ones.",
          "Resist turning their story into your story (“When I was on the floor…”).",
          "Ask “What would help you?” before sharing what you need.",
        ],
      },
    ],
    scale: { min: 1, max: 10, default: 5 },
    resultBands: [
      { maxScore: 2, label: "Fragile", message: "Trust is thin right now. Start with one small promise you can keep this week, and listen more than you talk in your next one-on-one." },
      { maxScore: 4, label: "Building", message: "There's a foundation. Notice how much the score moves when self-focus goes down. That's usually the fastest lever for a new leader." },
      { maxScore: 8, label: "Solid", message: "This relationship can handle honest feedback. Protect it by staying reliable, especially when you're busy." },
      { maxScore: 999, label: "Strong", message: "This person likely brings you problems early. Ask yourself what you did to build this, and do it with the rest of the team." },
    ],
  },

  whyItWorks: {
    paragraphs: [
      "The trust equation comes from the book The Trusted Advisor (2000) by David Maister, Charles Green and Robert Galford. They noticed that people trust advisors for a few distinct reasons, and that one thing, self-orientation, can cancel out all the others. Because it sits underneath the line, it divides everything above it. You can be credible, reliable and warm, and if people sense it's really about you, trust drops sharply.",
      "This is the trap new leaders fall into most. Early in a new role, it's natural to worry about how you're doing, whether you look capable, and what your own leader thinks. Your team can feel that. The fastest way to build trust is often not doing more, but making the conversation less about yourself.",
      "The trust equation tells you what trust is made of. Brené Brown's research, in the next section, tells you how it actually gets built: slowly, and in moments so small they're easy to miss. Her BRAVING model (boundaries, reliability, accountability, vault, integrity, non-judgment, generosity) breaks trust into seven behaviors. You can rate yourself on it in the Toolkit's trust self-check.",
    ],
    sources: [
      { label: "Trusted Advisor Associates, “The Trust Equation”", url: "https://trustedadvisor.com/build-trust/trust-equation" },
      { label: "David Maister, Charles Green and Robert Galford, The Trusted Advisor (2000)" },
    ],
  },

  spotlight: {
    title: "The marble jar",
    intro:
      "If the trust equation explains what trust is made of, Brené Brown's marble jar explains how it's built. It's one of the most useful pictures of trust a leader can carry.",
    paragraphs: [
      "The idea started with Brown's daughter, Ellen, in third grade. At recess, Ellen told a couple of friends something embarrassing that had happened to her. By the time class started, everyone knew, and kids were laughing and pointing. Ellen's teacher used a marble jar in class: marbles went in when students made good choices together, and came out when they didn't. That day, marbles came out. Ellen came home and said she would never trust anyone again.",
      "Brown told her that trust works like a marble jar. You don't share your hardest things with just anyone. You share them with people who've filled up your jar over time. When she asked Ellen who her “marble jar friends” were, the answers were small: a friend who scooted over to make room at lunch, and another who noticed Ellen's grandparents at her soccer game and remembered their names.",
      "Brown's research found the same thing in adults: “Trust is built in very small moments.” People described trusting someone because they asked how a family member's chemotherapy was going, because they showed up at a funeral, or because they asked for help when they needed it. Nobody described a grand gesture.",
      "Marbles also come out in small moments. Brown draws on marriage researcher John Gottman's idea of “sliding door moments”: everyday chances to connect or turn away. In Gottman's words, “to choose to not connect when the opportunity is there, is a betrayal.” Brown also warns about gossip. Sharing something that isn't yours to share can feel like closeness in the moment, but she calls closeness built on talking about other people “counterfeit trust.” The person you're venting to quietly learns that you'd talk about them too.",
    ],
    points: [
      { title: "Small beats big", text: "You can't fill a jar with one big gesture, like a team lunch or a speech about your open door. Marbles come from hundreds of small, consistent moments: remembering, following up, showing up." },
      { title: "Every person has their own jar", text: "You don't have one jar with your team. You have a separate jar with each person. Your jar with the person you click with may be full while your jar with the quietest person on your team is nearly empty." },
      { title: "Hard conversations draw on the jar", text: "Every piece of honest feedback, every “I need you to change this,” takes marbles out. If the jar is empty, the conversation feels like an attack. If it's full, the same words feel like help. Fill the jar before you need it." },
      { title: "Your sliding door moments are constant", text: "As a leader, people approach you all day: a quick message, a question at the end of a meeting, a sigh on camera. Each one is a chance to put a marble in or let one roll away." },
    ],
    activity: {
      type: "sort",
      name: "Marble in or marble out?",
      oneLine: "Everyday leader moments that build trust, and ones that quietly cost it.",
      instructions: "Tap each moment, then choose whether it puts a marble in the jar or takes marbles out.",
      buckets: [
        { id: "in", label: "Marble in", description: "A small moment that builds trust." },
        { id: "out", label: "Marbles out", description: "A small moment that costs trust." },
      ],
      items: [
        { id: "mj1", text: "Remembering that a nurse's son had a recital, and asking how it went", answer: "in", explain: "Remembering what matters to someone is exactly the kind of small moment Brown's research describes." },
        { id: "mj2", text: "Getting back to someone on Thursday, like you said you would", answer: "in", explain: "Reliability, one kept promise at a time." },
        { id: "mj3", text: "Telling one nurse about another nurse's personal struggles “so she'll understand”", answer: "out", explain: "That story wasn't yours to share. Both nurses learn that you don't keep confidences." },
        { id: "mj4", text: "Reading messages while a nurse tells you something hard", answer: "out", explain: "A sliding door moment where you turned away. She'll think twice before telling you something hard again." },
        { id: "mj5", text: "Asking your team for help with something you don't know how to do", answer: "in", explain: "People in Brown's research trusted others who asked for help when they needed it. It shows honesty about your limits." },
        { id: "mj6", text: "Venting to one nurse about another nurse's attitude", answer: "out", explain: "Counterfeit trust. It feels like bonding, but the nurse you're venting to learns you'd talk about her too." },
        { id: "mj7", text: "Being on camera, on time, for every huddle", answer: "in", explain: "Showing up consistently is a marble your whole team sees, every day." },
        { id: "mj8", text: "Saying “Let's talk later” when a nurse stops you, then never coming back to it", answer: "out", explain: "A small broken promise. Following up later would have turned it into a marble in." },
        { id: "mj9", text: "Admitting a mistake you made, and fixing it", answer: "in", explain: "Accountability is one of the seven parts of BRAVING. Owning a miss builds trust faster than hiding it." },
      ],
    },
    sources: [
      { label: "Brené Brown, “Brené on the Anatomy of Trust,” Unlocking Us podcast (with full transcript)", url: "https://brenebrown.com/books/the-anatomy-of-trust/" },
      { label: "Brené Brown, Dare to Lead; John Gottman, The Science of Trust" },
    ],
  },

  seeItInAction: {
    setup:
      "It's your first real one-on-one with Marcus, a quiet nurse who joined six months ago. Here are two versions of the first few minutes.",
    weak: {
      label: "High self-focus",
      lines: [
        { speaker: "leader", text: "So, I wanted to tell you about my plans for the pod now that I'm lead.", note: "Self-focus. The meeting starts with your agenda, not his." },
        { speaker: "leader", text: "When I was a nurse here, I always did my calls first thing. You should try it.", note: "Turning his work into your story. It also lowers closeness, because he hears judgment." },
        { speaker: "teamMember", text: "Okay, sure." },
        { speaker: "leader", text: "And don't worry, I'll get your schedule fixed by next week.", note: "A big promise you may not be able to keep. Breaking it costs reliability." },
      ],
      result: "Marcus leaves polite and closed. He won't bring you a problem until it's serious.",
    },
    strong: {
      label: "Low self-focus",
      lines: [
        { speaker: "leader", text: "This time is for you. What's been on your mind lately?", note: "Low self-focus from the first sentence." },
        { speaker: "teamMember", text: "Honestly, it's been a lot. I'm still figuring out the remote setup." },
        { speaker: "leader", text: "Tell me more. What's been the hardest part?", note: "Following up shows you're actually listening. That builds closeness." },
        { speaker: "leader", text: "I don't know the answer on the schedule yet. I'll find out and get back to you by Thursday.", note: "Honest about what you don't know (credibility), and a small promise you can keep (reliability)." },
      ],
      result: "Marcus opens up a little. When Thursday comes and you follow through, he opens up more.",
    },
    takeaway:
      "You can't ask for trust. You can only make it easy to give: keep your word, be honest about what you don't know, and make the conversation about them.",
  },

  traps: [
    { trap: "Mistaking being liked for being trusted.", instead: "A team can like you and still not believe you'll handle hard things. Trust shows when people bring you bad news." },
    { trap: "Making big promises to win people over.", instead: "Make small promises and keep every one. Reliability is built in small, repeated moments." },
    { trap: "Oversharing to seem relatable.", instead: "Closeness means they feel safe with you, not that you share your personal problems with them. Your team shouldn't have to carry your stress." },
    { trap: "Building trust only with the people you click with.", instead: "Be deliberate about the people you connect with least. They're watching how you treat everyone." },
  ],

  check: [
    {
      id: "cl-m1-q1",
      question: "Why does self-focus have such a big effect in the trust equation?",
      options: [
        { text: "It's below the line, so it divides credibility, reliability and closeness all at once.", correct: true, explain: "Right. High self-focus shrinks everything else, no matter how strong those are." },
        { text: "It matters most to senior leaders.", correct: false, explain: "It affects trust at every level, and it's especially common in new leaders who are worried about how they're doing." },
        { text: "It's the easiest one to fake.", correct: false, explain: "Actually, people are quick to sense when something is really about you. That's why it's so powerful." },
      ],
    },
    {
      id: "cl-m1-q2",
      question:
        "A lead knows every workflow and always shows up on time. In one-on-ones, though, she mostly talks about her own plans and how leadership sees the pod. What should she work on first?",
      options: [
        { text: "Credibility", correct: false, explain: "Her knowledge of the work is already strong." },
        { text: "Reliability", correct: false, explain: "She's consistent and on time, so reliability isn't the gap." },
        { text: "Self-focus", correct: true, explain: "Yes. Her one-on-ones are about her. Turning them toward her team members would lift trust the most." },
      ],
    },
    {
      id: "cl-m1-q3",
      question: "Which of these is the best example of closeness at work?",
      options: [
        { text: "The leader tells the team about her personal struggles.", correct: false, explain: "That's sharing, not closeness. It can actually make the team feel responsible for you." },
        { text: "A nurse tells the leader she's struggling, and it doesn't get used against her.", correct: true, explain: "Right. Closeness is when people feel safe being honest with you." },
        { text: "The leader and a nurse are friends outside work.", correct: false, explain: "Friendship can exist, but it isn't what builds trust across a whole team." },
      ],
    },
    {
      id: "cl-m1-q4",
      question: "A new lead wants to build trust quickly with her team. According to the marble jar, what works best?",
      options: [
        { text: "A team lunch and a speech about her open-door policy", correct: false, explain: "Nice, but one big gesture adds few marbles. Trust is built in very small moments." },
        { text: "Many small, consistent moments: remembering what matters to each person, following up, showing up", correct: true, explain: "Right. Brown's research found trust is built in very small moments, repeated over time." },
        { text: "Sharing her own struggles so the team feels close to her", correct: false, explain: "Closeness at work means they feel safe with you, not that they carry your stress." },
      ],
    },
  ],

  makeItYours: {
    id: "cl-m1-apply",
    intro: "Use initials, not full names. Your answers are private unless you choose to share them.",
    questions: [
      { id: "cl-m1-apply-1", prompt: "Think of the person on your team you know least. Which of the four parts of trust (credibility, reliability, closeness, self-focus) is weakest between you?", placeholder: "With [initials], the weakest part is… because…" },
      { id: "cl-m1-apply-2", prompt: "Whose marble jar with you is probably the emptiest right now? What makes you think so?", placeholder: "Probably [initials], because…" },
      { id: "cl-m1-apply-3", prompt: "Have you taken any marbles out recently, through a missed follow-up, a distracted moment or something shared that wasn't yours to share?", placeholder: "Honestly, I…" },
      { id: "cl-m1-apply-4", prompt: "Name three small marbles you'll add this week, and who they're for.", placeholder: "1) … 2) … 3) …" },
    ],
  },

  fieldCard: {
    title: "Building trust",
    lines: [
      "Trust = (Credibility + Reliability + Closeness) ÷ Self-focus",
      "Say “I don't know, but I'll find out.”",
      "Make small promises. Keep every one.",
      "Every person has their own marble jar. Fill it before you need it.",
      "Keep confidences. Respond with curiosity, not judgment.",
      "In one-on-ones, it's their meeting. Talk less.",
      "Connect most with the people you click with least.",
    ],
  },

  practiceTieIn: {
    text:
      "This week's practice conversation is a getting-to-know-you one-on-one with Marcus. Keep your self-focus low: ask, follow up, and resist fixing.",
    relatedSkills: ["Asked open questions", "Followed up on what he said", "Listened more than talked", "Didn't rush to fix"],
  },

  goDeeper: [
    { kind: "tool", title: "The Trust Equation and Trust Quotient", by: "Trusted Advisor Associates", url: "https://trustedadvisor.com/build-trust/trust-equation", minutes: 10, why: "The original model explained by its creators, with a quiz that scores your own trust profile." },
    { kind: "podcast", title: "Brené on the Anatomy of Trust", by: "Brené Brown, Unlocking Us", url: "https://brenebrown.com/books/the-anatomy-of-trust/", minutes: 30, why: "The marble jar and BRAVING, explained in her own words with stories." },
    { kind: "video", title: "Why good leaders make you feel safe", by: "Simon Sinek, TED", url: "https://www.ted.com/talks/simon_sinek_why_good_leaders_make_you_feel_safe", minutes: 12, why: "Why teams that feel safe with their leader do better work." },
    { kind: "book", title: "Dare to Lead", by: "Brené Brown", why: "Trust, courage and hard conversations, with practical tools throughout." },
    { kind: "book", title: "The Trusted Advisor", by: "David Maister, Charles Green and Robert Galford", why: "Where the trust equation comes from, with much more on earning trust." },
  ],
};
