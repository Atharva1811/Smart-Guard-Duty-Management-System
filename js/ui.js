// js/ui.js
// Main UI Controller and Router for the Single Page Application (SPA)

import { api } from './api.js';
import { scheduler as clientScheduler } from './scheduler.js';
import { charts } from './charts.js';
import { filters } from './filters.js';
import { exporter } from './export.js';
import { getLoggedInUser, logout, t, translateContent, showToast, toggleTheme } from './utils.js';
import { CONFIG } from './config.js';

// Application State Cache
const STATE = {
  user: null,
  guards: [],
  locations: [],
  settings: {},
  attendance: [],
  leaves: [],
  roster: [], // Assignments for active date
  history: [],
  auditLogs: [],
  activeDate: new Date().toISOString().split('T')[0],
  draggedCell: null
};

// Check authentication
STATE.user = getLoggedInUser();
if (!STATE.user) {
  window.location.href = 'index.html';
}

// Global initialization
document.addEventListener('DOMContentLoaded', async () => {
  // Update Profile details in Sidebar
  document.getElementById('user-name').textContent = STATE.user.name;
  document.getElementById('user-role-badge').textContent = STATE.user.role;
  document.getElementById('user-avatar').textContent = STATE.user.name.charAt(0).toUpperCase();

  // Hide restricted links
  if (STATE.user.role !== 'Admin' && STATE.user.role !== 'Supervisor') {
    document.getElementById('nav-link-availability')?.classList.add('hidden');
    document.getElementById('nav-link-settings')?.classList.add('hidden');
  }
  if (STATE.user.role !== 'Admin') {
    document.getElementById('nav-link-users')?.classList.add('hidden');
  }

  // Setup Date pickers
  document.getElementById('roster-date-picker').value = STATE.activeDate;
  document.getElementById('attendance-date-picker').value = STATE.activeDate;
  document.getElementById('report-date').value = STATE.activeDate;

  // Bind Navbar Toolbar Actions
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('theme-toggle-btn').addEventListener('click', () => {
    toggleTheme();
    document.getElementById('theme-toggle-btn').textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
  });

  const langToggleBtn = document.getElementById('lang-toggle-btn');
  langToggleBtn.addEventListener('click', () => {
    const current = localStorage.getItem('language') || 'en';
    const next = current === 'en' ? 'mr' : 'en';
    localStorage.setItem('language', next);
    langToggleBtn.textContent = next === 'en' ? 'मराठी' : 'English';
    showToast(next === 'mr' ? 'भाषा बदलली' : 'Language updated');
    translateInterface();
    loadActiveView();
  });
  langToggleBtn.textContent = (localStorage.getItem('language') || 'en') === 'en' ? 'मराठी' : 'English';

  // Tick clock
  setInterval(() => {
    const timeDisplay = document.getElementById('nav-time-display');
    if (timeDisplay) {
      timeDisplay.textContent = `${t('language') === 'mr' ? 'वेळ' : 'Time'}: ${new Date().toLocaleTimeString()}`;
    }
  }, 1000);

  // Setup Navigation Router
  const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = link.getAttribute('data-view');
      window.location.hash = targetView;
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      switchView(targetView);
    });
  });

  // Handle mobile sidebar toggle
  const sidebar = document.getElementById('sidebar');
  document.getElementById('sidebar-toggle').addEventListener('click', () => sidebar.classList.add('open'));
  document.getElementById('sidebar-close').addEventListener('click', () => sidebar.classList.remove('open'));

  // Bind Audit Log drawer toggle
  const drawer = document.getElementById('audit-drawer');
  document.getElementById('audit-btn').addEventListener('click', () => {
    loadAuditLogs();
    drawer.classList.remove('translate-x-full');
  });
  document.getElementById('audit-close-btn').addEventListener('click', () => drawer.classList.add('translate-x-full'));

  // Notification panel toggle
  const notifDropdown = document.getElementById('notif-dropdown');
  document.getElementById('notif-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    notifDropdown.classList.toggle('hidden');
  });
  document.addEventListener('click', () => notifDropdown.classList.add('hidden'));
  notifDropdown.addEventListener('click', (e) => e.stopPropagation());

  // Set initial settings base URL in UI
  document.getElementById('set-api-url').value = CONFIG.getApiUrl();

  // Load database and trigger routing
  await loadStateData();
  translateInterface();
  handleHashRouting();
  checkNotifications();
});

// Load all database state arrays from the Cloudflare API
async function loadStateData() {
  try {
    STATE.guards = await api.getGuards();
    STATE.locations = await api.getLocations();
    STATE.settings = await api.getSettings();
    STATE.leaves = await api.getLeaves();
    STATE.history = await api.getHistory();
    STATE.roster = await api.getAssignments(STATE.activeDate);
    // Parse settings
    if (STATE.settings) {
      document.getElementById('set-shift-morning-start').value = STATE.settings.shiftTimings?.Morning?.start || '06:00';
      document.getElementById('set-shift-morning-end').value = STATE.settings.shiftTimings?.Morning?.end || '14:00';
      document.getElementById('set-shift-evening-start').value = STATE.settings.shiftTimings?.Evening?.start || '14:00';
      document.getElementById('set-shift-evening-end').value = STATE.settings.shiftTimings?.Evening?.end || '22:00';
      document.getElementById('set-shift-night-start').value = STATE.settings.shiftTimings?.Night?.start || '22:00';
      document.getElementById('set-shift-night-end').value = STATE.settings.shiftTimings?.Night?.end || '06:00';

      document.getElementById('set-consec-days').value = STATE.settings.rotationRules?.maxConsecutiveDuties || 5;
      document.getElementById('set-night-limit').value = STATE.settings.rotationRules?.maxNightShiftsPerWeek || 3;
      document.getElementById('set-rest-hours').value = STATE.settings.rotationRules?.restHoursBetweenShifts || 12;
    }
  } catch (e) {
    console.error('Failed to load state data:', e);
    showToast(t('language') === 'mr' ? 'डेटा लोड करण्यात अडचण आली' : 'Failed to synchronize with server: ' + e.message, 'error');
  }
}

// Router trigger on hash changes
window.addEventListener('hashchange', handleHashRouting);

function handleHashRouting() {
  const hash = window.location.hash.substring(1) || 'dashboard';
  const matchingLink = document.querySelector(`.sidebar-nav .nav-link[data-view="${hash}"]`);
  
  if (matchingLink) {
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(l => l.classList.remove('active'));
    matchingLink.classList.add('active');
    switchView(hash);
  } else {
    switchView('dashboard');
  }
}

// Translate all HTML labels containing data-t attributes
function translateInterface() {
  const elements = document.querySelectorAll('[data-t]');
  elements.forEach(el => {
    const key = el.getAttribute('data-t');
    el.textContent = t(key);
  });
}

// Switch showing panel view
function switchView(viewName) {
  document.querySelectorAll('.view-pane').forEach(p => p.classList.add('hidden'));
  document.getElementById(`view-${viewName}`)?.classList.remove('hidden');
  document.getElementById('sidebar').classList.remove('open');
  loadActiveView();
}

