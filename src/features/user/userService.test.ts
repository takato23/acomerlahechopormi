import { getUserProfile, updateUserProfile, uploadAvatar } from './userService'; 
// Importar SOLO el mock de supabase
import { supabase } from '@/lib/supabaseClient'; 

// Mockear el módulo
jest.mock('@/lib/supabaseClient');

// Acceder a los mocks directamente desde el objeto supabase importado
const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockFrom = supabase.from as jest.Mock;
const mockSelect = mockFrom().select as jest.Mock;
const mockUpdate = mockFrom().update as jest.Mock;
const mockEq = mockSelect().eq as jest.Mock; 
const mockSingle = mockEq().single as jest.Mock; 
const mockThen = mockEq().then as jest.Mock; 
const mockStorageFrom = supabase.storage.from as jest.Mock;
const mockUpload = mockStorageFrom().upload as jest.Mock;
const mockGetPublicUrl = mockStorageFrom().getPublicUrl as jest.Mock;

// Mock de usuario estándar para las pruebas
const mockUser = { id: 'user-123', email: 'test@example.com' };

describe('userService', () => {
  
  beforeEach(() => {
    jest.resetAllMocks(); // Resetear todos los mocks completamente
    // Configurar mock de usuario por defecto para CADA prueba
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    // Configurar implementaciones por defecto para mocks encadenables
    mockEq.mockImplementation(() => ({ 
        then: mockThen, 
        single: mockSingle, 
        eq: mockEq, 
        order: jest.fn() // Añadir order si es necesario
    }));
     mockFrom.mockImplementation(() => ({
        select: mockSelect,
        insert: jest.fn(),
        update: mockUpdate,
        delete: jest.fn(),
        upsert: jest.fn(),
    }));
     mockSelect.mockImplementation(() => ({ 
        eq: mockEq, 
        order: jest.fn(), 
        lte: jest.fn(),
        limit: jest.fn() 
    }));
     mockUpdate.mockImplementation(() => ({ 
        eq: mockEq 
    }));
     // Configurar mocks de Storage
     mockStorageFrom.mockImplementation(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
     }));

  });

  // --- Pruebas para getUserProfile ---
  describe('getUserProfile', () => {
     it('should return null if user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      await expect(getUserProfile(mockUser.id)).resolves.toBeNull(); // Añadir userId
    });

    it('should return null if there is an auth error', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('Auth Error') });
      await expect(getUserProfile(mockUser.id)).resolves.toBeNull(); // Añadir userId
      expect(console.error).toHaveBeenCalledWith('Error getting user:', expect.any(Error));
    });

    it('should return basic user data if profile fetch fails (not PGRST116)', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'DB Error', code: 'XYZ' } });
      
      await expect(getUserProfile(mockUser.id)).resolves.toEqual(expect.objectContaining({ // Añadir userId
         id: mockUser.id, 
         email: mockUser.email,
         username: null, 
         avatar_url: null,
      }));
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', mockUser.id);
      expect(console.warn).toHaveBeenCalledWith('Error fetching profile (but not PGRST116):', 'DB Error');
    });
    
     it('should return basic user data if profile is not found (PGRST116)', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not Found', code: 'PGRST116' } });
      
       await expect(getUserProfile(mockUser.id)).resolves.toEqual(expect.objectContaining({ // Añadir userId
         id: mockUser.id, 
         email: mockUser.email,
         username: null,
         avatar_url: null,
      }));
       expect(console.warn).not.toHaveBeenCalled(); 
    });

    it('should return combined profile data if found', async () => {
      const mockProfileData = { username: 'tester', dietary_preference: 'vegan', avatar_url: 'url.jpg' };
      mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
      mockSingle.mockResolvedValueOnce({ data: mockProfileData, error: null });

      await expect(getUserProfile(mockUser.id)).resolves.toEqual(expect.objectContaining({ // Añadir userId
        id: mockUser.id,
        email: mockUser.email,
        username: 'tester',
        dietary_preference: 'vegan',
        avatar_url: 'url.jpg',
      }));
    });

     it('should return null on unexpected error during auth', async () => {
      mockGetUser.mockRejectedValueOnce(new Error('Unexpected Auth'));
      await expect(getUserProfile(mockUser.id)).resolves.toBeNull(); // Añadir userId
      expect(console.error).toHaveBeenCalledWith('Unexpected error fetching user profile:', expect.any(Error));
    });
    
     it('should return null on unexpected error during profile fetch', async () => {
       mockGetUser.mockResolvedValueOnce({ data: { user: mockUser }, error: null });
       mockSingle.mockRejectedValueOnce(new Error('Unexpected DB'));
       await expect(getUserProfile(mockUser.id)).resolves.toBeNull(); // Añadir userId
       expect(console.error).toHaveBeenCalledWith('Unexpected error fetching user profile:', expect.any(Error));
    });
  });

  // --- Pruebas para updateUserProfile ---
  describe('updateUserProfile', () => {
     it('should throw error if user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null }); 
      await expect(updateUserProfile(mockUser.id, { username: 'new' })).rejects.toThrow('Usuario no autenticado'); // Añadir userId
    });
    
     it('should throw error if auth error occurs', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('Auth Error') }); 
      await expect(updateUserProfile(mockUser.id, { username: 'new' })).rejects.toThrow('Usuario no autenticado'); // Añadir userId
    });

    it('should call supabase.update with correct data and return true on success', async () => {
      const updateData = { username: 'new_username', dietary_preference: 'vegetarian' as const };
      mockThen.mockResolvedValueOnce({ error: null }); // update().eq().then()

      await expect(updateUserProfile(mockUser.id, updateData)).resolves.toBe(true); // Añadir userId
      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith(updateData);
      expect(mockEq).toHaveBeenCalledWith('id', mockUser.id); // update().eq()
      expect(console.log).toHaveBeenCalledWith('Profile updated successfully for user:', mockUser.id, updateData);
    });

    it('should return false if supabase.update fails', async () => {
       const updateData = { username: 'fail_update' };
       // Configurar mock de update para fallo ANTES
       mockEq.mockImplementationOnce(() => ({ // update().eq()
           then: jest.fn((callback) => Promise.resolve(callback({ error: new Error('Update Failed') })))
       }));

       await expect(updateUserProfile(mockUser.id, updateData)).resolves.toBe(false); // Añadir userId
       expect(console.error).toHaveBeenCalledWith('Error updating profile:', expect.any(Error));
    });
    
     it('should throw error on unexpected error during auth', async () => {
      mockGetUser.mockRejectedValueOnce(new Error('Unexpected'));
      await expect(updateUserProfile(mockUser.id, { username: 'new' })).rejects.toThrow('Usuario no autenticado'); // Añadir userId
    });
  });

   // --- Pruebas para uploadAvatar ---
   describe('uploadAvatar', () => {
      const mockFile = new File(['avatar'], 'avatar.png', { type: 'image/png' });
      const mockPublicUrl = 'https://supabase.co/storage/v1/object/public/avatars/user-123-timestamp.png';

      it('should upload avatar, update profile, and return public URL on success', async () => {
         mockUpload.mockResolvedValueOnce({ data: { path: 'user-123-timestamp.png' }, error: null }); 
         mockGetPublicUrl.mockReturnValueOnce({ data: { publicUrl: mockPublicUrl } });
         mockThen.mockResolvedValueOnce({ error: null }); // update().eq().then()

         const result = await uploadAvatar(mockFile);

         expect(result).toBe(mockPublicUrl);
         expect(mockStorageFrom).toHaveBeenCalledWith('avatars');
         expect(mockUpload).toHaveBeenCalledWith(expect.stringMatching(/^user-123-\d+\.png$/), mockFile, { cacheControl: '3600', upsert: true }); 
         expect(mockGetPublicUrl).toHaveBeenCalledWith('user-123-timestamp.png'); 
         expect(mockFrom).toHaveBeenCalledWith('profiles');
         expect(mockUpdate).toHaveBeenCalledWith({ avatar_url: mockPublicUrl });
         expect(mockEq).toHaveBeenCalledWith('id', 'user-123'); // update().eq()
      });

      it('should throw error if user is not authenticated', async () => {
         mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null }); 
         await expect(uploadAvatar(mockFile)).rejects.toThrow('Usuario no autenticado');
      });

      it('should return null if upload fails', async () => {
         mockUpload.mockResolvedValueOnce({ data: null, error: new Error('Upload Failed') });
         await expect(uploadAvatar(mockFile)).resolves.toBeNull();
         expect(console.error).toHaveBeenCalledWith('Error uploading avatar:', expect.any(Error));
      });
      
      it('should return null if upload succeeds but returns no path', async () => {
         mockUpload.mockResolvedValueOnce({ data: null, error: null }); // Sin path
         await expect(uploadAvatar(mockFile)).resolves.toBeNull();
         expect(console.error).toHaveBeenCalledWith('Upload succeeded but no path returned.');
      });
      
      it('should return null if getPublicUrl fails', async () => {
         mockUpload.mockResolvedValueOnce({ data: { path: 'user-123-timestamp.png' }, error: null });
         mockGetPublicUrl.mockReturnValueOnce({ data: { publicUrl: null } }); // Simular fallo
         await expect(uploadAvatar(mockFile)).resolves.toBeNull();
         expect(console.error).toHaveBeenCalledWith('Could not get public URL for uploaded avatar');
      });
      
      it('should return null if updateUserProfile fails', async () => {
         mockUpload.mockResolvedValueOnce({ data: { path: 'user-123-timestamp.png' }, error: null });
         mockGetPublicUrl.mockReturnValueOnce({ data: { publicUrl: mockPublicUrl } });
         // Mockear fallo de updateUserProfile ANTES
         mockEq.mockImplementationOnce(() => ({ // update().eq()
            then: jest.fn((callback) => Promise.resolve(callback({ error: new Error('Profile Update Failed') })))
         }));

         await expect(uploadAvatar(mockFile)).resolves.toBeNull();
         expect(console.warn).toHaveBeenCalledWith('Avatar uploaded but failed to update profile URL.');
         expect(console.error).toHaveBeenCalledWith('Error updating profile:', expect.any(Error)); 
      });
   });

});

// Mock console
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};