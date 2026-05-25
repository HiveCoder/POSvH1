import { DOCTYPES } from '../data/doctypes';
import { call, db } from './frappe-sdk';
import { IS_WEBSITE_MODE } from './platform';
import {
  addWebsiteTable,
  deleteWebsiteTable,
  getWebsiteRooms,
  getWebsiteTables,
  renameWebsiteTable,
  updateWebsiteTable,
} from './website-mock';

export interface Room {
  name: string;
  branch: string;
}

export interface Table {
  name: string;
  occupied: number;
  latest_invoice_time: string | null;
  is_take_away: number;
  restaurant_room: string;
  table_shape: 'Circle' | 'Square' | 'Rectangle';
  no_of_seats?: number;
  layout_x?: number;
  layout_y?: number;
  minimum_seating?: number;
}

interface CreateTablePayload {
  name: string;
  no_of_seats?: number;
  table_shape?: Table['table_shape'];
}


export async function getRestaurantMenu(posProfile: string, room?: string | null) {
  if (IS_WEBSITE_MODE) {
    return { items: [] };
  }

  const { call } = await import('./frappe-sdk');
  const params: Record<string, string> = { pos_profile: posProfile };
  if (room) {
    params.room = room;
  }
  const res = await call.get('ury.ury_pos.api.getRestaurantMenu', params);
  return res.message;
}

export async function getRooms(branch: string): Promise<Room[]> {
  if (IS_WEBSITE_MODE) {
    return getWebsiteRooms(branch) as Room[];
  }

  const rooms = await db.getDocList(DOCTYPES.URY_ROOM, {
    fields: ['name', 'branch'],
    filters: [['branch', 'like', branch]],
    limit: "*" as unknown as number,
    asDict: true,
  });
  return rooms as Room[];
}

export async function getTableCount(room: string, branch?: string): Promise<number> {
  if (IS_WEBSITE_MODE) {
    return getWebsiteTables(room).length;
  }

  const filters = [
    ['restaurant_room', '=', room],
    ...(branch ? [['branch', '=', branch]] : []),
  ];
  const rows = await db.getDocList(DOCTYPES.URY_TABLE, {
    fields: ['count(name) as count'],
    filters: filters as any,
    limit: 1,
    asDict: true,
  }) as Array<{ count?: number | string }>;
  const countValue = rows[0]?.count ?? 0;
  return typeof countValue === 'number' ? countValue : Number(countValue) || 0;
}
export async function getTables(room: string): Promise<Table[]> {
  if (IS_WEBSITE_MODE) {
    return getWebsiteTables(room) as Table[];
  }

  const tables = await db.getDocList(DOCTYPES.URY_TABLE, {
    fields: [
      'name',
      'occupied',
      'latest_invoice_time',
      'is_take_away',
      'restaurant_room',
      'table_shape',
      'no_of_seats',
      'layout_x',
      'layout_y',
      'minimum_seating'
    ],
    filters: [['restaurant_room', '=', room]],
    asDict: true,
  });

  return tables as Table[];
}


export async function updateTableLayout(name: string, data: Partial<Table>) {
  if (IS_WEBSITE_MODE) {
    const room = (data.restaurant_room || 'Main Hall') as string;
    updateWebsiteTable(room, name, data as any);
    return { message: 'ok' };
  }

  return db.updateDoc(DOCTYPES.URY_TABLE, name, data);
}

export async function createTable(room: string, payload: CreateTablePayload) {
  if (IS_WEBSITE_MODE) {
    return addWebsiteTable(room, payload);
  }

  const doc = {
    doctype: DOCTYPES.URY_TABLE,
    name: payload.name,
    restaurant_room: room,
    table_shape: payload.table_shape || 'Rectangle',
    no_of_seats: payload.no_of_seats || 4,
    minimum_seating: 1,
  };

  return call.post('frappe.client.insert', { doc });
}

export async function renameTable(room: string, oldName: string, newName: string) {
  if (IS_WEBSITE_MODE) {
    renameWebsiteTable(room, oldName, newName);
    return { message: 'ok' };
  }

  return call.post('frappe.client.rename_doc', {
    doctype: DOCTYPES.URY_TABLE,
    old_name: oldName,
    new_name: newName,
    merge: false,
  });
}

export async function deleteTable(room: string, name: string) {
  if (IS_WEBSITE_MODE) {
    deleteWebsiteTable(room, name);
    return { message: 'ok' };
  }

  return call.post('frappe.client.delete', {
    doctype: DOCTYPES.URY_TABLE,
    name,
  });
}

