import cron from "node-cron";
import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { wsManager } from "@/platform/ws/manager.js";
import { withLock } from "@/core/index.js";

export function startTodoReminderScheduler() {
  // 每分钟检查
  cron.schedule("*/1 * * * *", async () => {
    await withLock("job:lock:todo-reminder", 50, async () => {
      const now = new Date();
      const pending = await prisma.sys_todo.findMany({
        where: {
          is_deleted: 0,
          status: "0",
          reminded: 0,
          remind_at: { lte: now },
        },
        take: 200,
      });

      if (pending.length === 0) return 0;

      for (const todo of pending) {
        wsManager.sendToUser(todo.user_id, {
          type: "todo-reminder",
          data: {
            todoId: todo.todo_id,
            title: todo.title,
            dueTime: todo.due_time,
          },
          timestamp: Date.now(),
        });
      }

      await prisma.sys_todo.updateMany({
        where: { todo_id: { in: pending.map((t) => t.todo_id) } },
        data: { reminded: 1 },
      });

      logger.info({ count: pending.length }, "todo reminders sent");
      return pending.length;
    });
  });
}
