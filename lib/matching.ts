import { StudentProfile, Project } from '@/types';

export function recommendTeammates(students: StudentProfile[], currentSkills: string[] = [], limit = 5) {
  const scored = students
    .map((s) => ({
      student: s,
      score: jaccard(currentSkills, s.skills) + (s.available ? 0.2 : 0)
    }))
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((r) => r.student);
}

export function matchForProject(students: StudentProfile[], project: Project, limit = 5) {
  return recommendTeammates(students, project.requiredSkills, limit);
}

function jaccard(a: string[], b: string[]) {
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...a.map((s) => s.toLowerCase()), ...b.map((s) => s.toLowerCase())]).size;
  return union === 0 ? 0 : intersection / union;
}
