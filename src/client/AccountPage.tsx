import Button from './Button';
import { ChangeEvent, useEffect, useState } from 'react';
import logout from '@wasp/auth/logout';
import type { User } from '@wasp/entities';
import updateAccount from '@wasp/actions/updateAccount'

const AccountPage = ({ user }: { user: User }) => {
  return (
    <div className='flex flex-col justify-center items-center mt-12 w-full'>
      <div className='flex flex-col items-center justify-center gap-4 border border-neutral-700 bg-neutral-100/40 rounded-xl p-1 sm:p-4 w-full'>
        <div className='flex flex-row justify-end w-full px-4 pt-2'>
          <Button onClick={logout}>Logout</Button>
        </div>
        <InputFields user={user} />
      </div>
    </div>
  );
};

export default AccountPage;

function InputFields({ user }: { user: User }) {
  const [isLoading, setIsLoading] = useState(false);
  const [fields, setFields] = useState(['']);

  useEffect(() => {
    if (user?.favUsers.length > 0) {
      setFields(user.favUsers);
    }
  }, [user?.favUsers]);

  const handleAdd = () => {
    setFields([...fields, '']);
  };

  const handleRemove = () => {
    const newFields = [...fields];
    newFields.splice(fields.length - 1, 1);
    setFields(newFields);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const newFields = [...fields];
    newFields[index] = e.target.value;
    setFields(newFields);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      await updateAccount({ favUsers: fields });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='w-full p-4'>
      <div className='flex flex-row justify-start items-start'>
        <h2 className='ml-1 font-bold'>Trend-Setting Twitter Accounts</h2>
      </div>
      {fields.map((field, index) => (
        <div key={index} className='my-2'>
          <input
            type='text'
            placeholder='Twitter Username'
            className='w-full bg-white border border-gray-300 rounded-lg py-2 px-4 text-gray-700 focus:border-blue-400 focus:outline-none'
            value={field}
            onChange={(e) => handleChange(e, index)}
          />
        </div>
      ))}
      <div className='my-2 flex flex-row justify-end gap-1'>
        {fields.length > 1 && <Button onClick={handleRemove}>-</Button>}
        {fields.length < 10 && (
          <Button onClick={handleAdd} className='bg-blue-500 text-white px-4 py-2 rounded'>
            +
          </Button>
        )}
      </div>
      <Button onClick={handleSubmit} isLoading={isLoading}>
        <span>Save</span>
      </Button>
    </div>
  );
}
