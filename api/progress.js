import { db } from 'hatchable';
import { parseModuleId, parseTopicId, canOpenTopic, topicMastered, moduleReady } from 'lib/progression.js';

export const access = 'user';
export const methods = ['GET','POST'];

const ANSWERS = {
  A1:[1,0,2,1,1], A2:[1,2,1,1,0], B1:[0,1,1,1,0],
  B2:[0,1,0,0,1], C1:[1,1,1,0,0], C2:[1,1,1,0,1]
};

export default async function(req,res) {
  const userId = String(req.user.id);
  if (req.method === 'GET') {
    const p = await db.query('SELECT topic_id,status,best_score,attempts,updated_at FROM learning_progress WHERE user_id=$1',[userId]);
    const q = await db.query('SELECT module_id,score,total,created_at FROM quiz_attempts WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[userId]);
    return res.json({progress:p.rows,quizzes:q.rows});
  }
  const b = req.body || {};
  if (b.kind === 'topic') {
    const parsed = parseTopicId(b.topic_id);
    if (!parsed || !['in_progress','completed'].includes(b.status)) return res.status(400).json({error:'Invalid topic update.'});
    if (!(await canOpenTopic(userId,parsed.level,parsed.module,parsed.topic))) return res.status(403).json({error:'Complete the previous topics, module exams and CEFR levels in order.'});
    if (b.status === 'completed' && !(await topicMastered(userId,b.topic_id))) return res.status(409).json({error:'A topic is completed only after all five skills reach at least 8.5/10.'});
    const score = b.score == null ? null : Number(b.score);
    if (score !== null && (!Number.isFinite(score) || score < 0 || score > 10)) return res.status(400).json({error:'Invalid topic score.'});
    await db.query(
      'INSERT INTO learning_progress(user_id,topic_id,status,best_score,attempts) VALUES($1,$2,$3,$4::numeric,CASE WHEN $4::numeric IS NULL THEN 0 ELSE 1 END) ON CONFLICT(user_id,topic_id) DO UPDATE SET status=EXCLUDED.status,best_score=CASE WHEN EXCLUDED.best_score IS NULL THEN learning_progress.best_score ELSE GREATEST(COALESCE(learning_progress.best_score,0),EXCLUDED.best_score) END,attempts=learning_progress.attempts+CASE WHEN $4::numeric IS NULL THEN 0 ELSE 1 END,updated_at=NOW()',
      [userId,b.topic_id,b.status,score]
    );
    return res.json({ok:true,status:b.status});
  }
  if (b.kind === 'quiz') {
    const parsed = parseModuleId(b.module_id);
    if (!parsed || Number(b.total) !== 5 || !(await moduleReady(userId,parsed.level,parsed.module))) {
      return res.status(403).json({error:'Master all five skill areas in the three topics, and pass earlier modules, before taking this exam.'});
    }
    const key = ANSWERS[parsed.level],answers = b.answers && typeof b.answers === 'object' ? b.answers : {};
    let correct = 0;
    for (let i=0; i<5; i++) {
      const value = Number(answers['q'+i]);
      if (!Number.isInteger(value) || value < 0 || value > 2) return res.status(400).json({error:'Answer all five exam questions.'});
      if (value === key[i]) correct++;
    }
    const score = Math.round(correct / 5 * 100);
    await db.query(
      'INSERT INTO quiz_attempts(user_id,module_id,score,total,answers) VALUES($1,$2,$3,5,$4::jsonb)',
      [userId,parsed.level+'-'+parsed.module,score,JSON.stringify(answers)]
    );
    return res.json({ok:true,score,passed:score>=80,threshold:80});
  }
  return res.status(400).json({error:'Unknown progress event.'});
}