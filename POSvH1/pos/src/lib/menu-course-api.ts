import { call } from './frappe-sdk';
import { IS_WEBSITE_MODE } from './platform';
import { WEBSITE_MENU_COURSES } from './website-mock';

export interface MenuCourse {
  name: string;
  label: string;
}

export interface MenuCourseResponse {
  message: MenuCourse[];
}


export async function getMenuCourses(): Promise<MenuCourse[]> {
  if (IS_WEBSITE_MODE) {
    return WEBSITE_MENU_COURSES;
  }

  const response = await call.get<MenuCourseResponse>(
    'ury.ury_pos.api.getMenuCourses'
  );
  return response.message;
}