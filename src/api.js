// FieldOps API Service
// Connects the frontend to your real Railway backend

const API_URL = process.env.REACT_APP_API_URL || 'https://fieldops-api-production-a1b2.com/v1';

// ── Token helpers ─────────────────────────────────────────────
export function getToken() {
  return localStorage.getItem('fieldops_token');
}

export function setToken(token) {
  localStorage.setItem('fieldops_token', token);
}

export function clearToken() {
  localStorage.removeItem('fieldops_token');
  localStorage.removeItem('fieldops_user');
}

export function getUser() {
  const u = localStorage.getItem('fieldops_user');
  return u ? JSON.parse(u) : null;
}

export function setUser(user) {
  localStorage.setItem('fieldops_user', JSON.stringify(user));
}

// ── Base fetch wrapper ────────────────────────────────────────
async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || 'Something went wrong');
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────────────
export async function login(email, password) {
  const data = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.data.token);
  setUser(data.data.user);
  return data.data;
}

export async function register(companyName, name, email, password) {
  const data = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      company_name: companyName,
      name,
      email,
      password,
    }),
  });
  setToken(data.data.token);
  setUser(data.data.user);
  return data.data;
}

export function logout() {
  clearToken();
  window.location.reload();
}

// ── Company ───────────────────────────────────────────────────
export async function getCompanyStats() {
  const data = await api('/company/stats');
  return data.data;
}

// ── Customers ─────────────────────────────────────────────────
export async function getCustomers(params = {}) {
  const query = new URLSearchParams(params).toString();
  const data = await api(`/customers?${query}`);
  return data.data;
}

export async function getCustomer(id) {
  const data = await api(`/customers/${id}`);
  return data.data;
}

export async function createCustomer(customerData) {
  const data = await api('/customers', {
    method: 'POST',
    body: JSON.stringify(customerData),
  });
  return data.data;
}

export async function updateCustomer(id, updates) {
  const data = await api(`/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data.data;
}

// ── Jobs ──────────────────────────────────────────────────────
export async function getJobs(params = {}) {
  const query = new URLSearchParams(params).toString();
  const data = await api(`/jobs?${query}`);
  return data.data;
}

export async function getJob(id) {
  const data = await api(`/jobs/${id}`);
  return data.data;
}

export async function createJob(jobData) {
  const data = await api('/jobs', {
    method: 'POST',
    body: JSON.stringify(jobData),
  });
  return data.data;
}

export async function updateJobStatus(id, status) {
  const data = await api(`/jobs/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return data.data;
}

export async function assignTechnician(jobId, technicianIds) {
  const data = await api(`/jobs/${jobId}/assignments`, {
    method: 'POST',
    body: JSON.stringify({ technician_ids: technicianIds }),
  });
  return data.data;
}

export async function clockIn(jobId) {
  const data = await api(`/jobs/${jobId}/time-entries`, {
    method: 'POST',
    body: JSON.stringify({ action: 'clock_in' }),
  });
  return data.data;
}

export async function clockOut(jobId, notes) {
  const data = await api(`/jobs/${jobId}/time-entries`, {
    method: 'POST',
    body: JSON.stringify({ action: 'clock_out', notes }),
  });
  return data.data;
}

export async function addJobPhoto(jobId, url, caption) {
  const data = await api(`/jobs/${jobId}/photos`, {
    method: 'POST',
    body: JSON.stringify({ url, caption }),
  });
  return data.data;
}

export async function saveSignature(jobId, signature) {
  const data = await api(`/jobs/${jobId}/signature`, {
    method: 'POST',
    body: JSON.stringify({ signature }),
  });
  return data.data;
}

// ── Dispatch ──────────────────────────────────────────────────
export async function getDispatch(date) {
  const data = await api(`/dispatch?date=${date}`);
  return data.data;
}

// ── Invoices ──────────────────────────────────────────────────
export async function getInvoices(params = {}) {
  const query = new URLSearchParams(params).toString();
  const data = await api(`/invoices?${query}`);
  return data.data;
}

export async function getInvoice(id) {
  const data = await api(`/invoices/${id}`);
  return data.data;
}

export async function collectPayment(invoiceId, paymentData) {
  const data = await api(`/invoices/${invoiceId}/payments`, {
    method: 'POST',
    body: JSON.stringify(paymentData),
  });
  return data.data;
}

// ── Users ─────────────────────────────────────────────────────
export async function getUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  const data = await api(`/users?${query}`);
  return data.data;
}

export async function createUser(userData) {
  const data = await api('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  return data.data;
}

// ── Reports ───────────────────────────────────────────────────
export async function getRevenueReport(params = {}) {
  const query = new URLSearchParams(params).toString();
  const data = await api(`/reports/revenue?${query}`);
  return data.data;
}

export async function getJobsReport(params = {}) {
  const query = new URLSearchParams(params).toString();
  const data = await api(`/reports/jobs?${query}`);
  return data.data;
}
