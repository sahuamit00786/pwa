import Dexie from "dexie";
const db = new Dexie("NotesDB");

db.version(1).stores({
  notes: "++id, title, content, category, priority, tags, createdAt, updatedAt, isPinned, isCompleted,mainId, attachments",
});

export default db;