function loadActiveView() {
  const hash = window.location.hash.substring(1) || 'dashboard';
  if (hash === 'dashboard') renderDashboardView();
  else if (hash === 'duty') renderDutyView();
  else if (hash === 'guards') renderGuardsView();
  else if (hash === 'locations') renderLocationsView();
  else if (hash === 'availability') renderAvailabilityView();
  else if (hash === 'leaves') renderLeavesView();
  else if (hash === 'reports') renderReportsView();
  else if (hash === 'users') renderUsersView();
}

// Check alert notifications
function checkNotifications() {
  const alertBadge = document.getElementById('notif-badge');
  const alertList = document.getElementById('notif-list');
  const lang = localStorage.getItem('language') || 'en';

  const alerts = [];

  // Check pending leaves
  const pendingLeaves = STATE.leaves.filter(l => l.status === 'Pending').length;
  if (pendingLeaves > 0) {
    alerts.push({
      text: lang === 'mr' ? `${pendingLeaves} रजा मंजुरीसाठी प्रलंबित आहेत` : `${pendingLeaves} leave requests are pending approval`,
      type: 'warning'
    });
  }

  // Check shortages in active roster
  const vacantSpots = STATE.locations.reduce((acc, loc) => {
    const activeShifts = (loc.shift || 'Morning,Evening,Night').split(',');
    let emptyCount = 0;
    activeShifts.forEach(s => {
      const match = STATE.roster.find(a => a.location_id === loc.id && a.shift === s);
      if (!match || !match.guard_id) emptyCount++;
    });
    return acc + emptyCount;
  }, 0);

  if (vacantSpots > 0) {
    alerts.push({
      text: lang === 'mr' ? `${vacantSpots} ड्युटी जागा आज रिक्त आहेत!` : `${vacantSpots} duty spots are currently vacant today!`,
      type: 'error'
    });
  }

  if (alerts.length > 0) {
    alertBadge.textContent = alerts.length;
    alertBadge.classList.remove('hidden');
    alertList.innerHTML = alerts.map(a => `
      <div class="p-2 border-b last:border-0 border-border flex items-center gap-2">
        <span>${a.type === 'error' ? '🔴' : '🟡'}</span>
        <span>${a.text}</span>
      </div>
    `).join('');
  } else {
    alertBadge.classList.add('hidden');
    alertList.innerHTML = `<p class="text-center py-2">${lang === 'mr' ? 'कोणतेही नवीन अलर्ट नाहीत.' : 'No new system alerts.'}</p>`;
  }
}

// --- VIEW CONTROLLERS ---

// 1. DASHBOARD VIEW RENDERER
function renderDashboardView() {
  const lang = localStorage.getItem('language') || 'en';
  
  // Total Guards
  document.getElementById('stat-total-guards').textContent = STATE.guards.length;
  
  // Available Today
  const availableToday = STATE.guards.filter(g => g.status === 'Available').length;
  document.getElementById('stat-available-guards').textContent = availableToday;

  // On Leave Today
  const onLeave = STATE.guards.filter(g => g.status === 'Leave').length;
  document.getElementById('stat-leave-guards').textContent = onLeave;

  // Compute shift distributions
  let morning = 0, evening = 0, night = 0, vacant = 0;
  
  STATE.roster.forEach(a => {
    if (a.guard_id) {
      if (a.shift === 'Morning') morning++;
      else if (a.shift === 'Evening') evening++;
      else if (a.shift === 'Night') night++;
    } else {
      vacant++;
    }
  });

  const totalRequired = STATE.locations.reduce((acc, loc) => acc + (loc.shift || 'Morning,Evening,Night').split(',').length, 0);
  const totalAssigned = morning + evening + night;
  const coveragePercent = totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 0;

  document.getElementById('stat-vacant-spots').textContent = totalRequired - totalAssigned;
  document.getElementById('stat-morning-count').textContent = morning;
  document.getElementById('stat-evening-count').textContent = evening;
  document.getElementById('stat-night-count').textContent = night;
  document.getElementById('stat-coverage-percent').textContent = `${coveragePercent}%`;

  // Render Donut Chart (Availability breakup)
  const breakupData = [
    { name: t('language') === 'mr' ? 'उपलब्ध' : 'Available', value: availableToday, color: '#10b981' },
    { name: t('language') === 'mr' ? 'रजेवर' : 'On Leave', value: onLeave, color: '#3b82f6' },
    { name: t('language') === 'mr' ? 'गैरहजर' : 'Absent', value: STATE.guards.filter(g => g.status === 'Absent').length, color: '#ef4444' },
    { name: t('language') === 'mr' ? 'प्रशिक्षण' : 'Training', value: STATE.guards.filter(g => g.status === 'Training').length, color: '#818cf8' },
    { name: t('language') === 'mr' ? 'वैद्यकीय सुट्टी' : 'Medical', value: STATE.guards.filter(g => g.status === 'Medical').length, color: '#fbbf24' }
  ].filter(d => d.value > 0);

  charts.renderDonutChart('chart-pie-container', breakupData);

  // Render Bar Chart (Occupancy)
  const occupancyData = STATE.locations.map(loc => {
    const activeShifts = (loc.shift || 'Morning,Evening,Night').split(',');
    const assignedCount = STATE.roster.filter(a => a.location_id === loc.id && a.guard_id).length;
    return {
      name: translateContent(loc.location_name, lang),
      assigned: assignedCount
    };
  });
  charts.renderBarChart('chart-bar-container', occupancyData, 'name', 'assigned', ['#60a5fa', '#34d399', '#f87171']);

  // Render Line Chart (Coverage trends)
  // Fetch from unique dates in history
  const uniqueDates = [...new Set(STATE.history.map(h => h.assignment_date))].sort().slice(-7);
  const trendData = uniqueDates.map(date => {
    const list = STATE.history.filter(h => h.assignment_date === date);
    const assigned = list.filter(h => h.guard_id).length;
    const total = list.length;
    return {
      date: date.substring(5), // MM-DD
      rate: total > 0 ? Math.round((assigned / total) * 100) : 100
    };
  });

  if (trendData.length === 0) {
    trendData.push({ date: 'Today', rate: coveragePercent });
  }
  charts.renderLineChart('chart-line-container', trendData, 'date', 'rate', '#10b981');
}

