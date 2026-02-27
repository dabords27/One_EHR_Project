const express = require('express');
const router = express.Router();
const controller = require('./progress-notes.controller');

// Get notes by RegistryTrackingNo
router.get('/:registryNo', controller.getNotesByRegistry);

// Create new note (draft or finalized)
router.post('/', controller.createNote);

// Update draft (only creator)
router.put('/:noteId', controller.updateDraft);

// Finalize note
router.put('/:noteId/finalize', controller.finalizeNote);

// Exclude finalized note from print
router.put('/:noteId/exclude', controller.excludeFromPrint);

module.exports = router;