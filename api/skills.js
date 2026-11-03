import { db } from 'hatchable';
import { parseTopicId, canOpenTopic } from 'lib/progression.js';

export const access = 'user';
export const methods = ['GET','POST'];

const KEYS = {
  grammar:[0,0,0],
  listening:[0,1,0],
  reading:[0,0]
};

export default async function(req,res) {
  const userId = String(req.user.id);
  if (req.method === 'GET') {
    const r = await db.query(
      'SELECT topic_id,skill,score,max_score,answers,feedback,created_at FROM skill_assessments WHERE user_id=$1 ORDER BY created_at DESC LIMIT 500',
      [userId]
    );
    return res.json({assessments:r.rows});
  }

  const b = req.body || {};
  const parsed = parseTopicId(b.topic_id);
  const skill = String(b.skill || '');
  if (!parsed || !Object.prototype.hasOwnProperty.call(KEYS,skill)) {
    return res.status(400).json({error:'Invalid objective skill assessment.'});
  }
  if (!(await canOpenTopic(userId,parsed.level,parsed.module,parsed.topic))) {
    return res.status(403).json({error:'Complete the previous topics, module exams and levels in order.'});
  }
  const keys = KEYS[skill];
  const answers = b.answers && typeof b.answers === 'object' ? b.answers : {};
  let correct = 0;
  const names = skill === 'reading' ? ['q1','q2'] : ['q0','q1','q2'];
  for (let i=0; i<names.length; i++) {
    const value = Number(answers[names[i]]);
    if (!Number.isInteger(value) || value < 0 || value > 2) {
      return res.status(400).json({error:'Answer every question before submitting this assessment.'});
    }
    if (value === keys[i]) correct++;
  }
  const score = Number((correct / names.length * 10).toFixed(1));
  const feedback = typeof b.feedback === 'string' ? b.feedback.slice(0,5000) : '';
  await db.query(
    'INSERT INTO skill_assessments(user_id,topic_id,skill,score,max_score,answers,feedback) VALUES($1,$2,$3,$4,10,$5::jsonb,$6)',
    [userId,b.topic_id,skill,score,JSON.stringify(answers),feedback]
  );
  return res.json({ok:true,score,skill,topic_id:b.topic_id});
}