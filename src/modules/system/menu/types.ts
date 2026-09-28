/** 菜单导出/导入的行结构 */
export interface MicroAppConfig {
  name: string;
  url: string;
  baseroute: string;
  keepAlive?: boolean;
  disableMemoryRouter?: boolean;
  disablePatchRequest?: boolean;
  inline?: boolean;
  destroy?: boolean;
}
export interface MenuImportRow {
  menuName: string;
  menuType: number;
  parentName: string;
  icon: string;
  path: string;
  component: string;
  permission: string;
  sortOrder: number;
  status: string;
}

/** 菜单表实体（简化） */
export interface MenuEntity {
  menu_id: string;
  tenant_id: string;
  parent_id: string | null;
  menu_name: string;
  menu_type: number;
  icon: string | null;
  path: string | null;
  component: string | null;
  permission: string | null;
  micro_app: MicroAppConfig | null;
  is_external: boolean;
  layout: string | null;
  hidden: boolean;
  keep_alive: boolean;
  sort_order: number;
  status: string;
  created_at: Date;
  updated_at: Date;
  is_deleted: number;
}
/** 菜单导入行 */
export interface MenuImportRow {
  menuName: string;
  menuType: number;
  parentName: string;
  icon: string;
  path: string;
  component: string;
  permission: string;
  sortOrder: number;
  status: string;
  microApp: MicroAppConfig | null;
  isExternal: boolean;
  layout: string | null;
  hidden: boolean;
  keepAlive: boolean;
}

/** 菜单树节点 */
export interface MenuNode {
  menuId: string;
  parentId: string | null;
  menuName: string;
  menuType: number;
  icon: string | null;
  path: string | null;
  component: string | null;
  permission: string | null;
  sortOrder: number;
  status: string;
  children?: MenuNode[];
  microApp: MicroAppConfig | null;
  isExternal: boolean;
  layout: string | null;
  hidden: boolean;
  keepAlive: boolean;
}
