"use strict";
const assert=require("node:assert/strict");
const score=require("./leaderboard.js");
const memory=new Map();
const storage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};
function match(i,name,rank,correct,fastest){
 return {matchId:"race-"+i,playerName:name,pigName:"Heo Tia Chớp",mode:i%2?"typing":"math",rank,correct,fastest,finishTime:58.5+i};
}
async function main(){
 assert.equal(score.pointsFor(1,3,2),140);
 assert.equal(score.pointsFor(8,0,0),10);
 assert.equal(score.pointsFor(2,2,1),105);
 assert.equal(score.cleanName("  Minh     Racing  "),"Minh Racing");
 assert.equal(score.playerKey("MINH Racing"),score.playerKey("minh racing"));
 const a=score.recordResult(storage,match(1,"Minh Racing",1,3,2));
 assert.equal(a.saved,true);assert.equal(a.points,140);
 const b=score.recordResult(storage,match(2,"MINH RACING",2,2,1));
 assert.equal(b.points,105);
 const duplicate=score.recordResult(storage,match(2,"MINH RACING",2,2,1));
 assert.equal(duplicate.duplicate,true);assert.equal(duplicate.points,0);
 assert.equal(score.read(storage).players.length,1);
 assert.equal(score.read(storage).players[0].totalPoints,245);
 assert.equal(score.read(storage).players[0].races,2);
 assert.equal(score.read(storage).history.length,2);
 for(let i=3;i<=17;i++)score.recordResult(storage,match(i,"Player "+i,i%8+1,i%3,0));
 assert.equal(score.top10(score.read(storage)).length,10);
 assert.equal(score.top10(score.read(storage))[0].totalPoints,245);
 assert.ok(score.toCsv(score.read(storage)).startsWith("\uFEFF"));
 assert.ok(score.toCsv(score.read(storage)).includes("Minh Racing")||score.toCsv(score.read(storage)).includes("MINH RACING"));
 const parsed=JSON.parse(score.toJson(score.read(storage)));
 assert.equal(parsed.history.length,17);
 let written="";
 const dir={getFileHandle:async(n,opts)=>{assert.equal(n,"dua-heo-bang-diem.json");assert.equal(opts.create,true);return{createWritable:async()=>({write:async text=>{written=text},close:async()=>{}})}}};
 assert.equal(await score.savePrivateFile(parsed,{getDirectory:async()=>dir}),true);
 assert.equal(JSON.parse(written).players.length,16);
 assert.equal(await score.savePrivateFile(parsed,{}),false);
 console.log("Leaderboard tests passed: scoring, duplicate guard, cumulative Top 10, CSV/JSON, private-file save.");
}
main().catch(err=>{console.error(err);process.exitCode=1;});
