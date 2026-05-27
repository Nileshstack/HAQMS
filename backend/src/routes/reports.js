const express = require('express');
const { authenticate } = require('../middleware/auth');
const prisma = require('../prisma');

const router = express.Router();

// GET /api/reports/doctor-stats
// Highly inefficient nested loop aggregate reporting for admin/receptionists dashboard
// PERFORMANCE BUG: Performs multiple nested DB queries inside a loop for every doctor.
// Runs sequentially, blocking/scaling terrible with doctors count.
router.get('/doctor-stats', authenticate, async (req, res) => {
  try {
    const start = Date.now();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [doctors, appointmentAgg, queueAgg] = await Promise.all([
      prisma.doctor.findMany(),
      prisma.appointment.groupBy({
        by: ['doctorId', 'status'],
        _count: { _all: true },
      }),
      prisma.queueToken.groupBy({
        by: ['doctorId'],
        where: { createdAt: { gte: today } },
        _count: { _all: true },
      }),
    ]);

    const byDoctor = new Map();
    for (const row of appointmentAgg) {
      const current = byDoctor.get(row.doctorId) || {
        total: 0,
        completed: 0,
        cancelled: 0,
      };
      current.total += row._count._all;
      if (row.status === 'COMPLETED') current.completed += row._count._all;
      if (row.status === 'CANCELLED') current.cancelled += row._count._all;
      byDoctor.set(row.doctorId, current);
    }

    const queueByDoctor = new Map(queueAgg.map((r) => [r.doctorId, r._count._all]));

    const reportData = doctors.map((doc) => {
      const stats = byDoctor.get(doc.id) || { total: 0, completed: 0, cancelled: 0 };
      return {
        id: doc.id,
        name: doc.name,
        specialization: doc.specialization,
        department: doc.department,
        totalAppointments: stats.total,
        completedAppointments: stats.completed,
        cancelledAppointments: stats.cancelled,
        todayQueueSize: queueByDoctor.get(doc.id) || 0,
        revenue: stats.completed * doc.consultationFee,
      };
    });

    const durationMs = Date.now() - start;

    res.json({
      success: true,
      timeTakenMs: durationMs,
      data: reportData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
});

module.exports = router;
