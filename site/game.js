/* Bầy Heo Đua - browser demo. All scoring/racing is local for now. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const TOTAL=2000,LAP=TOTAL/3,BASE=30,QUESTION_SECONDS=12,BOOST_SECONDS=3;
const BOOSTS=[12,10,8.5,7.2,6,4.7,3.5,2.4];
const texts=[
"Con heo cơ bắp đang bứt tốc về đích!",
"Ú Nụ mập nhưng chạy nhanh như gió.",
"Heo Cầu Vồng vừa vượt qua Bánh Bao!",
"Đường đua nông trại thật náo nhiệt hôm nay.",
"Chú heo đeo kính nhảy qua bờ rào xanh.",
"The funny little pig is running very fast.",
"A rainbow pig can win the race today.",
"Nhanh tay gõ chữ để heo bứt tốc.",
"Heo Tia Chớp phóng như tên lửa màu xanh.",
"Con heo ninja thích ăn bánh bao buổi sáng."
];
const canvas=$("raceCanvas"),ctx=canvas.getContext("2d");
const roster=window.PIG_ROSTER,art=window.PigArt;
const nameField=$("pigNameInput");
const stage=$("stage");
const mapPath=$("mapLine");
let profile={id:2,name:"Cơ Bắp"},avatarURL=null;
try {const old=JSON.parse(localStorage.getItem("pigRaceProfileV3")||"null");if(old && Number.isInteger(old.id)&&roster[old.id]&&typeof old.name==="string"&&old.name.length>=2)profile={id:old.id,name:old.name.slice(0,18)};}catch(e){}
let selected=profile.id;
let racers=[],particles=[],state="ready",mode="typing",question="",expectedAnswer=0,questionId=0;
let qStart=0,qElapsed=0,gameClock=0,botTimes=[],botDone=[],userDone=false,wrongFiredAt=-10,correctWords=0;
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
 $("selectedInfo").textContent=roster[selected].name+" — "+roster[selected].tagline;
 $("nameError").textContent="";renderRoster();
 $("pickerModal").classList.remove("hidden");nameField.focus();
}
function pickerSave(){
 const name=nameField.value.trim().replace(/\s+/g," ");
 if(name.length<2 || name.length>18){$("nameError").textContent="❌ Tên phải có từ 2 đến 18 ký tự.";nameField.focus();return;}
 profile={id:selected,name};try{localStorage.setItem("pigRaceProfileV3",JSON.stringify(profile));}catch(e){}
 $("pickerModal").classList.add("hidden");setAvatar();reset();
 $("resultHeading").textContent="🐷 "+profile.name.toUpperCase()+"!";
 $("resultMessage").textContent="Chiến binh "+roster[profile.id].name+" đã sẵn sàng. Gõ đúng, chạy nhanh, giành cúp!";
 sfx("click");
}
function reset(){
 if(frameHandle){cancelAnimationFrame(frameHandle);frameHandle=0;}
 if(musicTimer){clearInterval(musicTimer);musicTimer=0;}
 state="ready";gameClock=0;lastTick=0;lastUi=0;qElapsed=0;userDone=false;questionId=0;particles=[];
 makeRacers();updateRank();
 $("startOverlay").classList.remove("hidden");
 $("playBtn").textContent="🚀 BẮT ĐẦU ĐUA";
 $("resultHeading").textContent="BẦY HEO ĐUA!";
 $("resultMessage").textContent="Chọn heo, đặt tên, gõ chữ hoặc giải toán để tăng tốc qua 3 vòng!";
 $("answerInput").disabled=true;$("answerInput").value="";
 $("answerColor").textContent="Nhấn Bắt đầu để nhận thử thách...";
 $("questionText").textContent="Con heo cơ bắp đang bứt tốc về đích!";
 $("answerFeedback").textContent="Gõ nhanh và chính xác để heo chạy nhanh hơn!";
 $("timeLeft").textContent="⌛ Còn: 12.0 giây";
 $("boostValue").textContent="+0.0 m/s";$("boostDuration").textContent="SẴN SÀNG";
 setAvatar();drawRace(0);
}
function start(){
 if(state==="racing")return;
 if($("pickerModal").classList.contains("hidden")===false)return;
 reset();state="racing";$("startOverlay").classList.add("hidden");
 $("answerInput").disabled=false;nextQuestion();
 lastTick=performance.now();sfx("start");musicStart();frameHandle=requestAnimationFrame(tick);
}
function mathQuestion(){
 const a=3+Math.floor(Math.random()*80),b=2+Math.floor(Math.random()*17),op=["+","−","×","÷"][Math.floor(Math.random()*4)];
 if(op==="+"){expectedAnswer=a+b;return a+" + "+b+" = ?";}
 if(op==="−"){expectedAnswer=a-b;return a+" − "+b+" = ?";}
 if(op==="×"){expectedAnswer=a*b;return a+" × "+b+" = ?";}
 const quotient=2+Math.floor(Math.random()*16);
 expectedAnswer=quotient;return (quotient*b)+" ÷ "+b+" = ?";
}
function nextQuestion(){
 questionId++;qStart=gameClock;qElapsed=0;userDone=false;botDone=Array(racers.length).fill(false);
 botTimes=racers.map((p,i)=>i===0?Infinity:2.0+Math.random()*8.5);
 question=mode==="typing"?texts[(questionId-1)%texts.length]:mathQuestion();
 correctWords=0;previousQuestion=-1;
 $("questionText").textContent=question;
 $("challengeType").textContent=mode==="typing"?"Gõ lại chính xác đoạn văn sau!":"Giải phép tính và nhập đáp án!";
 $("answerInput").value="";$("answerInput").disabled=false;
 $("answerInput").placeholder="";
 $("answerInput").setAttribute("inputmode",mode==="typing"?"text":"numeric");
 $("answerFeedback").textContent="🐷 Heo vẫn chạy khi bạn đang trả lời...";
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
 if(!good){sfx("wrong");$("answerFeedback").textContent="❌ Chưa đúng! Sửa phần chữ đỏ hoặc kiểm tra kết quả.";return;}
 userDone=true;$("answerInput").disabled=true;
 const responseTime=gameClock-qStart;
 const rank=1+botTimes.slice(1).filter(t=>t<=responseTime).length;
 boost(racers[0],BOOSTS[Math.min(BOOSTS.length-1,rank-1)]);
 $("answerFeedback").textContent="✅ Chính xác! Hạng "+rank+"/"+racers.length+" sau "+responseTime.toFixed(2)+"s • BOOST!";
 bubble("⚡ "+profile.name+" BỨT TỐC!");
 sfx("boost");
}
function boost(p,bonus){p.bonus=bonus;p.boostUntil=gameClock+BOOST_SECONDS;}
function end(){
 if(state!=="racing")return;
 state="finished";$("answerInput").disabled=true;
 if(musicTimer){clearInterval(musicTimer);musicTimer=0;}
 const sorted=[...racers].sort((a,b)=>(a.finishAt??Infinity)-(b.finishAt??Infinity));
 const rank=sorted.indexOf(racers[0])+1,win=rank===1;
 $("resultHeading").textContent=win?"🏆 VÔ ĐỊCH ĐƯỜNG ĐUA!":"🐷 VỀ ĐÍCH HẠNG "+rank+"!";
 $("resultMessage").textContent=win?profile.name+" đã chiến thắng ngoạn mục!":profile.name+" đã hoàn thành 3 vòng. Cùng thử lại để giành chức vô địch nhé!";
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
 if(qElapsed<QUESTION_SECONDS){
  racers.forEach((p,i)=>{
   if(i>0&&!botDone[i]&&qElapsed>=botTimes[i]){
    botDone[i]=true;const rank=1+botTimes.slice(1).filter(t=>t<botTimes[i]).length;
    boost(p,BOOSTS[Math.min(BOOSTS.length-1,rank-1)]);
   }
  });
 } else if(!userDone){userDone=true;$("answerInput").disabled=true;$("answerFeedback").textContent="⌛ Hết giờ! Hãy chờ câu tiếp theo."; }
 if(qElapsed>QUESTION_SECONDS+1)nextQuestion();
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
 $("timeLeft").textContent="⌛ Còn: "+Math.max(0,QUESTION_SECONDS-qElapsed).toFixed(1)+" giây";
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
function keyEvents(){
 $("playBtn").addEventListener("click",start);
 $("changeBtn").addEventListener("click",pickerOpen);
 $("settingsBtn").addEventListener("click",pickerOpen);
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
 $("avatarInput").addEventListener("change",function(){
  const file=this.files&&this.files[0];if(!file)return;
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>2*1024*1024){$("nameError").textContent="Avatar chỉ nhận PNG/JPG/WebP dưới 2MB.";this.value="";return;}
  if(avatarURL)URL.revokeObjectURL(avatarURL);
  avatarURL=URL.createObjectURL(file);
 });
}
function setMode(next){
 if(state==="racing"){bubble("Đổi loại thử thách ở trận tiếp theo nhé!");return;}
 if(mode===next)return;mode=next;
 $("typeMode").classList.toggle("chosen",next==="typing");
 $("mathMode").classList.toggle("chosen",next==="math");
 if(state==="racing")nextQuestion();
 else {$("challengeType").textContent=next==="typing"?"Gõ lại chính xác đoạn văn sau!":"Giải phép tính và nhập đáp án!";$("questionText").textContent=next==="typing"?texts[0]:"25 + 17 = ?";}
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
keyEvents();art.preload();makeRacers();reset();pickerOpen();
})();