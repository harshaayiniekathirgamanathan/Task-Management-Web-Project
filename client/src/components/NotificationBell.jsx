import { useEffect, useState } from 'react';
import { NavDropdown, Toast, ToastContainer } from 'react-bootstrap';
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
        <span className="tm-bell" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}>
            <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.7"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && <span className="tm-bell-count">{unreadCount}</span>}
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
