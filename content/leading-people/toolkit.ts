// Generated from reference/1-Leading-People-Protocol.html by scripts/extract-content.mjs.
// Text is verbatim from the reference page, apart from approved-edits.json. To change wording, edit that file and re-run.
import type { Tool, PlannerTool } from "../types";

export const TOOLS: Tool[] = [
  {
    "type": "planner",
    "title": "Conversation planner",
    "lede": "Fill this in before any performance conversation. It separates what you know from the story you're telling yourself, based on Crucial Conversations.",
    "fields": [
      {
        "key": "fact",
        "label": "The facts: what did you see or hear?",
        "ph": "Monitoring calls at 82% in September and 79% in October; the target is 95%.",
        "blank": "what you saw or heard"
      },
      {
        "key": "story",
        "label": "The story you're telling yourself",
        "ph": "She's checked out since the panel change.",
        "blank": "your story"
      },
      {
        "key": "want",
        "label": "What do you really want? For them, for you, for the relationship",
        "ph": "For her to be back on track and to feel she can tell me when something's in the way.",
        "blank": "for them, for me, for our working relationship"
      },
      {
        "key": "next",
        "label": "Agreed next steps (fill in after)",
        "blank": "what each of us will do, and by when"
      },
      {
        "key": "follow",
        "label": "Follow-up date",
        "input": true,
        "ph": "e.g. Thursday the 23rd",
        "blank": "within two weeks"
      }
    ],
    "note": "The story stays out of the opening. You'll test it by asking, not by stating it.",
    "template": "OPENING\n“I wanted to talk with you about something I noticed. {fact}. I don't know the full story yet, and I'd like to hear your side before I assume anything.”\n\nWHAT I WANT\n{want}\n\nQUESTIONS TO ASK\n• What's been getting in the way?\n• What do you think would help?\n• And what else?\n• What do you need from me?\n\nAGREED NEXT STEPS\n{next}\n\nFOLLOW-UP DATE\n{follow}",
    "id": "conv",
    "prefix": ""
  },
  {
    "type": "braving",
    "lede": "Rate yourself honestly on Brené Brown's seven elements of trust, from 1 (rarely) to 5 (consistently). Retake it at the end of the program."
  },
  {
    "type": "list",
    "title": "Getting-to-know-you 1:1 questions",
    "lede": "For Module 1. Listen more than you talk, and take notes after, not during.",
    "items": [
      "What do you enjoy most about your work here? What drains you?",
      "What are you best at that people might not know about?",
      "What does a really good workday look like for you?",
      "Is there anything about your situation or work environment you'd like me to know, so I can support you?",
      "Where do you want to grow in the next year?",
      "How do you like to receive feedback: in the moment, written, in a 1:1?",
      "What did I do as a peer that you'd like me to keep doing? Anything you'd like me to stop?",
      "What's one thing that would make your job easier right now?"
    ]
  },
  {
    "type": "list",
    "title": "Former-peer reset conversation",
    "lede": "For Weeks 0 to 1, with anyone you were close to. Keep it short and warm. The goal is to name the change before a hard moment forces it.",
    "items": [
      "<b>Open with the relationship.</b> “Our friendship matters to me, and I want to talk about how this change affects us.”",
      "<b>Name what changes.</b> “I'm now responsible for the team's results, which means sometimes I'll need to give you feedback, including about things I used to joke about with you.”",
      "<b>Name what stays.</b> “I'll still have your back, and I still want to hear what you think.”",
      "<b>Ask.</b> “How are you feeling about it? What would help this feel okay?”",
      "<b>Agree on one thing.</b> For example: venting goes somewhere other than the team chat, or concerns come to you directly."
    ]
  },
  {
    "type": "list",
    "title": "Weekly 1:1 template",
    "lede": "Their meeting, not yours. Keep it even in busy weeks.",
    "items": [
      "<b>Their topics first.</b> What's on your mind?",
      "<b>Wins.</b> Name one specific thing they did well.",
      "<b>Barriers.</b> What's getting in the way? What have you tried?",
      "<b>Growth.</b> Progress on the goal they named.",
      "<b>Your follow-ups.</b> What you owe them from last week, done or not."
    ]
  }
];

