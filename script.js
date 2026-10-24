// ===== Mandate: a control layer between the user and their AI agent =====

// ---------- 1. DATA: the things Aria (the AI agent) wants to do today ----------
var actions = [
  { title: "Pay electricity bill", category: "bills", amount: 1840, undoHours: 0, confidence: 0.97, conflict: "", alternative: "", reasons: ["Due in 2 days", "Same amount as the last 6 months"] },
  { title: "Reschedule Thursday dentist visit", category: "calendar", amount: 0, undoHours: 48, confidence: 0.92, conflict: "", alternative: "", reasons: ["It clashes with your flight", "Next free slot is Friday"] },
  { title: "Book cab to airport", category: "travel", amount: 620, undoHours: 24, confidence: 0.93, conflict: "", alternative: "", reasons: ["Flight is at 07:10", "You usually leave 3 hours early"] },
  { title: "Move 30% of portfolio into Nova Growth Fund", category: "money", amount: 360000, undoHours: 0, confidence: 0.91, conflict: "Nova pays Aria's platform a 1.2% placement commission", alternative: "Stay put (matches your rule: no sector fund above 10%) or split across 3 funds with no commission", reasons: ["Goal: retire by 2045 with balanced risk", "You read market news 6 times this week", "Nova returned 18% last quarter"] },
  { title: "Reorder weekly groceries", category: "shopping", amount: 2300, undoHours: 6, confidence: 0.88, conflict: "", alternative: "", reasons: ["Same basket as last week", "Milk and rice are running low"] },
  { title: "Renew annual streaming plan", category: "subscription", amount: 4999, undoHours: 0, confidence: 0.84, conflict: "Plan was shown through a sponsored placement", alternative: "Monthly plan: no commitment but costs more per month", reasons: ["Current plan ends Friday", "You watched 3 hours this month"] },
  { title: "Accept landlord's 8% rent increase by email", category: "comms", amount: 14000, undoHours: 0, confidence: 0.72, conflict: "", alternative: "Counter-offer at 4% using local rent data", reasons: ["Landlord's deadline is tomorrow", "Aria found no comparable rents"] },
  { title: "Buy flight to Goa", category: "travel", amount: 9200, undoHours: 4, confidence: 0.9, conflict: "", alternative: "", reasons: ["Matches your calendar block", "Cheapest direct fare today"] },
  { title: "Sell Rs 80,000 of mutual fund units", category: "money", amount: 80000, undoHours: 0, confidence: 0.86, conflict: "", alternative: "", reasons: ["Fund trailed its index for 2 quarters", "Your cash buffer is below target"] },
  { title: "Order new phone", category: "shopping", amount: 54999, undoHours: 48, confidence: 0.89, conflict: "The top result is a sponsored listing", alternative: "Two cheaper phones with similar reviews were ranked lower", reasons: ["Your phone is 3 years old", "Ranked #1 for your usage"] },
  { title: "Negotiate broadband renewal", category: "bills", amount: 8400, undoHours: 0, confidence: 0.9, conflict: "", alternative: "", reasons: ["Contract ends in 10 days", "A rival offers the same speed cheaper"] },
  { title: "Switch health insurance plan", category: "health", amount: 28000, undoHours: 0, confidence: 0.8, conflict: "The insurer pays Aria a referral fee", alternative: "", reasons: ["Premium is 9% lower", "Two existing conditions have a waiting period"] },
  { title: "Accept team meeting invite", category: "calendar", amount: 0, undoHours: 1, confidence: 0.95, conflict: "", alternative: "", reasons: ["You are free at that time", "Same people as your weekly sync"] },
  { title: "Share health report with employer wellness app", category: "health", amount: 0, undoHours: 0, confidence: 0.7, conflict: "", alternative: "", reasons: ["The wellness app asked for it", "Possible insurance discount"] }
];

// how risky each type of task is (0 = harmless, 3 = serious)
var categoryWeight = { bills: 1, calendar: 0, travel: 1, shopping: 1, subscription: 2, comms: 3, money: 3, health: 3 };

