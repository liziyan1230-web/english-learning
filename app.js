const STORAGE_KEY = "wordloom.v1";
const todayKey = () => new Date().toISOString().slice(0, 10);
const dayKey = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };
const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[char]));

const starterWords = [
  ["coherent","/kəʊˈhɪərənt/","adj. 连贯的；条理清晰的","A coherent argument makes your writing easier to follow.","Academic"],
  ["compelling","/kəmˈpelɪŋ/","adj. 引人注目的；令人信服的","The speaker gave a compelling explanation of the problem.","Speaking"],
  ["allocate","/ˈæləkeɪt/","v. 分配；拨出","Governments should allocate more money to public transport.","Writing"],
  ["deteriorate","/dɪˈtɪəriəreɪt/","v. 恶化；变差","Air quality may deteriorate rapidly in large cities.","Academic"],
  ["inevitable","/ɪnˈevɪtəbl/","adj. 不可避免的","Some changes are inevitable as technology develops.","Reading"],
  ["sustainable","/səˈsteɪnəbl/","adj. 可持续的","We need a sustainable approach to urban growth.","Writing"],
  ["exacerbate","/ɪɡˈzæsəbeɪt/","v. 加剧；使恶化","Traffic congestion can exacerbate noise pollution.","Academic"],
  ["ubiquitous","/juːˈbɪkwɪtəs/","adj. 无处不在的","Smartphones have become ubiquitous in modern life.","Speaking"]
];
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
const defaultData = () => ({
  version: 1,
  settings: { goal: 12, repo: "", branch: "main" },
  words: starterWords.map(([word, phonetic, definition, example, tag]) => ({ id: newId(), word, phonetic, definition, example, tag, level: 0, due: null, reviews: 0, createdAt: todayKey() })),
  history: []
});
let data;
try { data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData(); } catch { data = defaultData(); }
if (!data.words || !data.settings || !data.history) data = defaultData();
let currentWordId = null;
let editingId = null;

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); render(); }
function dueWords() { return data.words.filter(w => w.due && w.due <= todayKey()); }
function todayEvents() { return data.history.filter(h => h.date === todayKey()).length; }
function todayWordIds() { return new Set(data.history.filter(h => h.date === todayKey()).map(h => h.wordId)); }
function mastered() { return data.words.filter(w => w.level >= 4).length; }
function streak() {
  const days = new Set(data.history.map(h => h.date)); let count = 0; let cursor = new Date();
  if (!days.has(todayKey())) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toISOString().slice(0, 10))) { count++; cursor.setDate(cursor.getDate() - 1); }
  return count;
}
function nextWord() {
  const due = dueWords();
  const unseen = data.words.filter(w => !w.reviews);
  const pool = due.length ? due : (unseen.length ? unseen : data.words);
  if (!pool.length) return null;
  const currentIndex = pool.findIndex(w => w.id === currentWordId);
  return pool[(currentIndex + 1 + pool.length) % pool.length];
}
function currentWord() { return data.words.find(w => w.id === currentWordId) || nextWord(); }
function formatDate(value) { if (!value) return "尚未学习"; if (value === todayKey()) return "今天"; if (value === dayKey(1)) return "明天"; return value.slice(5).replace("-", "/"); }

