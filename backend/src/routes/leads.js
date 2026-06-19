import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../db.js';
import { parseLeadsExcel } from '../services/excel.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  },
});

router.get('/', async (req, res) => {
  try {
    const { status, location, search } = req.query;
    let query = supabase
      .from('leads')
      .select('*, conversations(id, last_message_at)')
      .order('updated_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (location) query = query.ilike('location', `%${location}%`);
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { leads, errors: parseErrors } = parseLeadsExcel(req.file.buffer);

    if (leads.length === 0) {
      return res.status(400).json({
        error: 'No valid leads found in file',
        parseErrors,
      });
    }

    const imported = [];
    const skipped = [];

    for (const lead of leads) {
      const { data, error } = await supabase
        .from('leads')
        .insert(lead)
        .select()
        .single();

      if (error) {
        skipped.push({ phone: lead.phone, name: lead.name, error: error.message });
      } else {
        imported.push(data);
      }
    }

    res.json({
      imported: imported.length,
      skipped: skipped.length,
      parseErrors,
      skippedRows: skipped,
      leads: imported,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/delete-bulk', async (req, res) => {
  try {
    const { leadIds } = req.body;

    if (!leadIds?.length) {
      return res.status(400).json({ error: 'No leads selected' });
    }

    const { error } = await supabase.from('leads').delete().in('id', leadIds);
    if (error) throw error;

    res.json({ deleted: leadIds.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*, conversations(*)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, location, status, notes } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone is required' });
    }

    const leadData = {
      name: name?.trim() || `Lead ${String(phone).slice(-4)}`,
      phone,
      location: location || null,
      status: status || 'new',
      notes: notes || null,
    };

    const { data, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, phone, location, status, notes } = req.body;

    const { data, error } = await supabase
      .from('leads')
      .update({ name, phone, location, status, notes })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('leads').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
