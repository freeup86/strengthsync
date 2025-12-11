// Complete CliftonStrengths data - All 34 themes across 4 domains

export type DomainSlug = "executing" | "influencing" | "relationship" | "strategic";

export interface Domain {
  id: string;
  name: string;
  slug: DomainSlug;
  description: string;
  colorHex: string;
  colorName: string;
  iconName: string;
  themeCount: number;
}

export interface Theme {
  id: string;
  name: string;
  slug: string;
  domain: DomainSlug;
  shortDescription: string;
  fullDescription: string;
  blindSpots: string[];
  actionItems: string[];
  worksWith: string[];
  keywords: string[];
}

export const DOMAINS: Domain[] = [
  {
    id: "domain-executing",
    name: "Executing",
    slug: "executing",
    description:
      "People with dominant Executing themes make things happen. They know how to take an idea and transform it into a reality through tireless effort.",
    colorHex: "#7B68EE",
    colorName: "purple",
    iconName: "Zap",
    themeCount: 9,
  },
  {
    id: "domain-influencing",
    name: "Influencing",
    slug: "influencing",
    description:
      "People with dominant Influencing themes know how to take charge, speak up, and make sure others are heard. They can sell ideas both inside and outside the organization.",
    colorHex: "#F5A623",
    colorName: "orange",
    iconName: "Megaphone",
    themeCount: 8,
  },
  {
    id: "domain-relationship",
    name: "Relationship Building",
    slug: "relationship",
    description:
      "People with dominant Relationship Building themes build strong relationships that hold a team together and make it greater than the sum of its parts.",
    colorHex: "#4A90D9",
    colorName: "blue",
    iconName: "Heart",
    themeCount: 9,
  },
  {
    id: "domain-strategic",
    name: "Strategic Thinking",
    slug: "strategic",
    description:
      "People with dominant Strategic Thinking themes absorb and analyze information that informs better decisions. They help teams consider what could be.",
    colorHex: "#7CB342",
    colorName: "green",
    iconName: "Lightbulb",
    themeCount: 8,
  },
];

