import { fireEvent, wait } from '@testing-library/react';
import React from 'react';

import render from '../../../utils/testUtils';
import ResetPasswordForm from './ResetPasswordForm';

describe('<ResetPasswordForm />', () => {
  it('renders without crashing', () => {
    render(<ResetPasswordForm />);
  });

  it('should always show a success message after submitting with a valid mail', async () => {
    const { getByTestId } = render(<ResetPasswordForm />);

    const mailInput = getByTestId('mail-input');
    const submitButton = getByTestId('submit-button');

    expect(submitButton.disabled).toBe(true);

    fireEvent.input(mailInput, {
      target: {
        value: 'some@mail.com',
      },
    });

    expect(submitButton.disabled).toBe(false);

    fireEvent.click(submitButton);

    await wait(() => getByTestId('success-message') !== null);

    [mailInput, submitButton].forEach(element => {
      expect(element).not.toBeInTheDocument();
    });
  });
});