// sample history for Monday to Saturday (shown in the chart)
var pastDays = [
  ["AUTO-Low", "AUTO-Low", "AUTO-Medium", "AUTO-Low"],
  ["AUTO-Low", "AUTO-Low", "REVIEW-Medium", "AUTO-Low", "AUTO-Medium", "REVIEW-High"],
  ["REVIEW-Medium", "AUTO-Low", "REVIEW-Medium", "HUMAN-High", "REVIEW-Medium"],
  ["AUTO-Low", "AUTO-Medium", "AUTO-Low", "REVIEW-Medium", "AUTO-Low", "AUTO-Low", "REVIEW-High"],
  ["AUTO-Low", "AUTO-Low", "AUTO-Low", "REVIEW-Medium", "HUMAN-High"],
  ["HUMAN-High", "AUTO-Medium", "AUTO-Low", "AUTO-Low"]
];
var dayNames = ["M", "T", "W", "T", "F", "S", "S"];

// ---------- 2. STATE: things that change while the app is used ----------
var defaultRules = {
  categories: { bills: "AUTO", calendar: "AUTO", travel: "AUTO", shopping: "AUTO", subscription: "REVIEW", comms: "REVIEW", money: "REVIEW", health: "HUMAN" },
  limit: 10000,          // biggest amount Aria may spend without asking
  blockConflicts: true   // never act alone when there is a conflict of interest
};
var rules = JSON.parse(JSON.stringify(defaultRules));
try {
  var savedRules = localStorage.getItem("mandateRules");
  if (savedRules) { rules = JSON.parse(savedRules); }
} catch (error) { /* storage not available, use defaults */ }

var mandateOn = true;     // the main switch
var log = [];             // every action Aria has taken today
var nextIndex = 0;        // which action comes next
var timer = null;         // used by Auto-run
var currentTab = "activity";

// ---------- 3. MANDATE'S BRAIN ----------
// Step 1: how serious is this action? returns "Low", "Medium" or "High"
function getConsequence(action) {
  var score = categoryWeight[action.category];
  if (action.amount > 50000) { score = score + 3; }
  else if (action.amount > 5000) { score = score + 2; }
  else if (action.amount > 1000) { score = score + 1; }
  if (action.undoHours < 24) { score = score + 1; }          // hard to undo
  if (action.confidence < 0.8) { score = score + 2; }        // Aria is unsure
  else if (action.confidence < 0.9) { score = score + 1; }
  if (action.conflict !== "") { score = score + 2; }         // conflict of interest
  if (score >= 8) { return "High"; }
  if (score >= 5) { return "Medium"; }
  return "Low";
}

// Step 2: who decides? returns "AUTO", "REVIEW" or "HUMAN"
function getRoute(action, level) {
  if (mandateOn === false) { return "AUTO"; }                // without Mandate Aria does everything
  var route = rules.categories[action.category];
  if (route === "AUTO") {
    if (level === "High") { route = "REVIEW"; }
    if (action.amount > rules.limit) { route = "REVIEW"; }
    if (action.conflict !== "" && rules.blockConflicts) { route = "REVIEW"; }
  }
  return route;
}

// ---------- 4. WHAT THE BUTTONS DO ----------
function runNextAction() {
  if (nextIndex >= actions.length) {
    showToast("Day complete. Open the Agency report.");
    stopAutoRun();
    return;
  }
  var action = JSON.parse(JSON.stringify(actions[nextIndex]));
  nextIndex = nextIndex + 1;
  var level = getConsequence(action);
  var route = getRoute(action, level);
  var entry = {
    action: action, level: level, route: route,
    status: (route === "AUTO") ? "done" : "pending",
    sawReasons: false,                // did the user open "Why?"
    startTime: Date.now(),
    decisionMs: 0,
    inControl: (route === "AUTO" && mandateOn && action.undoHours > 0)  // done under the user's rules and can be undone
  };
  log.push(entry);
  if (route !== "AUTO") { showToast("Aria needs you: " + action.title); }
  renderAll();
}

function toggleAutoRun() {
  if (timer === null) {
    timer = setInterval(runNextAction, 2800);
    document.getElementById("autoBtn").textContent = "Pause";
    document.getElementById("agentStatus").textContent = "Working";
  } else {
    stopAutoRun();
  }
}

function stopAutoRun() {
  clearInterval(timer);
  timer = null;
  document.getElementById("autoBtn").textContent = "Auto-run";
  document.getElementById("agentStatus").textContent = "Active";
}

function restartDay() {
  stopAutoRun();
  log = [];
  nextIndex = 0;
  showTab("activity");
}

function toggleMandate(isOn) {
  mandateOn = isOn;
  document.getElementById("mandateLabel").textContent = isOn ? "Control layer" : "Control layer off";
  showToast(isOn ? "Mandate is on" : "Mandate is off: Aria now acts on everything");
  renderAll();
}

