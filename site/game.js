/* Bầy Heo Đua - browser demo. All scoring/racing is local for now. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const TOTAL=2000,LAP=TOTAL/3,BASE=30,BOOST_SECONDS=3;
const QUESTION_TIMES={typing:18,math:14};
const BOOSTS=[12,10,8.5,7.2,6,4.7,3.5,2.4];
const texts=[
 "Heo chạy nhanh!",
 "Bánh Bao bứt tốc!",
 "Ninja vượt lên!",
 "Ú Nụ về đích!",
 "Tia Chớp thật nhanh!",
 "Heo hồng chiến thắng!",
 "Cố lên, heo con!",
 "Cơ Bắp siêu tốc!",
 "Vằn Vện dẫn đầu!",
 "Heo tím tăng tốc!",
 "Pig runs fast!",
 "Go little pig!",
 "Ready to race!",
 "Fast and funny!",
 "Run to win!",
 "Heo đua vui quá!",
 "Chạy nhanh nào!",
 "Nông trại vui nhộn!",
 "Mũm Mĩm cố lên!",
 "Về đích thôi!"
];
const canvas=$("raceCanvas"),ctx=canvas.getContext("2d");
const roster=window.PIG_ROSTER,art=window.PigArt,scores=window.PigScores;
const nameField=$("pigNameInput");
const stage=$("stage");
const mapPath=$("mapLine");
let profile={id:2,name:"Cơ Bắp",playerName:""},avatarURL=null;
try {const old=JSON.parse(localStorage.getItem("pigRaceProfileV3")||"null");if(old && Number.isInteger(old.id)&&roster[old.id]&&typeof old.name==="string"&&old.name.length>=2)profile={id:old.id,name:old.name.slice(0,18),playerName:scores.cleanName(old.playerName||"")};}catch(e){}
let selected=profile.id;
let matchStats={correct:0,fastest:0,typing:0,math:0},matchId="",currentLeaderboardData=null;
let racers=[],particles=[],state="ready",mode="typing",pendingMode=null,question="",expectedAnswer=0,questionId=0;
let qStart=0,qElapsed=0,gameClock=0,answerCompletedAt=null,botTimes=[],botDone=[],userDone=false,wrongFiredAt=-10,correctWords=0;
let frameHandle=0,lastTick=0,lastUi=0,composing=false,muted=false,music=false,musicTimer=0;
let audio=null,flashUntil=0;
let previousQuestion=-1;
let mapLength=0;
try {mapLength=mapPath.getTotalLength();}catch(e){mapLength=350;}
function fit(){const scale=Math.min(innerWidth/1600,innerHeight/900);stage.style.transform="scale("+scale+")";}
window.addEventListener("resize",fit);fit();
function sfx(t){
 if(muted)return;
 try{
  audio=audio||(new (window.AudioContext||window.webkitAudioContext)());
  if(audio.state==="suspended")audio.resume();
  const sound=(f,d,start=0,wave="sine",g=.045,slide=null)=>{
   const o=audio.createOscillator(),amp=audio.createGain(),at=audio.currentTime+start;
   o.type=wave;o.frequency.setValueAtTime(f,at);
   if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(slide,70),at+d);
   amp.gain.setValueAtTime(.0001,at);amp.gain.exponentialRampToValueAtTime(g,at+.014);
   amp.gain.exponentialRampToValueAtTime(.0001,at+d);
   o.connect(amp).connect(audio.destination);o.start(at);o.stop(at+d+.02);
  };
  if(t==="correct")sound(720,.07,0,"sine",.026,980);
  if(t==="wrong"){sound(220,.16,0,"triangle",.06,112);sound(143,.13,.06,"sine",.03);}
  if(t==="boost"){sound(430,.18,0,"sawtooth",.045,880);sound(900,.25,.1,"sine",.07,1250);}
  if(t==="start")[392,493,587,784].forEach((f,i)=>sound(f,.17,i*.12,"triangle",.047));
  if(t==="win")[523,659,784,1046,932,1046].forEach((f,i)=>sound(f,i>3?.35:.2,i*.17,"triangle",.055));
  if(t==="lose")[494,392,311,233].forEach((f,i)=>sound(f,.27,i*.18,"triangle",.05));
  if(t==="click")sound(490,.06,0,"sine",.018,590);
  if(t==="music")sound(392,.12,0,"triangle",.014);
 }catch(e){}
}
function musicStart(){
 if(musicTimer)clearInterval(musicTimer);
 if(music && state==="racing")musicTimer=setInterval(()=>sfx("music"),1850);
}
function number(n){return Math.round(n).toLocaleString("vi-VN");}
function picture(p,frame){return art.get(roster[p.id],frame||0);}
function setAvatar(){
 $("myPortrait").src=avatarURL||picture({id:profile.id},0).src;
 $("myPigLabel").textContent=profile.name;
}
function makeRacers(){
 const bots=[16,15,0,3,9,6,7,4,5,12,18,10,13,1,19].filter(i=>i!==profile.id).slice(0,7);
 racers=[profile.id].concat(bots).map((id,i)=>({
  id,name:i===0?profile.name:roster[id].name,me:i===0,distance:0,speed:BASE,bonus:0,boostUntil:0,finishAt:null,
  offset:[0,140,335,440,240,580,520,680][i],depth:[390,280,328,425,209,465,245,176][i],
  visualScale:[1.35,.92,.98,1.1,.73,1.11,.78,.73][i]
 }));
 for(const pig of racers)for(let frame=0;frame<6;frame++)picture(pig,frame);
 const dots=$("mapDots");dots.replaceChildren();
 racers.forEach((p,i)=>{
  let c=document.createElementNS("http://www.w3.org/2000/svg","circle");
  c.setAttribute("r",i===0?"7":"5");
  c.setAttribute("stroke","#fff7e6");c.setAttribute("stroke-width","2");
  c.setAttribute("fill",roster[p.id].color);
  dots.append(c);p.dot=c;
 });
}
function updateRank(){
 const sorted=[...racers].sort((a,b)=>b.distance-a.distance || racers.indexOf(a)-racers.indexOf(b));
 const list=$("rankList");list.replaceChildren();
 sorted.forEach((p,i)=>{
  const row=document.createElement("div");row.className="rank-row"+(i===0?" first":"");
  const num=document.createElement("div");num.className="rank-place";num.textContent=i===0?"👑":String(i+1);
  const img=document.createElement("img");img.className="rank-pic";img.alt="";img.src=picture(p,0).src;
  const name=document.createElement("span");name.className="rank-name";name.textContent=p.name;
  const meters=document.createElement("span");meters.className="rank-distance";meters.textContent=number(p.distance)+" m";
  row.append(num,img,name,meters);list.append(row);
 });
 const gaps=$("gapList");gaps.replaceChildren();
 sorted.slice(0,5).forEach((p,i)=>{
  const row=document.createElement("div");row.className="gap-row";
  const nm=document.createElement("span");nm.className="gap-label";nm.textContent=(i===0?"👑 ":"🐽 ")+p.name;
  const dist=document.createElement("span");dist.className="gap-gap";
  dist.textContent=i===0?"Dẫn đầu":"-"+number(sorted[0].distance-p.distance)+" m";
  row.append(nm,dist);gaps.append(row);
 });
 $("lapLabel").textContent=Math.min(3,Math.floor(racers[0].distance/LAP)+1)+"/3";
 $("distanceValue").textContent=number(racers[0].distance)+" / 2.000 m";
 $("raceClock").textContent=String(Math.floor(gameClock/60)).padStart(2,"0")+":"+(gameClock%60).toFixed(1).padStart(4,"0");
 racers.forEach(p=>{
  if(!p.dot)return;
  const progress=(p.distance%LAP)/LAP;
  const pt=mapPath.getPointAtLength((progress*(mapLength||350))||0);
  p.dot.setAttribute("cx",String(pt.x));p.dot.setAttribute("cy",String(pt.y));
 });
 const you=racers[0],remain=Math.max(0,you.boostUntil-gameClock);
 $("boostValue").textContent=remain>0?"+"+you.bonus.toFixed(1)+" m/s":"+0.0 m/s";
 $("boostDuration").textContent=remain>0?remain.toFixed(1)+" giây":"SẴN SÀNG";
}
function renderRoster(){
 $("pigGrid").replaceChildren();
 roster.forEach(p=>{
  const b=document.createElement("button");b.type="button";b.className="pig-card"+(selected===p.id?" selected":"");b.setAttribute("aria-pressed",String(selected===p.id));
  const img=document.createElement("img");img.alt="";img.src=art.get(p,0).src;
  const name=document.createElement("strong");name.textContent=p.name;
  const tag=document.createElement("small");tag.textContent=p.tagline;
  b.append(img,name,tag);
  b.addEventListener("click",()=>{
   const oldName=roster[selected].name;
   const replaceName=!nameField.value.trim()||nameField.value===profile.name||nameField.value===oldName;
   selected=p.id;if(replaceName)nameField.value=p.name;
   $("selectedInfo").textContent=p.name+" — "+p.tagline;
   renderRoster();sfx("click");
  });
  $("pigGrid").append(b);
 });
}
function pickerOpen(){
 if(state==="racing"){$("bubbleMessage").textContent="🏁 Kết thúc trận rồi hãy đổi heo nhé!";bubble();return;}
 selected=profile.id;nameField.value=profile.name;
 $("playerNameInput").value=profile.playerName||"";
 $("playerNameError").textContent="";
 $("selectedInfo").textContent=roster[selected].name+" — "+roster[selected].tagline;
 $("nameError").textContent="";renderRoster();
 $("pickerModal").classList.remove("hidden");nameField.focus();
}
function pickerSave(){
 const playerName=scores.cleanName($("playerNameInput").value);
 if(playerName.length<2){
   $("playerNameError").textContent="❌ Tên người chơi cần từ 2 đến 24 ký tự.";
   $("playerNameInput").focus();return;
 }
 $("playerNameError").textContent="";
 const name=nameField.value.trim().replace(/\s+/g," ");
 if(name.length<2 || name.length>18){$("nameError").textContent="❌ Tên phải có từ 2 đến 18 ký tự.";nameField.focus();return;}
 profile={id:selected,name,playerName};try{localStorage.setItem("pigRaceProfileV3",JSON.stringify(profile));}catch(e){}
 $("pickerModal").classList.add("hidden");setAvatar();reset();
 $("resultHeading").textContent="🐷 "+profile.name.toUpperCase()+"!";
 $("resultMessage").textContent="Chiến binh "+roster[profile.id].name+" đã sẵn sàng. Gõ đúng, chạy nhanh, giành cúp!";
 sfx("click");
}
function reset(){
 if(frameHandle){cancelAnimationFrame(frameHandle);frameHandle=0;}
 if(musicTimer){clearInterval(musicTimer);musicTimer=0;}
 state="ready";gameClock=0;lastTick=0;lastUi=0;qElapsed=0;userDone=false;questionId=0;particles=[];
 matchStats={correct:0,fastest:0,typing:0,math:0};
 $("resultScoreBox").classList.add("hidden");$("startOverlay").classList.remove("finished-overlay");
 makeRacers();updateRank();
 $("startOverlay").classList.remove("hidden");
 $("playBtn").textContent="🚀 BẮT ĐẦU ĐUA";
 $("resultHeading").textContent="BẦY HEO ĐUA!";
 $("resultMessage").textContent="Chọn heo, đặt tên, gõ chữ hoặc giải toán để tăng tốc qua 3 vòng!";
 $("answerInput").disabled=true;$("answerInput").value="";$("answerSubmit").disabled=true;
 $("answerColor").textContent="Nhấn Bắt đầu để nhận thử thách...";
 $("questionText").textContent=mode==="typing"?texts[0]:"25 + 17 = ?";
 $("answerFeedback").textContent="Gõ nhanh và chính xác để heo chạy nhanh hơn!";
 $("timeLeft").textContent="⌛ Còn: "+QUESTION_TIMES[mode].toFixed(1)+" giây";
 $("boostValue").textContent="+0.0 m/s";$("boostDuration").textContent="SẴN SÀNG";
 setAvatar();drawRace(0);
}
function start(){
 if(state==="racing")return;
 if($("pickerModal").classList.contains("hidden")===false)return;
 reset();
 if(!scores.cleanName(profile.playerName||"")){pickerOpen();return;}
 matchId="race-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10);
 state="racing";$("startOverlay").classList.add("hidden");
 $("answerInput").disabled=false;nextQuestion();
 lastTick=performance.now();sfx("start");musicStart();frameHandle=requestAnimationFrame(tick);
}
function mathQuestion(){
 const a=10+Math.floor(Math.random()*40),b=2+Math.floor(Math.random()*9),op=["+","−","×","÷"][Math.floor(Math.random()*4)];
 if(op==="+"){expectedAnswer=a+b;return a+" + "+b+" = ?";}
 if(op==="−"){expectedAnswer=a-b;return a+" − "+b+" = ?";}
 if(op==="×"){const x=2+Math.floor(Math.random()*8);expectedAnswer=x*b;return x+" × "+b+" = ?";}
 const quotient=2+Math.floor(Math.random()*9);
 expectedAnswer=quotient;return (quotient*b)+" ÷ "+b+" = ?";
}
function nextQuestion(){
 if(pendingMode){mode=pendingMode;pendingMode=null;}
 syncModeButtons();
 questionId++;qStart=gameClock;qElapsed=0;answerCompletedAt=null;userDone=false;botDone=Array(racers.length).fill(false);
 const diff=mode==="math"?{min:3.4,range:9.2}:{min:4.5,range:10.5};
 botTimes=racers.map((p,i)=>i===0?Infinity:diff.min+Math.random()*diff.range);
 question=mode==="typing"?texts[(questionId-1)%texts.length]:mathQuestion();
 correctWords=0;previousQuestion=-1;
 $("questionText").textContent=question;
 $("challengeType").textContent=mode==="typing"?"Gõ chính xác câu ngắn sau!":"Tính nhanh và nhập kết quả!";
 $("answerSubmit").textContent=mode==="math"?"GỬI ↵":"XONG ✓";
 $("answerSubmit").disabled=false;
 $("timeLeft").textContent="⌛ Còn: "+QUESTION_TIMES[mode].toFixed(1)+" giây";
 $("answerInput").value="";$("answerInput").disabled=false;
 $("answerInput").placeholder="";
 $("answerInput").setAttribute("inputmode",mode==="typing"?"text":"numeric");
 $("answerFeedback").textContent=mode==="math"?"🧮 Tính kết quả rồi nhấn GỬI hoặc Enter!":"⌨️ Câu ngắn thôi! Gõ đúng để BOOST nhé!";
 colorWords();$("answerInput").focus();
}
function colorWords(){
 const out=$("answerColor");out.replaceChildren();
 const typed=$("answerInput").value.normalize("NFC");
 if(!typed){out.textContent=mode==="typing"?"Gõ lại câu ở phía trên...":"Nhập kết quả phép tính...";return;}
 if(mode==="math"){
  const span=document.createElement("span");
  span.className=Number(typed)===expectedAnswer?"word-correct":"word-pending";
  span.textContent=typed;out.append(span);return;
 }
 const target=question.normalize("NFC");
 const regex=/\S+|\s+/g;
 let part,offset=0,correct=0;
 while((part=regex.exec(typed))!==null){
  let value=part[0],exp=target.slice(offset,offset+value.length);
  let span=document.createElement("span");span.textContent=value;
  if(/^\s+$/.test(value)){span.className="word-rest";}
  else if(value!==exp)span.className="word-wrong";
  else{
   const end=offset+value.length;
   const complete=end>=target.length||target[end]===" ";
   span.className=complete?"word-correct":"word-pending";
   if(complete)correct++;
  }
  out.append(span);offset+=value.length;
 }
 if(correct>correctWords && !composing){correctWords=correct;sfx("correct");}
}
function submit(){
 if(state!=="racing"||userDone)return;
 const typed=$("answerInput").value.normalize("NFC");
 let good=mode==="typing"?typed===question.normalize("NFC"):typed.trim()!==""&&Number(typed.trim())===expectedAnswer;
 if(!good){sfx("wrong");$("answerFeedback").textContent=mode==="math"?"❌ Sai kết quả, hãy tính lại!":"❌ Chữ chưa khớp, sửa từ màu đỏ nhé!";return;}
 userDone=true;answerCompletedAt=gameClock;$("answerInput").disabled=true;$("answerSubmit").disabled=true;
 const responseTime=gameClock-qStart;
 const rank=1+botTimes.slice(1).filter(t=>t<=responseTime).length;
 matchStats.correct++;
 if(rank===1)matchStats.fastest++;
 matchStats[mode]++;
 boost(racers[0],BOOSTS[Math.min(BOOSTS.length-1,rank-1)]);
 $("answerFeedback").textContent="✅ Chính xác! Hạng "+rank+"/"+racers.length+" sau "+responseTime.toFixed(2)+"s • BOOST!";
 bubble("⚡ "+profile.name+" BỨT TỐC!");
 sfx("boost");
}
function boost(p,bonus){p.bonus=bonus;p.boostUntil=gameClock+BOOST_SECONDS;}
function end(){
 if(state!=="racing")return;
 state="finished";$("answerInput").disabled=true;$("answerSubmit").disabled=true;
 if(musicTimer){clearInterval(musicTimer);musicTimer=0;}
 const sorted=[...racers].sort((a,b)=>(a.finishAt??Infinity)-(b.finishAt??Infinity));
 const rank=sorted.indexOf(racers[0])+1,win=rank===1;
 let result;
 try{
   result=scores.recordResult(localStorage,{
     matchId,playerName:profile.playerName,pigName:profile.name,mode,rank,
     correct:matchStats.correct,fastest:matchStats.fastest,
     finishTime:racers[0].finishAt??gameClock
   });
   currentLeaderboardData=result.data;
   if(result.saved&&typeof navigator!=="undefined"&&navigator.storage){
     scores.savePrivateFile(result.data,navigator.storage).catch(()=>{});
   }
 }catch(err){result=null;console.error("Could not score race",err);}
 const matchPoints=result?result.points:scores.pointsFor(rank,matchStats.correct,matchStats.fastest);
 $("resultPlayerName").textContent=profile.playerName;
 $("resultPoints").textContent=matchPoints.toLocaleString("vi-VN");
 $("resultScoreBreakdown").textContent="Hạng "+rank+" • "+matchStats.correct+" câu đúng • "+matchStats.fastest+" lần nhanh nhất";
 $("resultScoreBox").classList.remove("hidden");
 $("startOverlay").classList.add("finished-overlay");
 $("resultHeading").textContent=win?"🏆 VÔ ĐỊCH ĐƯỜNG ĐUA!":"🐷 VỀ ĐÍCH HẠNG "+rank+"!";
 $("resultMessage").textContent=(win?profile.name+" chiến thắng!":profile.name+" hoàn thành 3 vòng!")+
 (result&&!result.saved?" ⚠️ Không lưu được vào trình duyệt; hãy xuất file JSON.":" Điểm đã được tính cho "+profile.playerName+".");
 $("playBtn").textContent="🔁 CHƠI LẠI";
 $("startOverlay").classList.remove("hidden");
 sfx(win?"win":"lose");
 updateRank();drawRace(gameClock);
}
function bubble(message){
 if(message)$("bubbleMessage").textContent=message;
 const target=$("bubbleMessage");target.classList.remove("show");void target.offsetWidth;target.classList.add("show");
 $("raceCallout").classList.remove("show");void $("raceCallout").offsetWidth;$("raceCallout").classList.add("show");
}
function tick(now){
 if(state!=="racing")return;
 const dt=Math.min(.05,Math.max(0,(now-lastTick)/1000));lastTick=now;gameClock+=dt;
 qElapsed=gameClock-qStart;
 if(qElapsed<QUESTION_TIMES[mode]){
  racers.forEach((p,i)=>{
   if(i>0&&!botDone[i]&&qElapsed>=botTimes[i]){
    botDone[i]=true;const rank=1+botTimes.slice(1).filter(t=>t<botTimes[i]).length;
    boost(p,BOOSTS[Math.min(BOOSTS.length-1,rank-1)]);
   }
  });
 } else if(!userDone){userDone=true;$("answerInput").disabled=true;$("answerSubmit").disabled=true;$("answerFeedback").textContent="⌛ Hết giờ! Câu mới sẽ xuất hiện ngay."; }
 if(qElapsed>QUESTION_TIMES[mode]+0.8 || (answerCompletedAt!==null && gameClock-answerCompletedAt>2.2 && qElapsed>4.0))nextQuestion();
 racers.forEach((p,i)=>{
  if(p.finishAt!==null)return;
  p.speed=BASE+(gameClock<p.boostUntil?p.bonus:0);
  const prev=p.distance;
  p.distance=Math.min(TOTAL,p.distance+dt*p.speed);
  if(p.distance===TOTAL)p.finishAt=gameClock-dt+(TOTAL-prev)/p.speed;
  if(Math.random()<(p.speed>BASE?24:10)*dt){
   particles.push({pig:p,x:0,y:Math.random()*10,r:3+Math.random()*8,life:.3+Math.random()*.35,boost:p.speed>BASE});
  }
 });
 particles.forEach(p=>p.life-=dt);particles=particles.filter(p=>p.life>0).slice(-200);
 $("timeLeft").textContent="⌛ Còn: "+Math.max(0,QUESTION_TIMES[mode]-qElapsed).toFixed(1)+" giây";
 if(gameClock-lastUi>.16){lastUi=gameClock;updateRank();}
 drawRace(gameClock);
 if(racers.every(p=>p.finishAt!==null)){end();return;}
 frameHandle=requestAnimationFrame(tick);
}
function roundedRect(x,y,w,h,r){
 ctx.beginPath();ctx.roundRect(x,y,w,h,r);
}
function drawRace(t){
 ctx.clearRect(0,0,1600,900);
 // Sunny semi-isometric dirt track. Decorative mark drift reinforces motion.
 ctx.save();ctx.beginPath();ctx.moveTo(228,236);ctx.lineTo(1387,197);ctx.lineTo(1467,520);ctx.lineTo(211,570);ctx.closePath();ctx.clip();
 const grad=ctx.createLinearGradient(0,215,0,565);
 grad.addColorStop(0,"#f9d4a7ab");grad.addColorStop(.5,"#c78e5a74");grad.addColorStop(1,"#f0bd8b90");
 ctx.fillStyle=grad;ctx.fillRect(200,190,1300,395);
 ctx.strokeStyle="#fff7df91";ctx.lineWidth=3;ctx.setLineDash([24,27]);
 for(let i=1;i<8;i++){
  const yy=218+i*42;ctx.beginPath();ctx.moveTo(220,yy+20);ctx.lineTo(1470,yy-24);ctx.stroke();
 }
 ctx.setLineDash([]);
 const shift=(t*BASE*2)%160;ctx.strokeStyle="#fff4dc40";ctx.lineWidth=11;
 for(let i=-2;i<13;i++){let xx=i*165-shift;ctx.beginPath();ctx.moveTo(xx,200);ctx.lineTo(xx+73,565);ctx.stroke();}
 ctx.restore();
 // Finishing marker on the track.
 ctx.save();ctx.globalAlpha=.75;ctx.translate(1349,213);ctx.transform(1,-.05,-.19,1,0,0);
 for(let i=0;i<22;i++)for(let j=0;j<2;j++){
  ctx.fillStyle=(i+j)%2===0?"#fbf5ec":"#282840";
  ctx.fillRect(j*18,i*15,18,15);
 }
 ctx.restore();
 // Stationary flowering foreground fence.
 ctx.strokeStyle="#a76746";ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(20,529);ctx.lineTo(285,542);ctx.moveTo(1420,508);ctx.lineTo(1590,528);ctx.stroke();
 [38,116,205,278,1440,1520,1586].forEach(x=>{
  const y=x>1000?518:542;
  ctx.fillStyle="#cc8d59";roundedRect(x-8,y-29,16,66,5);ctx.fill();
  ctx.fillStyle="#f5bf70";roundedRect(x-5,y-26,10,57,4);ctx.fill();
 });
 let leader=Math.max(...racers.map(p=>p.distance));
 const views=racers.map(p=>{
  const x=Math.min(1285,Math.max(345,1180+(p.distance-leader)*5-p.offset*.65));
  const y=p.depth+Math.sin(t*14+p.id*2)*2;
  return {p,x,y,scale:p.visualScale};
 }).sort((a,b)=>a.y-b.y);
 for(const view of views){
  const {p,x,y,scale}=view;const fast=p.speed>BASE;
  if(fast){
   const col=p.me?"#ffdc46":"#dd7de9";
   ctx.strokeStyle=col;ctx.lineWidth=5*scale;ctx.shadowColor=col;ctx.shadowBlur=20*scale;
   for(let k=0;k<4;k++){ctx.beginPath();ctx.moveTo(x-(122+36*k)*scale,y+(k-2)*15);ctx.lineTo(x-(65+29*k)*scale,y+(k-2)*15);ctx.stroke();}
   ctx.shadowBlur=0;
  }
  // Soft dust impacts and race motion.
  ctx.fillStyle="#fff5e0bf";ctx.beginPath();ctx.ellipse(x-64*scale,y+26*scale,56*scale,14*scale,0,0,Math.PI*2);ctx.fill();
  for(let k=0;k<3;k++){ctx.fillStyle="#f7e4c5a8";ctx.beginPath();ctx.arc(x-(75+k*14)*scale,y+(13-k*4)*scale, (8+k*2)*scale,0,Math.PI*2);ctx.fill();}
  const sprite=picture(p,Math.floor(t*(fast?17:12))%6);
  if(sprite.complete && sprite.naturalWidth){
   ctx.drawImage(sprite,x-119*scale,y-100*scale,240*scale,167*scale);
  }
  const rank=[...racers].sort((a,b)=>b.distance-a.distance).indexOf(p)+1;
  const label=p.name.length>13?p.name.slice(0,12)+"…":p.name;
  ctx.font="1000 "+Math.round((p.me?21:15)*scale)+"px Nunito,system-ui";
  const width=Math.max(86,ctx.measureText(label).width+40*scale);
  const labelX=x-width/2+10*scale,labelY=y-100*scale;
  ctx.fillStyle=p.me?"#fbb634":"#5b3879";roundedRect(labelX,labelY,width,28*scale,14*scale);ctx.fill();
  ctx.strokeStyle=p.me?"#fff4b4":"#c69afb";ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle=p.me?"#56336c":"#fff";ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillText(label,x+10*scale,labelY+14*scale);
  if(p.me){ctx.font="35px sans-serif";ctx.fillText("👑",x-60*scale,y-114*scale);}
 }
 ctx.globalAlpha=1;
}

function showTop10(){
 const data=currentLeaderboardData||scores.read(localStorage);
 const leaders=scores.top10(data);
 const body=$("top10Rows");body.replaceChildren();
 leaders.forEach((p,i)=>{
   const row=document.createElement("tr");
   if(scores.playerKey(p.name)===scores.playerKey(profile.playerName||""))row.classList.add("my-score");
   const columns=[i===0?"🥇":i===1?"🥈":i===2?"🥉":String(i+1),p.name,p.totalPoints.toLocaleString("vi-VN"),p.races,p.wins,p.correct];
   columns.forEach(value=>{const cell=document.createElement("td");cell.textContent=String(value);row.append(cell);});
   body.append(row);
 });
 $("top10Empty").classList.toggle("hidden",leaders.length>0);
 $("top10StorageNote").textContent="Điểm được lưu trên trình duyệt hiện tại. Dùng TẢI CSV/JSON để có file; chưa có bảng chung giữa các thiết bị.";
 $("leaderboardModal").classList.remove("hidden");
}
function exportScores(format){
 const data=currentLeaderboardData||scores.read(localStorage);
 try{
   if(format==="csv")scores.download("dua-heo-top-10.csv",scores.toCsv(data),"text/csv;charset=utf-8",document,window);
   else scores.download("dua-heo-bang-diem.json",scores.toJson(data),"application/json;charset=utf-8",document,window);
 }catch(err){
   $("top10StorageNote").textContent="Không thể tải file trên trình duyệt này. Vui lòng dùng Chrome hoặc Edge.";
 }
}
function keyEvents(){
 $("playBtn").addEventListener("click",start);
 $("changeBtn").addEventListener("click",pickerOpen);
 $("settingsBtn").addEventListener("click",pickerOpen);
 $("leaderboardBtn").addEventListener("click",showTop10);
 $("resultTop10Btn").addEventListener("click",showTop10);
 $("top10Close").addEventListener("click",()=>$("leaderboardModal").classList.add("hidden"));
 $("exportCsv").addEventListener("click",()=>exportScores("csv"));
 $("exportJson").addEventListener("click",()=>exportScores("json"));
 $("pickerClose").addEventListener("click",()=>$("pickerModal").classList.add("hidden"));
 $("pickerSave").addEventListener("click",pickerSave);
 nameField.addEventListener("keydown",e=>{if(e.key==="Enter")pickerSave();});
 $("soundBtn").addEventListener("click",()=>{muted=!muted;$("soundBtn").textContent=muted?"🔇":"🔊";});
 $("musicBtn").addEventListener("click",()=>{music=!music;$("musicBtn").textContent=music?"🎶":"🎵";musicStart();});
 $("typeMode").addEventListener("click",()=>setMode("typing"));
 $("mathMode").addEventListener("click",()=>setMode("math"));
 $("answerInput").addEventListener("compositionstart",()=>{composing=true;});
 $("answerInput").addEventListener("compositionend",()=>{composing=false;onInput();});
 $("answerInput").addEventListener("input",onInput);
 $("answerInput").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();submit();}});
 $("answerSubmit").addEventListener("click",submit);
 $("startTypeMode").addEventListener("click",()=>setMode("typing"));
 $("startMathMode").addEventListener("click",()=>setMode("math"));
 $("avatarInput").addEventListener("change",function(){
  const file=this.files&&this.files[0];if(!file)return;
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>2*1024*1024){$("nameError").textContent="Avatar chỉ nhận PNG/JPG/WebP dưới 2MB.";this.value="";return;}
  if(avatarURL)URL.revokeObjectURL(avatarURL);
  avatarURL=URL.createObjectURL(file);
 });
}
function syncModeButtons(){
 const shown=pendingMode||mode;
 $("typeMode").classList.toggle("chosen",shown==="typing");
 $("mathMode").classList.toggle("chosen",shown==="math");
 $("startTypeMode").classList.toggle("chosen",shown==="typing");
 $("startMathMode").classList.toggle("chosen",shown==="math");
 $("startModeHint").textContent=shown==="math"?"🧮 Chế độ: Tính toán":"⌨️ Chế độ: Gõ chữ";
}
function setMode(next){
 if(mode===next && pendingMode===null)return;
 if(state==="racing"){
   pendingMode=next;
   syncModeButtons();
   $("answerFeedback").textContent=next==="math"
     ?"🧮 Đã chọn Tính toán. Phép tính xuất hiện ở câu kế tiếp!"
     :"⌨️ Đã chọn Gõ chữ. Câu ngắn sẽ xuất hiện ở lượt kế tiếp!";
 }else{
   mode=next;pendingMode=null;syncModeButtons();
   $("challengeType").textContent=next==="typing"?"Gõ chính xác câu ngắn sau!":"Tính nhanh và nhập kết quả!";
   $("questionText").textContent=next==="typing"?texts[0]:"25 + 17 = ?";
   $("timeLeft").textContent="⌛ Còn: "+QUESTION_TIMES[next].toFixed(1)+" giây";
   $("answerColor").textContent=next==="typing"?"Gõ lại câu ở phía trên...":"Nhập kết quả phép tính...";
   $("answerFeedback").textContent=next==="typing"?"⌨️ Câu ngắn chỉ vài từ!":"🧮 Cộng, trừ, nhân, chia – đáp án là số nguyên!";
 }
 sfx("click");
}
function onInput(){
 if(state!=="racing"||userDone)return;
 const typed=$("answerInput").value.normalize("NFC");
 colorWords();
 if(composing)return;
 if(mode==="typing"){
  const target=question.normalize("NFC");
  if(typed.length>0 && target.slice(0,typed.length)!==typed){
   if(gameClock-wrongFiredAt>.19){sfx("wrong");wrongFiredAt=gameClock;}
   $("answerFeedback").textContent="❌ Có từ sai! Hãy sửa chữ đỏ.";
  }else{$("answerFeedback").textContent="✅ Tiếp tục! Heo vẫn đang chạy...";}
  if(typed===target)submit();
 }else if(typed.trim()!=="" && Number(typed)===expectedAnswer){submit();}
}
keyEvents();art.preload();makeRacers();reset();syncModeButtons();pickerOpen();
})();