export const THEMES: Theme[] = [
  // ============================================================================
  // EXECUTING DOMAIN (9 themes)
  // ============================================================================
  {
    id: "theme-achiever",
    name: "Achiever",
    slug: "achiever",
    domain: "executing",
    shortDescription: "A constant drive for accomplishment",
    fullDescription:
      "Your Achiever theme helps explain your drive. Achiever describes a constant need for achievement. You feel as if every day starts at zero. By the end of the day you must achieve something tangible in order to feel good about yourself. And by 'every day' you mean every single day—workdays, weekends, vacations. No matter how much you may feel you deserve a day of rest, if the day passes without some form of achievement, no matter how small, you will feel dissatisfied.",
    blindSpots: [
      "May struggle to celebrate wins before moving to the next goal",
      "Risk of burnout from constant doing",
      "May make others feel inadequate with relentless pace",
      "Can prioritize quantity over quality",
    ],
    actionItems: [
      "Set daily goals and track your accomplishments",
      "Build in time for rest without guilt",
      "Partner with someone who can help you celebrate milestones",
      "Channel your drive into high-impact activities",
    ],
    worksWith: ["Strategic", "Focus", "Discipline", "Activator"],
    keywords: ["productive", "driven", "hardworking", "busy", "stamina"],
  },
  {
    id: "theme-arranger",
    name: "Arranger",
    slug: "arranger",
    domain: "executing",
    shortDescription: "Organizing resources for maximum productivity",
    fullDescription:
      "You are a conductor. When faced with a complex situation involving many factors, you enjoy managing all of the variables, aligning and realigning them until you are sure you have arranged them in the most productive configuration possible. In your mind there is nothing special about what you are doing—you are simply trying to figure out the best way to get things done.",
    blindSpots: [
      "May over-complicate simple tasks",
      "Can appear controlling to others",
      "May struggle when not in charge of coordination",
      "Frequent changes can frustrate team members who prefer stability",
    ],
    actionItems: [
      "Take on roles that allow you to orchestrate projects",
      "Explain your reasoning when making changes",
      "Create systems that others can follow",
      "Use your flexibility to respond to crises effectively",
    ],
    worksWith: ["Strategic", "Maximizer", "Adaptability", "Communication"],
    keywords: ["organize", "coordinate", "flexible", "juggle", "conductor"],
  },
  {
    id: "theme-belief",
    name: "Belief",
    slug: "belief",
    domain: "executing",
    shortDescription: "Core values that guide all actions",
    fullDescription:
      "If you possess a strong Belief theme, you have certain core values that are enduring. These values vary from one person to another, but ordinarily your Belief theme causes you to be family-oriented, altruistic, even spiritual, and to value responsibility and high ethics—both in yourself and others. These core values affect your behavior in many ways.",
    blindSpots: [
      "May appear inflexible or judgmental",
      "Can struggle in environments that conflict with values",
      "May prioritize principles over practical solutions",
      "Risk of missionary zeal that alienates others",
    ],
    actionItems: [
      "Choose work aligned with your values",
      "Articulate your values clearly to others",
      "Find like-minded colleagues who share your mission",
      "Use your conviction to inspire others during challenges",
    ],
    worksWith: ["Responsibility", "Connectedness", "Empathy", "Futuristic"],
    keywords: ["values", "ethics", "purpose", "mission", "principles"],
  },
  {
    id: "theme-consistency",
    name: "Consistency",
    slug: "consistency",
    domain: "executing",
    shortDescription: "Treating everyone equally and fairly",
    fullDescription:
      "Balance is important to you. You are keenly aware of the need to treat people the same, no matter what their station in life, so you do not want to see the scales tipped too far in any one person's favor. In your view this leads to selfishness and individualism. It leads to a world where some people gain an unfair advantage because of their connections or their background or their greasing of the wheels.",
    blindSpots: [
      "May overlook individual needs in favor of uniformity",
      "Can be seen as rigid or uncreative",
      "May struggle with situations requiring special treatment",
      "Risk of undervaluing star performers",
    ],
    actionItems: [
      "Develop clear policies and procedures",
      "Advocate for fair treatment across the organization",
      "Explain the reasoning behind rules to build buy-in",
      "Balance fairness with recognition of individual contributions",
    ],
    worksWith: ["Discipline", "Harmony", "Analytical", "Deliberative"],
    keywords: ["fair", "equal", "rules", "procedures", "balance"],
  },
  {
    id: "theme-deliberative",
    name: "Deliberative",
    slug: "deliberative",
    domain: "executing",
    shortDescription: "Taking serious care in making decisions",
    fullDescription:
      "You are careful. You are vigilant. You are a private person. You know that the world is an unpredictable place. Everything may seem in order, but beneath the surface you sense the many risks. Rather than denying these risks, you draw each one out into the open. Then each risk can be identified, assessed, and ultimately reduced.",
    blindSpots: [
      "May be seen as overly cautious or slow",
      "Can dampen enthusiasm with risk focus",
      "May miss opportunities by waiting too long",
      "Can frustrate action-oriented colleagues",
    ],
    actionItems: [
      "Take time to think through decisions carefully",
      "Share your risk assessments to help the team",
      "Build trust slowly but deeply",
      "Partner with Activators who can push past analysis paralysis",
    ],
    worksWith: ["Analytical", "Strategic", "Responsibility", "Focus"],
    keywords: ["careful", "cautious", "risk", "private", "thoughtful"],
  },
  {
    id: "theme-discipline",
    name: "Discipline",
    slug: "discipline",
    domain: "executing",
    shortDescription: "Creating order, structure, and routines",
    fullDescription:
      "Your world needs to be predictable. It needs to be ordered and planned. So you instinctively impose structure on your world. You set up routines. You focus on timelines and deadlines. You break long-term projects into a series of specific short-term plans, and you work through each plan diligently.",
    blindSpots: [
      "May appear inflexible or controlling",
      "Can struggle with ambiguity or sudden changes",
      "May impose structure where it's not needed",
      "Risk of frustration when others don't follow plans",
    ],
    actionItems: [
      "Create structures and timelines for projects",
      "Help teams break big goals into actionable steps",
      "Build in flexibility for the unexpected",
      "Partner with Adaptability to handle disruptions",
    ],
    worksWith: ["Focus", "Achiever", "Responsibility", "Analytical"],
    keywords: ["routine", "structure", "order", "timelines", "precision"],
  },
  {
    id: "theme-focus",
    name: "Focus",
    slug: "focus",
    domain: "executing",
    shortDescription: "Setting and pursuing priorities with single-minded intensity",
    fullDescription:
      "Where am I headed? you ask yourself. You ask this question every day. Guided by this theme of Focus, you need a clear destination. Lacking one, your life and your work can quickly become frustrating. And so each year, each month, and even each week you set goals. These goals then serve as your compass, helping you determine priorities and make the necessary corrections to get back on course.",
    blindSpots: [
      "May miss important peripheral information",
      "Can appear dismissive of other priorities",
      "Risk of tunnel vision on one goal",
      "May struggle to pivot when circumstances change",
    ],
    actionItems: [
      "Set clear priorities and communicate them",
      "Help teams stay on track toward goals",
      "Take time to assess if focus needs to shift",
      "Partner with Input or Ideation to broaden perspective",
    ],
    worksWith: ["Achiever", "Discipline", "Strategic", "Maximizer"],
    keywords: ["goals", "priorities", "direction", "clarity", "efficient"],
  },
  {
    id: "theme-responsibility",
    name: "Responsibility",
    slug: "responsibility",
    domain: "executing",
    shortDescription: "Taking psychological ownership of commitments",
    fullDescription:
      "Your Responsibility theme forces you to take psychological ownership for anything you commit to, and whether large or small, you feel emotionally bound to follow it through to completion. Your good name depends on it. If for some reason you cannot deliver, you automatically start to look for ways to make it up to the other person.",
    blindSpots: [
      "May take on too much",
      "Can have difficulty delegating",
      "Risk of guilt when unable to deliver",
      "May feel personally responsible for team failures",
    ],
    actionItems: [
      "Be selective about commitments",
      "Clearly communicate what you can and cannot do",
      "Build trusted relationships where you can share the load",
      "Help others understand the importance of follow-through",
    ],
    worksWith: ["Achiever", "Belief", "Discipline", "Relator"],
    keywords: ["commitment", "ownership", "reliable", "dependable", "accountable"],
  },
  {
    id: "theme-restorative",
    name: "Restorative",
    slug: "restorative",
    domain: "executing",
    shortDescription: "Solving problems and fixing what's broken",
    fullDescription:
      "You love to solve problems. Whereas some are dismayed when they encounter yet another breakdown, you can be energized by it. You enjoy the challenge of analyzing the symptoms, identifying what is wrong, and finding the solution. You may prefer practical problems or conceptual ones or personal ones.",
    blindSpots: [
      "May focus too much on what's broken vs. what's working",
      "Can be seen as negative or critical",
      "Risk of fixing things that aren't broken",
      "May struggle to appreciate when things are going well",
    ],
    actionItems: [
      "Seek roles that involve troubleshooting",
      "Help teams identify root causes of problems",
      "Balance problem-finding with acknowledging successes",
      "Partner with Positivity to maintain team morale",
    ],
    worksWith: ["Analytical", "Deliberative", "Learner", "Strategic"],
    keywords: ["problem-solving", "fix", "troubleshoot", "diagnose", "improve"],
  },

  // ============================================================================
  // INFLUENCING DOMAIN (8 themes)
  // ============================================================================
  {
    id: "theme-activator",
    name: "Activator",
    slug: "activator",
    domain: "influencing",
    shortDescription: "Making things happen by turning thoughts into action",
    fullDescription:
      "When can we start? This is a recurring question in your life. You are impatient for action. You may concede that analysis has its uses or that debate and discussion can occasionally yield some valuable insights, but deep down you know that only action is real. Only action can make things happen.",
    blindSpots: [
      "May act before thinking things through",
      "Can frustrate those who need more planning time",
      "Risk of starting too many things at once",
      "May appear impatient or pushy",
    ],
    actionItems: [
      "Jump-start stalled projects",
      "Partner with Strategic or Deliberative for better planning",
      "Channel your energy into high-priority initiatives",
      "Help others overcome analysis paralysis",
    ],
    worksWith: ["Strategic", "Ideation", "Communication", "Achiever"],
    keywords: ["action", "start", "impatient", "initiate", "catalyst"],
  },
  {
    id: "theme-command",
    name: "Command",
    slug: "command",
    domain: "influencing",
    shortDescription: "Taking control and making decisions",
    fullDescription:
      "Command leads you to take charge. Unlike some people, you feel no discomfort with imposing your views on others. On the contrary, once your opinion is formed, you need to share it with others. Once your goal is set, you feel restless until you have aligned others with you.",
    blindSpots: [
      "May be seen as domineering or intimidating",
      "Can shut down others' input",
      "Risk of creating conflict in collaborative settings",
      "May struggle with positions lacking authority",
    ],
    actionItems: [
      "Step up during crises when decisive leadership is needed",
      "Use your presence to advocate for your team",
      "Balance assertiveness with listening",
      "Partner with Empathy to soften your approach when needed",
    ],
    worksWith: ["Activator", "Self-Assurance", "Competition", "Strategic"],
    keywords: ["decisive", "direct", "assertive", "leader", "presence"],
  },
  {
    id: "theme-communication",
    name: "Communication",
    slug: "communication",
    domain: "influencing",
    shortDescription: "Expressing thoughts in compelling ways",
    fullDescription:
      "You like to explain, to describe, to host, to speak in public, and to write. This is your Communication theme at work. Ideas are a dry beginning. Events are static. You feel a need to bring them to life, to energize them, to make them exciting and vivid.",
    blindSpots: [
      "May dominate conversations",
      "Can prioritize style over substance",
      "Risk of over-explaining or rambling",
      "May struggle with quiet, reflective work",
    ],
    actionItems: [
      "Take on presentation and storytelling roles",
      "Help translate complex ideas for broader audiences",
      "Practice active listening to balance your talking",
      "Use stories to make data and concepts memorable",
    ],
    worksWith: ["Woo", "Positivity", "Activator", "Strategic"],
    keywords: ["storytelling", "presenting", "articulate", "expressive", "vivid"],
  },
  {
    id: "theme-competition",
    name: "Competition",
    slug: "competition",
    domain: "influencing",
    shortDescription: "Measuring progress against others' performance",
    fullDescription:
      "Competition is rooted in comparison. When you look at the world, you are instinctively aware of other people's performance. Their performance is the ultimate yardstick. No matter how hard you tried, no matter how worthy your intentions, if you reached your goal but did not outperform your peers, the achievement feels hollow.",
    blindSpots: [
      "May create unnecessary rivalry",
      "Can prioritize winning over collaboration",
      "Risk of poor sportsmanship in loss",
      "May demotivate others who aren't competitive",
    ],
    actionItems: [
      "Channel competition into measurable goals",
      "Compete against your own past performance",
      "Celebrate team wins, not just individual victories",
      "Partner with Harmony to balance competitive drive",
    ],
    worksWith: ["Achiever", "Focus", "Maximizer", "Significance"],
    keywords: ["winning", "performance", "comparison", "contest", "drive"],
  },
  {
    id: "theme-maximizer",
    name: "Maximizer",
    slug: "maximizer",
    domain: "influencing",
    shortDescription: "Focusing on strengths to stimulate excellence",
    fullDescription:
      "Excellence, not average, is your measure. Taking something from below average to slightly above average takes a great deal of effort and in your opinion is not very rewarding. Transforming something strong into something superb takes just as much effort but is much more thrilling.",
    blindSpots: [
      "May neglect necessary remediation",
      "Can appear elitist or dismissive of weakness",
      "Risk of perfectionism that delays completion",
      "May struggle with entry-level or foundational work",
    ],
    actionItems: [
      "Focus on developing people's strengths",
      "Seek excellence in select areas rather than mediocrity in many",
      "Help teams identify and leverage what they do best",
      "Partner with Restorative for necessary problem-fixing",
    ],
    worksWith: ["Individualization", "Developer", "Strategic", "Arranger"],
    keywords: ["excellence", "strengths", "quality", "best", "optimize"],
  },
  {
    id: "theme-self-assurance",
    name: "Self-Assurance",
    slug: "self-assurance",
    domain: "influencing",
    shortDescription: "Inner confidence in one's abilities and judgment",
    fullDescription:
      "Self-Assurance is similar to self-confidence. In the deepest part of you, you have faith in your strengths. You know that you are able—able to take risks, able to meet new challenges, able to stake claims, and, most importantly, able to deliver. But Self-Assurance is more than just self-confidence.",
    blindSpots: [
      "May appear arrogant or dismissive of others' opinions",
      "Can take on challenges beyond capabilities",
      "Risk of not seeking help when needed",
      "May underestimate risks others see",
    ],
    actionItems: [
      "Trust your instincts in uncertain situations",
      "Help others feel confident by sharing your certainty",
      "Seek feedback to check blind spots",
      "Partner with Deliberative for balanced risk assessment",
    ],
    worksWith: ["Command", "Activator", "Competition", "Strategic"],
    keywords: ["confident", "certain", "independent", "bold", "decisive"],
  },
  {
    id: "theme-significance",
    name: "Significance",
    slug: "significance",
    domain: "influencing",
    shortDescription: "Wanting to make a meaningful impact",
    fullDescription:
      "You want to be very significant in the eyes of other people. In the truest sense of the word you want to be recognized. You want to be heard. You want to stand out. You want to be known. In particular, you want to be known and appreciated for the unique strengths you bring.",
    blindSpots: [
      "May seek recognition inappropriately",
      "Can appear self-centered or attention-seeking",
      "Risk of disappointment when not acknowledged",
      "May prioritize visibility over substance",
    ],
    actionItems: [
      "Pursue roles with visibility and impact",
      "Ensure your contributions are meaningful, not just noticed",
      "Help others gain recognition too",
      "Partner with Significance to amplify important causes",
    ],
    worksWith: ["Communication", "Competition", "Achiever", "Focus"],
    keywords: ["recognition", "impact", "legacy", "visibility", "meaningful"],
  },
  {
    id: "theme-woo",
    name: "Woo",
    slug: "woo",
    domain: "influencing",
    shortDescription: "Winning others over through charm and connection",
    fullDescription:
      "Woo stands for winning others over. You enjoy the challenge of meeting new people and getting them to like you. Strangers are rarely intimidating to you. On the contrary, strangers can be energizing. You are drawn to them. You want to learn their names, ask them questions, and find some area of common interest.",
    blindSpots: [
      "May prioritize breadth over depth in relationships",
      "Can appear superficial or insincere",
      "Risk of neglecting existing relationships for new ones",
      "May struggle with follow-through after initial connection",
    ],
    actionItems: [
      "Use your social skills to open doors for your team",
      "Network strategically for organizational benefit",
      "Partner with Relator to deepen key relationships",
      "Help shy colleagues expand their networks",
    ],
    worksWith: ["Communication", "Positivity", "Activator", "Empathy"],
    keywords: ["networking", "charm", "social", "outgoing", "connect"],
  },

  // ============================================================================
  // RELATIONSHIP BUILDING DOMAIN (9 themes)
  // ============================================================================
  {
    id: "theme-adaptability",
    name: "Adaptability",
    slug: "adaptability",
    domain: "relationship",
    shortDescription: "Going with the flow and living in the moment",
    fullDescription:
      "You live in the moment. You don't see the future as a fixed destination. Instead, you see it as a place that you create out of the choices that you make right now. And so you discover your future one choice at a time. This doesn't mean that you don't have plans. You probably do.",
    blindSpots: [
      "May lack long-term planning",
      "Can appear directionless to goal-oriented people",
      "Risk of being too reactive",
      "May struggle with rigid deadlines or structures",
    ],
    actionItems: [
      "Be the calm in the storm during crises",
      "Help teams adjust to unexpected changes",
      "Partner with Focus or Discipline for long-term planning",
      "Use your flexibility to smooth team dynamics",
    ],
    worksWith: ["Arranger", "Empathy", "Positivity", "Includer"],
    keywords: ["flexible", "present", "go-with-flow", "responsive", "nimble"],
  },
  {
    id: "theme-connectedness",
    name: "Connectedness",
    slug: "connectedness",
    domain: "relationship",
    shortDescription: "Believing that everything happens for a reason",
    fullDescription:
      "Things happen for a reason. You are sure of it. You are sure of it because in your soul you know that we are all connected. Yes, we are individuals, responsible for our own judgments and in possession of our own free will, but nonetheless we are part of something larger.",
    blindSpots: [
      "May seem abstract or mystical to pragmatic people",
      "Can over-attribute meaning to random events",
      "Risk of passivity ('it will work out')",
      "May struggle with purely transactional relationships",
    ],
    actionItems: [
      "Help teams see the bigger picture",
      "Build bridges between diverse groups",
      "Bring perspective during challenging times",
      "Partner with Analytical to ground insights in data",
    ],
    worksWith: ["Belief", "Empathy", "Developer", "Harmony"],
    keywords: ["meaning", "purpose", "spiritual", "unity", "bridge-builder"],
  },
  {
    id: "theme-developer",
    name: "Developer",
    slug: "developer",
    domain: "relationship",
    shortDescription: "Recognizing and cultivating potential in others",
    fullDescription:
      "You see the potential in others. Very often, in fact, potential is all you see. In your view no individual is fully formed. On the contrary, each individual is a work in progress, alive with possibilities. And you are drawn toward people for this very reason.",
    blindSpots: [
      "May invest in people who won't develop",
      "Can neglect high performers for those needing growth",
      "Risk of disappointment when people don't change",
      "May be taken advantage of by those not committed to growth",
    ],
    actionItems: [
      "Take on mentoring and coaching roles",
      "Celebrate others' growth milestones",
      "Set realistic expectations for development timelines",
      "Partner with Maximizer to identify where to invest",
    ],
    worksWith: ["Individualization", "Positivity", "Empathy", "Maximizer"],
    keywords: ["mentor", "coach", "potential", "growth", "nurture"],
  },
  {
    id: "theme-empathy",
    name: "Empathy",
    slug: "empathy",
    domain: "relationship",
    shortDescription: "Sensing and understanding others' emotions",
    fullDescription:
      "You can sense the emotions of those around you. You can feel what they are feeling as though their feelings are your own. Intuitively, you are able to see the world through their eyes and share their perspective. You do not necessarily agree with each person's perspective.",
    blindSpots: [
      "May absorb others' negative emotions",
      "Can struggle to maintain boundaries",
      "Risk of emotional exhaustion",
      "May be seen as too soft in tough situations",
    ],
    actionItems: [
      "Use your insight to help teams navigate emotions",
      "Advocate for people who aren't being heard",
      "Set boundaries to protect your emotional energy",
      "Partner with Command for balanced decision-making",
    ],
    worksWith: ["Developer", "Harmony", "Individualization", "Connectedness"],
    keywords: ["feelings", "emotional-intelligence", "understanding", "intuitive", "compassion"],
  },
  {
    id: "theme-harmony",
    name: "Harmony",
    slug: "harmony",
    domain: "relationship",
    shortDescription: "Finding common ground and avoiding conflict",
    fullDescription:
      "You look for areas of agreement. In your view there is little to be gained from conflict and friction, so you seek to hold them to a minimum. When you know that the people around you hold differing views, you try to find the common ground.",
    blindSpots: [
      "May avoid necessary conflict",
      "Can suppress important dissenting views",
      "Risk of appearing wishy-washy",
      "May struggle in highly competitive environments",
    ],
    actionItems: [
      "Facilitate consensus-building discussions",
      "Find practical solutions that work for everyone",
      "Develop comfort with productive disagreement",
      "Partner with Command to navigate necessary conflicts",
    ],
    worksWith: ["Adaptability", "Empathy", "Consistency", "Includer"],
    keywords: ["peace", "consensus", "agreement", "practical", "mediator"],
  },
  {
    id: "theme-includer",
    name: "Includer",
    slug: "includer",
    domain: "relationship",
    shortDescription: "Accepting everyone and making them feel welcome",
    fullDescription:
      "Stretch the circle wider. This is the philosophy around which you orient your life. You want to include people and make them feel part of the group. In direct contrast to those who are drawn only to exclusive groups, you actively avoid those groups that exclude others.",
    blindSpots: [
      "May include people who don't fit",
      "Can slow group progress by accommodating everyone",
      "Risk of diluting team focus",
      "May struggle with necessary exclusion decisions",
    ],
    actionItems: [
      "Welcome new team members and help them integrate",
      "Ensure all voices are heard in meetings",
      "Balance inclusion with performance standards",
      "Partner with Focus to maintain team direction",
    ],
    worksWith: ["Harmony", "Empathy", "Adaptability", "Developer"],
    keywords: ["welcome", "belonging", "accepting", "diverse", "inclusive"],
  },
  {
    id: "theme-individualization",
    name: "Individualization",
    slug: "individualization",
    domain: "relationship",
    shortDescription: "Recognizing each person's unique qualities",
    fullDescription:
      "Your Individualization theme leads you to be intrigued by the unique qualities of each person. You are impatient with generalizations or 'types' because you don't want to obscure what is special and distinct about each person. Instead, you focus on the differences between individuals.",
    blindSpots: [
      "May struggle to treat people consistently",
      "Can appear to play favorites",
      "Risk of overcomplicating team management",
      "May resist standardized processes",
    ],
    actionItems: [
      "Match people to roles that fit their unique talents",
      "Customize communication for each team member",
      "Help leaders understand individual motivations",
      "Partner with Consistency for fair treatment frameworks",
    ],
    worksWith: ["Developer", "Empathy", "Maximizer", "Arranger"],
    keywords: ["unique", "personalize", "observe", "tailor", "custom"],
  },
  {
    id: "theme-positivity",
    name: "Positivity",
    slug: "positivity",
    domain: "relationship",
    shortDescription: "Bringing enthusiasm and energy to others",
    fullDescription:
      "You are generous with praise, quick to smile, and always on the lookout for the positive in the situation. Some call you lighthearted. Others just wish that their glass were as full as yours seems to be. But either way, people want to be around you.",
    blindSpots: [
      "May appear naive or unrealistic",
      "Can dismiss legitimate concerns",
      "Risk of toxic positivity",
      "May struggle to acknowledge problems",
    ],
    actionItems: [
      "Lift team morale during challenging times",
      "Celebrate wins and milestones",
      "Balance optimism with realistic problem acknowledgment",
      "Partner with Deliberative for balanced perspective",
    ],
    worksWith: ["Communication", "Woo", "Developer", "Adaptability"],
    keywords: ["optimistic", "enthusiasm", "lighthearted", "upbeat", "encouraging"],
  },
  {
    id: "theme-relator",
    name: "Relator",
    slug: "relator",
    domain: "relationship",
    shortDescription: "Building deep, genuine relationships",
    fullDescription:
      "Relator describes your attitude toward your relationships. In simple terms, the Relator theme pulls you toward people you already know. You do not necessarily shy away from meeting new people—in fact, you may have other themes that cause you to enjoy the thrill of turning strangers into friends—but you do derive a great deal of pleasure and strength from being around your close friends.",
    blindSpots: [
      "May appear cliquish or exclusive",
      "Can struggle with large-group dynamics",
      "Risk of neglecting broader network",
      "May be slow to trust new team members",
    ],
    actionItems: [
      "Invest time in deepening key relationships",
      "Build small, high-trust teams",
      "Share your authentic self to build genuine connections",
      "Partner with Woo to expand your network strategically",
    ],
    worksWith: ["Responsibility", "Empathy", "Individualization", "Developer"],
    keywords: ["close-friends", "genuine", "trust", "authentic", "loyal"],
  },

  // ============================================================================
  // STRATEGIC THINKING DOMAIN (8 themes)
  // ============================================================================
  {
    id: "theme-analytical",
    name: "Analytical",
    slug: "analytical",
    domain: "strategic",
    shortDescription: "Searching for patterns and connections in data",
    fullDescription:
      "Your Analytical theme challenges other people: 'Prove it. Show me why what you are claiming is true.' In the face of this kind of questioning some will find that their brilliant theories wither and die. For you, this is precisely the point. You do not necessarily want to destroy other people's ideas, but you do insist that their theories be sound.",
    blindSpots: [
      "May appear overly critical or skeptical",
      "Can slow decision-making with over-analysis",
      "Risk of analysis paralysis",
      "May dismiss intuition-based ideas",
    ],
    actionItems: [
      "Bring rigor to team decisions with data analysis",
      "Help others strengthen their arguments",
      "Set time limits for analysis phases",
      "Partner with Activator to move from analysis to action",
    ],
    worksWith: ["Deliberative", "Learner", "Strategic", "Context"],
    keywords: ["data", "evidence", "logical", "objective", "research"],
  },
  {
    id: "theme-context",
    name: "Context",
    slug: "context",
    domain: "strategic",
    shortDescription: "Understanding the present by researching the past",
    fullDescription:
      "You look back. You look back because that is where the answers lie. You look back to understand the present. From your vantage point the present is unstable, a confusing clamor of competing voices. It is only by casting your mind back to an earlier time, a time when the plans were being drawn up, that the present regains its stability.",
    blindSpots: [
      "May focus too much on the past",
      "Can resist new approaches that lack precedent",
      "Risk of being seen as backward-looking",
      "May slow innovation by over-analyzing history",
    ],
    actionItems: [
      "Help teams learn from past successes and failures",
      "Provide historical perspective on decisions",
      "Document lessons learned for future reference",
      "Partner with Futuristic to balance past and future focus",
    ],
    worksWith: ["Analytical", "Deliberative", "Learner", "Belief"],
    keywords: ["history", "background", "precedent", "retrospective", "patterns"],
  },
  {
    id: "theme-futuristic",
    name: "Futuristic",
    slug: "futuristic",
    domain: "strategic",
    shortDescription: "Inspired by visions of what could be",
    fullDescription:
      "Wouldn't it be great if... You are the kind of person who loves to peer over the horizon. The future fascinates you. As if it were projected on the wall, you see in detail what the future might hold, and this detailed picture keeps pulling you forward, into tomorrow.",
    blindSpots: [
      "May neglect present realities",
      "Can appear unrealistic or detached",
      "Risk of frustration when vision isn't shared",
      "May struggle with tactical execution",
    ],
    actionItems: [
      "Paint compelling visions to inspire teams",
      "Help organizations plan for long-term success",
      "Ground your vision with practical next steps",
      "Partner with Achiever or Discipline for execution",
    ],
    worksWith: ["Strategic", "Ideation", "Communication", "Belief"],
    keywords: ["vision", "tomorrow", "dream", "inspire", "possibilities"],
  },
  {
    id: "theme-ideation",
    name: "Ideation",
    slug: "ideation",
    domain: "strategic",
    shortDescription: "Fascinated by ideas and connections",
    fullDescription:
      "You are fascinated by ideas. What is an idea? An idea is a concept, the best explanation of the most events. You are delighted when you discover beneath the complex surface an elegantly simple concept to explain why things are the way they are. An idea is a connection.",
    blindSpots: [
      "May generate more ideas than can be executed",
      "Can appear scattered or unfocused",
      "Risk of boredom with implementation",
      "May frustrate those seeking practical solutions",
    ],
    actionItems: [
      "Brainstorm solutions to complex problems",
      "Help teams see new possibilities",
      "Develop discipline for evaluating and prioritizing ideas",
      "Partner with Focus or Discipline for execution",
    ],
    worksWith: ["Strategic", "Futuristic", "Activator", "Input"],
    keywords: ["creative", "innovation", "brainstorm", "concepts", "connections"],
  },
  {
    id: "theme-input",
    name: "Input",
    slug: "input",
    domain: "strategic",
    shortDescription: "Collecting information and resources",
    fullDescription:
      "You are inquisitive. You collect things. You might collect information—words, facts, books, and quotations—or you might collect tangible things such as butterflies, baseball cards, porcelain dolls, or sepia photographs. Whatever you collect, you collect it because it interests you.",
    blindSpots: [
      "May hoard information without sharing",
      "Can collect more than you can use",
      "Risk of being seen as disorganized",
      "May struggle to decide what's worth keeping",
    ],
    actionItems: [
      "Be the team's go-to resource for information",
      "Curate collections that add value to projects",
      "Regularly share useful information with others",
      "Partner with Arranger to organize your collections",
    ],
    worksWith: ["Learner", "Analytical", "Ideation", "Context"],
    keywords: ["curious", "collect", "archive", "resources", "research"],
  },
  {
    id: "theme-intellection",
    name: "Intellection",
    slug: "intellection",
    domain: "strategic",
    shortDescription: "Enjoying deep thinking and mental activity",
    fullDescription:
      "You like to think. You like mental activity. You like exercising the 'muscles' of your brain, stretching them in multiple directions. This need for mental activity may be focused; for example, you may be trying to solve a problem or develop an idea or understand another person's feelings.",
    blindSpots: [
      "May appear aloof or disengaged",
      "Can struggle with quick decision-making",
      "Risk of overthinking simple matters",
      "May prefer solitary work over collaboration",
    ],
    actionItems: [
      "Schedule time for deep thinking",
      "Share your insights to add value to discussions",
      "Partner with Communication to articulate your thoughts",
      "Balance reflection with action",
    ],
    worksWith: ["Learner", "Analytical", "Strategic", "Input"],
    keywords: ["introspective", "contemplative", "philosophical", "deep-thinker", "reflective"],
  },
  {
    id: "theme-learner",
    name: "Learner",
    slug: "learner",
    domain: "strategic",
    shortDescription: "Energized by the journey from ignorance to competence",
    fullDescription:
      "You love to learn. The subject matter that interests you most will be determined by your other themes and experiences, but whatever the subject, you will always be drawn to the process of learning. The process, more than the content or the result, is especially exciting for you.",
    blindSpots: [
      "May be perpetual student, never expert",
      "Can lose interest once mastery is achieved",
      "Risk of learning without applying",
      "May take on more learning than practical",
    ],
    actionItems: [
      "Pursue continuous professional development",
      "Share what you learn with others",
      "Apply learning to practical challenges",
      "Partner with Achiever to balance learning with doing",
    ],
    worksWith: ["Input", "Analytical", "Intellection", "Achiever"],
    keywords: ["growth", "education", "development", "curious", "mastery"],
  },
  {
    id: "theme-strategic",
    name: "Strategic",
    slug: "strategic",
    domain: "strategic",
    shortDescription: "Seeing patterns and creating alternative paths",
    fullDescription:
      "The Strategic theme enables you to sort through the clutter and find the best route. It is not a skill that can be taught. It is a distinct way of thinking, a special perspective on the world at large. This perspective allows you to see patterns where others simply see complexity.",
    blindSpots: [
      "May be impatient with those who don't see the path",
      "Can appear to jump to conclusions",
      "Risk of dismissing alternatives too quickly",
      "May struggle to explain intuitive leaps",
    ],
    actionItems: [
      "Help teams navigate complex decisions",
      "Identify multiple paths forward and their trade-offs",
      "Slow down to bring others along your thinking",
      "Partner with Communication to explain your strategy",
    ],
    worksWith: ["Futuristic", "Ideation", "Analytical", "Achiever"],
    keywords: ["patterns", "options", "navigation", "planning", "pathfinding"],
  },
];