function renderNav() {
  const due = dueWords().length;
  document.querySelector("#navDue").classList.toggle("show", due > 0);
  document.querySelector("#streakCount").textContent = streak();
}
function renderLearn() {
  const done = todayEvents(), goal = data.settings.goal;
  document.querySelector("#todayDone").textContent = done;
  document.querySelector("#todayGoal").textContent = goal;
  document.querySelector("#dailyProgressBar").style.width = `${Math.min(100, done / goal * 100)}%`;
  document.querySelector("#dueCount").textContent = dueWords().length;
  document.querySelector("#masteredCount").textContent = mastered();
  document.querySelector("#reviewHint").textContent = dueWords().length ? `有 ${dueWords().length} 个词在等你想起它们。` : "今天的复习队列已经很轻盈。";
  document.querySelector("#dailyPrompt").textContent = done >= goal ? "今日目标已完成，真棒。再走一步也不错。" : `离今天的目标还差 ${Math.max(0, goal - done)} 次回忆。`;
  const word = currentWord();
  const card = document.querySelector("#wordCard");
  if (!word) { card.innerHTML = "<p>词库还是空的，先添加一个单词吧。</p>"; return; }
  currentWordId = word.id;
  document.querySelector("#wordTag").textContent = word.tag || "Academic";
  document.querySelector("#wordText").textContent = word.word;
  document.querySelector("#phonetic").textContent = word.phonetic || "";
  document.querySelector("#definition").textContent = word.definition;
  document.querySelector("#example").textContent = word.example;
  card.classList.add("hidden-answer");
  document.querySelector("#revealButton").hidden = false;
  document.querySelector("#recallActions").hidden = true;
  const recent = [...data.words].sort((a,b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 3);
  document.querySelector("#recentWords").innerHTML = recent.map(w => `<article><strong>${escapeHtml(w.word)}</strong><span>${escapeHtml(w.definition)}</span></article>`).join("") || "<p class='muted'>还没有添加单词。</p>";
}
function renderReview() {
  const due = dueWords();
  document.querySelector("#reviewDueBig").textContent = due.length;
  document.querySelector("#reviewEmpty").hidden = due.length > 0;
  document.querySelector("#reviewQueue").hidden = due.length === 0;
  document.querySelector("#startReview").disabled = due.length === 0;
  const queue = document.querySelector("#reviewQueue");
  queue.innerHTML = due.map(w => `<article class="review-item"><strong>${escapeHtml(w.word)}</strong><p>${escapeHtml(w.definition)}</p><div class="grade-buttons"><button data-review-id="${w.id}" data-grade="0" class="grade again">忘了 <small>1天后</small></button><button data-review-id="${w.id}" data-grade="1" class="grade hard">有点难 <small>3天后</small></button><button data-review-id="${w.id}" data-grade="2" class="grade good">记得 <small>7天后</small></button><button data-review-id="${w.id}" data-grade="3" class="grade easy">很轻松 <small>14天后</small></button></div></article>`).join("");
}
function renderWords() {
  const term = document.querySelector("#wordSearch").value.trim().toLowerCase();
  const filter = document.querySelector("#wordFilter").value;
  let list = data.words.filter(w => `${w.word} ${w.definition}`.toLowerCase().includes(term));
  if (filter === "due") list = list.filter(w => w.due && w.due <= todayKey());
  if (filter === "mastered") list = list.filter(w => w.level >= 4);
  if (filter === "new") list = list.filter(w => !w.reviews);
  document.querySelector("#wordTable").innerHTML = list.map(w => `<tr><td><strong>${escapeHtml(w.word)}</strong><br><span class="muted">${escapeHtml(w.phonetic || "—")}</span></td><td>${escapeHtml(w.definition)}</td><td class="level-dots">${"●".repeat(Math.min(5,w.level))}${"○".repeat(Math.max(0,5-w.level))}</td><td>${formatDate(w.due)}</td><td><button class="row-edit" data-edit="${w.id}">编辑</button></td></tr>`).join("") || "<tr><td colspan='5' class='muted'>没有匹配的单词。</td></tr>";
}
function renderStats() {
  document.querySelector("#totalWordsStat").textContent = data.words.length;
  document.querySelector("#todayStat").textContent = todayEvents();
  document.querySelector("#reviewsStat").textContent = data.history.length;
  document.querySelector("#goalRange").value = data.settings.goal;
  document.querySelector("#goalValue").textContent = data.settings.goal;
  const labels = ["日","一","二","三","四","五","六"];
  const days = Array.from({length:7}, (_,i) => dayKey(i - 6));
  const values = days.map(date => data.history.filter(h => h.date === date).length);
  const ceiling = Math.max(data.settings.goal, ...values, 1);
  document.querySelector("#weekChart").innerHTML = days.map((date,i) => `<div class="chart-column ${date === todayKey() ? "today" : ""}"><span>${values[i] || ""}</span><div class="chart-bar-wrap"><div class="chart-bar" style="height:${Math.max(3,values[i]/ceiling*100)}%"></div></div><b>${date === todayKey() ? "今" : labels[new Date(date + "T00:00:00").getDay()]}</b></div>`).join("");
}
function renderSync() {
  document.querySelector("#repoInput").value = data.settings.repo || "";
  document.querySelector("#branchInput").value = data.settings.branch || "main";
}
function render() { renderNav(); renderLearn(); renderReview(); renderWords(); renderStats(); renderSync(); }

function gradeWord(id, grade) {
  const word = data.words.find(w => w.id === id); if (!word) return;
  const gaps = [1,3,7,14];
  word.level = Math.max(0, Math.min(5, word.level + (grade === 0 ? -1 : grade === 1 ? 0 : grade === 2 ? 1 : 2)));
  word.due = dayKey(gaps[grade]); word.reviews = (word.reviews || 0) + 1;
  data.history.push({ wordId:id, date:todayKey(), grade:Number(grade) });
  currentWordId = null; save();
}
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === id));
  document.querySelectorAll(".nav-item").forEach(p => p.classList.toggle("active", p.dataset.nav === id));
  window.scrollTo({top:0,behavior:"smooth"});
}
function openWordDialog(id = null) {
  editingId = id; const form = document.querySelector("#wordForm"); const remove = document.querySelector("#deleteWord");
  form.reset(); remove.hidden = !id;
  if (id) { const w = data.words.find(x => x.id === id); for (const key of ["word","phonetic","definition","example","tag"]) form.elements[key].value = w[key] || ""; }
  document.querySelector("#wordDialog").showModal();
}
function encodeContent(payload) { return btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2)))); }
function decodeContent(content) { return JSON.parse(decodeURIComponent(escape(atob(content.replace(/\n/g, ""))))); }
function githubConfig() {
  const repo = document.querySelector("#repoInput").value.trim(); const branch = document.querySelector("#branchInput").value.trim(); const token = document.querySelector("#tokenInput").value.trim();
  if (!/^[-\w.]+\/[-\w.]+$/.test(repo) || !branch || !token) throw new Error("请填写仓库、分支和 GitHub 令牌。");
  data.settings.repo = repo; data.settings.branch = branch; localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return {repo,branch,token};
}
function setSyncStatus(message, isError=false) { const el = document.querySelector("#syncStatus"); el.textContent = message; el.classList.toggle("error",isError); }
async function githubRequest(url, token, options={}) {
  const response = await fetch(url, { ...options, headers: {Accept:"application/vnd.github+json", Authorization:`Bearer ${token}`, "X-GitHub-Api-Version":"2022-11-28", ...(options.headers || {})} });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.message || `GitHub 请求失败（${response.status}）`); }
  return response.status === 204 ? null : response.json();
}
async function uploadGithub() {
  try { const {repo,branch,token} = githubConfig(); setSyncStatus("正在连接 GitHub…"); const path = "wordloom-data.json"; let sha;
    try { const existing = await githubRequest(`https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,token); sha = existing.sha; } catch (e) { if (!String(e.message).includes("Not Found")) throw e; }
    const body = {message: sha ? "Update Wordloom learning data" : "Create Wordloom learning data", content:encodeContent(data), branch, ...(sha ? {sha} : {})};
    await githubRequest(`https://api.github.com/repos/${repo}/contents/${path}`,token,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    setSyncStatus("同步成功。你的学习记录已保存到 GitHub。 ");
  } catch(e) { setSyncStatus(e.message, true); }
}
async function pullGithub() {
  try { const {repo,branch,token} = githubConfig(); if (!confirm("这会用 GitHub 上的备份替换当前本机数据。建议先导出备份。继续吗？")) return; setSyncStatus("正在从 GitHub 下载…");
    const remote = await githubRequest(`https://api.github.com/repos/${repo}/contents/wordloom-data.json?ref=${encodeURIComponent(branch)}`,token);
    const incoming = decodeContent(remote.content); if (!incoming.words || !incoming.settings || !incoming.history) throw new Error("GitHub 上的数据文件格式不正确。");
    incoming.settings.repo = repo; incoming.settings.branch = branch; data = incoming; currentWordId = null; localStorage.setItem(STORAGE_KEY,JSON.stringify(data)); render(); setSyncStatus("下载成功。本机已更新为 GitHub 上的记录。");
  } catch(e) { setSyncStatus(e.message,true); }
}

document.addEventListener("click", event => {
  const nav = event.target.closest("[data-nav]"); if (nav) showPage(nav.dataset.nav);
  if (event.target.closest("#shuffleButton")) { currentWordId = nextWord()?.id || null; renderLearn(); }
  if (event.target.closest("#revealButton")) { document.querySelector("#wordCard").classList.remove("hidden-answer"); document.querySelector("#recallActions").hidden = false; }
  if (event.target.closest("#speakButton")) { const word=currentWord(); if (word && "speechSynthesis" in window) { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(word.word)); } }
  const grade = event.target.closest("[data-grade]"); if (grade) gradeWord(grade.dataset.reviewId || currentWordId, Number(grade.dataset.grade));
  if (event.target.closest("#startReview")) showPage("review");
  if (event.target.closest("#addWordButton")) openWordDialog();
  const edit = event.target.closest("[data-edit]"); if (edit) openWordDialog(edit.dataset.edit);
  if (event.target.closest("#closeDialog")) document.querySelector("#wordDialog").close();
  if (event.target.closest("#deleteWord") && editingId) { if (confirm("删除这个单词吗？")) { data.words = data.words.filter(w=>w.id !== editingId); data.history=data.history.filter(h=>h.wordId !== editingId); document.querySelector("#wordDialog").close(); save(); } }
  if (event.target.closest("#exportButton")) { const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`wordloom-backup-${todayKey()}.json`; a.click(); URL.revokeObjectURL(a.href); }
});
document.querySelector("#wordSearch").addEventListener("input",renderWords);
document.querySelector("#wordFilter").addEventListener("change",renderWords);
document.querySelector("#goalRange").addEventListener("input",e=>{data.settings.goal=Number(e.target.value); localStorage.setItem(STORAGE_KEY,JSON.stringify(data)); renderStats(); renderLearn();});
document.querySelector("#wordForm").addEventListener("submit",event=>{event.preventDefault();const form=new FormData(event.target);const item=Object.fromEntries(form.entries());if(editingId){Object.assign(data.words.find(w=>w.id===editingId),item);}else{data.words.unshift({id:newId(),...item,level:0,due:null,reviews:0,createdAt:todayKey()});}document.querySelector("#wordDialog").close();save();});
document.querySelector("#githubForm").addEventListener("submit",event=>{event.preventDefault();uploadGithub();});
document.querySelector("#pullButton").addEventListener("click",pullGithub);
document.querySelector("#importInput").addEventListener("change",async event=>{const file=event.target.files[0];if(!file)return;try{const incoming=JSON.parse(await file.text());if(!incoming.words||!incoming.settings||!incoming.history)throw new Error();if(!confirm("这会替换当前本机数据。继续吗？"))return;data=incoming;currentWordId=null;save();setSyncStatus("导入成功。",false);}catch{setSyncStatus("无法导入：请选择有效的 Wordloom 备份文件。",true);}event.target.value="";});
render();

