import api from '@/lib/api'

export interface UserProfile {
  user_id: string
  full_name: string
  email: string
  phone_number?: string
  address?: string
  created_at?: string
  profile_picture_url?: string
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

const profileService = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/profile');
    return response.data;
  },
  
  updateProfile: async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await api.patch('/profile', profileData);
    return response.data;
  },
  
  changePassword: async (passwordData: PasswordChangeRequest): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch('/profile/password', passwordData);
    return response.data;
  },

  // Note: This would require file upload endpoints on your backend
  uploadProfilePicture: async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await api.post('/profile/upload-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.imageUrl;
    } catch (error) {
      console.error('Error in uploadProfilePicture:', error)
      return null
    }
  }
};

export default profileService;