// 2. TODAY'S DUTY TABLE VIEW RENDERER
function renderDutyView() {
  const container = document.getElementById('roster-table-parent');
  const lang = localStorage.getItem('language') || 'en';

  if (STATE.locations.length === 0) {
    container.innerHTML = '<p class="text-center py-6 text-muted-foreground">Please configure operational locations first.</p>';
    return;
  }

  // Create table header
  let tableHTML = `
    <table class="roster-table">
      <thead>
        <tr>
          <th data-t="locationNode">${t('locationNode')}</th>
          <th data-t="morningShift">${t('morningShift')}</th>
          <th data-t="eveningShift">${t('eveningShift')}</th>
          <th data-t="nightShift">${t('nightShift')}</th>
          <th data-t="reserveGuard">${t('reserveGuard')}</th>
        </tr>
      </thead>
      <tbody>
  `;

  // Generate table rows dynamically
  STATE.locations.forEach(loc => {
    tableHTML += `
      <tr data-location-id="${loc.id}">
        <td class="font-semibold text-foreground">${translateContent(loc.location_name, lang)}</td>
    `;

    ['Morning', 'Evening', 'Night', 'Reserve'].forEach(shift => {
      // Find matching assignment
      const assignment = STATE.roster.find(a => a.location_id === loc.id && a.shift === shift);
      const isLocked = assignment && assignment.status === 'Locked';
      const guardName = assignment && assignment.guard_name ? translateContent(assignment.guard_name, lang) : '';
      const guardId = assignment ? assignment.guard_id : null;
      
      let cellClass = 'status-vacant';
      let cellText = 'Vacant';
      
      if (guardId) {
        cellClass = isLocked ? 'status-locked' : 'status-assigned';
        cellText = `${guardName} (${assignment.guard_code})`;
      } else if (shift === 'Reserve') {
        cellClass = 'status-holiday';
        cellText = '-';
      }

      const activeShifts = (loc.shift || 'Morning,Evening,Night').split(',');
      if (shift !== 'Reserve' && !activeShifts.includes(shift)) {
        tableHTML += `<td class="bg-muted/10 text-muted-foreground/30 text-center">-</td>`;
      } else {
        tableHTML += `
          <td class="${cellClass} text-center font-medium cursor-pointer relative group transition-all"
              data-shift="${shift}"
              data-location-id="${loc.id}"
              data-guard-id="${guardId || ''}"
              data-assignment-id="${assignment ? assignment.id : ''}"
              draggable="${!!guardId && !isLocked}"
              id="cell-${loc.id}-${shift}">
            <span>${cellText}</span>
            ${isLocked ? '<span style="font-size: 10px; margin-left: 4px;">🔒</span>' : ''}
          </td>
        `;
      }
    });

    tableHTML += `</tr>`;
  });

  tableHTML += `</tbody></table>`;
  container.innerHTML = tableHTML;

  // Bind table event listeners (Click reassign & Drag and Drop)
  bindTimetableListeners();
  renderShortagesAndConflicts();
}

function bindTimetableListeners() {
  const cells = document.querySelectorAll('.roster-table td[data-shift]');
  
  cells.forEach(cell => {
    // Click reassign modal triggers
    cell.addEventListener('click', (e) => {
      e.stopPropagation();
      const locId = cell.getAttribute('data-location-id');
      const shift = cell.getAttribute('data-shift');
      const guardId = cell.getAttribute('data-guard-id');
      const assignmentId = cell.getAttribute('data-assignment-id');
      
      openReassignModal(locId, shift, guardId, assignmentId);
    });

    // Drag-and-drop mechanics
    const isDraggable = cell.getAttribute('draggable') === 'true';
    if (isDraggable) {
      cell.addEventListener('dragstart', (e) => {
        STATE.draggedCell = {
          locationId: cell.getAttribute('data-location-id'),
          shift: cell.getAttribute('data-shift'),
          guardId: cell.getAttribute('data-guard-id'),
          guardName: cell.querySelector('span').textContent
        };
        cell.classList.add('opacity-40');
      });

      cell.addEventListener('dragend', () => {
        cell.classList.remove('opacity-40');
        STATE.draggedCell = null;
      });
    }

    cell.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (STATE.draggedCell) {
        cell.classList.add('bg-primary/20');
      }
    });

    cell.addEventListener('dragleave', () => {
      cell.classList.remove('bg-primary/20');
    });

    cell.addEventListener('drop', async (e) => {
      e.preventDefault();
      cell.classList.remove('bg-primary/20');
      
      if (!STATE.draggedCell) return;

      const targetLocId = cell.getAttribute('data-location-id');
      const targetShift = cell.getAttribute('data-shift');
      const targetGuardId = cell.getAttribute('data-guard-id');

      // Prevent swap on same cell or locked cells
      const targetAssignment = STATE.roster.find(a => a.location_id === Number(targetLocId) && a.shift === targetShift);
      if (targetAssignment && targetAssignment.status === 'Locked') {
        showToast('Cell is locked! Unlock it first to make changes.', 'warning');
        return;
      }

      // Perform swap in STATE.roster array
      const sourceLocId = Number(STATE.draggedCell.locationId);
      const sourceShift = STATE.draggedCell.shift;

      const sourceAssignment = STATE.roster.find(a => a.location_id === sourceLocId && a.shift === sourceShift);
      
      if (sourceAssignment && targetAssignment) {
        // Swap guards
        const tempId = sourceAssignment.guard_id;
        const tempName = sourceAssignment.guard_name;
        const tempCode = sourceAssignment.guard_code;

        sourceAssignment.guard_id = targetAssignment.guard_id;
        sourceAssignment.guard_name = targetAssignment.guard_name;
        sourceAssignment.guard_code = targetAssignment.guard_code;

        targetAssignment.guard_id = tempId;
        targetAssignment.guard_name = tempName;
        targetAssignment.guard_code = tempCode;

        showToast('Guards swapped successfully.');
        renderDutyView();
      }
    });
  });
}

// Reassignment Modal opening
async function openReassignModal(locationId, shift, guardId, assignmentId) {
  const modal = document.getElementById('reassign-modal');
  const labelLoc = document.getElementById('reassign-label-location');
  const labelShift = document.getElementById('reassign-label-shift');
  const guardSelect = document.getElementById('reassign-guard-select');
  const removeBtn = document.getElementById('btn-remove-assignment');

  const loc = STATE.locations.find(l => l.id === Number(locationId));
  labelLoc.textContent = loc ? loc.location_name : '';
  labelShift.textContent = shift;

  document.getElementById('reassign-location-id').value = locationId;
  document.getElementById('reassign-shift').value = shift;

  // Toggle remove button display
  if (guardId) {
    removeBtn.classList.remove('hidden');
  } else {
    removeBtn.classList.add('hidden');
  }

  // Populate candidate options
  guardSelect.innerHTML = `<option value="">-- Select Guard --</option>`;
  
  // Calculate today's attendance map
  const attendanceList = STATE.guards.map(g => ({
    guard_id: g.id,
    status: g.status
  }));

  const candidates = await clientScheduler.getReplacementSuggestions(
    STATE.activeDate,
    locationId,
    shift,
    STATE.guards,
    attendanceList
  );

  candidates.forEach(c => {
    guardSelect.innerHTML += `<option value="${c.id}">${c.name} (${c.guard_code}) - Exp: ${c.experience}y</option>`;
  });

  modal.classList.remove('hidden');
}

