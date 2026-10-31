import { DESTINATIONS, INTERESTS } from '../data/destinations.js';
import { formatDay, toIsoDate } from '../engine/dates.js';
import { createPlan } from '../engine/index.js';

const STORAGE_KEY = 'tripwise:prefs';
const DEFAULT_INTERESTS = ['history', 'food', 'culture'];
const CONDITION_LABEL = { rainy: '🌧️ Rainy', hot: '☀️ Hot', cold: '🧥 Cold', pleasant: '⛅ Pleasant' };
const SLOT_LABEL = { morning: 'Morning', midday: 'Midday', afternoon: 'Afternoon', evening: 'Evening' };

const form = document.getElementById('trip-form');
const results = document.getElementById('results');
const submitBtn = document.getElementById('submit-btn');

/** Small DOM helper. Text always goes through textContent, never innerHTML. */
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

const usd = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function populateForm() {
  const select = form.elements.destination;
  for (const d of DESTINATIONS) select.append(el('option', { value: d.id }, `${d.name}, ${d.country}`));

  const box = document.getElementById('interests');
  for (const interest of INTERESTS) {
    const input = el('input', { type: 'checkbox', name: 'interests', value: interest });
    input.checked = DEFAULT_INTERESTS.includes(interest);
    box.append(el('label', { class: 'chip' }, input, ` ${capitalise(interest)}`));
  }

  const today = toIsoDate(Date.now());
  form.elements.startDate.min = today;
  form.elements.startDate.value = toIsoDate(Date.now() + 7 * 86_400_000);
  restorePrefs();
}

function readForm() {
  const data = new FormData(form);
  return {
    destination: data.get('destination'),
    startDate: data.get('startDate'),
    days: data.get('days'),
    travellers: data.get('travellers'),
    group: data.get('group'),
    budgetLevel: data.get('budgetLevel'),
    pace: data.get('pace'),
    budgetUSD: data.get('budgetUSD'),
    interests: data.getAll('interests'),
    accessibleOnly: form.elements.accessibleOnly.checked,
  };
}

// Preferences are remembered on this device only, as a convenience.
function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* storage unavailable (private mode): ignore */
  }
}

function restorePrefs() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
  } catch {
    return;
  }
  if (!saved || typeof saved !== 'object') return;
  for (const name of ['destination', 'days', 'travellers', 'group', 'budgetUSD']) {
    if (typeof saved[name] === 'string' && form.elements[name]) form.elements[name].value = saved[name];
  }
  for (const name of ['budgetLevel', 'pace']) {
    const radio = form.querySelector(`input[name="${name}"][value="${CSS.escape(String(saved[name] ?? ''))}"]`);
    if (radio) radio.checked = true;
  }
  if (Array.isArray(saved.interests)) {
    for (const box of form.querySelectorAll('input[name="interests"]')) box.checked = saved.interests.includes(box.value);
  }
  form.elements.accessibleOnly.checked = saved.accessibleOnly === true;
}

function showErrors(errors) {
  let first = null;
  for (const p of form.querySelectorAll('.error')) {
    const field = p.id.replace(/-error$/, '');
    p.textContent = errors[field] ?? '';
    const control = form.elements[field];
    const target = control instanceof RadioNodeList ? null : control;
    if (target) target.setAttribute('aria-invalid', errors[field] ? 'true' : 'false');
    if (errors[field] && !first) first = target ?? form.querySelector(`[name="${field}"]`);
  }
  first?.focus();
}

