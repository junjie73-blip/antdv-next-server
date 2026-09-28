/** 待办分组 */
export interface TodoGroupRecord {
  groupId: string;
  tenantId: string;
  userId: string;
  name: string;
  color?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
