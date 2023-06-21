import { useQuery } from '@wasp/queries';
import getEmbeddedNotes from '@wasp/queries/getEmbeddedNotes';

const NotesPage = () => {
  const { data: notes, isLoading, error } = useQuery(getEmbeddedNotes);

  if (isLoading) <div>Loading...</div>;
  if (error) <div>Error: {error.message}</div>;

  return (
    <>
      <h2 className='text-2xl font-bold'>My Notes</h2>
      {notes && notes.length > 0 ? (
        notes.map((note) => (
          <div key={note.id} className='flex flex-col gap-2 justify-center items-center w-full'>
            <div className='flex flex-row gap-2 justify-center items-center w-full'>
              <div className='w-full p-4 h-22 bg-blue-100 border rounded-lg w-full'>{note.content}</div>
            </div>
          </div>
        ))
      ) : notes && notes.length === 0 && (
        <div className='flex flex-col gap-2 justify-center items-center w-full'>
          <div className='w-full p-4 h-22 bg-blue-100 border rounded-lg w-full'>No notes yet</div>
        </div>
      )}
    </>
  );
};

export default NotesPage;
