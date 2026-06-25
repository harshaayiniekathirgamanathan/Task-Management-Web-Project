import { useEffect, useState } from 'react';
import { NavDropdown, Badge, Toast, ToastContainer } from 'react-bootstrap';
import { listNotifications, markRead } from '../api/notifications';
import { useSocket } from '../context/SocketContext';

const NotificationBell = () => {
    const socket = useSocket();

    const [notifications, setNotifications] = useState([]);
    const [error, setError] = useState('');
    const [toastNotification, setToastNotification] = useState(null);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        async function loadNotifications() {
            try {
                setError('');

                const data = await listNotifications();
                setNotifications(data);
            } catch (err) {
                console.error('Failed to load notifications:', err);
                setError('Could not load notifications.');
            }
        }

        loadNotifications();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (notification) => {
            const newNotification = {
                ...notification,
                is_read: false
            };

            setNotifications(currentNotifications => {
                const alreadyExists = currentNotifications.some(
                    item => item.id === newNotification.id
                );

                if (alreadyExists) {
                    return currentNotifications;
                }

                return [newNotification, ...currentNotifications];
            });

            setToastNotification(newNotification);
            setShowToast(true);
        };

        socket.on('notification:new', handleNewNotification);

        return () => {
            socket.off('notification:new', handleNewNotification);
        };
    }, [socket]);

    const unreadCount = notifications.filter(
        notification => !notification.is_read
    ).length;

    const handleNotificationClick = async (notification) => {
        if (notification.is_read) return;

        try {
            setError('');

            await markRead(notification.id);

            setNotifications(currentNotifications =>
                currentNotifications.map(item =>
                    item.id === notification.id
                    ? { ...notification, is_read: true }
                    : item
                )
            );
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
            setError('Could not mark notification as read.');
        }
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
        <>
            <NavDropdown
                title={bellTitle}
                id="notification-dropdown"
                align="end"
            >
                <NavDropdown.Header>Notifications</NavDropdown.Header>

                {error && (
                    <NavDropdown.ItemText className="text-danger">
                        {error}
                    </NavDropdown.ItemText>
                )}

                {notifications.map(notification => (
                    <NavDropdown.Item
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={notification.is_read ? 'text-muted' : 'fw-bold'}
                    >
                        <div>{notification.message}</div>

                        <small className="text-muted">
                            {new Date(notification.created_at).toLocaleString()}
                        </small>
                    </NavDropdown.Item>
                ))}

                {notifications.length === 0 && !error && (
                    <NavDropdown.ItemText>
                        No notifications
                    </NavDropdown.ItemText>
                )}
            </NavDropdown>

            <ToastContainer position="top-end" className="p-3">
                <Toast
                    show={showToast}
                    onClose={() => setShowToast(false)}
                    delay={4000}
                    autohide
                >
                    <Toast.Header>
                        <strong className="me-auto">New notification</strong>
                    </Toast.Header>

                    <Toast.Body>
                        {toastNotification?.message}
                    </Toast.Body>
                </Toast>
            </ToastContainer>
        </>
    );
};

export default NotificationBell;
