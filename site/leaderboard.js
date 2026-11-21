/* Pig Racing scoring and local leaderboard, usable in browser and Node tests. */
(function(root, factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.PigScores=api;
})(typeof globalThis!=="undefined"?globalThis:null,function(){
"use strict";
const STORAGE_KEY="pigRaceLeaderboardV1";
const MAX_HISTORY=300;
const RANK_POINTS=[100,80,60,45,35,25,15,10];

function cleanName(value){
  return String(value||"").normalize("NFC").trim().replace(/\s+/g," ").slice(0,24);
}
function playerKey(value){return cleanName(value).toLocaleLowerCase("vi");}
function pointsFor(rank,correct,fastest){
  const place=Number.isInteger(rank)&&rank>=1&&rank<=8?RANK_POINTS[rank-1]:0;
  return place+Math.max(0,Math.floor(correct||0))*10+Math.max(0,Math.floor(fastest||0))*5;
}
function fresh(){return{version:1,players:[],history:[]};}
function validated(data){
  if(!data||!Array.isArray(data.players)||!Array.isArray(data.history))return fresh();
  return{version:1,players:data.players.filter(p=>p&&typeof p.name==="string"&&Number.isFinite(p.totalPoints)),history:data.history.filter(h=>h&&typeof h.playerName==="string").slice(-MAX_HISTORY)};
}
function read(storage){
  try{return validated(JSON.parse(storage.getItem(STORAGE_KEY)||"null"));}catch(err){return fresh();}
}
function persist(storage,data){
  try{storage.setItem(STORAGE_KEY,JSON.stringify(data));return true;}catch(err){return false;}
}
function recordResult(storage,result){
  const name=cleanName(result.playerName),pigName=cleanName(result.pigName);
  if(name.length<2)throw Error("Tên người chơi cần từ 2 ký tự.");
  if(typeof result.matchId!=="string"||result.matchId.length<4)throw Error("Thiếu mã trận.");
  const rank=Number(result.rank),correct=Math.max(0,Math.floor(result.correct||0));
  const fastest=Math.max(0,Math.min(correct,Math.floor(result.fastest||0)));
  if(!Number.isInteger(rank)||rank<1||rank>8)throw Error("Thứ hạng không hợp lệ.");
  if(!Number.isFinite(correct)||correct>1000||fastest>1000)throw Error("Thống kê không hợp lệ.");
  const data=read(storage);
  if(data.history.some(x=>x.matchId===result.matchId))return{saved:true,duplicate:true,points:0,top10:top10(data),data};
  const key=playerKey(name),points=pointsFor(rank,correct,fastest);
  const now=new Date().toISOString();
  const match={matchId:result.matchId,playerName:name,pigName,mode:result.mode==="math"?"math":"typing",rank,correct,fastest,points,finishTime:Number(result.finishTime.toFixed?result.finishTime.toFixed(2):result.finishTime)||0,playedAt:now};
  let player=data.players.find(x=>x.key===key);
  if(!player){
    player={key,name,totalPoints:0,races:0,wins:0,top3:0,bestScore:0,correct:0,fastest:0,lastPlayed:now};
    data.players.push(player);
  }
  player.name=name;
  player.totalPoints+=points;player.races++;
  if(rank===1)player.wins++;
  if(rank<=3)player.top3++;
  player.bestScore=Math.max(player.bestScore,points);
  player.correct+=correct;player.fastest+=fastest;player.lastPlayed=now;
  data.history.push(match);
  if(data.history.length>MAX_HISTORY)data.history.splice(0,data.history.length-MAX_HISTORY);
  const saved=persist(storage,data);
  return{saved,duplicate:false,points,match,top10:top10(data),data};
}
function top10(data){
  return [...validated(data).players].sort((a,b)=>b.totalPoints-a.totalPoints||b.wins-a.wins||b.bestScore-a.bestScore||a.name.localeCompare(b.name,"vi")).slice(0,10);
}
function csvCell(value){return '"'+String(value??"").replace(/"/g,'""')+'"';}
function toCsv(data){
  const headers=["Hạng","Người chơi","Tổng điểm","Số trận","Số trận thắng","Top 3","Điểm trận cao nhất","Câu đúng","Trả lời nhanh nhất"];
  const rows=top10(data).map((p,i)=>[i+1,p.name,p.totalPoints,p.races,p.wins,p.top3,p.bestScore,p.correct,p.fastest]);
  return "\uFEFF"+[headers,...rows].map(row=>row.map(csvCell).join(",")).join("\r\n")+"\r\n";
}
function toJson(data){return JSON.stringify(validated(data),null,2);}
// Origin Private File System: automatically write a JSON file after each match
// on supported HTTPS browsers. Export JSON to download a regular file.
async function savePrivateFile(data,storageManager){
  if(!storageManager||typeof storageManager.getDirectory!=="function")return false;
  try{
    const directory=await storageManager.getDirectory();
    const handle=await directory.getFileHandle("dua-heo-bang-diem.json",{create:true});
    const writable=await handle.createWritable();
    await writable.write(toJson(data));await writable.close();
    return true;
  }catch(err){return false;}
}
function download(filename,content,mime,doc,win){
  const blob=new Blob([content],{type:mime}),url=win.URL.createObjectURL(blob);
  const a=doc.createElement("a");a.href=url;a.download=filename;doc.body.append(a);a.click();a.remove();
  win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);
}
return{STORAGE_KEY,RANK_POINTS,cleanName,playerKey,pointsFor,read,recordResult,top10,toCsv,toJson,savePrivateFile,download};
});
