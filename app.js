const STORAGE_KEY="study-quest-v1";

function localISODate(date=new Date()){
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,"0");
  const d=String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}
function todayKey(){return localISODate(new Date())}
function parseLocalDate(iso){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||""))) return null;
  const [y,m,d]=iso.split("-").map(Number);
  const dt=new Date(y,m-1,d,12,0,0,0);
  return Number.isNaN(dt.getTime())?null:dt;
}
function addDaysISO(baseIso,days){
  const d=parseLocalDate(baseIso)||new Date();
  d.setDate(d.getDate()+days);
  return localISODate(d);
}
function diffDays(fromIso,toIso){
  const a=parseLocalDate(fromIso), b=parseLocalDate(toIso);
  if(!a||!b) return 0;
  return Math.round((b-a)/86400000);
}
function formatJPDate(iso,withYear=false){
  const d=parseLocalDate(iso); if(!d) return "—";
  return withYear?`${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`:`${d.getMonth()+1}/${d.getDate()}`;
}
function inferOldStage(status){
  if(status==="定着") return 4;
  if(status==="2週間後確認"||status==="定着確認待ち") return 3;
  if(status==="1週間後確認") return 2;
  if(status==="3日後確認") return 1;
  if(status==="翌日確認"||status==="直し待ち"||status==="理解不十分"||status==="再確認") return 0;
  return -1;
}
function futureDateFromOldStatus(status){
  const t=todayKey();
  if(status==="3日後確認") return addDaysISO(t,3);
  if(status==="1週間後確認") return addDaysISO(t,7);
  if(status==="2週間後確認"||status==="定着確認待ち") return addDaysISO(t,14);
  return addDaysISO(t,7);
}

const seed={xp:120,streak:2,lastStudyDate:"",tasks:[
{id:1,subject:"算数",book:"テーマ教材",unit:"単位換算",level:"A",number:"No.8",priority:93,status:"直し待ち",nextReviewDate:todayKey(),reviewStage:0,mastered:false,lastResult:null,miss:"単位",lastStudyDate:null},
{id:2,subject:"算数",book:"演習教材",unit:"約数",level:"A",number:"No.4",priority:90,status:"理解不十分",nextReviewDate:todayKey(),reviewStage:0,mastered:false,lastResult:null,miss:"同じ誤り",lastStudyDate:null},
{id:3,subject:"国語",book:"国語テキスト",unit:"物語文・心情",level:"A",number:"問3",priority:82,status:"再確認",nextReviewDate:todayKey(),reviewStage:0,mastered:false,lastResult:null,miss:"根拠不足",lastStudyDate:null},
{id:4,subject:"算数",book:"演習教材",unit:"図形",level:"B",number:"No.13",priority:68,status:"再確認",nextReviewDate:todayKey(),reviewStage:0,mastered:false,lastResult:null,miss:"図・条件整理",lastStudyDate:null},
{id:5,subject:"理科",book:"理科テキスト",unit:"人体",level:"A",number:"No.7",priority:61,status:"3日後確認",nextReviewDate:addDaysISO(todayKey(),3),reviewStage:1,mastered:false,lastResult:null,miss:"知識不足",lastStudyDate:todayKey()},
{id:6,subject:"国語",book:"国語テキスト",unit:"物語文・理由説明",level:"A",number:"問4",priority:52,status:"1週間後確認",nextReviewDate:addDaysISO(todayKey(),7),reviewStage:2,mastered:false,lastResult:null,miss:"自分の解釈優先",lastStudyDate:todayKey()},
{id:7,subject:"社会",book:"社会テキスト",unit:"地理",level:"B",number:"No.15",priority:39,status:"2週間後確認",nextReviewDate:addDaysISO(todayKey(),14),reviewStage:3,mastered:false,lastResult:null,miss:"知識不足",lastStudyDate:todayKey()},
{id:8,subject:"算数",book:"演習教材",unit:"速さ",level:"A",number:"No.6",priority:25,status:"定着",nextReviewDate:null,reviewStage:4,mastered:true,lastResult:"excellent",miss:"ケアレス",lastStudyDate:todayKey()}
],history:[]};

