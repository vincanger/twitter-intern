import './Main.css';
import AddNote from './AddNote';
import { ReactNode } from 'react';
import useAuth from '@wasp/auth/useAuth';

const App = ({ children }: { children: ReactNode }) => {

  const { data: user } = useAuth();

  return (
    <div className='min-h-screen bg-neutral-300/70 text-center'>
      <div className='flex flex-col gap-6 justify-center items-center mx-auto pt-12'>
        <div className='flex flex-row justify-between items-center w-1/2 mb-6 text-neutral-600 px-2'>
          <div className='flex justify-start w-1/3'>
            <a href='/' className='hover:underline cursor-pointer'>
              🤖 Generated Ideas
            </a>
          </div>
          <div className='flex justify-center w-1/3'>
            <a href='/notes' className='hover:underline cursor-pointer'>
              📝 My Notes
            </a>
          </div>
          <div className='flex justify-end w-1/3'>
            <a href='/account' className='hover:underline cursor-pointer'>
              👤 Account
            </a>
          </div>
        </div>

        <div className='flex flex-col gap-4 justify-center items-center w-2/4'>
          {!!user && <AddNote />}
          <hr className='border border-t-1 border-neutral-100/70 w-full' />
          {children}
        </div>
      </div>
    </div>
  );
};

export default App;
