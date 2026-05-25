import { call, db, auth } from './frappe-sdk';
import { IS_WEBSITE_MODE, WEBSITE_USER } from './platform';

type LoggedUserResponse = string | null;

interface UserDoc {
  name: string;
  full_name: string;
  roles: Array<{
    name: string;
    role: string;
    parent: string;
  }>;
}

export const getLoggedUser = async (): Promise<LoggedUserResponse> => {
  if (IS_WEBSITE_MODE) {
    const stored = localStorage.getItem('pos_web_user');
    return stored || WEBSITE_USER.id;
  }

  try {
    const response = await auth.getLoggedInUser();
    return response as LoggedUserResponse;
  } catch (error) {
    console.error('Error getting logged user:', error);
    return null;
  }
};

export const getUserRoles = async (email: string): Promise<{ roles: string[]; full_name: string }> => {
  if (IS_WEBSITE_MODE) {
    const storedName = localStorage.getItem('pos_web_full_name');
    const storedRoles = localStorage.getItem('pos_web_roles');
    const roles = storedRoles
      ? storedRoles.split(',').map((role) => role.trim()).filter(Boolean)
      : WEBSITE_USER.roles;

    return {
      roles,
      full_name: storedName || WEBSITE_USER.fullName,
    };
  }

  try {
    // Get user details using db.getDoc
    const userDoc = await db.getDoc<UserDoc>('User', email);
    
    if (!userDoc || !userDoc.roles) {
      return { roles: [], full_name: '' };
    }

    // Extract role names and full_name from the user doc
    return {
      roles: userDoc.roles.map(role => role.role),
      full_name: userDoc.full_name
    };
  } catch (error) {
    console.error('Error getting user details:', error);
    return { roles: [], full_name: '' };
  }
};

export const logout = async () => {
  if (IS_WEBSITE_MODE) {
    localStorage.removeItem('pos_web_user');
    localStorage.removeItem('pos_web_full_name');
    localStorage.removeItem('pos_web_roles');
    return true;
  }

  try {
    return auth.logout();
  }catch(e){
    console.error('Error logging out:', e);
    return false;
  }
}