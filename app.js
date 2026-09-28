const $ = id => document.getElementById(id);
const fields = ["employeeName","department","requestDate","email","fromDate","toDate","leaveType","notes"];
const stateKey = "richiesta-assenza-v1";

const modal = $("signatureModal");
const canvas = $("signaturePad");
const ctx = canvas.getContext("2d");
let drawing = false;
let hasSignature = false;
let pendingAction = null;

function today(){ return new Date().toISOString().slice(0,10); }

function save(){
  const data = {};
  fields.forEach(id => data[id] = $(id).value);
  localStorage.setItem(stateKey, JSON.stringify(data));
  updateSummary();
}

function load(){
  let data = {};
  try { data = JSON.parse(localStorage.getItem(stateKey) || "{}"); } catch {}
  fields.forEach(id => { if(data[id] !== undefined) $(id).value = data[id]; });
  if(!$("requestDate").value) $("requestDate").value = today();
  updateSummary();
}

function fmt(v){
  if(!v) return "—";
  const [y,m,d] = v.split("-");
  return `${d}/${m}/${y}`;
}

function updateSummary(){
  $("periodSummary").textContent = $("fromDate").value
    ? `${fmt($("fromDate").value)} → ${fmt($("toDate").value)}`
    : "—";
  $("typeSummary").textContent = $("leaveType").value;
}

fields.forEach(id => ["input","change"].forEach(ev => $(id).addEventListener(ev, save)));

$("resetBtn").onclick = () => {
  if(confirm("Cancellare i dati del modulo?")){
    localStorage.removeItem(stateKey);
    location.reload();
  }
};

function validate(){
  for(const id of ["employeeName","fromDate","toDate"]){
    if(!$(id).value){
      $("status").textContent = "Compila nome, data iniziale e data finale.";
      $(id).focus();
      return false;
    }
  }
  if($("toDate").value < $("fromDate").value){
    $("status").textContent = "La data finale non può precedere quella iniziale.";
    return false;
  }
  return true;
}

function resizeCanvas(){
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  const rect = canvas.getBoundingClientRect();
  const old = canvas.width ? canvas.toDataURL() : null;
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  ctx.setTransform(ratio,0,0,ratio,0,0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = "#111827";
  hasSignature = false;
  if(old){
    const img = new Image();
    img.onload = () => ctx.drawImage(img,0,0,rect.width,rect.height);
    img.src = old;
    hasSignature = true;
  }
}

function pointFromEvent(event){
  const rect = canvas.getBoundingClientRect();
  return { x:event.clientX - rect.left, y:event.clientY - rect.top };
}

function startDrawing(event){
  event.preventDefault();
  drawing = true;
  hasSignature = true;
  const p = pointFromEvent(event);
  ctx.beginPath();
  ctx.moveTo(p.x,p.y);
}

function draw(event){
  if(!drawing) return;
  event.preventDefault();
  const p = pointFromEvent(event);
  ctx.lineTo(p.x,p.y);
  ctx.stroke();
}

function stopDrawing(event){
  if(!drawing) return;
  event.preventDefault();
  drawing = false;
  ctx.closePath();
}

function clearSignature(){
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0,0,rect.width,rect.height);
  hasSignature = false;
}

function openSignature(action){
  if(!validate()) return;
  pendingAction = action;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  requestAnimationFrame(resizeCanvas);
}

function closeSignature(){
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  pendingAction = null;
}

canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
canvas.addEventListener("pointerleave", stopDrawing);

$("clearSignatureBtn").onclick = clearSignature;
$("closeSignatureBtn").onclick = closeSignature;
document.querySelector("[data-close-signature]").onclick = closeSignature;
window.addEventListener("resize", () => {
  if(!modal.hidden) resizeCanvas();
});

