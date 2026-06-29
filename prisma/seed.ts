import { PrismaClient } from "@prisma/client";
import type { CompetencyConfig } from "../src/engine/types";

const prisma = new PrismaClient();

const BEHAVIORAL_COMPETENCIES: CompetencyConfig[] = [
  {
    competency: "leadership",
    label: "Leadership",
    description: "Ability to influence, guide, and inspire others toward a goal",
    targetTurns: 3,
    minTurns: 1,
  },
  {
    competency: "ownership",
    label: "Ownership",
    description: "Taking responsibility for outcomes, not just tasks",
    targetTurns: 3,
    minTurns: 1,
  },
  {
    competency: "conflict_resolution",
    label: "Conflict Resolution",
    description: "Navigating disagreements productively and maintaining relationships",
    targetTurns: 2,
    minTurns: 1,
  },
  {
    competency: "communication",
    label: "Communication",
    description: "Clarity, brevity, and adapting style to audience",
    targetTurns: 2,
    minTurns: 1,
  },
  {
    competency: "growth_mindset",
    label: "Growth Mindset",
    description: "Learning from failure, seeking feedback, adapting quickly",
    targetTurns: 2,
    minTurns: 1,
  },
  {
    competency: "execution",
    label: "Execution",
    description: "Delivering high-quality work under constraints and ambiguity",
    targetTurns: 3,
    minTurns: 1,
  },
];

async function main() {
  await prisma.interviewTemplate.upsert({
    where: { slug: "senior-engineer-behavioral" },
    update: {},
    create: {
      slug: "senior-engineer-behavioral",
      title: "Senior Engineer Behavioral Interview",
      role: "Senior Software Engineer",
      duration: 45,
      description:
        "A comprehensive behavioral interview for senior individual contributor roles. Evaluates leadership, ownership, execution, communication, conflict resolution, and growth mindset.",
      config: BEHAVIORAL_COMPETENCIES as any,
    },
  });

  await prisma.interviewTemplate.upsert({
    where: { slug: "engineering-manager-behavioral" },
    update: {},
    create: {
      slug: "engineering-manager-behavioral",
      title: "Engineering Manager Behavioral Interview",
      role: "Engineering Manager",
      duration: 45,
      description:
        "Behavioral interview for engineering manager roles. Focuses on people leadership, execution at scale, cross-functional collaboration, and building high-performing teams.",
      config: BEHAVIORAL_COMPETENCIES as any,
    },
  });

  console.log("Seeded interview templates.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
