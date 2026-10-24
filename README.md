# Mandate: a personal AI control layer

A working prototype for the **Flipkart APM '29 case (IIT Kanpur)**.

> *It's 2040. Everyone has a personal AI agent that knows them better than they know themselves and carries out their day to day tasks for them. Outline the ramifications of this paradigm and create a digital product that helps protect yourselves from it.*

Mandate is the product we chose after prioritising the problems this world creates. It sits between a user's AI agent and the world. Small, reversible tasks run automatically. Consequential ones wait for the human, with an independent explanation of why the agent chose them and who benefits.

**Product thesis:** *Automate the task. Keep the decision.*

---

## 1. Quick start

1. Keep `app.html`, `style.css` and `script.js` **in the same folder**.
2. Double-click `app.html`. It opens in your browser.
3. Click **Next agent action** (or **Auto-run**) and watch the page update.

Nothing to install, no server, no internet connection, no build step. The prototype uses only HTML, CSS and JavaScript, as the case requires. It makes no network requests, and the only thing it saves is your rules, in your own browser.

**Tested in:** headless Chromium with an automated click-through (see section 9). It uses standard browser features and should also work in current Chrome, Edge, Brave, Safari 15.4+ and Firefox 98+, but I have not tested those.

---

## 2. What is in the folder

| File | What it does |
|---|---|
| `app.html` | The page structure: sidebar, header, banner, stat cards, the changing panel, the chart and the footer. It has no logic. |
| `style.css` | All the styling: colours, sizes, layout and the mobile layout. Colours are CSS variables at the top. |
| `script.js` | All the behaviour: the agent's actions, Mandate's scoring and routing, the buttons, the numbers and the drawing of every section. |
| `README.md` | This file. |

---

## 3. The idea in one minute

In the 2040 scenario the agent acts for you instead of answering you. The problem we chose is that **consequential decisions get made without meaningful human visibility or control**. The agent becomes the only witness to its own actions.

Mandate responds with three rules:

- **AUTO**: low-stakes and reversible. The agent acts, you get a log and an undo.
- **REVIEW**: consequential. The agent recommends, Mandate explains, you approve, change or reject.
- **HUMAN**: high stakes. The agent can inform you but cannot act. You do it.

The product principle on the screen sums it up: *"Autonomy should scale with convenience. Human control should scale with consequence."*

---

## 4. A tour of the screen

### Left sidebar
- **Mandate logo and tagline.**
- **Your agent card:** Aria. The status text says **Active**, and changes to **Working** while Auto-run is on.
- **Navigation:** four tabs, described in section 5. The yellow badge on **Needs you** shows how many decisions are waiting.
- **Mandate principle** box.
- **What is Mandate?** opens a short explainer.
- **Account footer:** the demo user, Mayank.

### Header
- **Mandate switch** (top right). On means the control layer is working. Off means the agent acts on everything with no checks. This is the demo of the problem itself.
- **Next agent action:** brings in one action from Aria.
- **Auto-run:** brings in an action every 2.8 seconds. The button becomes **Pause**.
- **Restart:** clears today's log and starts the day again. Your rules are kept.

### Banner
The flow **YOU → MANDATE → ARIA → WORLD** shows where Mandate sits: between the agent and everything it does.

### Four stat cards (they update after every action)

| Card | What it counts |
|---|---|
| **AI actions** | Every action Aria has attempted today, including ones still waiting for you. |
| **Autonomous** | Actions that finished on AUTO. The label reads *handled safely* with Mandate on and *ran unchecked* with it off. |
| **Needs you** | Actions waiting for your decision right now. |
| **Control** | The Meaningful Control Rate (section 6). It shows 0% until you have finished at least one consequential decision. |

### The changing panel
Sits under the stat cards and shows whichever tab is selected.

### Weekly chart ("Aria's actions today")
Seven columns, M to S. **Bar height** is consequence (Low is short, High is tall). **Bar colour** is routing (green AUTO, orange REVIEW, red HUMAN). Monday to Saturday are **fictional sample history** so the chart is not empty. **Sunday is today and fills live** as Aria acts. Hover a bar to see its routing and consequence.

---

## 5. The four tabs

### Activity
The live feed of everything Aria has done, newest first. Each row shows the action, amount, consequence level, routing and status. Rows that finished on AUTO and can still be undone show an **Undo** button. Rows waiting for you show a **Review** button that takes you to Needs you. With no actions yet you see the empty state, "No activity yet".

### Needs you
The decision queue. Each card shows the amount, Aria's confidence, the consequence level and a **conflict of interest** flag where there is one.