function createPdfBlob(){
  if(!validate()) return null;
  if(!hasSignature){
    $("status").textContent = "Inserisci la firma prima di creare il PDF.";
    return null;
  }

  if(!window.jspdf?.jsPDF){
    $("status").textContent = "Libreria PDF non disponibile. Controlla la connessione e riprova.";
    return null;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:"mm", format:"a4"});
  const signatureData = canvas.toDataURL("image/png");
  const signatureName = `richiesta-assenza-${$("fromDate").value || today()}.pdf`;

  doc.setProperties({
    title:"Richiesta di assenza",
    author:"requestVacation",
    creator:"requestVacation"
  });

  doc.setFillColor(17,24,39);
  doc.rect(0,0,210,30,"F");
  doc.setTextColor(255,255,255);
  doc.setFontSize(20);
  doc.setFont("helvetica","bold");
  doc.text("RICHIESTA DI ASSENZA",18,19);

  doc.setTextColor(17,24,39);
  let y = 47;
  const line = (label,value) => {
    doc.setFontSize(10);
    doc.setFont("helvetica","bold");
    doc.text(label,18,y);
    doc.setFont("helvetica","normal");
    doc.text(value || "—",65,y,{maxWidth:125});
    y += 10;
  };

  line("Nome e cognome", $("employeeName").value);
  line("Reparto / mansione", $("department").value);
  line("Data richiesta", fmt($("requestDate").value));
  line("Email", $("email").value);

  y += 6;
  doc.setFont("helvetica","bold");
  doc.setFontSize(13);
  doc.text("ASSENZA RICHIESTA",18,y);
  y += 10;

  line("Dal", fmt($("fromDate").value));
  line("Al", fmt($("toDate").value));
  line("Tipo", $("leaveType").value);
  line("Note", $("notes").value);

  y += 16;
  doc.setFont("helvetica","normal");
  doc.setFontSize(11);
  doc.text("Il/La sottoscritto/a richiede l'autorizzazione all'assenza indicata.",18,y,{maxWidth:174});

  y += 25;
  doc.setFont("helvetica","bold");
  doc.setFontSize(10);
  doc.text("FIRMA DIPENDENTE",22,y);
  doc.text("FIRMA / APPROVAZIONE AZIENDA",122,y);

  doc.setDrawColor(148,163,184);
  doc.line(22,y+28,88,y+28);
  doc.line(122,y+28,188,y+28);

  doc.addImage(signatureData,"PNG",25,y+3,60,22);

  return {
    blob: doc.output("blob"),
    filename: signatureName
  };
}

async function sharePdf(){
  const result = createPdfBlob();
  if(!result) return;

  const file = new File([result.blob], result.filename, {type:"application/pdf", lastModified:Date.now()});
  const shareData = {
    title:"Richiesta di assenza",
    text:`Richiesta di ${$("leaveType").value.toLowerCase()} dal ${fmt($("fromDate").value)} al ${fmt($("toDate").value)}.`,
    files:[file]
  };

  if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
    try{
      await navigator.share(shareData);
      $("status").textContent = "PDF condiviso.";
      return;
    }catch(error){
      if(error?.name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(result.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  const subject = encodeURIComponent(`Richiesta ${$("leaveType").value} - ${fmt($("fromDate").value)} / ${fmt($("toDate").value)}`);
  const body = encodeURIComponent(`Buongiorno,\n\nallego la richiesta di ${$("leaveType").value.toLowerCase()} dal ${fmt($("fromDate").value)} al ${fmt($("toDate").value)}.\n\nCordiali saluti,\n${$("employeeName").value}`);
  location.href = `mailto:${encodeURIComponent($("email").value || "")}?subject=${subject}&body=${body}`;
  $("status").textContent = "PDF generato. Se la condivisione file non è disponibile, allegalo manualmente alla mail.";
}

$("pdfBtn").onclick = () => openSignature("download");
$("mailBtn").onclick = () => openSignature("share");

$("confirmSignatureBtn").onclick = async () => {
  if(!hasSignature){
    $("status").textContent = "Inserisci la firma prima di continuare.";
    return;
  }
  const action = pendingAction;
  closeSignature();

  if(action === "download"){
    const result = createPdfBlob();
    if(!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $("status").textContent = `PDF generato: ${result.filename}`;
  }else{
    await sharePdf();
  }
};

if("serviceWorker" in navigator){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

load();