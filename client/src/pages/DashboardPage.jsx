import { Row, Col, Card } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  // Placeholder numbers for now — real counts get wired in later
  const stats = [
    { label: 'My Tasks', value: 0 },
    { label: 'Projects', value: 0 },
    { label: 'Notifications', value: 0 },
  ];

  return (
    <div>
      <h2 className="mb-4">Welcome back, {user?.name || 'there'} 👋</h2>

      <Row className="g-3">
        {stats.map((stat) => (
          <Col key={stat.label} xs={12} md={4}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title className="display-6">{stat.value}</Card.Title>
                <Card.Text className="text-muted">{stat.label}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}