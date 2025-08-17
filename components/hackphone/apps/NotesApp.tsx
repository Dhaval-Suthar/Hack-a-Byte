"use client";

import { useState, useEffect } from "react";

interface Note {
  id: number;
  title: string;
  body: string;
}

interface NotesAppProps {
  onClose: () => void;
  time: string;
}

interface NoteEditorProps {
  note: Note | null;
  onBack: () => void;
  onSave: (id: number, body: string) => void;
}

function NotesApp({ onClose, time }: NotesAppProps) {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem("notes");
    return saved
      ? JSON.parse(saved)
      : [{ id: 1, title: "Shopping list", body: "Milk\nEggs\nBread" }];
  });

  const [selected, setSelected] = useState<number | null>(null);

  // Persist notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  // Save edits to a note
  function saveNote(id: number, body: string) {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, body, title: body.split("\n")[0] || "Untitled" } : n
      )
    );
  }

  // Add a new note
  function addNewNote() {
    const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
    const newNote: Note = { id: newId, title: "Untitled", body: "" };
    setNotes((prev) => [...prev, newNote]);
    setSelected(newId); // open new note immediately
  }

  // Delete a note
  function deleteNote(id: number) {
    setNotes((prev) => prev.filter(n => n.id !== id));
    if (selected === id) setSelected(null); // close editor if deleting current note
  }

  return (
    <div className="h-screen w-screen font-serif bg-[#e6e0b9] flex flex-col">
      {/* Nav bar */}
      <div className="flex items-center justify-between bg-yellow-900 text-yellow-100 p-4 font-bold shadow">
        <button onClick={onClose} className="text-sm">Home</button>
        <span>{time}</span>
      </div>

      {/* Body */}
      <div className="flex-1">
        {selected === null ? (
          <NotesList
            notes={notes}
            setSelected={setSelected}
            onAdd={addNewNote}
            onDelete={deleteNote}
          />
        ) : (
          <NoteEditor
            note={notes.find((n) => n.id === selected) || null}
            onBack={() => setSelected(null)}
            onSave={saveNote}
          />
        )}
      </div>
    </div>
  );
}

function NotesList({
  notes,
  setSelected,
  onAdd,
  onDelete,
}: {
  notes: Note[];
  setSelected: (id: number) => void;
  onAdd: () => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between bg-yellow-900 text-yellow-100 p-4 font-bold shadow">
        <span>Notes</span>
        <button
          onClick={onAdd}
          className="text-sm px-2 py-1 bg-yellow-100 text-yellow-900 rounded hover:bg-yellow-200"
        >
          + New Note
        </button>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-yellow-700/30">
        {notes.map((note) => (
          <div
            key={note.id}
            className="flex justify-between items-center p-4 hover:bg-yellow-200/30 cursor-pointer"
          >
            <div onClick={() => setSelected(note.id)} className="flex-1">
              <div className="font-bold">{note.title}</div>
              <div className="text-sm text-yellow-900/70 truncate">{note.body}</div>
            </div>
            <button
              onClick={() => onDelete(note.id)}
              className="ml-2 text-red-600 font-bold px-2 py-1 hover:bg-red-100 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoteEditor({ note, onBack, onSave }: NoteEditorProps) {
  if (!note) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-600">
        <p>Note not found</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-yellow-900 text-yellow-100 rounded"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center bg-yellow-900 text-yellow-100 p-4 font-bold shadow">
        <button onClick={onBack} className="flex items-center mr-2">
          <span className="text-xl">←</span>
          <span className="ml-1">Back</span>
        </button>
        <div className="flex-1 text-center">Notes</div>
      </div>
      <textarea
        className="flex-1 p-4 bg-[#fffdd0] text-yellow-900 resize-none leading-relaxed border-t border-yellow-900/20 focus:outline-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(transparent, transparent 34px, rgba(0,0,0,0.1) 35px)",
          fontFamily: "Georgia, serif",
        }}
        value={note.body}
        onChange={(e) => onSave(note.id, e.target.value)}
      />
    </div>
  );
}

export default NotesApp;