function renderPlan(plan) {
  const { destination, itinerary, budget, packing, alerts, tips, prefs } = plan;
  const title = el('h2', { id: 'results-title', tabindex: '-1' }, `${prefs.days}-day plan for ${destination.name}`);

  const summary = el(
    'div',
    { class: 'summary' },
    el('div', { class: 'stat' }, el('span', { class: 'stat-label' }, 'Estimated total'), el('span', { class: 'stat-value' }, usd(budget.total))),
    el('div', { class: 'stat' }, el('span', { class: 'stat-label' }, 'Per person'), el('span', { class: 'stat-value' }, usd(budget.perPerson))),
    el('div', { class: 'stat' }, el('span', { class: 'stat-label' }, 'Per day'), el('span', { class: 'stat-value' }, usd(budget.perDay))),
  );

  const budgetNote = budget.status === 'no-limit' ? null : renderBudgetStatus(budget);

  const alertList = el('ul', { class: 'alerts' }, alerts.map((a) => el('li', {}, a)));

  const daysList = el(
    'ol',
    { class: 'days' },
    itinerary.days.map((day, i) =>
      el(
        'li',
        { class: 'day' },
        el(
          'div',
          { class: 'day-head' },
          el('h3', {}, `Day ${i + 1}: ${formatDay(day.date)}`),
          el(
            'p',
            { class: `weather weather-${day.condition}` },
            `${CONDITION_LABEL[day.condition]} · ${day.lowC}–${day.highC}°C · ${day.rainChance}% rain`,
            day.source === 'climate' ? el('span', { class: 'muted' }, ' (typical)') : null,
          ),
        ),
        el('ul', { class: 'slots' }, day.items.map(renderSlot)),
        el('p', { class: 'muted day-cost' }, `Activities: ${usd(day.costPerPerson)} per person`),
      ),
    ),
  );

  const packingList = el('ul', { class: 'packing' }, packing.map((p) => el('li', {}, el('strong', {}, p.item), el('span', { class: 'muted' }, ` (${p.reason})`))));
  const tipList = el('ul', {}, tips.map((t) => el('li', {}, t)));

  const actions = el('div', { class: 'actions' }, el('button', { type: 'button', class: 'secondary', id: 'print-btn' }, 'Print plan'));

  const sections = [
    title,
    summary,
    budgetNote,
    el('h3', {}, 'What TripWise considered'),
    alertList,
    daysList,
    el('div', { class: 'cols' }, el('section', {}, el('h3', {}, 'Packing list'), packingList), el('section', {}, el('h3', {}, 'Local tips'), tipList)),
    actions,
  ];
  results.replaceChildren(...sections.filter(Boolean));
  document.getElementById('print-btn').addEventListener('click', () => window.print());
  title.focus();
}

function renderBudgetStatus(budget) {
  const label = {
    within: `Within your ${usd(budget.budgetUSD)} budget.`,
    tight: `Close to your ${usd(budget.budgetUSD)} budget.`,
    over: `About ${usd(budget.total - budget.budgetUSD)} over your ${usd(budget.budgetUSD)} budget.`,
  }[budget.status];
  return el(
    'div',
    { class: `budget budget-${budget.status}`, role: 'status' },
    el('p', {}, el('strong', {}, label)),
    budget.suggestions.length ? el('ul', {}, budget.suggestions.map((s) => el('li', {}, s))) : null,
  );
}

function renderSlot(item) {
  const time = el('span', { class: 'slot-time' }, SLOT_LABEL[item.slot]);
  if (!item.attraction) return el('li', { class: 'slot free' }, time, el('p', {}, item.note));

  const a = item.attraction;
  const meta = [a.area, `${a.hours} h`, a.costUSD ? `${usd(a.costUSD)} pp` : 'Free', capitalise(a.setting)];
  if (a.accessible) meta.push('Step-free');
  return el(
    'li',
    { class: 'slot' },
    time,
    el(
      'div',
      {},
      el('p', { class: 'slot-name' }, a.name),
      el('p', { class: 'muted' }, meta.join(' · ')),
      el('p', {}, a.blurb),
      item.reasons.length ? el('p', { class: 'why' }, el('span', { class: 'why-label' }, 'Why: '), item.reasons.join('; ') + '.') : null,
    ),
  );
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const raw = readForm();
  submitBtn.disabled = true;
  submitBtn.textContent = 'Planning…';
  results.setAttribute('aria-busy', 'true');
  try {
    const plan = await createPlan(raw);
    if (!plan.ok) {
      showErrors(plan.errors);
      return;
    }
    showErrors({});
    savePrefs(raw);
    renderPlan(plan);
  } catch (err) {
    console.error(err);
    results.replaceChildren(el('h2', { id: 'results-title', tabindex: '-1' }, 'Something went wrong'), el('p', {}, 'Please try again.'));
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Build my plan';
    results.setAttribute('aria-busy', 'false');
  }
});

populateForm();