// 3. GUARDS CRUD RENDERER
function renderGuardsView() {
  const grid = document.getElementById('guards-grid-list');
  const query = document.getElementById('guard-search-input').value;
  const status = document.getElementById('guard-filter-status').value;
  const shift = document.getElementById('guard-filter-shift').value;
  const lang = localStorage.getItem('language') || 'en';

  const filtered = filters.filterGuards(STATE.guards, query, status, shift);
  
  grid.innerHTML = '';
  
  if (filtered.length === 0) {
    grid.innerHTML = '<div class="col-span-full text-center text-muted-foreground py-8">No guards match filter criteria.</div>';
    return;
  }

  filtered.forEach(g => {
    let statusClass = 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
    if (g.status === 'Leave') statusClass = 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
    else if (g.status === 'Absent') statusClass = 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
    else if (g.status === 'Training') statusClass = 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20';
    else if (g.status === 'Medical') statusClass = 'bg-amber-500/10 text-amber-600 border border-amber-500/20';

    const card = document.createElement('div');
    card.className = 'card space-y-4';
    card.innerHTML = `
      <div class="flex justify-between items-start" style="display: flex; justify-content: space-between;">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full flex items-center justify-center font-bold text-white bg-slate-700">${g.name.charAt(0)}</div>
          <div>
            <h4 class="font-bold text-sm text-foreground">${translateContent(g.name, lang)}</h4>
            <p class="text-[10px] text-muted-foreground">${g.guard_code}</p>
          </div>
        </div>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${statusClass}">${translateContent(g.status, lang)}</span>
      </div>
      <div class="text-xs space-y-1.5 text-muted-foreground">
        <div><strong>Preference:</strong> ${translateContent(g.shift_preference, lang)}</div>
        <div><strong>Department:</strong> ${translateContent(g.department, lang)}</div>
        <div><strong>Weekly Off:</strong> ${getDayName(g.weekly_off, lang)}</div>
        <div><strong>Experience:</strong> ${g.experience} Years</div>
      </div>
      <div class="flex justify-end gap-2 border-t pt-3" style="display: flex; justify-content: flex-end;">
        <button class="btn-edit-guard hover:text-primary transition-all text-xs" data-id="${g.id}">✏️ Edit</button>
        <button class="btn-delete-guard hover:text-rose-600 transition-all text-xs" data-id="${g.id}">🗑️ Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });

  // Bind card action buttons
  document.querySelectorAll('.btn-edit-guard').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const g = STATE.guards.find(guard => guard.id === Number(id));
      if (g) openGuardModal(g);
    });
  });

  document.querySelectorAll('.btn-delete-guard').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this guard profile?')) {
        await api.deleteGuard(id);
        showToast('Guard profile deleted successfully.');
        await loadStateData();
        renderGuardsView();
      }
    });
  });
}

function getDayName(dayIndex, lang) {
  const index = parseInt(dayIndex, 10);
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysMr = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  return lang === 'mr' ? daysMr[index] : daysEn[index];
}

// 4. LOCATIONS VIEW RENDERER
function renderLocationsView() {
  const grid = document.getElementById('locations-grid-list');
  const query = document.getElementById('location-search-input').value;
  const lang = localStorage.getItem('language') || 'en';

  const filtered = filters.filterLocations(STATE.locations, query, 'All');

  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="col-span-full text-center text-muted-foreground py-8">No locations defined.</div>';
    return;
  }

  filtered.forEach(loc => {
    const card = document.createElement('div');
    card.className = 'card space-y-4';
    card.innerHTML = `
      <div class="flex justify-between items-start" style="display: flex; justify-content: space-between;">
        <div>
          <h4 class="font-bold text-sm text-foreground">${translateContent(loc.location_name, lang)}</h4>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20 uppercase mt-1">Critical</span>
        </div>
        <span class="text-xs text-muted-foreground font-semibold">Priority: ${loc.priority === 1 ? 'High' : loc.priority === 2 ? 'Medium' : 'Low'}</span>
      </div>
      <div class="text-xs space-y-1 text-muted-foreground">
        <div><strong>Guards Count:</strong> ${loc.required_guards} per shift</div>
        <div><strong>Active Shifts:</strong> ${loc.shift || 'Morning,Evening,Night'}</div>
      </div>
      <div class="flex justify-end gap-2 border-t pt-3" style="display: flex; justify-content: flex-end;">
        <button class="btn-edit-location hover:text-primary transition-all text-xs" data-id="${loc.id}">✏️ Edit</button>
        <button class="btn-delete-location hover:text-rose-600 transition-all text-xs" data-id="${loc.id}">🗑️ Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });

  // Bind location buttons
  document.querySelectorAll('.btn-edit-location').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const loc = STATE.locations.find(l => l.id === Number(id));
      if (loc) openLocationModal(loc);
    });
  });

  document.querySelectorAll('.btn-delete-location').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this operational location?')) {
        await api.deleteLocation(id);
        showToast('Location deleted successfully.');
        await loadStateData();
        renderLocationsView();
      }
    });
  });
}

// 5. DAILY AVAILABILITY attendance grid
function renderAvailabilityView() {
  const tbody = document.getElementById('attendance-table-body');
  const lang = localStorage.getItem('language') || 'en';

  tbody.innerHTML = '';
  
  if (STATE.guards.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-muted-foreground">No guards registered.</td></tr>';
    return;
  }

  STATE.guards.forEach(g => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="font-semibold text-foreground">${translateContent(g.name, lang)} (${g.guard_code})</td>
      <td>
        <select class="attendance-select border border-border bg-muted/20" data-guard-id="${g.id}" style="max-width: 180px;">
          <option value="Available" ${g.status === 'Available' ? 'selected' : ''}>Available</option>
          <option value="Leave" ${g.status === 'Leave' ? 'selected' : ''}>Leave</option>
          <option value="Absent" ${g.status === 'Absent' ? 'selected' : ''}>Absent</option>
          <option value="Medical" ${g.status === 'Medical' ? 'selected' : ''}>Medical</option>
          <option value="Holiday" ${g.status === 'Holiday' ? 'selected' : ''}>Holiday</option>
          <option value="Training" ${g.status === 'Training' ? 'selected' : ''}>Training</option>
        </select>
      </td>
      <td>
        <input type="text" class="attendance-notes" data-guard-id="${g.id}" placeholder="Specify reasons if absent..." style="font-size: 0.75rem;" />
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 6. LEAVES REQUEST TABLE VIEW
function renderLeavesView() {
  const tbody = document.getElementById('leaves-table-body');
  const lang = localStorage.getItem('language') || 'en';

  tbody.innerHTML = '';
  
  if (STATE.leaves.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted-foreground">No leave applications submitted.</td></tr>';
    return;
  }

  STATE.leaves.forEach(l => {
    let badgeClass = 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
    if (l.status === 'Approved') badgeClass = 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
    else if (l.status === 'Rejected') badgeClass = 'bg-rose-500/10 text-rose-600 border border-rose-500/20';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="font-semibold text-foreground">${translateContent(l.guard_name, lang)} (${l.guard_code})</td>
      <td>${l.leave_date}</td>
      <td>${l.reason}</td>
      <td><span class="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${badgeClass}">${translateContent(l.status, lang)}</span></td>
      <td>
        ${l.status === 'Pending' ? `
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn-approve px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[10px] hover:brightness-105" data-id="${l.id}">Approve</button>
            <button class="btn-reject px-2 py-1 rounded bg-rose-600 text-white font-bold text-[10px] hover:brightness-105" data-id="${l.id}">Reject</button>
          </div>
        ` : '-'}
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Bind approval clicks
  document.querySelectorAll('.btn-approve').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      await api.updateLeaveStatus(id, 'Approved');
      showToast('Leave request approved.');
      await loadStateData();
      renderLeavesView();
    });
  });

  document.querySelectorAll('.btn-reject').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      await api.updateLeaveStatus(id, 'Rejected');
      showToast('Leave request rejected.');
      await loadStateData();
      renderLeavesView();
    });
  });
}

