// ============================================
// BelediyeApp Admin Dashboard — Application JS
// ============================================

const API_BASE = 'http://localhost:8080/api/v1';

// ── State ──────────────────────────────────
let token = localStorage.getItem('token') || '';
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
let currentPage = 'dashboard';
let reportPage = 0;

// ── Helpers ────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (res.status === 401) { logout(); throw new Error('Oturum süresi doldu'); }
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Hata oluştu');
  return json.data;
}

function toast(msg, type = 'success') {
  const c = $('#toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="material-icons-round">${type === 'success' ? 'check_circle' : 'error'}</span><span class="toast-text">${msg}</span>`;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function statusLabel(s) {
  const map = { PENDING: 'Bekleyen', PROCESSING: 'İşleniyor', RESOLVED: 'Çözüldü', REJECTED: 'Reddedildi' };
  return map[s] || s;
}

function roleLabel(r) {
  const map = { ROLE_CITIZEN: 'Vatandaş', ROLE_FIELD_OFFICER: 'Saha Görevlisi', ROLE_DEPT_MANAGER: 'Birim Müdürü', ROLE_ADMIN: 'Yönetici', ROLE_SUPER_ADMIN: 'Süper Admin' };
  return map[r] || r;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Auth ───────────────────────────────────
$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#login-error');
  errEl.classList.add('hidden');
  const btn = $('#login-btn');
  btn.querySelector('.btn-text').textContent = 'Giriş yapılıyor...';
  btn.disabled = true;
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: $('#login-email').value, password: $('#login-password').value })
    });
    token = data.accessToken;
    currentUser = data;
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(data));
    showApp();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  } finally {
    btn.querySelector('.btn-text').textContent = 'Giriş Yap';
    btn.disabled = false;
  }
});

function logout() {
  token = '';
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  $('#app').classList.add('hidden');
  $('#login-screen').classList.remove('hidden');
}

$('#logout-btn').addEventListener('click', () => {
  api('/auth/logout', { method: 'POST' }).catch(() => {});
  logout();
});

// ── App Init ───────────────────────────────
function showApp() {
  $('#login-screen').classList.add('hidden');
  $('#app').classList.remove('hidden');
  if (currentUser) {
    $('#user-name').textContent = currentUser.fullName || 'Admin';
    const mainRole = (currentUser.roles || [])[0];
    $('#user-role').textContent = roleLabel(mainRole);
    $('#user-avatar').textContent = (currentUser.fullName || 'A')[0].toUpperCase();
  }
  navigateTo('dashboard');
}

// ── Navigation ─────────────────────────────
function navigateTo(page) {
  currentPage = page;
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.nav-item').forEach(n => n.classList.remove('active'));
  $(`#page-${page}`)?.classList.add('active');
  $(`[data-page="${page}"]`)?.classList.add('active');
  const titles = { dashboard: 'Dashboard', reports: 'Raporlar', users: 'Kullanıcılar', departments: 'Departmanlar', categories: 'Kategoriler' };
  $('#page-title').textContent = titles[page] || page;
  // Close mobile sidebar
  $('#sidebar').classList.remove('mobile-open');
  // Load page data
  if (page === 'dashboard') loadDashboard();
  else if (page === 'reports') { reportPage = 0; loadReports(); }
  else if (page === 'users') loadUsers();
  else if (page === 'departments') loadDepartments();
  else if (page === 'categories') loadCategories();
}

$$('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo(item.dataset.page);
  });
});
$$('.card-link[data-page]').forEach(link => {
  link.addEventListener('click', (e) => { e.preventDefault(); navigateTo(link.dataset.page); });
});

// Sidebar toggle
$('#sidebar-toggle').addEventListener('click', () => $('#sidebar').classList.toggle('collapsed'));
$('#mobile-menu-btn').addEventListener('click', () => $('#sidebar').classList.toggle('mobile-open'));

