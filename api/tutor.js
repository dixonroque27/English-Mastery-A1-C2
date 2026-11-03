import { ai } from 'hatchable';
export const access = 'user';
export const methods = ['POST'];
export default async function(req,res){
 const b=req.body||{};
 const task=String(b.task||'practice');
 const topic=String(b.topic||'English').slice(0,180);
 const level=String(b.level||'A1').slice(0,8);
 const input=String(b.input||'').slice(0,5000);
 const modes=['practice','explain','feedback','vocabulary'];
 if(!modes.includes(task))return res.status(400).json({error:'Unknown tutor task'});
 if(!['A1','A2','B1','B2','C1','C2'].includes(level))return res.status(400).json({error:'Invalid CEFR level'});
 if(['feedback'].includes(task)&&!input.trim())return res.status(400).json({error:'Write your sentence or answer first.'});
 const prompts={
  practice:'Create a short '+level+' English practice activity about '+topic+'. Include five varied questions, clear instructions and a separate answer key.',
  explain:'Explain '+topic+' for a '+level+' learner. Use short Spanish explanations, natural English examples, common mistakes and a concise summary.',
  feedback:'Correct this learner response for '+level+': '+input+'. Explain errors in Spanish, show corrected and natural versions, be lenient with obvious typos, and finish with three short practice prompts.',
  vocabulary:'Create eight useful '+level+' vocabulary items about '+topic+', with English word, Spanish meaning, natural example and recall drill.'
 };
 try{
  const r=await ai.generateText({model:'gemini',purpose:'english-tutor-'+task,userId:req.user.id,maxTokens:2000,system:'You are a patient expert English teacher. Respect CEFR level. Use Spanish for explanations and English for examples. Be encouraging but accurate. Never reveal answer hints before a learner attempts a question.',prompt:prompts[task]});
  if(r.finishReason==='length'||r.finishReason==='max_tokens')return res.status(502).json({error:'The response was cut short. Please make the request shorter.'});
  return res.json({text:r.text});
 }catch(e){console.log('Tutor error',e?.message||e);return res.status(503).json({error:'Gemini is temporarily unavailable. No response was saved; try again shortly.'});}
}