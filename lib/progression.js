import { db } from 'hatchable';

export const LEVELS = ['A1','A2','B1','B2','C1','C2'];
export const SKILLS = ['grammar','listening','speaking','reading','writing'];
const MODULES = 4;
const TOPICS = 3;

export function parseTopicId(value) {
  const m = /^(A1|A2|B1|B2|C1|C2)-([0-3])-([0-2])$/.exec(String(value || ''));
  return m ? { level: m[1], module: Number(m[2]), topic: Number(m[3]) } : null;
}
export function parseModuleId(value) {
  const m = /^(A1|A2|B1|B2|C1|C2)-([0-3])$/.exec(String(value || ''));
  return m ? { level: m[1], module: Number(m[2]) } : null;
}
export async function topicMastered(userId, topicId) {
  const r = await db.query(
    'SELECT skill, MAX(score) AS score FROM skill_assessments WHERE user_id=$1 AND topic_id=$2 GROUP BY skill',
    [userId, topicId]
  );
  const latest = new Map(r.rows.map(x => [x.skill, Number(x.score)]));
  return SKILLS.every(skill => latest.has(skill) && latest.get(skill) >= 8.5);
}
export async function modulePassed(userId, level, moduleIndex) {
  const r = await db.query(
    'SELECT MAX(score) AS best_score FROM quiz_attempts WHERE user_id=$1 AND module_id=$2',
    [userId, level + '-' + moduleIndex]
  );
  return Number(r.rows[0]?.best_score || 0) >= 80;
}
export async function canOpenTopic(userId, level, moduleIndex, topicIndex) {
  const li = LEVELS.indexOf(level);
  if (li < 0 || !Number.isInteger(moduleIndex) || moduleIndex < 0 || moduleIndex >= MODULES ||
      !Number.isInteger(topicIndex) || topicIndex < 0 || topicIndex >= TOPICS) return false;

  for (let previousLevel = 0; previousLevel < li; previousLevel++) {
    const lv = LEVELS[previousLevel];
    for (let mi = 0; mi < MODULES; mi++) {
      if (!(await modulePassed(userId, lv, mi))) return false;
      for (let ti = 0; ti < TOPICS; ti++) {
        if (!(await topicMastered(userId, lv + '-' + mi + '-' + ti))) return false;
      }
    }
  }
  for (let previousModule = 0; previousModule < moduleIndex; previousModule++) {
    if (!(await modulePassed(userId, level, previousModule))) return false;
    for (let ti = 0; ti < TOPICS; ti++) {
      if (!(await topicMastered(userId, level + '-' + previousModule + '-' + ti))) return false;
    }
  }
  for (let previousTopic = 0; previousTopic < topicIndex; previousTopic++) {
    if (!(await topicMastered(userId, level + '-' + moduleIndex + '-' + previousTopic))) return false;
  }
  return true;
}
export async function moduleReady(userId, level, moduleIndex) {
  if (!(await canOpenTopic(userId, level, moduleIndex, 0))) return false;
  for (let ti = 0; ti < TOPICS; ti++) {
    if (!(await topicMastered(userId, level + '-' + moduleIndex + '-' + ti))) return false;
  }
  return true;
}