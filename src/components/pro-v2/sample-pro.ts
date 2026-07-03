import proImage from "@/assets/pro-james.jpg";

export const samplePro = {
  slug: "jordon-gumbley",
  name: "Jordon Gumbley",
  firstName: "Jordon",
  role: "Personal Trainer & Strength Coach",
  image: proImage,
  tagline:
    "I help busy professionals in Telford rebuild strength, drop body fat, and train around real life — without giving up their evenings or weekends.",
  location: "Telford, Shropshire",
  city: "Telford",
  verified: true,
  memberSince: "March 2021",
  yearsQualified: 5,
  sessionsDelivered: 3200,
  coverageRadiusKm: 15,
  responseRate: "Usually within 24h",
  lastActive: "Today",
  modes: {
    inPerson: true,
    online: true,
  },
  atAGlance: [
    { label: "Years qualified", value: "5" },
    { label: "Sessions delivered", value: "3,200+" },
    { label: "Client retention", value: "92%" },
    { label: "Avg. rating", value: "4.9 / 5" },
  ],
  about: [
    "I've spent the last five years coaching people who thought they were 'too far gone' — post-injury, post-baby, mid-career burnout — and helped them rebuild a body they actually trust. My sessions are calm, technical, and deliberately unflashy.",
    "You won't find me shouting at anyone or posting gym selfies. What you will find is a coach who plans every session around your week, tracks the numbers that matter, and adjusts the moment life gets in the way.",
    "I train clients 1:1 in a private Telford studio, in small groups of three, and online for anyone outside the area. Every plan is written by hand — no templates, no apps generating your programme in the background.",
  ],
  specialisms: [
    "Fat loss",
    "Strength building",
    "Post-injury rehab",
    "Postnatal training",
    "Nutrition coaching",
    "Habit change",
  ],
  whoIHelp: [
    {
      title: "Busy professionals",
      body: "You want to feel strong and lean without training six days a week. We'll build a 2–3 session plan that fits around meetings, travel, and family.",
    },
    {
      title: "Returners after a break",
      body: "Injury, pregnancy, burnout, life. We rebuild carefully — starting where you are today, not where you used to be.",
    },
    {
      title: "First-time lifters",
      body: "If a barbell has always felt intimidating, we start with the fundamentals in a private studio. No mirrors, no crowds, no judgement.",
    },
  ],
  services: [
    {
      name: "1:1 Personal Training",
      price: "£55",
      unit: "per 60-min session",
      description:
        "Fully bespoke sessions in a private Telford studio. Programming, coaching, and check-ins built around you.",
      includes: [
        "Bespoke training programme",
        "In-person coaching every session",
        "Weekly WhatsApp check-in",
        "Video technique review",
      ],
      popular: false,
    },
    {
      name: "Small Group (max 3)",
      price: "£28",
      unit: "per person, per session",
      description:
        "Same programming as 1:1, coached in a group of three. Great if you want accountability, a shared cost, or to train with a partner.",
      includes: [
        "Groups capped at 3 people",
        "Shared programming, individual load",
        "60-minute session",
        "Free trial session",
      ],
      popular: true,
    },
    {
      name: "Online Coaching",
      price: "£120",
      unit: "per month",
      description:
        "For clients outside Telford. Fully written programme, video-reviewed technique, and weekly one-to-one check-ins.",
      includes: [
        "Programme built for your gym",
        "Unlimited technique reviews",
        "Weekly 1:1 video call",
        "Nutrition guidance",
      ],
      popular: false,
    },
  ],
  qualifications: [
    { name: "Level 3 Personal Trainer", body: "Active IQ", year: "2020", status: "Verified" },
    { name: "Level 4 Lower Back Pain Specialist", body: "Focus Awards", year: "2022", status: "Verified" },
    { name: "Pre & Post-Natal Coach", body: "Girls Gone Strong", year: "2023", status: "Verified" },
    { name: "Emergency First Aid at Work", body: "St John Ambulance", year: "2025", status: "Active", expires: "2028" },
  ],
  proofs: [
    {
      headline: "Lost 18kg in 9 months without giving up her social life",
      body: "Hannah came to me post-lockdown, exhausted and 20kg heavier than she wanted to be. We built a 3-session week she could actually stick to. Nine months in she's stronger than she's ever been and still eats out twice a week.",
      initials: "H.M.",
      metric: "-18 kg",
    },
    {
      headline: "Back to running after 3 years of chronic knee pain",
      body: "Tom had been told he'd need to stop running. We spent 12 weeks on lower-body strength and single-leg work. He's now running 10k pain-free and lifting more than he ever has.",
      initials: "T.R.",
      metric: "10 k pain-free",
    },
    {
      headline: "Postnatal rebuild — from doorframe planks to deadlifting 80kg",
      body: "Sam came back to training 5 months postpartum. We started with breath work and the basics. Nine months in, she's deadlifting 80kg and feels like herself again.",
      initials: "S.O.",
      metric: "80 kg deadlift",
    },
  ],
  reviews: {
    rating: 4.9,
    count: 47,
    distribution: [
      { stars: 5, count: 42 },
      { stars: 4, count: 4 },
      { stars: 3, count: 1 },
      { stars: 2, count: 0 },
      { stars: 1, count: 0 },
    ],
    items: [
      {
        author: "Hannah",
        rating: 5,
        date: "2 weeks ago",
        body: "Would really recommend Jordon to anybody looking to start their training journey. He is patient, knowledgeable and supportive throughout our sessions, and takes time to understand what I can and can't do.",
      },
      {
        author: "Tom",
        rating: 5,
        date: "1 month ago",
        body: "Genuinely the first trainer I've worked with who takes the time to understand the whole picture — not just the workout. My knee is the best it's been in years.",
      },
      {
        author: "Sam",
        rating: 5,
        date: "1 month ago",
        body: "I came back to training after having my little one and Jordon made it feel completely doable. He never rushed me and every session was pitched perfectly.",
      },
      {
        author: "Rob",
        rating: 5,
        date: "2 months ago",
        body: "Best PT I've had. Programming is thoughtful, coaching is precise, and he actually cares. Session flies by.",
      },
    ],
  },
  availability: [
    { day: "Mon", slots: ["morning", "evening"] },
    { day: "Tue", slots: ["morning", "afternoon", "evening"] },
    { day: "Wed", slots: ["evening"] },
    { day: "Thu", slots: ["morning", "afternoon", "evening"] },
    { day: "Fri", slots: ["morning", "afternoon"] },
    { day: "Sat", slots: ["morning"] },
    { day: "Sun", slots: [] },
  ] as { day: string; slots: Array<"morning" | "afternoon" | "evening"> }[],
  faqs: [
    {
      q: "How long is a typical session?",
      a: "60 minutes for 1:1 and small group. Online check-ins are usually 30 minutes. First session is 75 minutes so we can walk through your goals, injury history, and starting programme.",
    },
    {
      q: "What if I need to cancel or reschedule?",
      a: "24 hours' notice and we'll move it, no charge. Under 24 hours the session is chargeable — this keeps things fair for everyone on the roster.",
    },
    {
      q: "What happens in the first session?",
      a: "We spend the first 15 minutes on what you want, what's happened injury-wise, and what you've tried before. Then we run through a few baseline movements so I can build your first block of programming.",
    },
    {
      q: "Do I need my own kit?",
      a: "No. The studio has everything — barbells, dumbbells to 40kg, plates, machines, cardio. Just wear something you can move in.",
    },
    {
      q: "How does online coaching work?",
      a: "Everything runs through a private client portal. You get a written programme every 4 weeks, unlimited video technique reviews, and a weekly 1:1 call.",
    },
  ],
};

export type SamplePro = typeof samplePro;
