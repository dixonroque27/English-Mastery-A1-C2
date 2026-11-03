import { db } from 'hatchable';
export const access = 'user';
export const methods = ['GET','POST'];
const levels=['A1','A2','B1','B2','C1','C2'];
const keys=[1,0,2,1,0,2,1,0,2,1];
function place(score){
 if(score<=1)return 'A1';
 if(score<=3)return 'A2';
 if(score<=5)return 'B1';
 if(score<=7)return 'B2';
 if(score===8)return 'C1';
 return 'C2';
}
export default async function(req,res){
 const uid=String(req.user.id);
 if(req.method==='GET'){
  const r=await db.query('SELECT level,score,answers,completed_at FROM diagnostic_profiles WHERE user_id=$1',[uid]);
  return res.json({profile:r.rows[0]||null});
 }
 const answers=req.body?.answers;
 if(!answers||typeof answers!=='object'||Array.isArray(answers))return res.status(400).json({error:'Submit all 10 diagnostic answers.'});
 let score=0,clean={};
 for(let i=0;i<10;i++){
  const v=Number(answers['q'+(i+1)]);
  if(!Number.isInteger(v)||v<0||v>2)return res.status(400).json({error:'Answer all 10 questions before submitting.'});
  clean['q'+(i+1)]=v;
  if(v===keys[i])score++;
 }
 const level=place(score);
 await db.query('INSERT INTO diagnostic_profiles(user_id,level,score,answers) VALUES($1,$2,$3,$4::jsonb) ON CONFLICT(user_id) DO UPDATE SET level=EXCLUDED.level,score=EXCLUDED.score,answers=EXCLUDED.answers,completed_at=NOW(),updated_at=NOW()',[uid,level,score,JSON.stringify(clean)]);
 return res.json({ok:true,level,score,total:10,profileSaved:true});
}