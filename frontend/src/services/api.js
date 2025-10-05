const API_URL = '/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  async login(username, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return response.json();
  },

  async register(userData) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  async getPatients() {
    const response = await fetch(`${API_URL}/patients`, {
      headers: getAuthHeader()
    });
    return response.json();
  },

  async getPatientById(id) {
    const response = await fetch(`${API_URL}/patients/${id}`, {
      headers: getAuthHeader()
    });
    return response.json();
  },

  async createPatient(data) {
    const response = await fetch(`${API_URL}/patients`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updatePatient(id, data) {
    const response = await fetch(`${API_URL}/patients/${id}`, {
      method: 'PUT',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deletePatient(id) {
    const response = await fetch(`${API_URL}/patients/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    return response.json();
  },

  async archivePatient(id, archived) {
    const response = await fetch(`${API_URL}/patients/${id}/archive`, {
      method: 'PUT',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived })
    });
    return response.json();
  },

  async getAppointments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/appointments?${queryString}`, {
      headers: getAuthHeader()
    });
    return response.json();
  },

  async createAppointment(data) {
    const response = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateAppointment(id, data) {
    const response = await fetch(`${API_URL}/appointments/${id}`, {
      method: 'PUT',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async getTreatments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/treatments?${queryString}`, {
      headers: getAuthHeader()
    });
    return response.json();
  },

  async createTreatment(data) {
    const response = await fetch(`${API_URL}/treatments`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateTreatment(id, data) {
    const response = await fetch(`${API_URL}/treatments/${id}`, {
      method: 'PUT',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteTreatment(id) {
    const response = await fetch(`${API_URL}/treatments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    return response.json();
  },

  async getMedications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/medications?${queryString}`, {
      headers: getAuthHeader()
    });
    return response.json();
  },

  async createMedication(data) {
    const response = await fetch(`${API_URL}/medications`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateMedication(id, data) {
    const response = await fetch(`${API_URL}/medications/${id}`, {
      method: 'PUT',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteMedication(id) {
    const response = await fetch(`${API_URL}/medications/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    return response.json();
  },

  async getSuppliers() {
    const response = await fetch(`${API_URL}/suppliers`, {
      headers: getAuthHeader()
    });
    return response.json();
  },

  async createSupplier(data) {
    const response = await fetch(`${API_URL}/suppliers`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateSupplier(id, data) {
    const response = await fetch(`${API_URL}/suppliers/${id}`, {
      method: 'PUT',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteSupplier(id) {
    const response = await fetch(`${API_URL}/suppliers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    return response.json();
  },

  async getNotifications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/notifications?${queryString}`, {
      headers: getAuthHeader()
    });
    return response.json();
  },

  async markNotificationAsRead(id) {
    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeader()
    });
    return response.json();
  },

  async markAllNotificationsAsRead(userId) {
    const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    return response.json();
  },

  async getPayments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/payments?${queryString}`, {
      headers: getAuthHeader()
    });
    return response.json();
  },

  async createPayment(data) {
    const response = await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updatePayment(id, data) {
    const response = await fetch(`${API_URL}/payments/${id}`, {
      method: 'PUT',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async getPaymentStats() {
    const response = await fetch(`${API_URL}/payments/stats`, {
      headers: getAuthHeader()
    });
    return response.json();
  }
};
