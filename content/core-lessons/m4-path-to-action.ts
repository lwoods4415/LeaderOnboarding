import type { CoreLesson } from "./types";

export const lessonM4: CoreLesson = {
  id: "cl-m4",
  legacyModuleId: "m4",
  moduleMatch: ["right to guess", "facts before stories", "stories"],
  title: "The Path to Action",
  estimatedMinutes: 20,

  bigIdea:
    "Between what someone does and how you react, you tell yourself a story. The story drives your feelings and your actions, and most of the time you don't notice you told it.",

  whyNow: [
    "As a peer, you could think “she just doesn't care” about a coworker, and it cost nothing. As a leader, that same thought shapes how you talk to her, what you write down, and what happens to her job. Your stories now have consequences.",
    "This lesson gives you a simple map of how stories form, and how to get back to the facts before a hard conversation, so you open with what happened instead of what you assumed.",
  ],

  model: {
    type: "stages",
    name: "The Path to Action",
    oneLine: "See and hear → Tell a story → Feel → Act. We usually skip from the first step straight to the last.",
    instructions:
      "Click through the four steps. Each one follows the same situation, so you can see where the story slips in and how to catch it.",
    stages: [
      {
        id: "see",
        name: "1. See and hear",
        summary: "The facts: what a camera would have recorded.",
        detail:
          "Facts are things anyone could observe: numbers, dates, words actually said, actions actually taken. They're the least controversial part of any conversation, which makes them the safest place to start.",
        example: "Dana's monitoring-call completion was 82% last month and 79% this month. The target is 95%.",
        questions: ["What did I actually see or hear?", "Would someone else, watching, describe it the same way?"],
        watchFor: "Words like always, never, attitude, lazy or doesn't care. Those aren't facts, they're conclusions.",
      },
      {
        id: "story",
        name: "2. Tell a story",
        summary: "The meaning you add to the facts, often in a split second.",
        detail:
          "Your brain fills gaps automatically. It guesses why someone did something. That's normal and often useful, but the story is a guess, not a fact. The danger is forgetting that you made it up.",
        example: "“She just doesn't care anymore. She's checked out since the panel change.”",
        questions: [
          "What story am I telling myself?",
          "Why would a reasonable, rational, decent person do this?",
          "What am I pretending not to notice about my own part in this?",
        ],
        watchFor: "Three common stories: the villain story (“it's her fault”), the victim story (“it's not my fault”), and the helpless story (“there's nothing I can do”).",
      },
      {
        id: "feel",
        name: "3. Feel",
        summary: "Your emotions come from the story, not from the facts.",
        detail:
          "The same facts with a different story create a completely different feeling. If your story is “she doesn't care,” you'll feel frustrated. If your story is “something might be going on,” you'll feel concerned. Strong emotions are a signal to check your story.",
        example: "Frustrated, a little betrayed, maybe defensive about your pod's numbers.",
        questions: ["What am I feeling right now?", "Which part of my story is creating this feeling?"],
        watchFor: "Treating your feeling as proof the story is true. Feeling strongly about something doesn't make it accurate.",
      },
      {
        id: "act",
        name: "4. Act",
        summary: "What you do next, driven by the story you believe.",
        detail:
          "If you act on an unchecked story, the other person reacts to your story, not to the facts. They defend themselves, and the real issue never gets solved. Going back along the path, from action to feeling to story to facts, lets you choose a better action.",
        example:
          "Unchecked: a cold email restating the target. Checked: a conversation that opens with the numbers and asks what's getting in the way.",
        questions: ["If I act on this story, what will happen?", "What would I do if I only had the facts?"],
        watchFor: "Acting while the feeling is still hot. If you notice a strong emotion, retrace the path before you act.",
      },
    ],
    closing:
      "When you're ready to talk, use STATE from Crucial Conversations: Share your facts. Tell your story, as a possibility. Ask for their view. Talk tentatively. Encourage them to disagree with you.",
  },

  whyItWorks: {
    paragraphs: [
      "The Path to Action comes from Crucial Conversations by Kerry Patterson, Joseph Grenny, Ron McMillan and Al Switzler. Their key insight is that other people don't make us angry. We make ourselves angry with the stories we tell about them. That's good news, because it means we can change the feeling by changing the story.",
      "A related idea, the “ladder of inference,” was developed by organizational psychologist Chris Argyris. It describes how we climb from facts to assumptions to conclusions to beliefs so quickly that we don't notice the steps. Both models make the same point: slow down and climb back to what actually happened.",
      "Starting with facts also matters because of how people react to perceived judgment. David Rock's SCARF model describes how threats to status, certainty, autonomy, relatedness or fairness can trigger a defensive response in the brain that makes clear thinking harder. Opening with a judgment, like “you don't seem invested,” threatens status and fairness. Opening with a fact lowers the threat, so the other person can actually engage.",
    ],
    sources: [
      { label: "Crucial Learning, “Crucial Conversations Skill Summary: Master My Stories”", url: "https://cruciallearning.com/blog/crucial-conversations-skill-summary-master-my-stories/" },
      { label: "Kerry Patterson, Joseph Grenny, Ron McMillan and Al Switzler, Crucial Conversations" },
      { label: "David Rock, “SCARF: a brain-based model for collaborating with and influencing others,” NeuroLeadership Journal, 2008", url: "https://schoolguide.casel.org/uploads/sites/2/2018/12/SCARF-NeuroleadershipArticle.pdf" },
    ],
  },

  seeItInAction: {
    setup:
      "Dana has been a solid nurse for four years. Her call completion dropped to 82%, then 79%. Here are two ways to open the conversation.",
    weak: {
      label: "Opening with the story",
      lines: [
        { speaker: "leader", text: "I've noticed you don't seem as invested lately.", note: "“Invested” is your story, not a fact. She'll argue with the story instead of discussing the numbers." },
        { speaker: "teamMember", text: "Not invested? I've been here four years. I work harder than anyone on this pod." },
        { speaker: "leader", text: "Then why have your numbers dropped two months in a row?", note: "A question that's really an accusation. Now it's a debate." },
        { speaker: "teamMember", text: "Because the targets are unrealistic, honestly." },
      ],
      result: "Dana gets defensive, and the real reason for the drop never comes up.",
    },
    strong: {
      label: "Opening with the facts",
      lines: [
        { speaker: "leader", text: "I want to talk about your call completion. It was 82% last month and 79% this month, and the target is 95%.", note: "Facts only. Nothing to argue with." },
        { speaker: "leader", text: "That's not like you. You've been one of our most consistent nurses for years.", note: "This sets up mutual respect, and it's also true." },
        { speaker: "leader", text: "I don't know what's going on yet. What's been getting in the way?", note: "Curious, not certain. Talking tentatively." },
        { speaker: "teamMember", text: "Honestly, I got 15 new complex patients two months ago, and it's been a lot." },
      ],
      result: "You find a real barrier you can help solve, which the first version would never have uncovered.",
    },
    takeaway:
      "Facts are hard to argue with and easy to discuss. Stories invite a debate. Open with what happened, then get curious about why.",
  },

  traps: [
    { trap: "Hiding the story inside a question.", instead: "“Is everything okay with your motivation?” is still a story. Ask “What's been getting in the way?”" },
    { trap: "Calling a story a fact.", instead: "“You're always late” is a story. “Notes were submitted late on Sept 22, Oct 3 and Oct 9” is a fact." },
    { trap: "Never sharing what you're concerned about.", instead: "After the facts, it's okay to share your concern as a possibility: “I'm starting to wonder if something's going on. Is that right?”" },
    { trap: "Having the conversation while you're still angry.", instead: "Retrace your path first. If you can't name the facts calmly, you're not ready yet." },
  ],

  check: [
    {
      id: "cl-m4-q1",
      question: "Which of these is a fact?",
      options: [
        { text: "She's always late with her notes.", correct: false, explain: "“Always” is a conclusion. It's your story about the facts." },
        { text: "Her notes were submitted more than 24 hours after the call on Sept 22, Oct 3 and Oct 9.", correct: true, explain: "Right. Specific, observable, and anyone could verify it." },
        { text: "She doesn't prioritize documentation.", correct: false, explain: "That's a guess about her priorities, not something you observed." },
      ],
    },
    {
      id: "cl-m4-q2",
      question: "You're frustrated because you believe a nurse is ignoring your messages. According to the Path to Action, what should you do first?",
      options: [
        { text: "Message her and say you've noticed she's ignoring you.", correct: false, explain: "That acts on the story. She'll respond to the accusation, not the facts." },
        { text: "Go back to what you actually saw: how many messages, when, and what happened.", correct: true, explain: "Yes. Retrace the path to the facts, then ask yourself why a reasonable person might do this." },
        { text: "Wait until you feel less frustrated and let it go.", correct: false, explain: "Waiting can help you cool down, but letting it go means the issue never gets solved." },
      ],
    },
    {
      id: "cl-m4-q3",
      question: "Which opening best follows the STATE approach?",
      options: [
        { text: "“Why don't you care about your numbers anymore?”", correct: false, explain: "This opens with a story and puts her on the defensive." },
        { text: "“Your completion was 82%, then 79%. I'm wondering if something's getting in the way. What's going on from your side?”", correct: true, explain: "Right. Facts first, the story offered as a possibility, then a genuine question." },
        { text: "“I feel like you're checked out, and it's affecting the team.”", correct: false, explain: "Sharing your feeling is fine, but this skips the facts and states the story as truth." },
      ],
    },
  ],

  makeItYours: {
    id: "cl-m4-apply",
    intro: "Think of someone on your team you're frustrated with right now. Use initials, not full names. Your answers are private unless you choose to share them.",
    questions: [
      { id: "cl-m4-apply-1", prompt: "What are the facts? Write only what you actually saw or heard.", placeholder: "On [dates], I saw…" },
      { id: "cl-m4-apply-2", prompt: "What story have you been telling yourself about why?", placeholder: "The story I've been telling myself is…" },
      { id: "cl-m4-apply-3", prompt: "Why might a reasonable, rational, decent person do this? Write at least one other explanation.", placeholder: "Another possibility is…" },
      { id: "cl-m4-apply-4", prompt: "Write the first two sentences you'd say to open the conversation, starting with the facts.", placeholder: "I wanted to talk about…" },
    ],
  },

  fieldCard: {
    title: "Facts before stories",
    lines: [
      "What did I actually see or hear?",
      "What story am I telling myself?",
      "Why would a reasonable, decent person do this?",
      "Open with facts only. No always, never or attitude.",
      "Offer your concern as a possibility, then ask.",
      "Still angry? Retrace the path before you talk.",
    ],
  },

  practiceTieIn: {
    text:
      "This week's practice conversation is the performance conversation with Dana. Open with facts, not judgments, and find out what's really getting in the way.",
    relatedSkills: ["Opened with facts, not judgments", "Asked for her view", "Acknowledged what she shared"],
  },

  goDeeper: [
    { kind: "article", title: "Crucial Conversations Skill Summary: Master My Stories", by: "Crucial Learning", url: "https://cruciallearning.com/blog/crucial-conversations-skill-summary-master-my-stories/", minutes: 5, why: "The Path to Action and the three clever stories, from the authors' organization." },
    { kind: "video", title: "Rethinking thinking", by: "Trevor Maber, TED-Ed", url: "https://www.ted.com/talks/trevor_maber_rethinking_thinking", minutes: 6, why: "A short animated explanation of the ladder of inference: how we jump to conclusions." },
    { kind: "article", title: "SCARF: a brain-based model for collaborating with and influencing others", by: "David Rock, NeuroLeadership Journal", url: "https://schoolguide.casel.org/uploads/sites/2/2018/12/SCARF-NeuroleadershipArticle.pdf", minutes: 25, why: "The science behind why people get defensive, and what lowers the threat." },
    { kind: "book", title: "Crucial Conversations: Tools for Talking When Stakes Are High", by: "Kerry Patterson, Joseph Grenny, Ron McMillan and Al Switzler", why: "The full toolkit for hard conversations, including STATE." },
  ],
};
