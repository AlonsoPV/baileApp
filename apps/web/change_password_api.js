/**
 * Script para cambiar contraseña usando Management API de Supabase
 * 
 * INSTRUCCIONES:
 * 1. Reemplaza TU_PROYECTO con tu proyecto de Supabase
 * 2. Reemplaza TU_SERVICE_ROLE_KEY con tu service role key
 * 3. Reemplaza la contraseña deseada
 * 4. Ejecuta: node change_password_api.js
 */

const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
const SERVICE_ROLE_KEY = 'TU_SERVICE_ROLE_KEY'; // ⚠️ NUNCA expongas esto
const USER_ID = '501bdfe7-5568-4411-a666-7b17d21face1';
const NEW_PASSWORD = 'TuNuevaContraseña123!';

async function changePassword() {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}`, {
      method: 'PUT',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: NEW_PASSWORD
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al actualizar contraseña');
    }

    console.log('✅ Contraseña actualizada correctamente');
    console.log('Usuario:', data.user?.email || USER_ID);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

changePassword();

