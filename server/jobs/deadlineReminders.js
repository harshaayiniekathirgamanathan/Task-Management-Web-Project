const cron = require('node-cron');
const db = require('../utils/db');
const { createNotification } = require('../services/notificationService');

function startDeadlineReminderJob() {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        console.log('Running deadline reminder job...');
        try {
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            // Fetch incomplete tasks due in the next 24 hours
            const tasks = await db.many(
                `SELECT id, title, due_date
                   FROM tasks
                  WHERE status <> 'completed'
                    AND due_date > $1
                    AND due_date <= $2`,
                [now.toISOString(), tomorrow.toISOString()]
            );

            if (!tasks.length) return;

            for (const task of tasks) {
                // Get assignees for task
                const assignments = await db.many(
                    'SELECT user_id FROM task_assignments WHERE task_id = $1',
                    [task.id]
                );

                for (const assignment of assignments) {
                    const userId = assignment.user_id;

                    // Check if notification already exists to avoid duplicate spamming
                    const existing = await db.one(
                        `SELECT id FROM notifications
                          WHERE user_id = $1 AND task_id = $2 AND type = 'deadline_approaching'
                          LIMIT 1`,
                        [userId, task.id]
                    );

                    if (!existing) {
                        await createNotification(
                            userId,
                            'deadline_approaching',
                            `Task "${task.title}" is due within the next 24 hours.`,
                            task.id
                        );
                    }
                }
            }
        } catch (err) {
            console.error('Deadline reminder job error:', err.message);
        }
    });
    console.log('Deadline reminder job scheduled (hourly)');
}

module.exports = { startDeadlineReminderJob };
