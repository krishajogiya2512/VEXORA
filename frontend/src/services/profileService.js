import api from './api';

export const profileService = {
  async createProfile(profileData) {
    const { data } = await api.post('/profiles', profileData);
    return data;
  },

  async getProfiles(params = {}) {
    const { data } = await api.get('/profiles', { params });
    return data;
  },

  async getProfile(id) {
    const { data } = await api.get(`/profiles/${id}`);
    return data;
  },

  async updateProfile(id, profileData) {
    const { data } = await api.put(`/profiles/${id}`, profileData);
    return data;
  },

  async deleteProfile(id) {
    const { data } = await api.delete(`/profiles/${id}`);
    return data;
  },
};
