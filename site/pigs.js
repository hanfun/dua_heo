/* 20 original SVG pig characters, six-frame leg animation, no external images. */
(function(){
"use strict";
const defs=[
["Ú Nụ","Mập mà lao nhanh","fat","#f6a0b0","racer"],
["Tí Teo","Ốm nhưng lướt gió","thin","#efa090","pilot"],
["Cơ Bắp","Nổ cơ là chạy","muscle","#f08b91","muscle"],
["Vằn Vện","Sọc càng, càng ngầu","normal","#e1b08e","tiger"],
["Đốm Đen","Chạy kiểu bí ẩn","fat","#f0e2d9","spots"],
["Tóc Dựng","Punk từ chuồng ra","normal","#f4a2b9","punk"],
["Ngái Ngủ","Mơ mà vẫn thắng","fat","#f1afbf","sleep"],
["Kiêu Sa","Đẹp trước, đua sau","normal","#e9a0c6","princess"],
["Lực Điền","Ủn một cái là bay","muscle","#cb877f","armor"],
["Tia Chớp","Nhanh như điện giật","thin","#73a5eb","lightning"],
["Lơ Ngơ","Chậm đầu, nhanh chân","fat","#f1a5ae","propeller"],
["Quý Tộc","Chuẩn heo nhà giàu","normal","#dc9dac","fancy"],
["Lém Lỉnh","Nhìn hiền mà láu","thin","#dca1a7","bandit"],
["Giáo Sư","Thông minh tăng tốc","thin","#f4b7a8","professor"],
["Bác Nông","Từ trại ra đường","fat","#edaa8d","farmer"],
["Ẩn Thân","Thoắt cái vượt mặt","normal","#aea4b7","ninja"],
["Cầu Vồng","Màu mè nhưng chất","fat","#f5a2c4","rainbow"],
["Heo Vua","Oai nhất đường đua","fat","#eda5a7","king"],
["Chân Dài","Sải bước ăn tiền","thin","#e9a9b5","longlegs"],
["Bánh Bao","Tròn vo siêu cưng","fat","#ffc0c8","chef"]];
const roster=defs.map(function(p,i){return{id:i,name:p[0],tagline:p[1],shape:p[2],color:p[3],style:p[4]};});
window.PIG_ROSTER=roster;
const cache=new Map();
function svg(p,frame){
 var fat=p.shape==="fat",thin=p.shape==="thin",muscle=p.shape==="muscle";
 var rx=fat?78:thin?54:muscle?70:65,ry=fat?51:thin?38:muscle?47:43;
 var phase=Math.round(Math.sin(frame*Math.PI/3)*19);
 var color=p.color,style=p.style;
 var s=['<svg xmlns="http://www.w3.org/2000/svg" width="260" height="180" viewBox="-10 -26 270 208">'];
 s.push('<defs><radialGradient id="b" cx=".28" cy=".2" r=".9"><stop stop-color="#fff7e6"/><stop offset=".38" stop-color="'+color+'"/><stop offset="1" stop-color="#a65c6c"/></radialGradient><radialGradient id="h" cx=".32" cy=".17" r=".9"><stop stop-color="#fff6e9"/><stop offset=".36" stop-color="'+color+'"/><stop offset="1" stop-color="#b76b79"/></radialGradient></defs>');
 s.push('<ellipse cx="121" cy="153" rx="109" ry="12" fill="#46304f3d"/>');
 if(["ninja","king","fancy"].includes(style))s.push('<path d="M56 48Q12 42 0 84L27 70 3 115Q55 93 87 66" fill="'+(style==="ninja"?"#d1415c":"#8a3666")+'" stroke="#663550" stroke-width="4"/>');
 s.push('<path d="M48 94q-42-28-37 1 4 24 27 7 9-13-3-21" fill="none" stroke="#b97583" stroke-width="8" stroke-linecap="round"/>');
 s.push('<g fill="#c57b85" stroke="#8c5266" stroke-width="4"><path d="M48 111l-17 25q4 19 26 10l22-28" transform="rotate('+phase+' 66 110)"/><path d="M110 104l8 33q13 13 25-1l-5-33" transform="rotate('+(-phase)+' 120 110)"/></g>');
 s.push('<ellipse cx="104" cy="85" rx="'+rx+'" ry="'+ry+'" fill="url(#b)" stroke="#914d63" stroke-width="6"/>');
 s.push('<ellipse cx="75" cy="57" rx="36" ry="13" fill="#fff8f079" transform="rotate(-22 75 57)"/>');
 if(style==="racer")s.push('<path d="M36 58q37-17 79 0l13 58q-43 17-87-7z" fill="#cf3e51" stroke="#aa3858" stroke-width="3"/><path d="M50 61l48 55M51 85l42 30" stroke="#fff7d9" stroke-width="8"/><rect x="76" y="82" width="31" height="29" rx="6" fill="#fff"/><text x="91" y="103" font-size="24" font-family="sans-serif" font-weight="bold" fill="#ad4257" text-anchor="middle">1</text>');
 if(style==="tiger")s.push('<g stroke="#694b36" stroke-width="9"><path d="M57 50l24 63M83 43l23 72M109 43l21 64"/></g>');
 if(style==="spots")s.push('<g fill="#3a3443"><ellipse cx="51" cy="75" rx="16" ry="12"/><ellipse cx="105" cy="64" rx="15" ry="19"/><ellipse cx="129" cy="109" rx="15" ry="10"/></g>');
 if(style==="rainbow")["#f1559a","#ffd044","#64cb91","#69abf4","#a475de"].forEach(function(c,i){s.push('<path d="M'+(49+i*16)+' 50l5 67" stroke="'+c+'" stroke-width="14"/>');});
 if(style==="lightning")s.push('<path d="M38 50q39-17 90 10l9 54q-49 14-90-5z" fill="#3d62d7"/><path d="M88 56L70 86H94L79 116 117 72H95L111 48" fill="#ffdf43" stroke="#fff5a8" stroke-width="2"/>');
 if(style==="armor")s.push('<path d="M48 55q41-18 88 5l9 47q-43 28-91 4z" fill="#595260" stroke="#ddc4bb" stroke-width="5"/><path d="M55 89h87M66 72h64" stroke="#b6a2a5" stroke-width="8"/>');
 if(style==="muscle")s.push('<path d="M55 55q40-12 81 4l11 51q-49 13-89 0z" fill="#ffeadc" stroke="#cb8e8c" stroke-width="4"/><path d="M71 61l-10 49M126 61l12 50" stroke="#53434b" stroke-width="7"/><path d="M86 79h27M81 92h36" stroke="#cc9f90" stroke-width="3"/>');
 s.push('<path d="M139 51q-23-35 6-53l23 29M188 37q17-43 42-28l-11 48" fill="'+color+'" stroke="#a35f70" stroke-width="6"/>');
 s.push('<path d="M150 27l7-17 13 15M198 27l18-13-7 18" fill="#e78295"/>');
 s.push('<ellipse cx="170" cy="76" rx="'+(thin?48:56)+'" ry="'+(fat?51:47)+'" fill="url(#h)" stroke="#a45b6a" stroke-width="6"/>');
 s.push('<ellipse cx="148" cy="86" rx="15" ry="11" fill="#ed788d8a"/><path d="M163 105q25 30 53-1" fill="#68354f" stroke="#5c324a" stroke-width="3"/><path d="M170 108q20 17 36 0" fill="#fff7f2"/>');
 s.push('<ellipse cx="171" cy="65" rx="15" ry="19" fill="#fffaf6"/><ellipse cx="181" cy="68" rx="6" ry="10" fill="#2f2a40"/><circle cx="183" cy="62" r="3" fill="#fff"/><path d="M156 48q17-11 29-3" fill="none" stroke="#8a4959" stroke-width="6" stroke-linecap="round"/>');
 if(style==="ninja"||style==="bandit")s.push('<path d="M124 54q43-26 94 0l2 22q-49-13-95 0z" fill="#29293a" stroke="#1b1a2f" stroke-width="4"/><path d="M130 55L89 37 117 78" fill="#2b273d"/>');
 if(style==="lightning"||style==="professor"||style==="fancy")s.push('<g fill="#6ee8fc77" stroke="#353c7c" stroke-width="6"><ellipse cx="163" cy="65" rx="18" ry="14"/><ellipse cx="204" cy="64" rx="16" ry="13"/><path d="M180 65h8" fill="none"/></g>');
 s.push('<ellipse cx="217" cy="86" rx="31" ry="23" fill="#ffb7bf" stroke="#a66076" stroke-width="5"/><ellipse cx="205" cy="87" rx="5" ry="7" fill="#bd6679"/><ellipse cx="228" cy="87" rx="5" ry="7" fill="#bd6679"/><ellipse cx="211" cy="78" rx="18" ry="4" fill="#fff9f78a"/>');
 s.push('<g fill="'+color+'" stroke="#945266" stroke-width="5"><path d="M145 105l-8 29q7 16 26 8l9-31" transform="rotate('+phase+' 148 110)"/><path d="M194 107l23 27q23 8 25-8l-22-28" transform="rotate('+(-phase)+' 209 105)"/></g>');
 if(style==="muscle")s.push('<path d="M72 62Q25 34 20 84q0 33 36 27l21-27" fill="#f09d9b" stroke="#a66071" stroke-width="6"/><path d="M31 82q12 16 30 10" fill="none" stroke="#ffd2c4" stroke-width="6"/>');
 if(style==="punk")s.push('<g fill="#e5429b" stroke="#9b336e" stroke-width="4"><path d="M128 44l-12-49 32 24 6-28 19 27 14-25 14 40z"/></g>');
 if(style==="pilot")s.push('<path d="M130 40q30-46 83-12l-3 18-83 8z" fill="#e9bc5e" stroke="#9e7949" stroke-width="4"/><rect x="145" y="28" width="60" height="15" rx="8" fill="#74deee" stroke="#7a5668" stroke-width="5"/>');
 if(style==="sleep")s.push('<path d="M132 38q28-54 88-11l-41 17z" fill="#5b6bbc" stroke="#f9dcf5" stroke-width="4"/><circle cx="219" cy="25" r="13" fill="#f8f0df"/>');
 if(style==="king"||style==="princess")s.push('<path d="M144 35l-7-34 24 13 18-24 16 24 24-13-7 35z" fill="#ffd54e" stroke="#a97732" stroke-width="5"/><circle cx="179" cy="19" r="7" fill="#f0558b" stroke="#fff4ba" stroke-width="3"/>');
 if(style==="fancy")s.push('<path d="M146 35l8-53h41l6 53z" fill="#523454" stroke="#b88cc3" stroke-width="4"/><ellipse cx="176" cy="35" rx="48" ry="12" fill="#523454"/>');
 if(style==="farmer")s.push('<ellipse cx="168" cy="34" rx="82" ry="16" fill="#e8af5c" stroke="#9e6f3a" stroke-width="4"/><path d="M126 30l9-35h68l11 35" fill="#f6c578" stroke="#9e6f3a" stroke-width="4"/><path d="M137 15h64" stroke="#d26e67" stroke-width="7"/>');
 if(style==="chef")s.push('<path d="M129 33q-20-32 9-41 18-27 40-10 32-19 45 10 25 15 0 41z" fill="#fff9f3" stroke="#cbb3aa" stroke-width="4"/><path d="M129 30h95" stroke="#efe6e7" stroke-width="12"/>');
 if(style==="propeller")s.push('<path d="M176 35V-8" stroke="#7650ae" stroke-width="6"/><path d="M176 -8q-34-29-43-3 17 17 43 3 39 28 42-2-15-16-42 2" fill="#ffdf54" stroke="#ce528b" stroke-width="4"/>');
 if(style==="lightning")s.push('<path d="M125 50l-30-25" stroke="#ffea55" stroke-width="8"/><path d="M113 42l-17-24" stroke="#ffea55" stroke-width="5"/>');
 if(style==="rainbow")s.push('<path d="M125 41Q103 3 73 2" stroke="#f44f99" stroke-width="7" fill="none"/><path d="M117 43Q95 5 60 7" stroke="#fbc843" stroke-width="7" fill="none"/><path d="M111 45Q88 12 50 14" stroke="#66cc95" stroke-width="7" fill="none"/>');
 s.push('</svg>');
 return s.join("");
}
function get(p,frame){
 const key=p.id+"-"+(frame%6);
 if(cache.has(key))return cache.get(key);
 const image=new Image();
 image.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg(p,frame||0));
 cache.set(key,image);
 return image;
}
window.PigArt={get,svg,preload:function(){roster.forEach(function(p){get(p,0);});}};
})();