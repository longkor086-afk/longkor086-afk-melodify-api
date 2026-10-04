import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getDatabase, ref, get, set, update, onValue } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const $=id=>document.getElementById(id), today=()=>new Date().toISOString().slice(0,10);
let app,auth,db,workers={},attendance={},qrScanner=null;

function money(n){return Number(n||0).toLocaleString("en-US")+"៛"}
function toast(s){$("toast").textContent=s;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),1800)}
function uid(){return "W"+Date.now().toString(36).toUpperCase()}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function getAtt(wid,date=today()){return attendance[date]?.[wid]||{morning:false,afternoon:false}}
async function write(path,value){await set(ref(db,path),value)}

try{
 if(firebaseConfig.apiKey==="YOUR_API_KEY") throw new Error("Firebase config មិនទាន់បានដាក់");
 app=initializeApp(firebaseConfig);auth=getAuth(app);db=getDatabase(app);
 onAuthStateChanged(auth,user=>{if(user){$("loginScreen").classList.add("hidden");$("app").classList.remove("hidden");$("userLabel").textContent=user.email;listen()}else{$("app").classList.add("hidden");$("loginScreen").classList.remove("hidden")}});
}catch(e){$("loginMsg").textContent="⚠️ សូមដាក់ Firebase config ក្នុង firebase-config.js មុន";}

$("loginBtn").onclick=async()=>{try{await signInWithEmailAndPassword(auth,$("loginEmail").value,$("loginPassword").value)}catch(e){$("loginMsg").textContent="ចូលមិនបាន: "+e.message}}
$("registerBtn").onclick=async()=>{try{await createUserWithEmailAndPassword(auth,$("loginEmail").value,$("loginPassword").value);toast("បានបង្កើត Admin Account ✅")}catch(e){$("loginMsg").textContent="បង្កើតមិនបាន: "+e.message}}
$("logoutBtn").onclick=()=>signOut(auth);

function listen(){
 onValue(ref(db,"workers"),s=>{workers=s.val()||{};renderAll()});
 onValue(ref(db,"attendance"),s=>{attendance=s.val()||{};renderAll()});
}

document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.tab).classList.add("active");renderAll()});

function openWorker(w=null){$("workerId").value=w?.id||"";$("workerName").value=w?.name||"";$("workerPhone").value=w?.phone||"";$("workerJob").value=w?.job||"";$("workerRate").value=w?.rate??60000;$("workerSite").value=w?.site||"";$("workerDialog").showModal()}
$("addWorkerBtn").onclick=()=>openWorker();$("addWorkerBtn2").onclick=()=>openWorker();$("cancelWorker").onclick=()=>$("workerDialog").close();
$("workerForm").onsubmit=async e=>{e.preventDefault();const id=$("workerId").value||uid();await write("workers/"+id,{id,name:$("workerName").value.trim(),phone:$("workerPhone").value.trim(),job:$("workerJob").value.trim(),rate:Number($("workerRate").value||0),site:$("workerSite").value.trim()});$("workerDialog").close();toast("បានរក្សាទុកលើ Cloud ✅")};

function renderDashboard(){let arr=Object.values(workers),present=0,pay=0;let html="";arr.forEach(w=>{let a=getAtt(w.id),u=(a.morning?.5:0)+(a.afternoon?.5:0);if(u)present++;pay+=u*(w.rate||0);html+=`<div class="list-item"><div><b>${esc(w.name)}</b><div class="muted">${a.morning?"🌅 ព្រឹក":"—"} · ${a.afternoon?"🌇 រសៀល":"—"}</div></div><b>${money(u*w.rate)}</b></div>`});$("totalWorkers").textContent=arr.length;$("presentToday").textContent=present;$("absentToday").textContent=Math.max(0,arr.length-present);$("todayPay").textContent=money(pay);$("todayList").innerHTML=html||`<div class="worker-card">មិនទាន់មានកម្មករ។</div>`}
function renderWorkers(){let q=($("workerSearch").value||"").toLowerCase();$("workerList").innerHTML=Object.values(workers).filter(w=>(w.name+" "+w.phone).toLowerCase().includes(q)).map(w=>`<div class="worker-card" onclick='openWorker(${JSON.stringify(w)})'><h3>👷 ${esc(w.name)}</h3><div class="muted">📱 ${esc(w.phone||"មិនទាន់មាន")}</div><div class="muted">🛠️ ${esc(w.job||"-")} · 📍 ${esc(w.site||"-")}</div><p><span class="badge">${money(w.rate)}/ថ្ងៃ</span></p><small>QR: <b>${w.id}</b></small></div>`).join("")||`<div class="worker-card">រកមិនឃើញ</div>`}
$("workerSearch").oninput=renderWorkers;

