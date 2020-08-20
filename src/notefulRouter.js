const express = require('express');
const notefulRouter = express.Router();
const notefulService = require('./noteful-service');
const xss = require('xss');

notefulRouter.get('/notes', (req, res, next) => {
    const knexInstance = req.app.get('db');
    notefulService.getAllNotes(knexInstance)
        .then(notes => { res.json(notes); })
        .catch(next);
});
notefulRouter.get('/folders', (req, res, next) => {
    const knexInstance = req.app.get('db');
    notefulService.getAllFolders(knexInstance)
        .then(folders => { res.json(folders); })
        .catch(next);
});

notefulRouter.post('/notes', (req, res, next) => {
    const knexInstance = req.app.get('db');
    const { name, content, folderid } = req.body;
    const newNote = { name, content, folderid };
    if ([name, content, folderid].some(data => !data)) {
        let result;
        if (!name) { result = 'name'; }
        else if (!content) { result = 'content'; }
        else if (!folderid) { result = 'folderid'; }
        return res.status(400).send(`Value for ${result} was not provided`);
    }
    notefulService.insertNote(knexInstance, newNote)
        .then(note => res.status(201).location(`/folders/${note.folderid}`).json({
            id: note.id,
            name: xss(note.name),
            content: xss(note.content),
            created: note.created,
            folderid: note.folderid
        }))
        .catch(next);
});

notefulRouter.post('/folders', (req, res, next) => {
    const knexInstance = req.app.get('db');
    const { name } = req.body;
    const newFolder = { name };
    if (!name) {
        return res.status(400).send('Value for name was not provided');
    }
    notefulService.insertFolder(knexInstance, newFolder)
        .then(folder => res.status(201).location(`/folder/${folder.id}`).json({
            id: folder.id,
            name: xss(folder.name)
        }))
        .catch(next);
});

notefulRouter.delete('/notes/:noteid', (req, res, next) => {
    const knexInstance = req.app.get('db');
    notefulService.getNoteById(knexInstance, req.params.noteid)
        .then(note => {
            if (!note) {
                return res.status(404).json({
                    error: { message: 'Note does not exist' }
                });
            }
            notefulService.deleteNote(knexInstance, note.id)
                .then(() => res.status(204).end())
                .catch(next);
        });
});

module.exports = notefulRouter;