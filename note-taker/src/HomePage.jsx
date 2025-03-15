
import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  X,
  Calendar,
  Star,
  Trash2,
  Edit3,
  Filter,
  ChevronDown,
  Bell,
  User,
  Settings,
  HelpCircle,
  CheckCircle,
  FileText,
  LinkIcon,
} from "lucide-react";
import db from "../utils/db";

function HomePage() {
  // State management
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updateNote, setUpdateNote] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  // Form state
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    category: "Personal",
    priority: "Medium",
    tags: [],
    isPinned: false,
    isCompleted: false,
    attachments: [],
    mainId:null
  });

  const [tagInput, setTagInput] = useState("");

    useEffect(() => {
    const finalData = async () => {
      try {
    const response = await fetch("http://localhost:3000/getAll", {
      method: "GET"
    });
        const result = await response.json();
        setNotes(result.allNotes)
        await db.notes.clear();
    await db.notes.bulkPut(result.allNotes);
        
    console.log("Sync all response:", result);
  } catch (error) {
    console.error("Sync error:", error);
  }
    }
    finalData();
  },[])
  
setInterval(async () => {
  try {
    const data = await db.notes.toArray();
    const filteredData = data?.filter((note) => 
      note.syncStatus === "modified" || note.syncStatus === "new" || note.syncStatus === "deleted"
    );

    if (filteredData.length === 0) return; 

    const response = await fetch("http://localhost:3000/syncNotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notes: filteredData }),
    });

    const result = await response.json();
    if (result.allNotes.length > 0) {
      await db.notes.clear();
      await db.notes.bulkPut(result.allNotes);
    } else {
      await db.notes.clear();
    }
    console.log("Sync response:", result);
  } catch (error) {
    console.error("Sync error:", error);
  }
}, 360000);


  // useEffect(() => {
  //   const saveNotesToDB = async () => {
  //     await db.notes.bulkPut(notes);
  //     console.log("Notes stored in IndexedDB");
  //   };
  //   saveNotesToDB();
  //   const fetchNotes = async () => {
  //     const storedNotes = await db.notes.toArray();
  //     setNotes(storedNotes);
  //   };

  //   fetchNotes();
  // }, [notes]);

  const generateUniqueId = (notes) => {
  let newId;
  do {
    newId = Date.now() + Math.floor(Math.random() * 1000);
  } while (notes.some((note) => note.id === newId));
  return newId;
};


  // Handle adding a new note
 const handleAddNote = async () => {
  if (newNote.title.trim() === "") return;

  const currentDate = new Date();
  const newNoteWithId = {
    ...newNote,
    mainId: generateUniqueId(notes),
    syncStatus:"new",
    createdAt: currentDate,
    updatedAt: currentDate,
  };

  try {
    await db.notes.add(newNoteWithId);
    console.log("Note added to IndexedDB successfully!");
  } catch (error) {
    console.error("Error adding note to IndexedDB:", error);
   }
   
  setNotes([newNoteWithId, ...notes]);
  setIsModalOpen(false);

  setNewNote({
    title: "",
    content: "",
    category: "Personal",
    priority: "Medium",
    tags: [],
    isPinned: false,
    isCompleted: false,
    attachments: [],
    mainId:null
  });
  setTagInput("");
};


  // Handle adding tags
  const handleAddTag = () => {
    if (tagInput.trim() === "") return;
    if (newNote.tags.includes(tagInput.trim())) return;

    setNewNote({
      ...newNote,
      tags: [...newNote.tags, tagInput.trim()],syncStatus:"modified"
    });
    setTagInput("");
  };

  // Handle removing tags
  const handleRemoveTag = (tagToRemove) => {
    setNewNote({
      ...newNote,
      tags: newNote.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleEditNote = (note) => {
    setNewNote(note);
    setIsModalOpen(true); 
    setUpdateNote(true);
  };

  const handleModalClose = () => {
    setNewNote({
      title: "",
      content: "",
      category: "Personal",
      priority: "Medium",
      tags: [],
      isPinned: false,
      isCompleted: false,
      attachments: [],
      mainId:null
    });
    setIsModalOpen(false);
  };

  const handleUpdateNote = async(id) => {
    console.log("id",id)
    if (newNote.title.trim() === "") return;

    const noteToUpdate = await db.notes.get(id);

    setNotes(notes.map(note =>
      note.id === newNote.id ? { ...newNote, updatedAt: new Date() } : note
    ));

    const updatedNote = { ...noteToUpdate, ...newNote, updatedAt: new Date(), syncStatus:"modified" };
  await db.notes.put(updatedNote);
    handleModalClose();
  };
  

const filteredNotes = notes
  .filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory ? note.category === selectedCategory : true;

    return matchesSearch && matchesCategory;
  })
  ?.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    const dateA = new Date(a.createdAt); // Convert to Date object
    const dateB = new Date(b.createdAt);

    if (sortBy === "newest") return dateB.getTime() - dateA.getTime();
    if (sortBy === "oldest") return dateA.getTime() - dateB.getTime();
    if (sortBy === "priority") {
      const priorityValues = { High: 3, Medium: 2, Low: 1 };
      return priorityValues[b.priority] - priorityValues[a.priority];
    }
    return 0;
  });


  const togglePin = (id) => {
    setNotes(notes.map((note) => (note.id === id ? { ...note, isPinned: !note.isPinned } : note)));
  };

  const toggleCompleted = (id) => {
    setNotes(notes.map((note) => (note.id === id ? { ...note, isCompleted: !note.isCompleted, syncStatus:"modified" } : note)));
  };