export const DOC_TOOL: PlannerTool = {
  "type": "planner",
  "id": "doc",
  "prefix": "doc_",
  "title": "Documentation builder",
  "lede": "Fill this in right after an early check-in, pattern conversation or improvement plan check-in. It produces a factual summary you can keep and, for pattern conversations, send to the team member.",
  "fields": [
    {
      "key": "date",
      "label": "Date and type of conversation",
      "input": true,
      "ph": "Oct 14, pattern conversation",
      "blank": "date and type"
    },
    {
      "key": "facts",
      "label": "The facts: metrics, dates, observations",
      "ph": "Documentation submitted late on Sept 22, Oct 3 and Oct 9. Expectation: within 24 hours of the call.",
      "blank": "facts"
    },
    {
      "key": "prior",
      "label": "Earlier conversations about this",
      "ph": "Early check-in on Sept 24.",
      "blank": "none"
    },
    {
      "key": "view",
      "label": "Their perspective, in their words",
      "ph": "Said she's been stretched thin and losing track at the end of the day.",
      "blank": "their perspective"
    },
    {
      "key": "support",
      "label": "Support offered",
      "ph": "End-of-day documentation block on her calendar; weekly check-in for a month.",
      "blank": "support offered"
    },
    {
      "key": "agree",
      "label": "What we agreed",
      "ph": "All documentation within 24 hours. She'll flag any day she can't by 4 p.m.",
      "blank": "agreed actions"
    },
    {
      "key": "next",
      "label": "What happens next",
      "ph": "Follow-up on Oct 28. If the pattern continues, the next step is a written improvement plan with our director.",
      "blank": "next step"
    }
  ],
  "note": "Write facts, not labels. Leave out guesses about health or personal life. Write it as if the team member will read it, because for a pattern conversation they will.",
  "template": "CONVERSATION SUMMARY\n{date}\n\nWHAT WE DISCUSSED\n{facts}\n\nEARLIER CONVERSATIONS\n{prior}\n\nYOUR PERSPECTIVE\n{view}\n\nSUPPORT OFFERED\n{support}\n\nWHAT WE AGREED\n{agree}\n\nWHAT HAPPENS NEXT\n{next}"
};

export const BOOKS: [string, string][] = [
  [
    "Crucial Conversations",
    "Patterson, Grenny, McMillan, Switzler. Modules 4 and 5."
  ],
  [
    "Crucial Accountability",
    "Grenny, Patterson et al. Module 5."
  ],
  [
    "Dare to Lead",
    "Brené Brown. Modules 1 and 4."
  ],
  [
    "Leaders Eat Last",
    "Simon Sinek. Modules 0 and 1."
  ],
  [
    "Becoming a Manager",
    "Linda Hill. Modules 0 and 2."
  ],
  [
    "The First 90 Days",
    "Michael Watkins. Module 0."
  ],
  [
    "The Coaching Habit",
    "Michael Bungay Stanier. Module 3."
  ],
  [
    "Multipliers",
    "Liz Wiseman. Module 3."
  ],
  [
    "Radical Candor",
    "Kim Scott. Module 1."
  ],
  [
    "The Fearless Organization",
    "Amy Edmondson. Module 6."
  ],
  [
    "The 4 Disciplines of Execution",
    "McChesney, Covey, Huling. Module 2."
  ],
  [
    "The Five Dysfunctions of a Team",
    "Patrick Lencioni. Module 5."
  ]
];

export const BRAVING: [string, string][] = [
  [
    "Boundaries",
    "I'm clear about what's okay and not okay, and I respect others' limits."
  ],
  [
    "Reliability",
    "I do what I say I'll do, consistently."
  ],
  [
    "Accountability",
    "I own my mistakes and make them right."
  ],
  [
    "Vault",
    "I keep confidences and don't share what isn't mine to share."
  ],
  [
    "Integrity",
    "I choose what's right over what's easy or fast."
  ],
  [
    "Non-judgment",
    "People can ask me for help without fear of being judged."
  ],
  [
    "Generosity",
    "I assume the most generous explanation for others' actions."
  ]
];
