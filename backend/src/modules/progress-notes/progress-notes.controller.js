const service = require('./progress-notes.service');

// ================= GET NOTES =================
exports.getNotesByRegistry = async (req, res) => {
    try {
        const registryNo = parseInt(req.params.registryNo);

        if (isNaN(registryNo)) {
            return res.status(400).json({ message: 'Invalid Registry Number.' });
        }

        const pool = req.app.locals.pool;
        const notes = await service.getNotesByRegistry(pool, registryNo);

        res.json(notes);
    } catch (error) {
        console.error('GET Progress Notes Error:', error);
        res.status(500).json({ message: 'Failed to fetch progress notes.' });
    }
};

// ================= CREATE NOTE =================
exports.createNote = async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const result = await service.createNote(pool, req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('CREATE Progress Note Error:', error);
        res.status(400).json({ message: error.message });
    }
};

// ================= UPDATE DRAFT =================
exports.updateDraft = async (req, res) => {
    try {
        const noteId = parseInt(req.params.noteId);
        if (isNaN(noteId)) {
            return res.status(400).json({ message: 'Invalid Note ID.' });
        }

        const pool = req.app.locals.pool;
        const result = await service.updateDraft(pool, noteId, req.body);

        res.json(result);
    } catch (error) {
        console.error('UPDATE Draft Error:', error);
        res.status(400).json({ message: error.message });
    }
};

// ================= FINALIZE =================
exports.finalizeNote = async (req, res) => {
    try {
        const noteId = parseInt(req.params.noteId);
        if (isNaN(noteId)) {
            return res.status(400).json({ message: 'Invalid Note ID.' });
        }

        const pool = req.app.locals.pool;
        const result = await service.finalizeNote(pool, noteId, req.body);

        res.json(result);
    } catch (error) {
        console.error('FINALIZE Error:', error);
        res.status(400).json({ message: error.message });
    }
};

// ================= EXCLUDE =================
exports.excludeFromPrint = async (req, res) => {
    try {
        const noteId = parseInt(req.params.noteId);
        if (isNaN(noteId)) {
            return res.status(400).json({ message: 'Invalid Note ID.' });
        }

        const pool = req.app.locals.pool;
        const result = await service.excludeFromPrint(pool, noteId);

        res.json(result);
    } catch (error) {
        console.error('EXCLUDE Error:', error);
        res.status(400).json({ message: error.message });
    }
};