function cloneSeed(){return JSON.parse(JSON.stringify(seed))}
function migrateState(input){
  const st=input&&typeof input==="object"?input:cloneSeed();
  st.xp=Number.isFinite(Number(st.xp))?Number(st.xp):0;
  st.streak=Number.isFinite(Number(st.streak))?Number(st.streak):0;
  st.lastStudyDate=st.lastStudyDate||"";
  st.history=Array.isArray(st.history)?st.history:[];
  st.tasks=Array.isArray(st.tasks)?st.tasks:[];
  st.tasks=st.tasks.map(t=>{
    const x={...t};
    x.mastered=Boolean(x.mastered||x.status==="定着");
    if(!Number.isInteger(x.reviewStage)) x.reviewStage=inferOldStage(x.status);
    if(x.mastered){x.reviewStage=4;x.nextReviewDate=null;x.status="定着";}
    else if(!parseLocalDate(x.nextReviewDate)){
      if(x.nextReview==="today") x.nextReviewDate=todayKey();
      else if(x.nextReview==="future") x.nextReviewDate=futureDateFromOldStatus(x.status);
      else x.nextReviewDate=todayKey();
    }
    if(!x.lastStudyDate){
      const hist=st.history.filter(h=>h.taskId===x.id&&parseLocalDate(h.date)).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
      x.lastStudyDate=hist?hist.date:null;
    }
    delete x.nextReview;
    return x;
  });
  return st;
}
function loadState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    const migrated=migrateState(raw?JSON.parse(raw):cloneSeed());
    localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));
    return migrated;
  }catch(e){return cloneSeed()}
}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}

