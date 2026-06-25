const cron = require('node-cron');
const supabase = require('../utils/supabase');
const { createNotification } = require('../services/notificationService');

function startDeadlineReminderJob() {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        console.log('Running deadline reminder job...');
        try {
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            // Fetch incomplete tasks due in the next 24 hours
            const { data: tasks, error: tasksError } = await supabase
                .from('tasks')
                .select('id, title, due_date')
                .neq('status', 'completed')
                .gt('due_date', now.toISOString())
                .lte('due_date', tomorrow.toISOString());

            if (tasksError) throw tasksError;

            if (!tasks || tasks.length === 0) return;

            for (const task of tasks) {
                // Get assignees for task
                const { data: assignments, error: assigneesError } = await supabase
                    .from('task_assignments')
                    .select('user_id')
                    .eq('task_id', task.id);

                if (assigneesError || !assignments) continue;

                for (const assignment of assignments) {
                    const userId = assignment.user_id;

                    // Check if notification already exists to avoid duplicate spamming
                    const { data: existing, error: checkError } = await supabase
                        .from('notifications')
                        .select('id')
                        .eq('user_id', userId)
                        .eq('task_id', task.id)
                        .eq('type', 'deadline_approaching')
                        .maybeSingle();

                    if (checkError) continue;

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