// ── Dashboard ──────────────────────────────
async function loadDashboard() {
  try {
    const stats = await api('/dashboard/stats');
    $('#stat-total').textContent = stats.totalReports;
    $('#stat-pending').textContent = stats.pendingReports;
    $('#stat-processing').textContent = stats.processingReports;
    $('#stat-resolved').textContent = stats.resolvedReports;
    $('#stat-rejected').textContent = stats.rejectedReports;
    $('#stat-users').textContent = stats.totalUsers;
  } catch (e) {
    console.error('Dashboard yüklenemedi:', e);
  }
  // Recent reports
  try {
    const data = await api('/reports?size=5&sort=createdAt,desc');
    const list = data.content || [];
    const el = $('#recent-reports-list');
    if (!list.length) { el.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1rem">Henüz rapor yok</p>'; return; }
    el.innerHTML = list.map(r => `
      <div class="report-list-item">
        <div>
          <div class="report-list-title">${r.title}</div>
          <div class="report-list-meta">${r.categoryName || '—'} • ${fmtDate(r.createdAt)}</div>
        </div>
        <span class="status-badge status-${r.status}">${statusLabel(r.status)}</span>
      </div>`).join('');
  } catch (e) {
    $('#recent-reports-list').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1rem">Raporlar yüklenemedi</p>';
  }
}

// ── Reports ────────────────────────────────
$('#report-status-filter').addEventListener('change', () => { reportPage = 0; loadReports(); });

async function loadReports() {
  const status = $('#report-status-filter').value;
  const statusQ = status ? `&status=${status}` : '';
  try {
    const data = await api(`/reports?page=${reportPage}&size=15&sort=createdAt,desc${statusQ}`);
    const list = data.content || [];
    const tbody = $('#reports-tbody');
    const empty = $('#reports-empty');
    if (!list.length) { tbody.innerHTML = ''; empty.classList.remove('hidden'); renderPagination(data); return; }
    empty.classList.add('hidden');
    tbody.innerHTML = list.map(r => `
      <tr>
        <td><strong>${r.title}</strong></td>
        <td>${r.categoryName || '—'}</td>
        <td><span class="status-badge status-${r.status}">${statusLabel(r.status)}</span></td>
        <td>${fmtDate(r.createdAt)}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="viewReport('${r.id}')">
            <span class="material-icons-round" style="font-size:15px">visibility</span> Detay
          </button>
        </td>
      </tr>`).join('');
    renderPagination(data);
  } catch (e) {
    toast('Raporlar yüklenemedi: ' + e.message, 'error');
  }
}

function renderPagination(pageData) {
  const el = $('#reports-pagination');
  if (!pageData || pageData.totalPages <= 1) { el.innerHTML = ''; return; }
  let html = `<button ${pageData.first ? 'disabled' : ''} onclick="goPage(${reportPage - 1})">‹</button>`;
  for (let i = 0; i < pageData.totalPages; i++) {
    html += `<button class="${i === reportPage ? 'active' : ''}" onclick="goPage(${i})">${i + 1}</button>`;
  }
  html += `<button ${pageData.last ? 'disabled' : ''} onclick="goPage(${reportPage + 1})">›</button>`;
  el.innerHTML = html;
}
window.goPage = (p) => { reportPage = p; loadReports(); };

// ── Report Detail ──────────────────────────
window.viewReport = async (id) => {
  try {
    const r = await api(`/reports/${id}`);
    $('#report-detail-body').innerHTML = `
      <div class="detail-grid">
        <div class="detail-item detail-full"><div class="detail-label">Başlık</div><div class="detail-value">${r.title}</div></div>
        <div class="detail-item detail-full"><div class="detail-label">Açıklama</div><div class="detail-value">${r.description}</div></div>
        <div class="detail-item"><div class="detail-label">Durum</div><div class="detail-value"><span class="status-badge status-${r.status}">${statusLabel(r.status)}</span></div></div>
        <div class="detail-item"><div class="detail-label">Kategori</div><div class="detail-value">${r.categoryName || '—'}</div></div>
        <div class="detail-item"><div class="detail-label">Raporlayan</div><div class="detail-value">${r.reporterFullName || '—'}</div></div>
        <div class="detail-item"><div class="detail-label">Atanan Görevli</div><div class="detail-value">${r.assigneeFullName || 'Henüz atanmadı'}</div></div>
        <div class="detail-item"><div class="detail-label">Konum</div><div class="detail-value">${r.latitude?.toFixed(5) || '—'}, ${r.longitude?.toFixed(5) || '—'}</div></div>
        <div class="detail-item"><div class="detail-label">Oluşturulma</div><div class="detail-value">${fmtDate(r.createdAt)}</div></div>
      </div>`;
    // Footer actions
    let footer = '';
    if (r.status === 'PENDING' || r.status === 'PROCESSING') {
      footer += `<select id="modal-status-select" class="form-select" style="max-width:180px">
        <option value="">Durum Değiştir</option>
        ${r.status === 'PENDING' ? '<option value="PROCESSING">İşleniyor</option>' : ''}
        <option value="RESOLVED">Çözüldü</option>
        <option value="REJECTED">Reddedildi</option>
      </select>
      <button class="btn btn-primary btn-sm" onclick="updateReportStatus('${r.id}')">Güncelle</button>`;
    }
    $('#report-detail-footer').innerHTML = footer;
    $('#report-detail-modal').classList.remove('hidden');
  } catch (e) {
    toast('Rapor detayı yüklenemedi', 'error');
  }
};

window.updateReportStatus = async (id) => {
  const sel = $('#modal-status-select');
  if (!sel || !sel.value) return;
  try {
    await api(`/reports/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: sel.value, note: 'Dashboard üzerinden güncellendi' }) });
    toast('Rapor durumu güncellendi');
    $('#report-detail-modal').classList.add('hidden');
    loadReports();
    loadDashboard();
  } catch (e) { toast(e.message, 'error'); }
};

$('#close-report-modal').addEventListener('click', () => $('#report-detail-modal').classList.add('hidden'));

// ── Users ──────────────────────────────────
async function loadUsers() {
  try {
    const list = await api('/users');
    const tbody = $('#users-tbody');
    tbody.innerHTML = list.map(u => `
      <tr>
        <td><strong>${u.firstName} ${u.lastName}</strong></td>
        <td>${u.email}</td>
        <td>${(u.roles || []).map(r => `<span class="role-badge">${roleLabel(r)}</span>`).join('')}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="toggleUser('${u.id}')">
            <span class="material-icons-round" style="font-size:15px">swap_horiz</span>
          </button>
        </td>
      </tr>`).join('');
  } catch (e) { toast('Kullanıcılar yüklenemedi', 'error'); }
}

window.toggleUser = async (id) => {
  try {
    await api(`/users/${id}/toggle-enabled`, { method: 'PATCH' });
    toast('Kullanıcı durumu güncellendi');
    loadUsers();
  } catch (e) { toast(e.message, 'error'); }
};

// Create Staff
$('#add-staff-btn').addEventListener('click', () => {
  loadDepartmentsDropdown('staff-department');
  $('#create-staff-modal').classList.remove('hidden');
});
$('#close-staff-modal').addEventListener('click', () => $('#create-staff-modal').classList.add('hidden'));
$('#cancel-staff-btn').addEventListener('click', () => $('#create-staff-modal').classList.add('hidden'));

$('#create-staff-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#staff-error');
  errEl.classList.add('hidden');
  const roles = [...$$('#staff-roles input:checked')].map(c => c.value);
  if (!roles.length) roles.push('ROLE_CITIZEN');
  try {
    await api('/users', {
      method: 'POST',
      body: JSON.stringify({
        firstName: $('#staff-firstname').value,
        lastName: $('#staff-lastname').value,
        email: $('#staff-email').value,
        password: $('#staff-password').value,
        phoneNumber: $('#staff-phone').value || null,
        roleNames: roles,
        departmentId: $('#staff-department').value || null
      })
    });
    toast('Personel oluşturuldu');
    $('#create-staff-modal').classList.add('hidden');
    $('#create-staff-form').reset();
    loadUsers();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
});

// ── Departments ────────────────────────────
async function loadDepartments() {
  try {
    const list = await api('/departments');
    const tbody = $('#departments-tbody');
    tbody.innerHTML = list.map(d => `
      <tr>
        <td><strong>${d.name}</strong></td>
        <td>${d.description || '—'}</td>
        <td><span class="status-badge ${d.active ? 'status-RESOLVED' : 'status-REJECTED'}">${d.active ? 'Aktif' : 'Pasif'}</span></td>
        <td>
          ${d.active ? `<button class="btn btn-danger btn-sm" onclick="deleteDept('${d.id}')">
            <span class="material-icons-round" style="font-size:15px">delete</span>
          </button>` : ''}
        </td>
      </tr>`).join('');
  } catch (e) { toast('Departmanlar yüklenemedi', 'error'); }
}

window.deleteDept = async (id) => {
  if (!confirm('Bu departmanı pasife almak istediğinize emin misiniz?')) return;
  try {
    await api(`/departments/${id}`, { method: 'DELETE' });
    toast('Departman devre dışı bırakıldı');
    loadDepartments();
  } catch (e) { toast(e.message, 'error'); }
};

$('#add-dept-btn').addEventListener('click', () => $('#create-dept-modal').classList.remove('hidden'));
$('#close-dept-modal').addEventListener('click', () => $('#create-dept-modal').classList.add('hidden'));
$('#cancel-dept-btn').addEventListener('click', () => $('#create-dept-modal').classList.add('hidden'));

$('#create-dept-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#dept-error');
  errEl.classList.add('hidden');
  try {
    await api('/departments', {
      method: 'POST',
      body: JSON.stringify({ name: $('#dept-name').value, description: $('#dept-description').value || null })
    });
    toast('Departman oluşturuldu');
    $('#create-dept-modal').classList.add('hidden');
    $('#create-dept-form').reset();
    loadDepartments();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
});

// ── Categories ─────────────────────────────
async function loadCategories() {
  try {
    const list = await api('/categories/all');
    const tbody = $('#categories-tbody');
    tbody.innerHTML = list.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.description || '—'}</td>
        <td>${c.iconCode ? `<span class="material-icons-round" style="font-size:18px">${c.iconCode}</span>` : '—'}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteCategory('${c.id}')">
            <span class="material-icons-round" style="font-size:15px">delete</span>
          </button>
        </td>
      </tr>`).join('');
  } catch (e) { toast('Kategoriler yüklenemedi', 'error'); }
}

window.deleteCategory = async (id) => {
  if (!confirm('Bu kategoriyi devre dışı bırakmak istediğinize emin misiniz?')) return;
  try {
    await api(`/categories/${id}`, { method: 'DELETE' });
    toast('Kategori devre dışı bırakıldı');
    loadCategories();
  } catch (e) { toast(e.message, 'error'); }
};

$('#add-category-btn').addEventListener('click', () => {
  loadDepartmentsDropdown('category-department');
  $('#create-category-modal').classList.remove('hidden');
});
$('#close-category-modal').addEventListener('click', () => $('#create-category-modal').classList.add('hidden'));
$('#cancel-category-btn').addEventListener('click', () => $('#create-category-modal').classList.add('hidden'));

$('#create-category-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#category-error');
  errEl.classList.add('hidden');
  try {
    await api('/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: $('#category-name').value,
        description: $('#category-description').value || null,
        iconCode: $('#category-icon').value || null,
        departmentId: $('#category-department').value || null
      })
    });
    toast('Kategori oluşturuldu');
    $('#create-category-modal').classList.add('hidden');
    $('#create-category-form').reset();
    loadCategories();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
});

// ── Shared Helpers ─────────────────────────
async function loadDepartmentsDropdown(selectId) {
  try {
    const list = await api('/departments');
    const sel = $(`#${selectId}`);
    sel.innerHTML = '<option value="">Seçiniz (Opsiyonel)</option>';
    list.filter(d => d.active).forEach(d => {
      sel.innerHTML += `<option value="${d.id}">${d.name}</option>`;
    });
  } catch (e) { /* ignore */ }
}

// ── Bootstrap ──────────────────────────────
if (token && currentUser) {
  showApp();
} else {
  $('#login-screen').classList.remove('hidden');
}