let state=loadState(),activeTaskId=null,filterSubject="すべて";
function getLevel(){return Math.max(1,Math.floor(state.xp/100)+1)}
function isDue(t,iso=todayKey()){return !t.mastered&&parseLocalDate(t.nextReviewDate)&&t.nextReviewDate<=iso}
function todaysTasks(){return state.tasks.filter(t=>isDue(t))}
function scheduledCount(iso){return state.tasks.filter(t=>!t.mastered&&t.nextReviewDate===iso).length}
function overdueCount(){const today=todayKey();return state.tasks.filter(t=>!t.mastered&&parseLocalDate(t.nextReviewDate)&&t.nextReviewDate<today).length}
function weekCount(){const today=todayKey(),end=addDaysISO(today,7);return state.tasks.filter(t=>!t.mastered&&parseLocalDate(t.nextReviewDate)&&t.nextReviewDate>today&&t.nextReviewDate<=end).length}
function overdueDays(t){return t.mastered||!t.nextReviewDate?0:Math.max(0,diffDays(t.nextReviewDate,todayKey()))}
function effectivePriority(t){return Number(t.priority||0)+Math.min(20,overdueDays(t)*2)}
function escapeHTML(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}
function dueInfo(t){
  if(t.mastered)return{label:"定着",cls:"mastered"};
  if(!t.nextReviewDate)return{label:"日付未設定",cls:""};
  const today=todayKey(),tomorrow=addDaysISO(today,1);
  if(t.nextReviewDate<today)return{label:`${formatJPDate(t.nextReviewDate)}・${overdueDays(t)}日超過`,cls:"overdue"};
  if(t.nextReviewDate===today)return{label:`今日 ${formatJPDate(t.nextReviewDate)}`,cls:"today"};
  if(t.nextReviewDate===tomorrow)return{label:`明日 ${formatJPDate(t.nextReviewDate)}`,cls:"tomorrow"};
  return{label:`次回 ${formatJPDate(t.nextReviewDate)}`,cls:""};
}
function taskCard(t,compact=false){
  const doneToday=state.history.some(h=>h.taskId===t.id&&h.date===todayKey());
  const due=dueInfo(t);
  return `<div class="task card"><div class="task-main"><div class="task-topline"><span class="subject ${t.subject}">${t.subject}</span><span class="level">${t.level}レベル</span><span class="priority">優先 ${effectivePriority(t)}</span><span class="due-badge ${due.cls}">${due.label}</span></div><p class="task-title">${escapeHTML(t.unit)} ${escapeHTML(t.number)}</p><div class="task-meta">${escapeHTML(t.book||"")} ・ ${escapeHTML(t.status)}</div></div>${doneToday?`<span class="done-tag">今日できた</span>`:`<button class="start-btn" data-task="${t.id}">${compact?"やる":"結果"}</button>`}</div>`;
}
function todayCompletedTaskIds(){return new Set(state.history.filter(h=>h.date===todayKey()).map(h=>h.taskId))}
function render(){
  const outstanding=todaysTasks();
  const completedIds=todayCompletedTaskIds();
  const completedCount=completedIds.size;
  const total=outstanding.length+completedCount;
  document.querySelector("#todayDone").textContent=completedCount;
  document.querySelector("#todayTotal").textContent=total;
  document.querySelector("#todayProgress").style.width=`${total?(completedCount/total)*100:100}%`;
  const overdue=overdueCount();
  document.querySelector("#homeMessage").textContent=overdue>0?`期限を過ぎた復習が ${overdue} 問あります。上から順に進めよう。`:outstanding.length===0?"今日の復習は完了です。":"上から1問ずつでOK。";
  document.querySelector("#level").textContent=getLevel();
  document.querySelector("#xp").textContent=state.xp;
  document.querySelector("#streak").textContent=state.streak;
  document.querySelector("#roomLevel").textContent=`Lv.${getLevel()}`;
  document.querySelector("#currentDateLabel").textContent=formatJPDate(todayKey(),true);
  document.querySelector("#scheduleToday").textContent=outstanding.length;
  document.querySelector("#scheduleTomorrow").textContent=scheduledCount(addDaysISO(todayKey(),1));
  document.querySelector("#scheduleWeek").textContent=weekCount();
  document.querySelector("#scheduleOverdue").textContent=overdue;
  const sortedToday=[...outstanding].sort((a,b)=>effectivePriority(b)-effectivePriority(a)||String(a.nextReviewDate).localeCompare(String(b.nextReviewDate)));
  document.querySelector("#topTasks").innerHTML=sortedToday.slice(0,6).map(t=>taskCard(t,true)).join("")||`<div class="empty card">今日の復習対象はありません。</div>`;
  const filtered=state.tasks.filter(t=>filterSubject==="すべて"||t.subject===filterSubject).sort((a,b)=>(a.mastered-b.mastered)||String(a.nextReviewDate||"9999").localeCompare(String(b.nextReviewDate||"9999"))||effectivePriority(b)-effectivePriority(a));
  document.querySelector("#allTasks").innerHTML=filtered.map(t=>taskCard(t,false)).join("")||`<div class="empty card">まだ問題がありません。</div>`;
  renderGrowth();renderParent();bindTaskButtons();
}
function renderGrowth(){
  const level=getLevel();
  const unlocks=[{level:2,icon:"📚",name:"本棚"},{level:3,icon:"☁",name:"ふわふわクッション"},{level:4,icon:"🌿",name:"観葉植物"},{level:5,icon:"✨",name:"きらきらライト"}];
  const next=unlocks.find(u=>u.level>level)||{level:level+1,icon:"🎁",name:"ひみつのごほうび"};
  const targetXp=(next.level-1)*100,prevXp=Math.max(0,(next.level-2)*100),pct=Math.max(0,Math.min(100,((state.xp-prevXp)/(targetXp-prevXp))*100));
  const nextUnlock=document.querySelector("#nextUnlock");if(nextUnlock)nextUnlock.innerHTML=`<div class="unlock-row"><div class="unlock-icon">${next.icon}</div><div class="unlock-bar"><strong>Lv.${next.level} ${next.name}</strong><div class="progress"><div style="width:${pct}%"></div></div><div class="mini-copy">あと ${Math.max(0,targetXp-state.xp)} XP</div></div></div>`;
  const hasHistory=state.history.length>0,aExcellent=state.tasks.some(t=>t.level==="A"&&(t.mastered||t.lastResult==="excellent"));
  const badgeFirst=document.querySelector("#badgeFirst"),badgeStreak=document.querySelector("#badgeStreak"),badgeMaster=document.querySelector("#badgeMaster");
  if(badgeFirst)badgeFirst.classList.toggle("unlocked",hasHistory);if(badgeStreak)badgeStreak.classList.toggle("unlocked",state.streak>=3);if(badgeMaster)badgeMaster.classList.toggle("unlocked",aExcellent);
}
function renderParent(){
  const redo=state.tasks.filter(t=>!t.mastered&&["直し待ち","理解不十分","翌日確認"].includes(t.status)).length;
  const aPending=state.tasks.filter(t=>t.level==="A"&&!t.mastered).length,mastered=state.tasks.filter(t=>t.mastered).length;
  document.querySelector("#metricRedo").textContent=redo;document.querySelector("#metricA").textContent=aPending;document.querySelector("#metricToday").textContent=todaysTasks().length;document.querySelector("#metricOverdue").textContent=overdueCount();document.querySelector("#metricMastered").textContent=mastered;
  const groups={};state.tasks.filter(t=>!t.mastered).forEach(t=>{const key=`${t.subject}・${t.unit}`;if(!groups[key])groups[key]={count:0,score:0};groups[key].count++;groups[key].score+=effectivePriority(t)});
  const weak=Object.entries(groups).map(([name,v])=>({name,score:Math.round(v.score/v.count),count:v.count})).sort((a,b)=>b.score-a.score).slice(0,5);
  document.querySelector("#weakUnits").innerHTML=weak.length?weak.map(w=>`<div class="weak-row"><div><strong>${escapeHTML(w.name)}</strong><div class="mini-copy">未完了 ${w.count}問</div></div><div class="weak-score">${w.score}</div></div>`).join(""):`<div class="empty">要注意単元はありません。</div>`;
}
function bindTaskButtons(){document.querySelectorAll("[data-task]").forEach(btn=>{btn.onclick=()=>{activeTaskId=Number(btn.dataset.task);const t=state.tasks.find(x=>x.id===activeTaskId);document.querySelector("#resultTaskTitle").textContent=`${t.subject} ${t.unit} ${t.number}`;document.querySelector("#resultDialog").showModal()}})}