// Helper functions
export function getThemeBySlug(slug: string): Theme | undefined {
  return THEMES.find((t) => t.slug === slug);
}

export function getThemesByDomain(domainSlug: DomainSlug): Theme[] {
  return THEMES.filter((t) => t.domain === domainSlug);
}

export function getDomainBySlug(slug: DomainSlug): Domain | undefined {
  return DOMAINS.find((d) => d.slug === slug);
}

export function getDomainForTheme(themeSlug: string): Domain | undefined {
  const theme = getThemeBySlug(themeSlug);
  if (!theme) return undefined;
  return getDomainBySlug(theme.domain);
}

export function getDomainColor(domainSlug: DomainSlug): string {
  const domain = getDomainBySlug(domainSlug);
  return domain?.colorHex ?? "#6B7280";
}

export function getThemeColor(themeSlug: string): string {
  const domain = getDomainForTheme(themeSlug);
  return domain?.colorHex ?? "#6B7280";
}

// All theme names for validation
export const ALL_THEME_NAMES = THEMES.map((t) => t.name);
export const ALL_THEME_SLUGS = THEMES.map((t) => t.slug);

// Complementary pairings for partnership suggestions
export const COMPLEMENTARY_PAIRINGS: Array<{
  theme1: string;
  theme2: string;
  description: string;
  synergyType: "natural" | "complementary" | "powerful";
}> = [
  {
    theme1: "strategic",
    theme2: "achiever",
    description: "Vision meets execution - Strategic sees the path, Achiever makes it happen",
    synergyType: "powerful",
  },
  {
    theme1: "empathy",
    theme2: "command",
    description: "Emotional intelligence balances direct leadership for impactful decisions",
    synergyType: "complementary",
  },
  {
    theme1: "analytical",
    theme2: "woo",
    description: "Data-driven precision meets persuasive charm for compelling presentations",
    synergyType: "complementary",
  },
  {
    theme1: "input",
    theme2: "arranger",
    description: "Collecting resources paired with organizing them for maximum impact",
    synergyType: "natural",
  },
  {
    theme1: "focus",
    theme2: "adaptability",
    description: "Staying on course while remaining flexible to change",
    synergyType: "complementary",
  },
  {
    theme1: "futuristic",
    theme2: "achiever",
    description: "Visionary thinking with practical progress",
    synergyType: "powerful",
  },
  {
    theme1: "ideation",
    theme2: "discipline",
    description: "Creative ideas with structured execution",
    synergyType: "complementary",
  },
  {
    theme1: "learner",
    theme2: "communication",
    description: "Acquiring knowledge and sharing it effectively",
    synergyType: "natural",
  },
  {
    theme1: "developer",
    theme2: "individualization",
    description: "Growing people by understanding their unique needs",
    synergyType: "natural",
  },
  {
    theme1: "positivity",
    theme2: "deliberative",
    description: "Optimism balanced with careful risk assessment",
    synergyType: "complementary",
  },
  {
    theme1: "activator",
    theme2: "strategic",
    description: "Quick action guided by clear direction",
    synergyType: "powerful",
  },
  {
    theme1: "responsibility",
    theme2: "relator",
    description: "Deep commitment to trusted relationships",
    synergyType: "natural",
  },
];