- **Why did Aria choose this?** opens an explanation written by Mandate, not by the agent. It lists what the agent used, what it set aside and who benefits.
- **Approve**, **Halve it** (approves at half the amount) and **Reject** are the controls for REVIEW items.
- **I'll handle it** is the only control on HUMAN items. The agent may not act.

### Autonomy rules
Your standing instructions:
- A dropdown per category (bills, calendar, travel, shopping, subscription, comms, money, health) set to AUTO, REVIEW or HUMAN.
- The **biggest amount Aria may spend alone** slider (₹0 to ₹100,000, default ₹10,000).
- A checkbox: **never act alone when there is a conflict of interest**.

Rules apply to the **next** action. Actions already routed are not changed. Rules are saved in your browser (section 8).

### Agency report
Live numbers for the session:
- **Meaningful Control Rate**, with a status label of *In control* (80% or more), *Slipping*, or *Mandate off*.
- Actions handled, consequential actions, **passed silently**, and conflicts of interest you saw.
- The counter-checks that ask whether Mandate is getting in the way: share of actions that ran on AUTO (aim above 80%), interruptions (aim for 3 or fewer), median decision time, and how many actions you changed or reversed.

---

## 6. How Mandate decides

Two steps happen every time Aria attempts an action.

### Step 1: how serious is it?
Mandate adds up a score:

| Factor | Points |
|---|---|
| Task type: calendar 0, bills 1, travel 1, shopping 1, subscription 2, comms 3, money 3, health 3 | 0 to 3 |
| Amount over ₹1,000 / over ₹5,000 / over ₹50,000 | +1 / +2 / +3 |
| Can be undone for less than 24 hours (or not at all) | +1 |
| Aria's confidence below 90% / below 80% | +1 / +2 |
| Conflict of interest (sponsored result, commission, referral fee) | +2 |

**Score 8 or more is High. 5 to 7 is Medium. Under 5 is Low.**

### Step 2: who decides?
1. If the Mandate switch is **off**, everything is AUTO.
2. Otherwise Mandate starts from **your rule** for that category.
3. If your rule says AUTO, Mandate still **escalates to REVIEW** when the action is High, when the amount is above your limit, or when there is a conflict of interest (if that box is ticked).
4. REVIEW and HUMAN rules are never loosened.

### Meaningful Control Rate (the North Star metric)
**Numerator:** consequential decisions (Medium or High) where you had real control.
**Denominator:** all consequential decisions you have finished.

A decision counts as real control only if:
- **REVIEW:** you opened *Why did Aria choose this?* **and** took at least **2 seconds** to decide. Approving, halving and rejecting all count. A quick click does not, and a message tells you so. This is the anti-gaming rule against rubber-stamping.
- **HUMAN:** you clicked *I'll handle it*, since the agent did not act.
- **AUTO:** Mandate was on and the action can be undone.

**Passed silently** counts consequential decisions that did not meet this test. With the Mandate switch off, every consequential action lands there.

---

## 7. The 14 scripted actions (with default rules)

Aria's day follows this fixed list, in this order. After the 14th action, **Next agent action** shows "Day complete" and you press **Restart** to replay it.

| # | Action | Amount | Consequence | Default routing |
|---|---|---|---|---|
| 1 | Pay electricity bill | ₹1,840 | Low | AUTO |
| 2 | Reschedule Thursday dentist visit | none | Low | AUTO |
| 3 | Book cab to airport | ₹620 | Low | AUTO |
| 4 | Move 30% of portfolio into Nova Growth Fund (commission conflict) | ₹3,60,000 | High | REVIEW |
| 5 | Reorder weekly groceries | ₹2,300 | Low | AUTO |
| 6 | Renew annual streaming plan (sponsored placement) | ₹4,999 | Medium | REVIEW |
| 7 | Accept landlord's 8% rent increase by email | ₹14,000 | High | REVIEW |
| 8 | Buy flight to Goa | ₹9,200 | Low | AUTO |
| 9 | Sell ₹80,000 of mutual fund units | ₹80,000 | High | REVIEW |
| 10 | Order new phone (sponsored listing) | ₹54,999 | Medium | REVIEW |
| 11 | Negotiate broadband renewal | ₹8,400 | Low | AUTO |
| 12 | Switch health insurance plan (referral fee) | ₹28,000 | High | HUMAN |
| 13 | Accept team meeting invite | none | Low | AUTO |
| 14 | Share health report with employer wellness app | none | Medium | HUMAN |

That gives **7 actions on AUTO and 7 that need you**. Try changing rules and replaying to see the routing change.

---

## 8. Data, storage and privacy