// 7. REPORTS GENERATION
function renderReportsView() {
  // Setup default query
}

// 8. USERS RENDERER (Admin only)
function renderUsersView() {
  const container = document.getElementById('users-card-list');
  const lang = localStorage.getItem('language') || 'en';

  container.innerHTML = '';
  
  api.getUsers().then(users => {
    users.forEach(u => {
      const card = document.createElement('div');
      card.className = 'card space-y-4';
      card.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full flex items-center justify-center font-bold text-white bg-slate-700">${u.name.charAt(0)}</div>
          <div>
            <h4 class="font-bold text-sm text-foreground">${u.name}</h4>
            <p class="text-[10px] text-muted-foreground">${u.email || 'No email specified'}</p>
          </div>
        </div>
        <div class="text-xs space-y-1.5 text-muted-foreground">
          <div><strong>Username:</strong> ${u.username}</div>
          <div><strong>Role Scope:</strong> ${u.role}</div>
        </div>
        ${u.username !== 'admin' ? `
          <div class="flex justify-end border-t pt-3" style="display: flex; justify-content: flex-end;">
            <button class="btn-delete-user hover:text-rose-600 transition-all text-xs" data-id="${u.id}">🗑️ Delete User</button>
          </div>
        ` : ''}
      `;
      container.appendChild(card);
    });

    document.querySelectorAll('.btn-delete-user').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this user login account?')) {
          await api.deleteUser(id);
          showToast('User account deleted.');
          renderUsersView();
        }
      });
    });
  });
}

// 9. Load system audit logs into the drawer
async function loadAuditLogs() {
  const list = document.getElementById('audit-logs-list');
  list.innerHTML = '<p class="text-center py-4 text-muted-foreground">Loading audit trail...</p>';
  try {
    const { results } = await api.getHistory(50); // Get recent logs
    if (!results || results.length === 0) {
      list.innerHTML = '<p class="text-center py-4 text-muted-foreground">No recent system events.</p>';
      return;
    }

    list.innerHTML = results.map(r => `
      <div class="p-2 border-b border-border space-y-1">
        <div class="flex justify-between font-semibold" style="display: flex; justify-content: space-between;">
          <span class="text-primary">${r.guard_name || 'System'}</span>
          <span class="text-muted-foreground" style="font-size: 8px;">${new Date(r.assignment_date).toLocaleDateString()}</span>
        </div>
        <p class="text-foreground">${r.remarks || 'Assigned spot'}</p>
        <span class="text-[9px] text-muted-foreground">Check: ${r.location_name} - ${r.shift}</span>
      </div>
    `).join('');
  } catch {
    list.innerHTML = '<p class="text-center py-4 text-rose-500">Error loading audit logs.</p>';
  }
}

// Render shortages and conflict detection outputs in Today's Duty panel
function renderShortagesAndConflicts() {
  const shortageList = document.getElementById('shortage-list');
  const conflictList = document.getElementById('conflict-list');

  // Check shortages
  const shortages = [];
  STATE.locations.forEach(loc => {
    const activeShifts = (loc.shift || 'Morning,Evening,Night').split(',');
    activeShifts.forEach(shift => {
      const match = STATE.roster.find(a => a.location_id === loc.id && a.shift === shift);
      if (!match || !match.guard_id) {
        shortages.push({
          locationName: loc.location_name,
          locationId: loc.id,
          shift: shift
        });
      }
    });
  });

  if (shortages.length === 0) {
    shortageList.innerHTML = `<div class="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-lg text-center" data-t="allStaffed">${t('allStaffed')}</div>`;
  } else {
    shortageList.innerHTML = shortages.map(s => `
      <div class="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-lg flex justify-between items-center" style="display: flex; justify-content: space-between;">
        <span><strong>${s.locationName}</strong>: ${s.shift} is vacant</span>
        <button class="btn-solve px-2 py-1 rounded bg-rose-600 text-white font-semibold text-[10px] hover:brightness-105" 
                data-location-id="${s.locationId}" 
                data-shift="${s.shift}">Solve Vacancy</button>
      </div>
    `).join('');

    // Bind solve vacancy buttons
    document.querySelectorAll('.btn-solve').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const locId = btn.getAttribute('data-location-id');
        const shift = btn.getAttribute('data-shift');
        openReassignModal(locId, shift, null, null);
      });
    });
  }

  // Check conflicts (Double shifts)
  const conflicts = clientScheduler.detectConflicts(STATE.roster, STATE.history, STATE.activeDate);
  
  if (conflicts.length === 0) {
    conflictList.innerHTML = `<div class="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-lg text-center" data-t="allClear">${t('allClear')}</div>`;
  } else {
    conflictList.innerHTML = conflicts.map(c => {
      const guard = STATE.guards.find(g => g.id === Number(c.guardId));
      const guardName = guard ? guard.name : 'Unknown';
      return `
        <div class="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-600 rounded-lg">
          ⚠️ <strong>${guardName}</strong>: ${c.message}
        </div>
      `;
    }).join('');
  }
}

// --- BINDING DIALOG TRIGGER ACTIONS ---

// Guard Modal helpers
const guardModal = document.getElementById('guard-modal');
function openGuardModal(guard = null) {
  const title = document.getElementById('guard-modal-title');
  const form = document.getElementById('guard-form');
  
  if (guard) {
    title.textContent = 'Edit Guard Profile';
    document.getElementById('guard-form-id').value = guard.id;
    document.getElementById('guard-form-code').value = guard.guard_code;
    document.getElementById('guard-form-name').value = guard.name;
    document.getElementById('guard-form-phone').value = guard.phone || '';
    document.getElementById('guard-form-email').value = guard.email || '';
    document.getElementById('guard-form-age').value = guard.age || 30;
    document.getElementById('guard-form-exp').value = guard.experience || 2;
    document.getElementById('guard-form-gender').value = guard.gender || 'Male';
    document.getElementById('guard-form-preference').value = guard.shift_preference || 'Any';
    document.getElementById('guard-form-off').value = guard.weekly_off || '0';
    document.getElementById('guard-form-status').value = guard.status || 'Available';
  } else {
    title.textContent = 'Add Guard Profile';
    form.reset();
    document.getElementById('guard-form-id').value = '';
  }
  guardModal.classList.remove('hidden');
}

document.getElementById('btn-add-guard').addEventListener('click', () => openGuardModal());
document.getElementById('btn-close-guard-modal').addEventListener('click', () => guardModal.classList.add('hidden'));
document.getElementById('btn-cancel-guard-modal').addEventListener('click', () => guardModal.classList.add('hidden'));

document.getElementById('guard-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('guard-form-id').value;
  const data = {
    guard_code: document.getElementById('guard-form-code').value.trim(),
    name: document.getElementById('guard-form-name').value.trim(),
    phone: document.getElementById('guard-form-phone').value.trim(),
    email: document.getElementById('guard-form-email').value.trim(),
    age: Number(document.getElementById('guard-form-age').value),
    experience: Number(document.getElementById('guard-form-exp').value),
    gender: document.getElementById('guard-form-gender').value,
    shift_preference: document.getElementById('guard-form-preference').value,
    weekly_off: document.getElementById('guard-form-off').value,
    status: document.getElementById('guard-form-status').value,
    availability: document.getElementById('guard-form-status').value === 'Available'
  };

  try {
    if (id) {
      await api.updateGuard(id, data);
      showToast('Guard profile updated successfully.');
    } else {
      await api.createGuard(data);
      showToast('Guard profile created successfully.');
    }
    guardModal.classList.add('hidden');
    await loadStateData();
    renderGuardsView();
  } catch (err) {
    showToast(err.message || 'Action failed', 'error');
  }
});

// Bulk Import Guards
const importModal = document.getElementById('import-modal');
document.getElementById('btn-import-guards').addEventListener('click', () => {
  document.getElementById('import-textarea').value = '';
  importModal.classList.remove('hidden');
});
document.getElementById('btn-close-import-modal').addEventListener('click', () => importModal.classList.add('hidden'));
document.getElementById('btn-cancel-import-modal').addEventListener('click', () => importModal.classList.add('hidden'));

document.getElementById('btn-submit-import').addEventListener('click', async () => {
  const text = document.getElementById('import-textarea').value.trim();
  if (!text) return;

  const names = text.split(/,|\n/).map(n => n.trim()).filter(n => n.length > 0);
  if (names.length === 0) return;

  try {
    // Sequential Code Generation
    let currentMax = STATE.guards.reduce((acc, curr) => {
      const num = parseInt(curr.guard_code.replace(/\D/g, ''), 10);
      return isNaN(num) ? acc : Math.max(acc, num);
    }, 0);

    for (let i = 0; i < names.length; i++) {
      currentMax++;
      const code = `G${String(currentMax).padStart(3, '0')}`;
      const data = {
        guard_code: code,
        name: names[i],
        experience: 2,
        gender: 'Male',
        shift_preference: 'Any',
        weekly_off: '0',
        status: 'Available',
        availability: true
      };
      await api.createGuard(data);
    }

    showToast(`Bulk imported ${names.length} guard profiles.`);
    importModal.classList.add('hidden');
    await loadStateData();
    renderGuardsView();
  } catch (err) {
    showToast(err.message || 'Bulk import failed', 'error');
  }
});

// Location Modal setup
const locationModal = document.getElementById('location-modal');
function openLocationModal(loc = null) {
  const title = document.getElementById('location-modal-title');
  const form = document.getElementById('location-form');
  
  if (loc) {
    title.textContent = 'Edit Location Point';
    document.getElementById('location-form-id').value = loc.id;
    document.getElementById('location-form-name').value = loc.location_name;
    document.getElementById('location-form-count').value = loc.required_guards || 1;
    document.getElementById('location-form-priority').value = loc.priority || 2;
    document.getElementById('location-form-security').value = loc.securityLevel || 'Standard';

    const activeShifts = (loc.shift || 'Morning,Evening,Night').split(',');
    document.getElementById('loc-shift-morning').checked = activeShifts.includes('Morning');
    document.getElementById('loc-shift-evening').checked = activeShifts.includes('Evening');
    document.getElementById('loc-shift-night').checked = activeShifts.includes('Night');
  } else {
    title.textContent = 'Add Location Checkpoint';
    form.reset();
    document.getElementById('location-form-id').value = '';
  }
  locationModal.classList.remove('hidden');
}

document.getElementById('btn-add-location').addEventListener('click', () => openLocationModal());
document.getElementById('btn-close-location-modal').addEventListener('click', () => locationModal.classList.add('hidden'));
document.getElementById('btn-cancel-location-modal').addEventListener('click', () => locationModal.classList.add('hidden'));

document.getElementById('location-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('location-form-id').value;

  const activeShifts = [];
  if (document.getElementById('loc-shift-morning').checked) activeShifts.push('Morning');
  if (document.getElementById('loc-shift-evening').checked) activeShifts.push('Evening');
  if (document.getElementById('loc-shift-night').checked) activeShifts.push('Night');

  const data = {
    location_name: document.getElementById('location-form-name').value.trim(),
    required_guards: Number(document.getElementById('location-form-count').value),
    priority: Number(document.getElementById('location-form-priority').value),
    securityLevel: document.getElementById('location-form-security').value,
    shift: activeShifts.join(','),
    status: 'Active'
  };

  try {
    if (id) {
      await api.updateLocation(id, data);
      showToast('Location updated successfully.');
    } else {
      await api.createLocation(data);
      showToast('Location added successfully.');
    }
    locationModal.classList.add('hidden');
    await loadStateData();
    renderLocationsView();
  } catch (err) {
    showToast(err.message || 'Action failed', 'error');
  }
});

// Reassign Modal actions
const reassignModal = document.getElementById('reassign-modal');
document.getElementById('btn-close-reassign-modal').addEventListener('click', () => reassignModal.classList.add('hidden'));
document.getElementById('btn-cancel-reassign-modal').addEventListener('click', () => reassignModal.classList.add('hidden'));

document.getElementById('btn-submit-reassign').addEventListener('click', async () => {
  const locId = document.getElementById('reassign-location-id').value;
  const shift = document.getElementById('reassign-shift').value;
  const guardId = document.getElementById('reassign-guard-select').value;

  if (!guardId) return;

  const selectedGuard = STATE.guards.find(g => g.id === Number(guardId));
  const activeAssignment = STATE.roster.find(a => a.location_id === Number(locId) && a.shift === shift);
  
  if (activeAssignment) {
    // Modify local assignments
    activeAssignment.guard_id = selectedGuard.id;
    activeAssignment.guard_name = selectedGuard.name;
    activeAssignment.guard_code = selectedGuard.guard_code;
    activeAssignment.status = 'Assigned';
  } else {
    // Add new manually
    STATE.roster.push({
      location_id: Number(locId),
      shift: shift,
      guard_id: selectedGuard.id,
      guard_name: selectedGuard.name,
      guard_code: selectedGuard.guard_code,
      status: 'Assigned'
    });
  }

  showToast(`Override saved. Guard ${selectedGuard.name} assigned.`);
  reassignModal.classList.add('hidden');
  renderDutyView();
});

document.getElementById('btn-remove-assignment').addEventListener('click', () => {
  const locId = Number(document.getElementById('reassign-location-id').value);
  const shift = document.getElementById('reassign-shift').value;

  const matchIndex = STATE.roster.findIndex(a => a.location_id === locId && a.shift === shift);
  if (matchIndex !== -1) {
    STATE.roster[matchIndex].guard_id = null;
    STATE.roster[matchIndex].guard_name = null;
    STATE.roster[matchIndex].guard_code = null;
    STATE.roster[matchIndex].status = 'Vacant';
  }

  showToast('Assignment cleared.');
  reassignModal.classList.add('hidden');
  renderDutyView();
});

// Leave Request Modal setup
const leaveModal = document.getElementById('leave-modal');
document.getElementById('btn-apply-leave').addEventListener('click', () => {
  const guardSelect = document.getElementById('leave-form-guard');
  guardSelect.innerHTML = `<option value="">-- Select Guard --</option>`;
  STATE.guards.forEach(g => {
    guardSelect.innerHTML += `<option value="${g.id}">${g.name} (${g.guard_code})</option>`;
  });
  
  // Set default dates
  document.getElementById('leave-form-start').value = STATE.activeDate;
  document.getElementById('leave-form-end').value = STATE.activeDate;
  
  leaveModal.classList.remove('hidden');
});
document.getElementById('btn-close-leave-modal').addEventListener('click', () => leaveModal.classList.add('hidden'));
document.getElementById('btn-cancel-leave-modal').addEventListener('click', () => leaveModal.classList.add('hidden'));

document.getElementById('leave-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    guard_id: Number(document.getElementById('leave-form-guard').value),
    leave_date: document.getElementById('leave-form-start').value, // Uses start date
    reason: document.getElementById('leave-form-reason').value.trim(),
    status: 'Pending'
  };

  try {
    await api.createLeave(data);
    showToast('Leave request submitted.');
    leaveModal.classList.add('hidden');
    await loadStateData();
    renderLeavesView();
  } catch (err) {
    showToast(err.message || 'Action failed', 'error');
  }
});

// User Modal (Add User)
const userModal = document.getElementById('user-modal');
document.getElementById('btn-add-user')?.addEventListener('click', () => {
  document.getElementById('user-form').reset();
  userModal.classList.remove('hidden');
});
document.getElementById('btn-close-user-modal').addEventListener('click', () => userModal.classList.add('hidden'));
document.getElementById('btn-cancel-user-modal').addEventListener('click', () => userModal.classList.add('hidden'));

document.getElementById('user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('user-form-username').value.trim();
  const passcode = document.getElementById('user-form-passcode').value;
  const name = document.getElementById('user-form-name').value.trim();
  const role = document.getElementById('user-form-role').value;
  const email = document.getElementById('user-form-email').value.trim();

  try {
    await api.createUser(username, passcode, name, role, email);
    showToast('User created successfully.');
    userModal.classList.add('hidden');
    renderUsersView();
  } catch (err) {
    showToast(err.message || 'Action failed', 'error');
  }
});

// Save Settings Form
document.getElementById('settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const shiftTimings = {
    Morning: {
      start: document.getElementById('set-shift-morning-start').value,
      end: document.getElementById('set-shift-morning-end').value
    },
    Evening: {
      start: document.getElementById('set-shift-evening-start').value,
      end: document.getElementById('set-shift-evening-end').value
    },
    Night: {
      start: document.getElementById('set-shift-night-start').value,
      end: document.getElementById('set-shift-night-end').value
    }
  };

  const rotationRules = {
    maxConsecutiveDuties: Number(document.getElementById('set-consec-days').value),
    maxNightShiftsPerWeek: Number(document.getElementById('set-night-limit').value),
    restHoursBetweenShifts: Number(document.getElementById('set-rest-hours').value)
  };

  const holidayCalendar = STATE.settings.holidayCalendar || [];

  // Update API Base URL in local config
  const newApiUrl = document.getElementById('set-api-url').value.trim();
  CONFIG.setApiUrl(newApiUrl);

  try {
    await api.saveSettings(shiftTimings, rotationRules, holidayCalendar);
    showToast('Timings and rotation caps saved successfully.');
    await loadStateData();
  } catch (err) {
    showToast(err.message || 'Action failed', 'error');
  }
});

// Timetable Auto generation event binding
document.getElementById('btn-generate-roster').addEventListener('click', async () => {
  const btn = document.getElementById('btn-generate-roster');
  btn.disabled = true;
  btn.textContent = t('language') === 'mr' ? 'नियोजन तयार करत आहे...' : 'Generating Roster...';

  try {
    // 1. Gather locked cells
    const lockedAssignments = [];
    STATE.roster.forEach(a => {
      if (a.status === 'Locked' && a.guard_id) {
        lockedAssignments.push({
          location_id: a.location_id,
          shift: a.shift,
          guard_id: a.guard_id,
          guard_name: a.guard_name
        });
      }
    });

    // 2. Call Worker generator endpoint
    const res = await api.generateRoster(STATE.activeDate, lockedAssignments, false);
    
    // 3. Format and update STATE.roster
    const newRoster = [];
    Object.entries(res.roster).forEach(([locId, shifts]) => {
      Object.entries(shifts).forEach(([shift, info]) => {
        if (info) {
          const guard = STATE.guards.find(g => g.id === Number(info.guard_id));
          newRoster.push({
            location_id: Number(locId),
            shift: shift,
            guard_id: info.guard_id,
            guard_name: info.guard_name,
            guard_code: guard ? guard.guard_code : '??',
            status: info.locked ? 'Locked' : 'Assigned'
          });
        }
      });
    });

    STATE.roster = newRoster;
    showToast('Roster timetable generated. Review conflicts and save.');
    
    renderDutyView();
  } catch (err) {
    showToast(err.message || 'Generation failed', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = t('autoAllocate');
  }
});

// Save Roster assignments to database
document.getElementById('btn-save-duty').addEventListener('click', async () => {
  const btn = document.getElementById('btn-save-duty');
  btn.disabled = true;
  
  const formatted = STATE.roster.map(a => ({
    guard_id: a.guard_id || null,
    location_id: a.location_id,
    shift: a.shift,
    status: a.status || 'Assigned'
  }));

  try {
    await api.saveAssignments(STATE.activeDate, formatted);
    showToast('Daily duty schedule saved successfully.');
    await loadStateData();
    renderDutyView();
  } catch (err) {
    showToast(err.message || 'Failed to save', 'error');
  } finally {
    btn.disabled = false;
  }
});

// Date pickers event triggers
document.getElementById('roster-date-picker').addEventListener('change', async (e) => {
  STATE.activeDate = e.target.value;
  document.getElementById('attendance-date-picker').value = STATE.activeDate;
  document.getElementById('report-date').value = STATE.activeDate;
  
  await loadStateData();
  renderDutyView();
});

document.getElementById('attendance-date-picker').addEventListener('change', async (e) => {
  STATE.activeDate = e.target.value;
  document.getElementById('roster-date-picker').value = STATE.activeDate;
  document.getElementById('report-date').value = STATE.activeDate;

  await loadStateData();
  renderAvailabilityView();
});

// Attendance Save trigger
document.getElementById('btn-save-attendance').addEventListener('click', async () => {
  const btn = document.getElementById('btn-save-attendance');
  btn.disabled = true;

  const selects = document.querySelectorAll('.attendance-select');
  const records = [];

  selects.forEach(select => {
    const guardId = select.getAttribute('data-guard-id');
    const status = select.value;
    records.push({
      guard_id: Number(guardId),
      status
    });
  });

  try {
    // Updates status call for each guard and marks base status
    for (let record of records) {
      const g = STATE.guards.find(guard => guard.id === record.guard_id);
      if (g && g.status !== record.status) {
        g.status = record.status;
        await api.updateGuard(g.id, g);
      }
    }
    showToast('Daily attendance saved and profiles updated.');
    await loadStateData();
    renderAvailabilityView();
  } catch (err) {
    showToast(err.message || 'Failed to save attendance', 'error');
  } finally {
    btn.disabled = false;
  }
});

// Guard search and filters triggers
document.getElementById('guard-search-input').addEventListener('keyup', renderGuardsView);
document.getElementById('guard-filter-status').addEventListener('change', renderGuardsView);
document.getElementById('guard-filter-shift').addEventListener('change', renderGuardsView);

// Populate status filters dynamically
function populateGuardFilterSelects() {
  const statusSelect = document.getElementById('guard-filter-status');
  const shiftSelect = document.getElementById('guard-filter-shift');

  statusSelect.innerHTML = `
    <option value="All">All Statuses</option>
    <option value="Available">Available</option>
    <option value="Leave">On Leave</option>
    <option value="Absent">Absent</option>
    <option value="Training">Training</option>
    <option value="Medical">Medical</option>
  `;

  shiftSelect.innerHTML = `
    <option value="All">All Shifts</option>
    <option value="Morning">Morning Preference</option>
    <option value="Evening">Evening Preference</option>
    <option value="Night">Night Preference</option>
    <option value="Any">Any preference</option>
  `;
}
populateGuardFilterSelects();

// Search locations list
document.getElementById('location-search-input').addEventListener('keyup', renderLocationsView);

// Printing timetable list
document.getElementById('btn-print-duty').addEventListener('click', () => {
  exporter.printTimetable('roster-table-parent', `Guard Duty Schedule - Date: ${STATE.activeDate}`);
});

// Reports Generation logic handler
document.getElementById('btn-run-report').addEventListener('click', () => {
  const type = document.getElementById('report-type-select').value;
  const date = document.getElementById('report-date').value;
  const preview = document.getElementById('report-preview-container');
  const title = document.getElementById('report-preview-title');
  const lang = localStorage.getItem('language') || 'en';

  if (type === 'daily') {
    title.textContent = `Report: Daily Duty Roster - ${date}`;
    api.getAssignments(date).then(roster => {
      if (!roster || roster.length === 0) {
        preview.innerHTML = '<p class="text-xs text-muted-foreground">No duty roster assignments created on this date.</p>';
        return;
      }

      let html = `
        <table class="roster-table text-xs">
          <thead>
            <tr>
              <th>Location Checkpoint</th>
              <th>Morning Shift</th>
              <th>Evening Shift</th>
              <th>Night Shift</th>
            </tr>
          </thead>
          <tbody>
      `;

      STATE.locations.forEach(loc => {
        html += `
          <tr>
            <td class="font-semibold">${translateContent(loc.location_name, lang)}</td>
        `;

        ['Morning', 'Evening', 'Night'].forEach(shift => {
          const match = roster.find(r => r.location_id === loc.id && r.shift === shift);
          const name = match && match.guard_name ? translateContent(match.guard_name, lang) : 'Vacant';
          html += `<td>${name}</td>`;
        });

        html += `</tr>`;
      });

      html += `</tbody></table>`;
      preview.innerHTML = html;
    });
  } else if (type === 'utilization') {
    title.textContent = `Report: Guard Utilization Stats`;
    // Generate simple workload preview from state history
    let html = `
      <table class="roster-table text-xs">
        <thead>
          <tr>
            <th>Guard Name</th>
            <th>Guard Code</th>
            <th>Department</th>
            <th>Status</th>
            <th>Workload (Duties last 14d)</th>
          </tr>
        </thead>
        <tbody>
    `;

    STATE.guards.forEach(g => {
      // Calculate workload count from history
      const totalDuties = STATE.history.filter(h => Number(h.guard_id) === Number(g.id)).length;
      html += `
        <tr>
          <td class="font-semibold">${translateContent(g.name, lang)}</td>
          <td>${g.guard_code}</td>
          <td>${translateContent(g.department, lang)}</td>
          <td>${translateContent(g.status, lang)}</td>
          <td class="text-center font-bold">${totalDuties}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    preview.innerHTML = html;
  } else if (type === 'occupancy') {
    title.textContent = `Report: Location Occupancy`;
    let html = `
      <table class="roster-table text-xs">
        <thead>
          <tr>
            <th>Checkpoint Location</th>
            <th>Required Guards count</th>
            <th>Active Shift nodes</th>
            <th>Overall Status</th>
          </tr>
        </thead>
        <tbody>
    `;

    STATE.locations.forEach(loc => {
      html += `
        <tr>
          <td class="font-semibold">${translateContent(loc.location_name, lang)}</td>
          <td class="text-center">${loc.required_guards}</td>
          <td>${loc.shift}</td>
          <td><span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase">ACTIVE</span></td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    preview.innerHTML = html;
  }
});

// CSV Export trigger
document.getElementById('btn-export-csv').addEventListener('click', () => {
  const type = document.getElementById('report-type-select').value;
  const date = document.getElementById('report-date').value;
  const lang = localStorage.getItem('language') || 'en';

  if (type === 'daily') {
    api.getAssignments(date).then(roster => {
      const headers = ['Checkpoint Point', 'Morning shift', 'Evening shift', 'Night shift'];
      const rows = STATE.locations.map(loc => {
        const line = [translateContent(loc.location_name, lang)];
        ['Morning', 'Evening', 'Night'].forEach(shift => {
          const match = roster.find(r => r.location_id === loc.id && r.shift === shift);
          line.push(match && match.guard_name ? translateContent(match.guard_name, lang) : 'Vacant');
        });
        return line;
      });
      exporter.exportToCSV(`duty_roster_${date}.csv`, headers, rows);
    });
  } else if (type === 'utilization') {
    const headers = ['Guard Name', 'Guard Code', 'Department', 'Experience', 'Status'];
    const rows = STATE.guards.map(g => [
      translateContent(g.name, lang),
      g.guard_code,
      translateContent(g.department, lang),
      g.experience,
      translateContent(g.status, lang)
    ]);
    exporter.exportToCSV('guard_utilization_report.csv', headers, rows);
  }
});

// Print Report preview
document.getElementById('btn-print-report').addEventListener('click', () => {
  const title = document.getElementById('report-preview-title').textContent;
  exporter.printTimetable('report-preview-container', title);
});
