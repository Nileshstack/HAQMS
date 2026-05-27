const express = require('express');
const { authenticate, authorizeAdminOnlyLegacy } = require('../middleware/auth');
const prisma = require('../prisma');

const router = express.Router();

// GET /api/patients
// Get all patients with search, filtering, and INEFICIENT IN-MEMORY PAGINATION
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, gender } = req.query;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 5, 1), 50);
    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      const q = String(search);
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phoneNumber: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (gender && gender !== 'All') {
      where.gender = { equals: String(gender), mode: 'insensitive' };
    }

    const [totalPatients, patients] = await prisma.$transaction([
      prisma.patient.count({ where }),
      prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.max(Math.ceil(totalPatients / limit), 1);

    // Inconsistent Response style
    res.json({
      success: true,
      patients,
      pagination: {
        page,
        limit,
        totalPatients,
        totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients', details: error.message });
  }
});

// GET /api/patients/:id
// Get patient details by ID. Notice N+1 issue could be placed here or in appointments,
// but let's make it fetch the patient with their appointments and tokens.
router.get('/:id', authenticate, async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        appointments: true, // Fetching relation direct
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/patients (Register patient)
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, email, phoneNumber, age, gender, medicalHistory } = req.body;

    // INCONSISTENT VALIDATION:
    // Email is nullable in schema, but here we only check missing fields.
    // No regex to check telephone number formats, allowing random strings like "abc" to be stored!
    if (!name || !phoneNumber || !age || !gender) {
      return res.status(400).json({ error: 'Name, phoneNumber, age, and gender are required.' });
    }

    const patient = await prisma.patient.create({
      data: {
        name,
        email: email || null,
        phoneNumber,
        age: parseInt(age),
        gender,
        medicalHistory: medicalHistory || null, // Can be null, will crash UI without optional chaining
      },
    });

    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register patient', details: error.message });
  }
});

// DELETE /api/patients/:id
router.delete('/:id', authenticate, authorizeAdminOnlyLegacy, async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await prisma.patient.delete({ where: { id } });

    res.json({ message: `Successfully deleted patient ${patient.name}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete patient', details: error.message });
  }
});

module.exports = router;
