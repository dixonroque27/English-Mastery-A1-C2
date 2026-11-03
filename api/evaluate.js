import { ai, db } from 'hatchable';
import { parseTopicId, canOpenTopic } from 'lib/progression.js';

export const access = 'user';
export const methods = ['POST'];
const validSkills = ['grammar','speaking','writing'];

export default async function(req,res) {
  const b = req.body || {};
  const skill = String(b.skill || '');
  const level = String(b.level || 'A1');
  const prompt = String(b.prompt || '').slice(0,2500);
  const answer = String(b.answer || '').slice(0,5000);
  const topicId = b.topic_id == null ? '' : String(b.topic_id);

  if (!validSkills.includes(skill) || !answer.trim()) {
    return res.status(400).json({error:'A grammar, writing, or speaking response is required.'});
  }
  if (!['A1','A2','B1','B2','C1','C2'].includes(level)) {
    return res.status(400).json({error:'Invalid CEFR level.'});
  }
  if (topicId) {
    const parsed = parseTopicId(topicId);
    if (!parsed || parsed.level !== level || !(await canOpenTopic(req.user.id,parsed.level,parsed.module,parsed.topic))) {
      return res.status(403).json({error:'This lesson is locked. Complete the previous topics and module exams first.'});
    }
  }

  try {
    const r = await ai.generateText({
      model:'gemini',
      purpose:'english-skill-assessment-'+skill,
      userId:req.user.id,
      maxTokens:3200,
      system:'You are a patient, fair CEFR English examiner. Evaluate leniently on obvious typos/autocorrect, but do not inflate scores. Use Spanish for feedback and natural English for corrections. Return ONLY valid JSON with keys score (number 0 to 10), strengths (string), corrections (array of strings), natural_version (string), explanation_es (string), rubric (object with grammar, task_completion, clarity, vocabulary, naturalness each scored 0 to 10). For speaking transcripts, do not claim to assess pronunciation, accent, fluency timing or intonation because you only receive text. Score the transcript for language only.',
      prompt:'Evaluate the learner '+skill+' performance at CEFR '+level+'. Task: '+prompt+'. Response: '+answer+'. Use criteria appropriate to the level: grammar accuracy, task completion, clarity, vocabulary and naturalness. For grammar exercises, identify the rule and explain the error. Score out of 10.'
    });
    if (r.finishReason === 'length' || r.finishReason === 'max_tokens') {
      return res.status(502).json({error:'The evaluation was truncated. Please try again.'});
    }
    let raw = String(r.text || '').trim();
    if (raw.startsWith('~~~json')) raw = raw.slice(7);
    if (raw.startsWith('```json')) raw = raw.slice(7);
    if (raw.endsWith('```')) raw = raw.slice(0,-3);
    const result = JSON.parse(raw.trim());
    const score = Number(result.score);
    if (!Number.isFinite(score) || score < 0 || score > 10 || !Array.isArray(result.corrections)) {
      throw new Error('Invalid evaluation payload');
    }
    result.score = Number(score.toFixed(1));
    if (topicId) {
      await db.query(
        'INSERT INTO skill_assessments(user_id,topic_id,skill,score,max_score,answers,feedback) VALUES($1,$2,$3,$4,10,$5::jsonb,$6)',
        [req.user.id,topicId,skill,result.score,JSON.stringify({prompt,answer}),JSON.stringify(result)]
      );
    }
    return res.json({evaluation:result,passed:result.score>=8.5,threshold:8.5,saved:!!topicId});
  } catch(e) {
    console.log('Evaluation error',e?.message||e);
    return res.status(503).json({error:'The Gemini evaluator is temporarily unavailable. Nothing was graded or saved; please try again.'});
  }
}