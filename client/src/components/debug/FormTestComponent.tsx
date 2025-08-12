import React from 'react';
import { apiPost } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

const FormTestComponent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const testFormCreation = async () => {
    console.log('Authentication status:', isAuthenticated);
    console.log('Current user:', user);

    const testData = {
      header: {
        type: "formHeader",
        title: "Sample Test Form",
        headerImg: null,
        description: "Test form description"
      },
      questions: [
        {
          "question-id": "q1-test",
          "question-type": "Cloze",
          "question": "Test question",
          "image": null,
          "options": ["option1", "option2"],
          "answer": []
        }
      ]
    };

    console.log('Sending data:', testData);

    try {
      const response = await apiPost('/api/forms', testData);
      const responseData = await response.json();
      
      console.log('Response status:', response.status);
      console.log('Response data:', responseData);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      alert(`Response: ${JSON.stringify(responseData, null, 2)}`);
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Form Creation Test</h2>
      <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
      <p>User: {user ? user.email : 'None'}</p>
      <button onClick={testFormCreation}>Test Form Creation</button>
    </div>
  );
};

export default FormTestComponent;
