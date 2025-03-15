const express = require("express");
const mongoose = require("mongoose");
const Note = require("./models/Notes.model");
const cors = require("cors")

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors())

// MongoDB Connection
mongoose
  .connect("mongodb+srv://sahuamit00786:1234567890@cluster0.ydhhz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));


app.post("/syncNotes", async (req, res) => {
  try {
    const { notes } = req.body;
    console.log("Received notes:", notes);

    if (!Array.isArray(notes)) {
      return res.status(400).json({ error: "Invalid data format. Expected an array." });
    }

    const createdNotes = [];
    const updatedNotes = [];

    for (const noteData of notes) {
  if (noteData.syncStatus === "new") {
    const existingNote = await Note.findOne({ mainId: noteData.mainId });

    if (!existingNote) {
      const newNote = new Note(noteData);
      await newNote.save();
      createdNotes.push(newNote);
    } else {
      console.log(`Note with mainId ${noteData.mainId} already exists. Skipping creation.`);
    }
  } else if (noteData.syncStatus === "modified") {
    let updatedNote = await Note.findByIdAndUpdate(noteData._id, noteData, { new: true });

    if (!updatedNote) {
      const existingNote = await Note.findOne({ mainId: noteData.mainId });

      if (!existingNote) {
        updatedNote = new Note(noteData);
        await updatedNote.save();
        createdNotes.push(updatedNote);
      } else {
        console.log(`Modified note with mainId ${noteData.mainId} already exists. Skipping creation.`);
      }
    } else {
      updatedNotes.push(updatedNote);
    }
  } else if (noteData.syncStatus === "deleted") {
    const noteToDelete = await Note.findOne({ mainId: noteData.mainId });
    if (noteToDelete) {
      await Note.deleteOne({ mainId: noteData.mainId });
      console.log(`Note with mainId ${noteData.mainId} deleted.`);
    } else {
      console.log(`No note found with mainId ${noteData.mainId}. Skipping deletion.`);
    }
  }
}

    const allNotes = await Note.find();

    res.status(200).json({
      status: 1,
      message: "Sync successful",
      createdNotes,
      updatedNotes,
      allNotes,
    });
  } catch (err) {
    console.error("Error during sync:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});


app.get("/getAll", async(req, res) => {
  try {
    const allNotes = await Note.find();
    return res.json({ allNotes });
  } catch (error) {
    console.log("error")
  }
})

app.listen(PORT, () => {
  console.log(`Server is listening at port ${PORT}`);
});