document.querySelectorAll(".nav-btn").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));btn.classList.add("active");document.querySelector(`#${btn.dataset.view}`).classList.add("active");window.scrollTo({top:0,behavior:"smooth"})}));
document.querySelectorAll("#subjectFilters .chip").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("#subjectFilters .chip").forEach(b=>b.classList.remove("active"));btn.classList.add("active");filterSubject=btn.dataset.subject;render()}));
document.querySelectorAll("[data-result]").forEach(btn=>btn.addEventListener("click",e=>{e.preventDefault();applyResult(btn.dataset.result);document.querySelector("#resultDialog").close()}));

function nextReviewForSuccess(t){
  const stage=Number.isInteger(t.reviewStage)?t.reviewStage:-1;
  if(stage<0)return{stage:0,days:1,status:"翌日確認"};
  if(stage===0)return{stage:1,days:3,status:"3日後確認"};
  if(stage===1)return{stage:2,days:7,status:"1週間後確認"};
  if(stage===2)return{stage:3,days:14,status:"2週間後確認"};
  return{stage:4,days:null,status:"定着"};
}
function applyResult(result){
  const t=state.tasks.find(x=>x.id===activeTaskId);if(!t)return;
  const xpMap={excellent:20,good:15,hint:8,wrong:3};
  const today=todayKey();
  if(result==="wrong"||result==="hint"){
    t.reviewStage=0;t.nextReviewDate=addDaysISO(today,1);t.status="翌日確認";t.mastered=false;
  }else{
    const next=nextReviewForSuccess(t);
    t.reviewStage=next.stage;t.status=next.status;
    if(next.stage>=4){t.mastered=true;t.nextReviewDate=null}else{t.mastered=false;t.nextReviewDate=addDaysISO(today,next.days)}
  }
  t.lastResult=result;t.lastStudyDate=today;
  const bonus=t.level==="A"&&result==="excellent"?5:0;
  state.xp+=xpMap[result]+bonus;
  state.history.push({taskId:t.id,date:today,result,xp:xpMap[result]+bonus,nextReviewDate:t.nextReviewDate,reviewStage:t.reviewStage});
  updateStreak();saveState();
  const nextMsg=t.mastered?"定着！":`次回 ${formatJPDate(t.nextReviewDate)}`;
  showToast(`+${xpMap[result]+bonus} XP！ ${nextMsg}`);render();
}
function updateStreak(){const today=todayKey();if(state.lastStudyDate===today)return;if(!state.lastStudyDate){state.streak=Math.max(1,state.streak)}else{const diff=diffDays(state.lastStudyDate,today);state.streak=diff===1?state.streak+1:1}state.lastStudyDate=today}

const addTaskBtn=document.querySelector("#addTaskBtn");
addTaskBtn.onclick=()=>{const dateInput=document.querySelector("#taskStartDate");if(dateInput)dateInput.value=todayKey();document.querySelector("#taskDialog").showModal()};
document.querySelector("#taskForm").addEventListener("submit",e=>{
  e.preventDefault();const fd=new FormData(e.currentTarget),newId=Math.max(0,...state.tasks.map(t=>t.id))+1;
  const startDate=fd.get("startDate")||todayKey();
  state.tasks.push({id:newId,subject:fd.get("subject"),book:fd.get("book")||"",unit:fd.get("unit"),level:fd.get("level"),number:fd.get("number"),priority:fd.get("level")==="A"?70:fd.get("level")==="B"?50:30,status:"未着手",nextReviewDate:startDate,reviewStage:-1,mastered:false,lastResult:null,miss:"",lastStudyDate:null});
  saveState();e.currentTarget.reset();document.querySelector("#taskDialog").close();render();showToast(`${formatJPDate(startDate)} に追加しました`);
});
document.querySelector("#installHelpBtn").onclick=()=>document.querySelector("#helpDialog").showModal();
document.querySelector("#exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`study-quest-backup-${todayKey()}.json`;a.click();URL.revokeObjectURL(a.href)};
document.querySelector("#importInput").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;try{const parsed=JSON.parse(await f.text());if(!parsed.tasks||!Array.isArray(parsed.tasks))throw new Error("invalid");state=migrateState(parsed);saveState();render();showToast("バックアップを読み込みました")}catch(err){alert("バックアップファイルを読み込めませんでした。")}e.target.value=""});
document.querySelector("#resetBtn").onclick=()=>{if(confirm("試作データに戻します。現在の記録は消えます。よろしいですか？")){state=cloneSeed();saveState();render();showToast("試作データに戻しました")}};
function showToast(msg){const el=document.querySelector("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(showToast.t);showToast.t=setTimeout(()=>el.classList.remove("show"),2300)}
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
render();
