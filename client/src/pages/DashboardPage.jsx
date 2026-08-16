import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [usersCount, setUsersCount] = useState(1);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const usersRes = await axiosClient.get('/api/users');
        if (Array.isArray(usersRes.data)) {
          setUsersCount(usersRes.data.length);
        }
      } catch (err) {
        // Fallback gracefully
      }
    }
    fetchDashboardData();
  }, []);

  const stats = [
    { label: 'Active Projects', value: 3, icon: '📁', color: 'badge-indigo', trend: '+1 this week' },
    { label: 'Pending Tasks', value: 8, icon: '⚡', color: 'badge-amber', trend: '3 high priority' },
    { label: 'Completed Tasks', value: 14, icon: '✅', color: 'badge-emerald', trend: '82% completion rate' },
    { label: 'Team Members', value: usersCount, icon: '👥', color: 'badge-indigo', trend: 'Active workspace' },
  ];

  const recentProjects = [
    { id: '1', name: 'Website Redesign', progress: 75, category: 'Frontend', status: 'In Progress', statusColor: 'badge-indigo' },
    { id: '2', name: 'Mobile App MVP', progress: 40, category: 'Mobile App', status: 'In Development', statusColor: 'badge-amber' },
    { id: '3', name: 'API Integration', progress: 90, category: 'Backend', status: 'Near Completion', statusColor: 'badge-emerald' },
  ];

  const recentActivities = [
    { id: 1, text: 'Admin updated project status for API Integration', time: '10 mins ago', icon: '🔄' },
    { id: 2, text: 'New member invited to Website Redesign workspace', time: '1 hour ago', icon: '👤' },
    { id: 3, text: 'Completed sprint review for Mobile App MVP', time: '3 hours ago', icon: '🎯' },
  ];

  return (
    <div className="py-2">
      {/* Top Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h1 className="h2 fw-bold text-white mb-1">
            Welcome back, {user?.name || 'Admin'} 👋
          </h1>
          <p className="text-muted mb-0 small">Here is what is happening across your projects today.</p>
        </div>
        <div className="d-flex gap-2">
          <Button 
            className="gradient-btn px-4 py-2 rounded-3 text-white fw-semibold shadow"
            onClick={() => navigate('/projects')}
          >
            + View Workspace Projects
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        {stats.map((stat) => (
          <Col key={stat.label} xs={12} sm={6} lg={3}>
            <Card className="glass-card h-100 p-2 border-0">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <span className="fs-3">{stat.icon}</span>
                  <Badge className={`${stat.color} rounded-pill px-2.5 py-1 small fw-normal`}>
                    {stat.trend}
                  </Badge>
                </div>
                <h3 className="display-6 fw-bold text-white mb-1">{stat.value}</h3>
                <div className="text-secondary small fw-medium">{stat.label}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Projects & Activity grid */}
      <Row className="g-4">
        {/* Active Projects Status */}
        <Col xs={12} lg={8}>
          <Card className="glass-card p-3 border-0 h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h5 className="fw-bold text-white mb-0">Project Performance</h5>
                  <small className="text-muted">Ongoing milestone progress</small>
                </div>
                <Button 
                  variant="link" 
                  className="text-indigo text-decoration-none p-0 small fw-semibold"
                  onClick={() => navigate('/projects')}
                >
                  View All →
                </Button>
              </div>

              <div className="d-flex flex-column gap-3">
                {recentProjects.map((p) => (
                  <div key={p.id} className="p-3 rounded-3 bg-dark bg-opacity-40 border border-secondary border-opacity-10">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <span className="fw-semibold text-white me-2">{p.name}</span>
                        <Badge className={`${p.statusColor} rounded-pill px-2 py-0.5 small`}>
                          {p.status}
                        </Badge>
                      </div>
                      <span className="text-muted small fw-bold">{p.progress}%</span>
                    </div>
                    <ProgressBar 
                      now={p.progress} 
                      style={{ height: '6px' }} 
                      className="bg-secondary bg-opacity-20" 
                    />
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Activity Feed */}
        <Col xs={12} lg={4}>
          <Card className="glass-card p-3 border-0 h-100">
            <Card.Body>
              <h5 className="fw-bold text-white mb-3">Recent Activity</h5>
              <div className="d-flex flex-column gap-3">
                {recentActivities.map((act) => (
                  <div key={act.id} className="d-flex gap-3 align-items-start pb-3 border-bottom border-secondary border-opacity-10">
                    <span className="fs-5 p-2 rounded-circle bg-indigo bg-opacity-10">{act.icon}</span>
                    <div>
                      <p className="text-white small mb-1">{act.text}</p>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}