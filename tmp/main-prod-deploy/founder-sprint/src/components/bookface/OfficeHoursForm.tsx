import React, { useState } from 'react';

export interface OfficeHoursFormProps {
  partners: { id: string; name: string }[];
  onSubmit: (data: {
    partnerId: string;
    topic: string;
    availability: string;
    shareWithCofounders: boolean;
  }) => void;
  instructions?: string;
}

export const OfficeHoursForm: React.FC<OfficeHoursFormProps> = ({
  partners,
  onSubmit,
}) => {
  const [partnerId, setPartnerId] = useState('');
  const [topic, setTopic] = useState('');
  const [availability, setAvailability] = useState('');
  const [shareWithCofounders, setShareWithCofounders] = useState(true);

  const styles = {
    container: {
      display: 'flex',
      gap: '40px',
    },
    formSection: {
      flex: 1,
    },
    title: {
      fontSize: '24px',
      fontWeight: 700,
      color: '#2F2C26',
      marginBottom: '24px',
    },
    fieldGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: 600,
      color: '#2F2C26',
      marginBottom: '8px',
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      fontSize: '14px',
      border: '1px solid #e0e0e0',
      borderRadius: '6px',
      outline: 'none',
      backgroundColor: '#ffffff',
      cursor: 'pointer',
      boxSizing: 'border-box' as const,
    },
    textarea: {
      width: '100%',
      padding: '10px 12px',
      fontSize: '14px',
      border: '1px solid #e0e0e0',
      borderRadius: '6px',
      outline: 'none',
      resize: 'vertical' as const,
      minHeight: '100px',
      boxSizing: 'border-box' as const,
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      fontSize: '14px',
      border: '1px solid #e0e0e0',
      borderRadius: '6px',
      outline: 'none',
      boxSizing: 'border-box' as const,
    },
    checkboxGroup: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      marginBottom: '24px',
    },
    checkbox: {
      marginTop: '3px',
      accentColor: '#1A1A1A',
    },
    checkboxLabel: {
      fontSize: '14px',
      color: '#2F2C26',
    },
    submitButton: {
      backgroundColor: '#1A1A1A',
      color: '#ffffff',
      border: 'none',
      borderRadius: '6px',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    instructionsSection: {
      width: '340px',
      flexShrink: 0,
    },
    instructionsTitle: {
      fontSize: '18px',
      fontWeight: 700,
      color: '#2F2C26',
      marginBottom: '16px',
    },
    instructionsBox: {
      backgroundColor: '#e8f4fc',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '24px',
    },
    instructionsText: {
      fontSize: '14px',
      color: '#2F2C26',
      lineHeight: 1.6,
    },
    instructionsList: {
      fontSize: '14px',
      color: '#2F2C26',
      lineHeight: 1.6,
      margin: 0,
      paddingLeft: '20px',
    },
    instructionsLink: {
      color: '#1A1A1A',
      textDecoration: 'none',
    },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      partnerId,
      topic,
      availability,
      shareWithCofounders,
    });
  };

  return (
    <div style={styles.container}>
      <form style={styles.formSection} onSubmit={handleSubmit}>
        <h2 style={styles.title}>Request Office Hours</h2>
        
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Who do you want office hours with?</label>
          <select
            style={styles.select}
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            required
          >
            <option value="">Select a partner...</option>
            {partners.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {partner.name}
              </option>
            ))}
          </select>
        </div>
        
        <div style={styles.fieldGroup}>
          <label style={styles.label}>What do you want to talk about?</label>
          <textarea
            style={styles.textarea}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Tell us..."
            required
          />
        </div>
        
        <div style={styles.fieldGroup}>
          <label style={styles.label}>What times in the Pacific time zone work for you?</label>
          <input
            type="text"
            style={styles.input}
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="PST, any time"
          />
        </div>
        
        <div style={styles.checkboxGroup}>
          <input
            type="checkbox"
            id="shareWithCofounders"
            style={styles.checkbox}
            checked={shareWithCofounders}
            onChange={(e) => setShareWithCofounders(e.target.checked)}
          />
          <label htmlFor="shareWithCofounders" style={styles.checkboxLabel}>
            Yes, show them this request and invite them to the office hour.
          </label>
        </div>
        
        <button type="submit" style={styles.submitButton}>
          Submit
        </button>
      </form>
      
      <div style={styles.instructionsSection}>
        <h3 style={styles.instructionsTitle}>Instructions</h3>
        
        <div style={styles.instructionsBox}>
          <p style={styles.instructionsText}>
            You can often get a faster response by asking us questions on Slack or email rather
            than scheduling office hours.
          </p>
        </div>
        
        <p style={styles.instructionsText}>
          Please <strong>book with your group partners</strong> by default.
        </p>
        
        <p style={styles.instructionsText}>
          If you don't see available times that work for you, please place a request.
        </p>
        
        <p style={styles.instructionsText}>
          For more details and tips about office hours, please see{' '}
          <a href="#" style={styles.instructionsLink}>the user manual article</a>.
        </p>
      </div>
    </div>
  );
};
