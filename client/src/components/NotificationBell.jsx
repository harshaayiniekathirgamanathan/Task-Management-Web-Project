import { useState } from 'react';
import { NavDropdown, Badge } from 'react-bootstrap';

const fakeNotifications = [
    {
        id: 1,
        type: 'task_assigned',
        message: 'You were assigned to Setup Database.',
        created_at: '2026-06-24T09:30:00',
        is_read: false
    },
    {
        id: 2,
        type: 'comment_added',
        message: 'Alice commented on Design Login Page.',
        created_at: '2026-06-23T14:15:00',
        is_read: false
    },
    {
        id: 3,
        type: 'status_changed',
        message: 'Build Auth API was moved to In Progress.',
        created_at: '2026-06-22T11:00:00',
        is_read: true
    }
];

const NotificationBell = () => {
    const [notifications, setNotifications] = useState(fakeNotifications);

    const unreadCount = notifications.filter(
        notification => !notification.is_read
    ).length;

    const handleNotificationClick = (notificationId) => {
        setNotifications(currentNotifications =>
            currentNotifications.map(notification =>
                notification.id === notificationId
                    ? { ...notification, is_read: true }
                    : notification
            )
        );

        console.log('Notification marked as read:', notificationId);
    };

    const bellTitle = (
        <span>
            🔔{' '}

            <Badge bg="danger" pill>
                {unreadCount}
            </Badge>
        </span>
    );

    return (
        <NavDropdown
            title={bellTitle}
            id="notification-dropdown"
            align="end"
        >
            <NavDropdown.Header>Notifications</NavDropdown.Header>

            {notifications.map(notification => (
                <NavDropdown.Item
                    key={notification.id}
                    onClick={() =>
                        handleNotificationClick(notification.id)
                    }
                    className={notification.is_read ? 'text-muted' : 'fw-bold'}
                >
                    <div>{notification.message}</div>

                    <small className="text-muted">
                        {new Date(notification.created_at).toLocaleString()}
                    </small>
                </NavDropdown.Item>
            ))}

            {notifications.length === 0 && (
                <NavDropdown.ItemText>
                    No notifications
                </NavDropdown.ItemText>
            )}
        </NavDropdown>
    );
};

export default NotificationBell;