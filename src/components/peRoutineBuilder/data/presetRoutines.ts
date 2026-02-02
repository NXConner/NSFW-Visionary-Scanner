import type { Routine } from "@/components/peRoutineBuilder/types";
import { exercises } from "@/components/peRoutineBuilder/data/exercises";

const byId = (id: string) => {
  const ex = exercises.find(e => e.id === id);
  if (!ex) throw new Error(`Exercise not found: ${id}`);
  return ex;
};

export const presetRoutines: Routine[] = [
  {
    id: "beginner-length",
    name: "Beginner Length Focus",
    level: "beginner",
    goal: "length",
    daysPerWeek: 3,
    totalDuration: 20,
    exercises: [byId("warmup-towel"), byId("stretch-basic"), byId("kegel-basic"), byId("cooldown")],
  },
  {
    id: "beginner-girth",
    name: "Beginner Girth Focus",
    level: "beginner",
    goal: "girth",
    daysPerWeek: 3,
    totalDuration: 25,
    exercises: [byId("warmup-towel"), byId("jelq-wet"), byId("kegel-basic"), byId("cooldown")],
  },
  {
    id: "intermediate-both",
    name: "Intermediate Combo",
    level: "intermediate",
    goal: "both",
    daysPerWeek: 4,
    totalDuration: 35,
    exercises: [
      byId("warmup-towel"),
      byId("stretch-basic"),
      byId("stretch-btc"),
      byId("jelq-wet"),
      byId("kegel-basic"),
      byId("cooldown"),
    ],
  },
  {
    id: "advanced-pump",
    name: "Advanced Pump Routine",
    level: "advanced",
    goal: "both",
    daysPerWeek: 5,
    totalDuration: 45,
    exercises: [
      byId("warmup-towel"),
      byId("stretch-btc"),
      byId("pump-basic"),
      byId("jelq-dry"),
      byId("kegel-basic"),
      byId("cooldown"),
    ],
  },
];
