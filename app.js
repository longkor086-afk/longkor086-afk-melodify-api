const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
let workers=JSON.parse(localStorage.getItem("wm_workers")||"[]");
let attendance=JSON.parse(localStorage.getItem("wm_attendance")||"{}");

function save(){localStorage.setItem("wm_workers",JSON.stringify(workers));localStorage.setItem("wm_attendance",JSON.stringify(attendance));}
function uid(){return "W"+Date.now().toString(36).toUpperCase();}
function money(n){return Number(n||0).toLocaleString("en-US")+"៛";}
function getAtt(wid,date=today()){return attendance[date]?.[wid]||{morning:false,afternoon:false};}
function setAtt(wid,date,data){attendance[date]??={};attendance[date][wid]=data;save();}
function toast(s){$("toast").textContent=s;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),1800)}

document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.tab).classList.add("active");renderAll()});

function openWorker(w=null){
  $("workerId").value=w?.id||"";
  $("workerName").value=w?.name||"";
  $("workerPhone").value=w?.phone||"";
  $("workerJob").value=w?.job||"";
  $("workerRate").value=w?.rate??60000;
  $("workerSite").value=w?.site||"";
  $("workerDialog").showModal();
}
$("addWorkerBtn").onclick=()=>openWorker();$("addWorkerBtn2").onclick=()=>openWorker();
$("cancelWorker").onclick=()=>$("workerDialog").close();

$("workerForm").onsubmit=e=>{
 e.preventDefault();
 const id=$("workerId").value||uid();
 const item={id,name:$("workerName").value.trim(),phone:$("workerPhone").value.trim(),job:$("workerJob").value.trim(),rate:Number($("workerRate").value||0),site:$("workerSite").value.trim()};
 const old=workers.findIndex(w=>w.id===id);
 if(old>=0)workers[old]=item;else workers.push(item);
 save();$("workerDialog").close();renderAll();toast("បានរក្សាទុកកម្មករ ✅");
};

function workerCard(w){
 const a=getAtt(w.id), units=(a.morning?0.5:0)+(a.afternoon?0.5:0);
 return `<div class="worker-card" onclick='openWorker(${JSON.stringify(w)})'><h3>👷 ${esc(w.name)}</h3><div class="muted">📱 ${esc(w.phone||"មិនទាន់មាន")}</div><div class="muted">🛠️ ${esc(w.job||"មិនបានកំណត់")} · 📍 ${esc(w.site||"-")}</div><p><span class="badge">${money(w.rate)}/ថ្ងៃ</span> <span class="badge">${units===1?"ថ្ងៃពេញ":units===.5?"កន្លះថ្ងៃ":"ថ្ងៃនេះមិនទាន់មក"}</span></p><small>QR: <b>${w.id}</b></small></div>`;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

function renderDashboard(){
 let present=0,pay=0;const list=[];
 workers.forEach(w=>{const a=getAtt(w.id),u=(a.morning?0.5:0)+(a.afternoon?0.5:0);if(u>0)present++;pay+=u*w.rate;list.push(`<div class="list-item"><div><b>${esc(w.name)}</b><div class="muted">${a.morning?"🌅 ព្រឹក":"—"} · ${a.afternoon?"🌇 រសៀល":"—"}</div></div><b>${money(u*w.rate)}</b></div>`)});
 $("totalWorkers").textContent=workers.length;$("presentToday").textContent=present;$("absentToday").textContent=Math.max(0,workers.length-present);$("todayPay").textContent=money(pay);$("todayList").innerHTML=list.join("")||`<div class="worker-card">មិនទាន់មានកម្មករ។ ចុច “បន្ថែមកម្មករ” ដើម្បីចាប់ផ្តើម។</div>`;
}
function renderWorkers(){
 const q=($("workerSearch").value||"").toLowerCase();
 $("workerList").innerHTML=workers.filter(w=>(w.name+" "+w.phone).toLowerCase().includes(q)).map(workerCard).join("")||`<div class="worker-card">រកមិនឃើញកម្មករ</div>`;
}
$("workerSearch").oninput=renderWorkers;

function renderAttendance(){
 const d=$("attendanceDate").value||today();$("attendanceDate").value=d;
 $("attendanceTable").innerHTML=workers.map(w=>{const a=getAtt(w.id,d),u=(a.morning?.5:0)+(a.afternoon?.5:0),status=u===1?"ពេញថ្ងៃ":u===.5?"កន្លះថ្ងៃ":"អវត្តមាន",cls=u===1?"ok":u===.5?"half":"bad";
 return `<tr><td><b>${esc(w.name)}</b><br><small>${w.id}</small></td><td>${a.morning?"✅":"—"}</td><td>${a.afternoon?"✅":"—"}</td><td class="${cls}">${status}</td><td>${money(u*w.rate)}</td><td><button onclick="editAtt('${w.id}','${d}')">✏️</button></td></tr>`}).join("");
}
$("attendanceDate").value=today();$("attendanceDate").onchange=renderAttendance;

function editAtt(wid,date){const a=getAtt(wid,date);$("editAttendanceWorker").value=wid;$("editAttendanceDate").value=date;$("editMorning").checked=a.morning;$("editAfternoon").checked=a.afternoon;$("editAttendanceDialog").showModal()}
$("cancelAttendance").onclick=()=>$("editAttendanceDialog").close();
$("attendanceForm").onsubmit=e=>{e.preventDefault();setAtt($("editAttendanceWorker").value,$("editAttendanceDate").value,{morning:$("editMorning").checked,afternoon:$("editAfternoon").checked});$("editAttendanceDialog").close();renderAll();toast("បានកែវត្តមាន ✅")};

function renderPayroll(){
 const period=$("payPeriod").value,now=new Date(),y=now.getFullYear(),m=now.getMonth(),start=period==="1"?1:16,end=period==="1"?15:new Date(y,m+1,0).getDate();
 const rows=workers.map(w=>{let units=0;for(let day=start;day<=end;day++){const d=new Date(y,m,day).toISOString().slice(0,10),a=getAtt(w.id,d);units+=(a.morning?.5:0)+(a.afternoon?.5:0)}return `<div class="list-item"><div><b>${esc(w.name)}</b><div class="muted">${units} ថ្ងៃ · ${money(w.rate)}/ថ្ងៃ</div></div><b>${money(units*w.rate)}</b></div>`});
 $("payrollList").innerHTML=rows.join("")||`<div class="worker-card">មិនទាន់មានទិន្នន័យ</div>`;
}
$("payPeriod").onchange=renderPayroll;

$("scanBtn").onclick=()=>{$("qrInput").value="";$("qrWorkerSelect").innerHTML=workers.map(w=>`<option value="${w.id}">${esc(w.name)} (${w.id})</option>`).join("");$("qrDialog").showModal()};
$("closeQr").onclick=()=>$("qrDialog").close();
$("qrWorkerSelect").onchange=()=>{$("qrInput").value=$("qrWorkerSelect").value};
$("recordQr").onclick=()=>{
 const id=$("qrInput").value.trim(),w=workers.find(x=>x.id===id);if(!w)return toast("រកមិនឃើញ Worker ID ❌");
 const a=getAtt(id);const shift=$("qrShift").value;if(shift==="morning")a.morning=true;else a.afternoon=true;setAtt(id,today(),a);$("qrDialog").close();renderAll();toast(`បានកត់ ${w.name} ${shift==="morning"?"ព្រឹក":"រសៀល"} ✅`);
};

function renderAll(){renderDashboard();renderWorkers();renderAttendance();renderPayroll()}
renderAll();