function renderAttendance(){let d=$("attendanceDate").value||today();$("attendanceDate").value=d;$("attendanceTable").innerHTML=Object.values(workers).map(w=>{let a=getAtt(w.id,d),u=(a.morning?.5:0)+(a.afternoon?.5:0),st=u===1?"ពេញថ្ងៃ":u===.5?"កន្លះថ្ងៃ":"អវត្តមាន",cl=u===1?"ok":u===.5?"half":"bad";return `<tr><td><b>${esc(w.name)}</b><br><small>${w.id}</small></td><td>${a.morning?"✅":"—"}</td><td>${a.afternoon?"✅":"—"}</td><td class="${cl}">${st}</td><td>${money(u*w.rate)}</td><td><button onclick="editAtt('${w.id}','${d}')">✏️</button></td></tr>`}).join("")}
$("attendanceDate").value=today();$("attendanceDate").onchange=renderAttendance;
window.editAtt=(wid,date)=>{let a=getAtt(wid,date);$("editAttendanceWorker").value=wid;$("editAttendanceDate").value=date;$("editMorning").checked=a.morning;$("editAfternoon").checked=a.afternoon;$("editAttendanceDialog").showModal()}
$("cancelAttendance").onclick=()=>$("editAttendanceDialog").close();
$("attendanceForm").onsubmit=async e=>{e.preventDefault();await write(`attendance/${$("editAttendanceDate").value}/${$("editAttendanceWorker").value}`,{morning:$("editMorning").checked,afternoon:$("editAfternoon").checked});$("editAttendanceDialog").close();toast("បានកែវត្តមាន ✅")};

function renderPayroll(){let now=new Date(),y=now.getFullYear(),m=now.getMonth(),period=$("payPeriod").value,start=period==="1"?1:16,end=period==="1"?15:new Date(y,m+1,0).getDate();$("payrollList").innerHTML=Object.values(workers).map(w=>{let units=0;for(let day=start;day<=end;day++){let d=new Date(y,m,day).toISOString().slice(0,10),a=getAtt(w.id,d);units+=(a.morning?.5:0)+(a.afternoon?.5:0)}return `<div class="list-item"><div><b>${esc(w.name)}</b><div class="muted">${units} ថ្ងៃ · ${money(w.rate)}/ថ្ងៃ</div></div><b>${money(units*w.rate)}</b></div>`}).join("")||`<div class="worker-card">មិនទាន់មានទិន្នន័យ</div>`}
$("payPeriod").onchange=renderPayroll;

async function record(id){let w=workers[id];if(!w)return toast("រកមិនឃើញ Worker ID ❌");let d=today(),a=getAtt(id,d),shift=$("qrShift").value;if(shift==="morning")a.morning=true;else a.afternoon=true;await write(`attendance/${d}/${id}`,a);toast(`${w.name} ${shift==="morning"?"ព្រឹក":"រសៀល"} ✅`);$("qrDialog").close();stopScanner()}
function stopScanner(){if(qrScanner){qrScanner.stop().catch(()=>{});qrScanner.clear();qrScanner=null}}
$("scanBtn").onclick=()=>{$("qrDialog").showModal();setTimeout(startScanner,150)};
$("closeQr").onclick=()=>{$("qrDialog").close();stopScanner()};
$("manualRecord").onclick=()=>record($("qrInput").value.trim());
async function startScanner(){if(!window.Html5Qrcode)return;qrScanner=new Html5Qrcode("reader");try{await qrScanner.start({facingMode:"environment"},{fps:10,qrbox:{width:220,height:220}},text=>{if(workers[text])record(text);else toast("QR នេះមិនមែនជា Worker ID ❌")},()=>{});}catch(e){$("qrStatus").textContent="មិនអាចបើកកាមេរ៉ា។ សូមប្រើ HTTPS/GitHub Pages និងអនុញ្ញាត Camera។"}}

function renderAll(){if(!auth?.currentUser)return;renderDashboard();renderWorkers();renderAttendance();renderPayroll()}