const deleteNote = async (id) => {
  try {
    console.log("id received:", id);

    // Fetch all notes
    const allNotes = await db.notes.toArray();
    console.log("All Notes:", allNotes);

    // Find the note with matching mainId
    const noteToDelete = allNotes.find(note => note.mainId === id.mainId);
    if (!noteToDelete) {
      console.log("Note not found for deletion");
      return;
    }

    console.log("Note to delete:", noteToDelete);

    // Change syncStatus of the deleted note to "deleted"
    const updatedNote = { ...noteToDelete, syncStatus: "deleted", updatedAt: new Date().toISOString() };

    // Filter out the note from allNotes and add the updated one
    const updatedNotes = allNotes.map(note => 
      note.mainId === id.mainId ? updatedNote : note
    );

    // Clear IndexedDB and store updated notes
    await db.notes.clear();
    await db.notes.bulkPut(updatedNotes);

    const undeleted = updatedNotes.filter((data) => data.syncStatus != "deleted")
    setNotes(undeleted)

    console.log(`Note with mainId: ${id.mainId} marked as deleted and updated in IndexedDB`);
  } catch (error) {
    console.error("Error deleting note:", error);
  }
};

const formatDate = (date) => {
  const parsedDate = new Date(date); // Convert string to Date object
  if (isNaN(parsedDate.getTime())) return "Invalid Date"; // Handle invalid dates
  return parsedDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};


  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "text-red-600";
      case "Medium":
        return "text-amber-600";
      case "Low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    switch (category) {
      case "Work":
        return "bg-blue-100 text-blue-800";
      case "Personal":
        return "bg-purple-100 text-purple-800";
      case "Ideas":
        return "bg-green-100 text-green-800";
      case "Tasks":
        return "bg-amber-100 text-amber-800";
      case "Important":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-indigo-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">NoteHub</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                <Settings className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                <HelpCircle className="h-5 w-5" />
              </button>
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                <User className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search notes by title, content, or tags..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white shadow-sm hover:bg-gray-50"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <Filter className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">Filter</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                    <div className="p-3 border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700">Filter by Category</h3>
                    </div>
                    <div className="p-2">
                      <button
                        className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                          selectedCategory === null ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => setSelectedCategory(null)}
                      >
                        All Categories
                      </button>
                      {["Personal", "Work", "Ideas", "Tasks", "Important"].map((category) => (
                        <button
                          key={category}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                            selectedCategory === category ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
                          }`}
                          onClick={() => setSelectedCategory(category)}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                    <div className="p-3 border-t border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700">Sort by</h3>
                    </div>
                    <div className="p-2">
                      <button
                        className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                          sortBy === "newest" ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => setSortBy("newest")}
                      >
                        Newest First
                      </button>
                      <button
                        className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                          sortBy === "oldest" ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => setSortBy("oldest")}
                      >
                        Oldest First
                      </button>
                      <button
                        className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                          sortBy === "priority" ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => setSortBy("priority")}
                      >
                        Priority
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={() => setIsModalOpen(true)}
              >
                <span className="flex items-center gap-1">
                  <Plus className="h-5 w-5" />
                  <span className="hidden sm:inline">Add Note</span>
                </span>
              </button>

               
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Notes */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Notes</p>
                <p className="text-2xl font-semibold text-gray-900">{notes.length}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>
          {/* Pinned Notes */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pinned Notes</p>
                <p className="text-2xl font-semibold text-gray-900">{notes.filter((note) => note.isPinned).length}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Star className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
          {/* Completed Notes */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {notes.filter((note) => note.isCompleted).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          {/* Notes With Reminders */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">With Reminders</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {notes.filter((note) => note.reminderDate).length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Bell className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="inline-flex space-x-1 border-b border-gray-200 w-full">
            <button
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                selectedCategory === null ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setSelectedCategory(null)}
            >
              All Notes
            </button>
            {["Personal", "Work", "Ideas", "Tasks", "Important"].map((category) => (
              <button
                key={category}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                  selectedCategory === category ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Notes Grid */}
        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md ${
                  note.isCompleted ? "opacity-70" : ""
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getCategoryColor(note.category)}`}>
                          {note.category}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(note.priority)}`}>
                          {note.priority} Priority
                        </span>
                      </div>
                      <h3 className={`text-lg font-semibold text-gray-900 ${note.isCompleted ? "line-through" : ""}`}>
                        {note.title}
                      </h3>
                    </div>
                    <button
                      className={`p-1 rounded-full ${note.isPinned ? "text-amber-500" : "text-gray-400 hover:text-gray-600"}`}
                      onClick={() => togglePin(note.id)}
                    >
                      <Star className="h-5 w-5" fill={note.isPinned ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <div className="mb-4">
                    <p className={`text-gray-600 text-sm whitespace-pre-line line-clamp-3 ${note.isCompleted ? "line-through" : ""}`}>
                      {note.content}
                    </p>
                  </div>

                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {note.attachments.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Attachments:</p>
                      {note.attachments.map((attachment) => (
                        <div key={attachment} className="flex items-center text-xs text-indigo-600">
                          <LinkIcon className="h-3 w-3 mr-1" />
                          {attachment}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(note.createdAt)}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        className="p-1 rounded-full text-gray-400 hover:text-gray-600"
                        onClick={() => toggleCompleted(note.id)}
                      >
                        <CheckCircle className="h-5 w-5" fill={note.isCompleted ? "currentColor" : "none"} />
                      </button>
                      <button
                        className="p-1 rounded-full text-gray-400 hover:text-gray-600"
                        onClick={() => handleEditNote(note)}
                      >
                        <Edit3 className="h-5 w-5" />
                      </button>
                      <button
                        className="p-1 rounded-full text-gray-400 hover:text-red-600"
                        onClick={() => deleteNote(note)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {note.reminderDate && (
                  <div className="px-5 py-2 bg-amber-50 border-t border-amber-100 flex items-center text-xs text-amber-800">
                    <Bell className="h-3 w-3 mr-1" />
                    Reminder: {formatDate(note.reminderDate)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400">
              <FileText className="h-full w-full" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No notes found</h3>
            <p className="mt-1 text-gray-500">
              {searchQuery ? "Try adjusting your search or filters" : "Get started by creating your first note"}
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                New Note
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Add Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setIsModalOpen(false)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Note</h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                          Title
                        </label>
                        <input
                          type="text"
                          id="title"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Note title"
                          value={newNote.title}
                          onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                        />
                      </div>

                      <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                          Content
                        </label>
                        <textarea
                          id="content"
                          rows={4}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Note content"
                          value={newNote.content}
                          onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                        ></textarea>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                            Category
                          </label>
                          <select
                            id="category"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={newNote.category}
                            onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                          >
                            <option value="Personal">Personal</option>
                            <option value="Work">Work</option>
                            <option value="Ideas">Ideas</option>
                            <option value="Tasks">Tasks</option>
                            <option value="Important">Important</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                            Priority
                          </label>
                          <select
                            id="priority"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={newNote.priority}
                            onChange={(e) => setNewNote({ ...newNote, priority: e.target.value })}
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                          Tags
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <input
                            type="text"
                            id="tags"
                            className="flex-1 min-w-0 block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Add a tag"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddTag();
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 sm:text-sm hover:bg-gray-100"
                            onClick={handleAddTag}
                          >
                            Add
                          </button>
                        </div>

                        {newNote.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {newNote.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                              >
                                {tag}
                                <button
                                  type="button"
                                  className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-indigo-400 hover:text-indigo-600 focus:outline-none"
                                  onClick={() => handleRemoveTag(tag)}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center">
                        <input
                          id="isPinned"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={newNote.isPinned}
                          onChange={(e) => setNewNote({ ...newNote, isPinned: e.target.checked })}
                        />
                        <label htmlFor="isPinned" className="ml-2 block text-sm text-gray-700">
                          Pin this note
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {
                  !updateNote &&  <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleAddNote}
                >
                  Add Note
                </button>
               }
                {
                updateNote && <button
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={()=>handleUpdateNote(newNote.id)}
              >
                <span className="flex items-center gap-1">
                  <Plus className="h-5 w-5" />
                  <span className="hidden sm:inline">Update Note</span>
                </span>
              </button>
              }
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleModalClose}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (Mobile) */}
      <button
        className="md:hidden fixed bottom-6 right-6 p-4 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => setIsModalOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
            <p className="mt-8 text-center text-base text-gray-400 md:mt-0 md:text-right">
              &copy; {new Date().getFullYear()} NoteHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;