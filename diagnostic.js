const diagnosticQuestions=[
 {q:"Choose the correct sentence.",a:["She are a doctor.","She is a doctor.","She be a doctor."]},
 {q:"Complete the sentence: I ___ coffee every morning.",a:["drink","drinks","am drink"]},
 {q:"We ___ to the cinema last night.",a:["go","have go","went"]},
 {q:"If I have enough time tomorrow, I ___ you.",a:["called","will call","would called"]},
 {q:"Choose the sentence with the correct meaning.",a:["I have lived here for five years.","I live here since five years.","I am live here five years ago."]},
 {q:"By the time we arrived, the meeting ___.",a:["already starts","has already start","had already started"]},
 {q:"Choose the most accurate sentence.",a:["Despite of the rain, we continued.","Despite the rain, we continued.","Although the rain, we continued."]},
 {q:"Which sentence uses inversion correctly?",a:["Rarely have I encountered such a complex issue.","Rarely I have encountered such a complex issue.","Rarely did I encountered such a complex issue."]},
 {q:"Choose the most natural, appropriately hedged academic statement.",a:["This proves beyond all doubt that the treatment works.","The treatment obviously works in every case.","The findings appear to indicate a possible association, although further evidence is needed."]},
 {q:"Which response best conveys a subtle, diplomatic disagreement?",a:["Your argument is completely ridiculous.","I take your point; nevertheless, I think that assumption may overlook an important qualification.","No, that is wrong and there is nothing else to discuss."]}
];
function renderDiagnostic(){
 const root=document.getElementById('diagnosticContent');if(!root)return;
 root.innerHTML='<div class="section-head"><div><span class="eyebrow">STARTING POINT · A1 TO C2</span><h2>Your English placement test</h2><p>Ten progressive questions help estimate your starting CEFR level. Answer independently; you may take your time.</p></div></div>'+
 '<div class="quiz-panel"><div class="pill">10 QUESTIONS · A1–C2</div><form id="diagnosticForm">'+diagnosticQuestions.map((q,i)=>'<div class="question"><p><b>'+(i+1)+'.</b> '+q.q+'</p>'+q.a.map((a,j)=>'<label class="option"><input type="radio" name="q'+(i+1)+'" value="'+j+'" required> '+String.fromCharCode(65+j)+'. '+a+'</label>').join('')+'</div>').join('')+'<button class="primary" type="submit">Submit diagnostic test →</button></form><p class="small-note">This is an initial screening, not an official CEFR certification. Your placement is saved to your learning profile.</p></div>';
 document.getElementById('diagnosticForm').onsubmit=async e=>{
  e.preventDefault();const btn=e.submitter;btn.disabled=true;btn.textContent='Evaluating your level…';
  const fd=new FormData(e.target),answers={};for(let i=1;i<=10;i++)answers['q'+i]=Number(fd.get('q'+i));
  try{const r=await fetch('/api/diagnostic',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answers})});const data=await r.json();if(!r.ok)throw Error(data.error||'Could not save the test');
   window.englishDiagnostic=data;
   root.innerHTML='<div class="quiz-panel"><span class="eyebrow">YOUR PLACEMENT RESULT</span><h2>Estimated level: '+data.level+'</h2><strong style="display:block;font:800 48px Manrope;color:var(--green);margin:15px 0">'+data.score+'/10</strong><p>Your result has been saved to your profile. The curriculum will begin at '+data.level+'. You can repeat the diagnostic later if your level changes.</p><button class="primary" id="beginPlacedCourse">Begin learning →</button></div>';
   document.getElementById('beginPlacedCourse').onclick=()=>location.reload();
  }catch(err){btn.disabled=false;btn.textContent='Try again';const p=root.querySelector('.small-note');if(p)p.textContent=err.message;}
 };
}
window.addEventListener('english-auth-ready',e=>{
 if(!e.detail?.signedIn){renderDiagnostic();document.getElementById('diagnosticContent').insertAdjacentHTML('afterbegin','<p class="example">Sign in to save your diagnostic result and personal progress. <a href="/login?next=%2F">Sign in / create account</a></p>');return;}
 if(!e.detail.profile)renderDiagnostic();
});