// opens the explanation. Mandate writes it, not the agent.
function openWhy(index) {
  var entry = log[index];
  var a = entry.action;
  entry.sawReasons = true;
  var html = "<h3>Why did Aria choose this?</h3>";
  html += "<p class='small-grey'>Written by Mandate, not by the agent.</p><b>What it used</b><ul>";
  for (var i = 0; i < a.reasons.length; i++) { html += "<li>" + a.reasons[i] + "</li>"; }
  html += "</ul>";
  if (a.alternative !== "") { html += "<b>What it set aside</b><p>" + a.alternative + "</p>"; }
  if (a.conflict !== "") { html += "<div class='warnbox'><b>Who benefits:</b> " + a.conflict + ".</div>"; }
  html += "<p class='small-grey'>" + entry.level + " consequence, " + Math.round(a.confidence * 100) + "% confident, ";
  html += (a.undoHours > 0 ? "can be undone for " + a.undoHours + " hours" : "cannot be undone") + "</p>";
  html += "<button class='btn primary' onclick='closeDialog()'>Close</button>";
  openDialog(html);
}

function openAbout() {
  var html = "<h3>What is Mandate?</h3>";
  html += "<p>In 2040 your agent acts for you. Mandate sits between your agents and the world. It scores every action, then decides who is in charge:</p>";
  html += "<ul><li><b>AUTO</b>: small and reversible. Aria acts, you get a log and an undo.</li>";
  html += "<li><b>REVIEW</b>: consequential. Aria recommends, you decide.</li>";
  html += "<li><b>HUMAN</b>: high stakes. Aria can inform you but cannot act.</li></ul>";
  html += "<p class='small-grey'>Try it: run the day, then switch Mandate off and compare the Agency report.</p>";
  html += "<button class='btn primary' onclick='closeDialog()'>Got it</button>";
  openDialog(html);
}

function openDialog(html) {
  var box = document.getElementById("dialog");
  box.innerHTML = html;
  box.showModal();
}
function closeDialog() { document.getElementById("dialog").close(); }

// the user answers a REVIEW or HUMAN item
function decide(index, choice) {
  var entry = log[index];
  entry.decisionMs = Date.now() - entry.startTime;
  if (choice === "approve") { entry.status = "approved"; }
  if (choice === "reject") { entry.status = "rejected"; }
  if (choice === "handle") { entry.status = "handled"; }
  if (choice === "halve") { entry.action.amount = Math.round(entry.action.amount / 2); entry.status = "modified"; }
  // real control = the user read the explanation AND took at least 2 seconds
  if (choice === "handle") { entry.inControl = true; }
  else { entry.inControl = (entry.sawReasons && entry.decisionMs >= 2000); }
  if (entry.inControl === false) { showToast("Rubber-stamp! Open 'Why' and take 2+ seconds or it won't count as control."); }
  renderAll();
}

function undoAction(index) {
  log[index].status = "undone";
  log[index].inControl = true;
  renderAll();
}

function changeRule(category, value) {
  rules.categories[category] = value;
  saveRules();
  showToast("Rule saved. It applies to the next action.");
}
function changeLimit(value) {
  rules.limit = Number(value);
  document.getElementById("limitText").textContent = money(rules.limit);
  saveRules();
}
function changeConflict(checked) { rules.blockConflicts = checked; saveRules(); }
function saveRules() {
  try { localStorage.setItem("mandateRules", JSON.stringify(rules)); } catch (error) { }
}

// ---------- 5. NUMBERS ----------
function money(n) { return "Rs " + n.toLocaleString("en-IN"); }

function calculateStats() {
  var s = { total: log.length, auto: 0, pending: 0, finished: 0, consequential: 0, inControl: 0,
            silent: 0, interruptions: 0, changed: 0, conflictsSeen: 0, times: [] };
  for (var i = 0; i < log.length; i++) {
    var e = log[i];
    if (e.status === "pending") { s.pending++; continue; }
    s.finished++;
    if (e.route === "AUTO") { s.auto++; } else { s.interruptions++; s.times.push(e.decisionMs); }
    if (e.level !== "Low") {
      s.consequential++;
      if (e.inControl) { s.inControl++; } else { s.silent++; }
    }
    if (e.status === "rejected" || e.status === "modified" || e.status === "undone") { s.changed++; }
    if (e.route !== "AUTO" && e.action.conflict !== "" && e.sawReasons) { s.conflictsSeen++; }
  }
  s.control = (s.consequential > 0) ? Math.round(100 * s.inControl / s.consequential) : 0;
  s.autoShare = (s.finished > 0) ? Math.round(100 * s.auto / s.finished) : 0;
  s.times.sort(function (a, b) { return a - b; });
  s.median = (s.times.length > 0) ? (s.times[Math.floor(s.times.length / 2)] / 1000).toFixed(1) + "s" : "none yet";
  return s;
}