- All data is **fictional and scripted**. Names, amounts and companies are made up.
- Nothing is sent anywhere. The prototype makes no network requests.
- Your rules are saved in your browser under the key `mandateRules`, so they survive a refresh and a Restart.
- To reset rules, clear the site's data in your browser, or run `localStorage.removeItem("mandateRules")` in the browser console and refresh.
- If your browser blocks storage (for example in some private modes), the prototype still works, it just won't remember your rules.

---

## 9. How it was tested

An automated browser run (headless Chromium, window 1470 px wide) checked, with no browser errors:

- All 14 actions arrive, and the four stat cards update.
- The Needs you queue shows 7 cards and the badge matches.
- The explanation dialog opens, and an approval after reading counts as real control (the rate went to 100% in the test).
- An approval without reading does **not** count (the rate stays 0%).
- Changing a rule, the Agency report, Restart, the Mandate off switch (all 14 actions run unchecked), Auto-run and Pause, and the "What is Mandate?" dialog.

Not tested: Safari and Firefox, phones, and screen readers.

---

## 10. Customising it

Everything below is in `script.js` unless noted.

- **Change the user or agent name:** search for `Mayank` and `Aria` in `app.html` and `script.js`.
- **Add or edit actions:** add an object to the `actions` array with these fields:
  - `title`, `category` (one of the eight task types), `amount` (rupees, 0 if none)
  - `undoHours` (0 means it cannot be undone), `confidence` (0 to 1)
  - `conflict` (text, or `""` for none), `alternative` (text or `""`), `reasons` (list of short strings)
- **Change how serious things are:** edit `categoryWeight`, or the numbers and thresholds in `getConsequence`.
- **Change the rubber-stamp rule:** edit `2000` (milliseconds) in the `decide` function.
- **Change Auto-run speed:** edit `2800` in `toggleAutoRun`.
- **Change the colours:** edit the variables at the top of `style.css` (`--blue`, `--yellow`, `--green`, `--orange`, `--red`).
- **Change the sample history in the chart:** edit `pastDays`.

---

## 11. How the prototype maps to the case

| Case requirement | Where it shows in the prototype |
|---|---|
| What the AI is doing | **Activity** feed and the stat cards |
| Why it creates the problem | The **Mandate off** switch: nothing is checked, "passed silently" jumps |
| What the product sees | The **conflict of interest** flag and the explanation dialog |
| The intervention | Scoring and routing into AUTO, REVIEW and HUMAN |
| How the user regains control | **Needs you** controls and **Autonomy rules** |
| What improves | The **Meaningful Control Rate** and the counter-checks in **Agency report** |

The five MVP features in the 2-pager appear as: activity feed (Activity), consequence classifier (scoring), AUTO/REVIEW/HUMAN controls (Needs you and Autonomy rules), explanation card (Why dialog), undo plus report (Undo button and Agency report).

---

## 12. Suggested 90-second demo

1. **Set the scene (0 to 10 s).** Show the empty dashboard. "It's 2040. Aria runs my money, travel and subscriptions."
2. **Let it run (10 to 25 s).** Click **Auto-run**. Watch the stat cards and Sunday's bars fill. "Most actions are small and reversible, so they run silently."
3. **Open the queue (25 to 40 s).** Click **Needs you**. Point at the portfolio move: High consequence, conflict of interest flag.
4. **Explain (40 to 60 s).** Click **Why did Aria choose this?**, read the "who benefits" line, then close it.
5. **Take control (60 to 75 s).** Click **Halve it**. Then open **Autonomy rules** and change *money* to HUMAN.
6. **Show the outcome (75 to 90 s).** Open **Agency report**: the control rate and the counter-checks. Press **Restart**, switch **Mandate** off, replay, and show the report again to show what unchecked delegation looks like.

Tip: pause for two seconds after opening *Why* before you decide, or the report will correctly call it a rubber-stamp.

---

## 13. Known limits

- It is a prototype: one scripted day of 14 actions, no real agent, no accounts, no backend.
- The **Agency report** covers today's session. The 2-pager's weekly report would need stored history.
- The chart's Monday to Saturday history is sample data, not your behaviour.
- The scoring thresholds and the "aim" figures in the report are **hypotheses to test**, not measured results.
- It has not been tested with assistive technology.

---

## 14. Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| Page looks unstyled | `style.css` is not in the same folder as `app.html`. |
| Buttons do nothing | `script.js` is missing or not in the same folder, or scripts are blocked. |
| Rules reset after refresh | The browser blocks local storage (private mode). |
| Control stays at 0% | Open *Why did Aria choose this?* and wait 2 seconds before deciding. |
| "Day complete" | All 14 actions have run. Press **Restart**. |

---

*Evidence and sources for the case are in the submission PDF's appendix. This prototype contains no statistics of its own.*
