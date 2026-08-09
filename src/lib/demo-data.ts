// Fictional demo data used to bring the Mitra shell to life.

export const family = {
  name: "The Ramesh family",
  contact: "Anita Ramesh",
  relation: "Daughter",
  location: "Bengaluru, Indiranagar",
};

export const careRecipient = {
  name: "Kamala Ramesh",
  age: 78,
  pronouns: "she/her",
  livesIn: "Indiranagar, Bengaluru",
  notes:
    "Loves filter coffee at 7am, morning walks in the park, and long phone calls with her sister on Sundays.",
  needs: ["Mobility support", "Medication reminders", "Companionship", "Light cooking"],
  languages: ["Kannada", "English", "Hindi"],
};

export const caregiver = {
  name: "Priya Nair",
  role: "Home caregiver",
  experience: "6 years",
  rating: 4.9,
  reviews: 38,
  location: "Bengaluru",
  languages: ["Malayalam", "English", "Kannada"],
  about:
    "I care for elders the way I cared for my own grandmother — patiently, with a lot of laughter and a strict eye on medication times.",
  skills: ["Dementia care", "Post-surgery recovery", "Meal prep", "Mobility assistance", "Basic physiotherapy"],
  certifications: ["Certified Nursing Assistant (2019)", "First Aid & CPR (renewed 2025)"],
  availability: "Weekdays, 8:00 – 18:00",
};

export type Task = {
  id: string;
  time: string;
  title: string;
  detail: string;
  category: "medication" | "meal" | "activity" | "check-in";
  done: boolean;
};

export const todaysTasks: Task[] = [
  {
    id: "t1",
    time: "07:00",
    title: "Morning coffee & greeting",
    detail: "Filter coffee, low sugar. Open the balcony curtains.",
    category: "meal",
    done: true,
  },
  {
    id: "t2",
    time: "08:30",
    title: "Blood pressure tablet",
    detail: "Amlodipine 5mg after breakfast.",
    category: "medication",
    done: true,
  },
  {
    id: "t3",
    time: "10:00",
    title: "Walk in the park",
    detail: "20 minutes, walking stick, shaded path near the pond.",
    category: "activity",
    done: false,
  },
  {
    id: "t4",
    time: "13:00",
    title: "Lunch — soft rice & dal",
    detail: "Low salt. Sit together, no rushing.",
    category: "meal",
    done: false,
  },
  {
    id: "t5",
    time: "16:30",
    title: "Call with Anita",
    detail: "Video call with her daughter. Help set up the tablet.",
    category: "check-in",
    done: false,
  },
  {
    id: "t6",
    time: "20:00",
    title: "Evening medication",
    detail: "Metformin 500mg with dinner.",
    category: "medication",
    done: false,
  },
];

export const carePlanSections = [
  {
    id: "morning",
    title: "Morning",
    window: "07:00 – 11:00",
    items: [
      "Filter coffee at 7:00, low sugar",
      "Help with bathing — grab bar on the left side",
      "Breakfast, then Amlodipine 5mg",
      "Short walk in the park if the weather is kind",
    ],
  },
  {
    id: "afternoon",
    title: "Afternoon",
    window: "11:00 – 17:00",
    items: [
      "Lunch at 13:00 — soft food, low salt",
      "Rest until 15:00, curtains half drawn",
      "Crossword or radio, her favourite station is Rainbow FM",
      "Video call with Anita at 16:30",
    ],
  },
  {
    id: "evening",
    title: "Evening",
    window: "17:00 – 21:00",
    items: [
      "Light stretching, seated",
      "Dinner at 19:45 with Metformin 500mg",
      "Night light on in the hallway",
      "Log the day in Mitra before leaving",
    ],
  },
];

export const medications = [
  { name: "Amlodipine", dose: "5mg", when: "Morning, after food" },
  { name: "Metformin", dose: "500mg", when: "Evening, with dinner" },
  { name: "Vitamin D3", dose: "60k IU", when: "Sundays" },
];

export const updates = [
  {
    id: "u1",
    author: "Priya Nair",
    time: "Today, 10:40",
    text: "We did the full 20 minute walk today. She met her neighbour Sarita and they sat and chatted for a while.",
    mood: "Good day",
  },
  {
    id: "u2",
    author: "Priya Nair",
    time: "Yesterday, 20:15",
    text: "Dinner and evening medication done. Slight knee stiffness in the evening, nothing worrying.",
    mood: "Steady",
  },
  {
    id: "u3",
    author: "Anita Ramesh",
    time: "Yesterday, 18:02",
    text: "Thank you Priya. I have ordered a new walking stick, it should arrive Thursday.",
    mood: "Note",
  },
];

export const matches = [
  {
    id: "m1",
    name: "Priya Nair",
    experience: "6 years",
    score: 96,
    distance: "2.4 km away",
    languages: ["Malayalam", "English", "Kannada"],
    highlights: ["Dementia care", "Medication management", "Morning availability"],
    rate: "₹520 / hour",
  },
  {
    id: "m2",
    name: "Fatima Sheikh",
    experience: "9 years",
    score: 91,
    distance: "4.1 km away",
    languages: ["Hindi", "Urdu", "English"],
    highlights: ["Post-surgery recovery", "Light cooking", "Weekend cover"],
    rate: "₹610 / hour",
  },
  {
    id: "m3",
    name: "Joseph Mathew",
    experience: "4 years",
    score: 88,
    distance: "5.6 km away",
    languages: ["Malayalam", "English"],
    highlights: ["Mobility support", "Physiotherapy basics", "Companionship"],
    rate: "₹480 / hour",
  },
];

export const careTeam = [
  { name: "Priya Nair", role: "Primary caregiver", initials: "PN" },
  { name: "Anita Ramesh", role: "Daughter · Coordinator", initials: "AR" },
  { name: "Vikram Ramesh", role: "Son", initials: "VR" },
  { name: "Dr. Meera Iyer", role: "Family physician", initials: "MI" },
];

export const assistantSuggestions = [
  "Summarise this week for the family",
  "What changed in the care plan?",
  "Help me write today's update",
  "When is the next medication due?",
];