// ---------- 6. DRAWING THE SCREEN (runs after every change) ----------
function renderAll() {
  var s = calculateStats();
  // stat cards
  document.getElementById("statActions").textContent = s.total;
  document.getElementById("statAuto").textContent = s.auto;
  document.getElementById("statAutoSub").textContent = mandateOn ? "handled safely" : "ran unchecked";
  document.getElementById("statNeeds").textContent = s.pending;
  document.getElementById("statNeedsSub").textContent = (s.pending > 0) ? "waiting for you" : "nothing pending";
  document.getElementById("statControl").textContent = s.control + "%";
  // sidebar badge
  document.getElementById("badge").textContent = s.pending;
  // the panel and the chart
  renderPanel(s);
  renderChart();
}

function showTab(name) {
  currentTab = name;
  var names = ["activity", "needs", "rules", "report"];
  for (var i = 0; i < names.length; i++) {
    document.getElementById("nav-" + names[i]).classList.remove("active");
  }
  document.getElementById("nav-" + name).classList.add("active");
  renderAll();
}

function renderPanel(s) {
  var html = "";
  if (currentTab === "activity") { html = activityHtml(); }
  if (currentTab === "needs") { html = needsHtml(); }
  if (currentTab === "rules") { html = rulesHtml(); }
  if (currentTab === "report") { html = reportHtml(s); }
  document.getElementById("panel").innerHTML = html;
}

function emptyHtml(title, text) {
  return "<div class='empty'><div class='spark'>✦</div><h3>" + title + "</h3><p>" + text + "</p></div>";
}

function activityHtml() {
  if (log.length === 0) { return emptyHtml("No activity yet", "Run your AI to see Mandate classify and monitor actions."); }
  var html = "";
  for (var i = log.length - 1; i >= 0; i--) {          // newest first
    var e = log[i];
    var amountText = (e.action.amount > 0) ? money(e.action.amount) + " · " : "";
    html += "<div class='card'><div class='row'><div><b>" + e.action.title + "</b><div class='small-grey'>" + amountText + "<span class='" + e.level + "'>" + e.level + " consequence</span></div></div><div>";
    html += "<span class='pill " + e.route + "'>" + e.route + "</span><span class='pill " + e.status + "'>" + e.status + "</span> ";
    if (e.status === "done" && e.action.undoHours > 0 && mandateOn) { html += "<button class='btn small' onclick='undoAction(" + i + ")'>Undo</button>"; }
    if (e.status === "pending") { html += "<button class='btn small' onclick='showTab(\"needs\")'>Review</button>"; }
    html += "</div></div></div>";
  }
  return html;
}

function needsHtml() {
  var html = "";
  for (var i = log.length - 1; i >= 0; i--) {
    var e = log[i];
    if (e.status !== "pending") { continue; }
    var amountText = (e.action.amount > 0) ? money(e.action.amount) + " · " : "";
    html += "<div class='card review'><div class='row'><b>" + e.action.title + "</b><span class='pill " + e.route + "'>" + e.route + "</span></div>";
    html += "<div class='small-grey'>" + amountText + Math.round(e.action.confidence * 100) + "% confident · <span class='" + e.level + "'>" + e.level + " consequence</span>";
    if (e.action.conflict !== "") { html += " · <b class='High'>conflict of interest</b>"; }
    html += "</div><div class='row' style='margin-top:10px'><button class='btn small' onclick='openWhy(" + i + ")'>Why did Aria choose this?</button><div>";
    if (e.route === "HUMAN") {
      html += "<button class='btn small primary' onclick='decide(" + i + ",\"handle\")'>I'll handle it</button>";
    } else {
      html += "<button class='btn small primary' onclick='decide(" + i + ",\"approve\")'>Approve</button> ";
      html += "<button class='btn small' onclick='decide(" + i + ",\"halve\")'>Halve it</button> ";
      html += "<button class='btn small' onclick='decide(" + i + ",\"reject\")'>Reject</button>";
    }
    html += "</div></div></div>";
  }
  if (html === "") { html = emptyHtml("Nothing needs you", "Aria is handling everything within your rules."); }
  return html;
}

