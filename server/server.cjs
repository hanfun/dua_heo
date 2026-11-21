/* Optional file-backed server for a SHARED leaderboard.
 * Run: node server/server.cjs (PORT=8080, SCORE_FILE=./server/data/scores.json).
 * WARNING: Scores are client-reported in this prototype; add authentication and
 * server-authoritative racing before offering prizes or trusting rankings.
 */
"use strict";
const http=require("node:http");
const fs=require("node:fs");
const path=require("node:path");
const score=require("../site/leaderboard.js");
const ROOT=path.resolve(__dirname,"..");
const DATA_FILE=path.resolve(process.env.SCORE_FILE||path.join(__dirname,"data","scores.json"));
const PORT=Number(process.env.PORT||8080);
const LIMIT=16*1024;
const recent=new Map();
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".json":"application/json; charset=utf-8",".png":"image/png",".webp":"image/webp",".jpg":"image/jpeg"};
function storage(){
 return{
  getItem(){try{return fs.readFileSync(DATA_FILE,"utf8");}catch(e){return null;}},
  setItem(key,value){
   fs.mkdirSync(path.dirname(DATA_FILE),{recursive:true});
   const tmp=DATA_FILE+"."+process.pid+".tmp";
   fs.writeFileSync(tmp,value,{encoding:"utf8",mode:0o600});
   fs.renameSync(tmp,DATA_FILE);
  }
 };
}
function json(res,status,body){
 res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
 res.end(JSON.stringify(body));
}
function sendPage(res,file){
 fs.readFile(file,(err,buf)=>{
  if(err){res.writeHead(404);res.end("Not found");return;}
  res.writeHead(200,{"Content-Type":mime[path.extname(file)]||"application/octet-stream","X-Content-Type-Options":"nosniff","Cache-Control":"no-cache"});res.end(buf);
 });
}
function readRequest(req){
 return new Promise((resolve,reject)=>{
  let chunks=[],n=0;
  req.on("data",chunk=>{n+=chunk.length;if(n>LIMIT){reject(new Error("Request too large"));req.destroy();return;}chunks.push(chunk);});
  req.on("end",()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));}catch(e){reject(new Error("Invalid JSON"));}});
  req.on("error",reject);
 });
}
function allowed(ip){
 const now=Date.now(),old=recent.get(ip)||[];
 const arr=old.filter(t=>now-t<60_000);
 if(arr.length>=10)return false;
 arr.push(now);recent.set(ip,arr);return true;
}
const app=http.createServer(async(req,res)=>{
 let url;try{url=new URL(req.url,"http://localhost");}catch(e){return json(res,400,{error:"Invalid URL"});}
 const pathName=url.pathname;
 if(req.method==="GET"&&pathName==="/api/scores"){
  return json(res,200,score.read(storage()));
 }
 if(req.method==="GET"&&pathName==="/api/top10"){
  return json(res,200,{scope:"server",players:score.top10(score.read(storage()))});
 }
 if(req.method==="POST"&&pathName==="/api/results"){
  if(!allowed(req.socket.remoteAddress||"unknown"))return json(res,429,{error:"Too many results"});
  try{
   const body=await readRequest(req);
   const result=score.recordResult(storage(),body);
   return json(res,result.duplicate?200:201,{saved:result.saved,duplicate:result.duplicate,points:result.points,top10:result.top10});
  }catch(err){return json(res,400,{error:"Invalid match result"});}
 }
 if(req.method!=="GET")return json(res,405,{error:"Method not allowed"});
 if(pathName==="/site/config.js"){
  res.writeHead(200,{"Content-Type":"text/javascript; charset=utf-8","Cache-Control":"no-store"});
  return res.end("window.PIG_SHARED_SCORE_API=true;");
 }
 let filename;
 if(pathName==="/")filename=path.join(ROOT,"index.html");
 else if(/^\/(?:site|assets|prototype)\/[a-zA-Z0-9._\/-]+$/.test(pathName)&&!pathName.split("/").includes("..")){
  filename=path.resolve(ROOT,"."+pathName);
  if(!filename.startsWith(ROOT+path.sep))return json(res,403,{error:"Forbidden"});
 }else return json(res,404,{error:"Not found"});
 return sendPage(res,filename);
});
if(require.main===module){
 app.listen(PORT,"0.0.0.0",()=>console.log("Bầy Heo Đua: http://localhost:"+PORT+" • Score file: "+DATA_FILE));
}
module.exports=app;
