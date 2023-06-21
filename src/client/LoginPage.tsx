import { LoginForm } from '@wasp/auth/forms/Login';
import { SignupForm } from '@wasp/auth/forms/Signup';
import { useState } from 'react';

export default () => {
  const [showSignupForm, setShowSignupForm] = useState(false);

  const handleShowSignupForm = () => {
    setShowSignupForm((x) => !x);
  };

  return (
    <>
      {showSignupForm ? <SignupForm /> : <LoginForm />}
      <div onClick={handleShowSignupForm} className='underline cursor-pointer hover:opacity-80'>
        {showSignupForm ? 'Already Registered? Login!' : 'No Account? Sign up!'}
      </div>
    </>
  );
};