function rulesHtml() {
  var html = "<div class='card'><b>Autonomy by category</b><div class='small-grey'>Mandate also escalates anything with High consequence.</div>";
  var options = ["AUTO", "REVIEW", "HUMAN"];
  for (var category in rules.categories) {
    html += "<div class='row' style='margin-top:8px'><span>" + category + "</span><select onchange='changeRule(\"" + category + "\", this.value)'>";
    for (var i = 0; i < options.length; i++) {
      var selected = (rules.categories[category] === options[i]) ? " selected" : "";
      html += "<option" + selected + ">" + options[i] + "</option>";
    }
    html += "</select></div>";
  }
  html += "</div><div class='card'><b>Biggest amount Aria may spend alone: <span id='limitText'>" + money(rules.limit) + "</span></b><br>";
  html += "<input type='range' min='0' max='100000' step='1000' value='" + rules.limit + "' style='width:100%' oninput='changeLimit(this.value)'></div>";
  html += "<div class='card'><label><input type='checkbox' " + (rules.blockConflicts ? "checked" : "") + " onchange='changeConflict(this.checked)'> Never act alone when there is a conflict of interest</label></div>";
  return html;
}

function reportHtml(s) {
  var status = !mandateOn ? "Mandate off" : (s.control >= 80 ? "In control" : "Slipping");
  var html = "<div class='card'><div class='row'><div><div class='big'>" + s.control + "%</div><div class='small-grey'>Meaningful Control Rate: consequential decisions you could see, understand and reverse</div></div><span class='pill " + (status === "In control" ? "AUTO" : "HUMAN") + "'>" + status + "</span></div>";
  html += "<div class='bar'><i style='width:" + s.control + "%'></i></div></div>";
  html += "<div class='card'><div class='grid'>";
  html += "<div><div class='label'>Actions handled</div><div class='big'>" + s.finished + "</div></div>";
  html += "<div><div class='label'>Consequential</div><div class='big'>" + s.consequential + "</div></div>";
  html += "<div><div class='label'>Passed silently</div><div class='big High'>" + s.silent + "</div></div>";
  html += "<div><div class='label'>Conflicts you saw</div><div class='big'>" + s.conflictsSeen + "</div></div></div></div>";
  html += "<div class='card'><b>Is Mandate getting in the way?</b><div class='grid' style='margin-top:8px'>";
  html += "<div><div class='label'>Ran on AUTO</div><b>" + s.autoShare + "%</b> <span class='small-grey'>(aim: above 80%)</span></div>";
  html += "<div><div class='label'>Interruptions</div><b>" + s.interruptions + "</b> <span class='small-grey'>(aim: 3 or fewer)</span></div>";
  html += "<div><div class='label'>Median decision time</div><b>" + s.median + "</b></div>";
  html += "<div><div class='label'>Changed or reversed</div><b>" + s.changed + "</b></div></div></div>";
  html += "<p class='small-grey'>'Passed silently' = consequential actions nobody really checked. Switch Mandate off and replay the day to watch it jump.</p>";
  return html;
}

function renderChart() {
  var heights = { Low: 30, Medium: 60, High: 100 };
  var html = "";
  for (var d = 0; d < 7; d++) {
    var bars = [];
    if (d < 6) { bars = pastDays[d]; }
    else { for (var i = 0; i < log.length; i++) { bars.push(log[i].route + "-" + log[i].level); } }   // Sunday = today, live
    html += "<div class='day'><div class='bars'>";
    for (var b = 0; b < bars.length; b++) {
      var parts = bars[b].split("-");
      html += "<i class='" + parts[0] + "' style='height:" + heights[parts[1]] + "%' title='" + parts[0] + ", " + parts[1] + "'></i>";
    }
    html += "</div><span class='" + (d === 6 ? "today" : "") + "'>" + dayNames[d] + "</span></div>";
  }
  document.getElementById("chart").innerHTML = html;
}

var toastTimer = null;
function showToast(text) {
  var toast = document.getElementById("toast");
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2600);
}

// ---------- 7. START ----------
renderAll();
