const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ["Work", "Personal", "Other"], default: "Personal" },
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  tags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isPinned: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  attachments: { type: [String], default: [] },
  mainId: {type:Number, required:true,unique: true}
});

const Note = mongoose.model("Note", noteSchema);

module.exports = Note;
