import React from 'react';

const ColorPicker = ({ onColorSelect }) => {
  const colors = ['red', 'blue', 'green', 'yellow'];

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const modalStyle = {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    textAlign: 'center'
  };

  const colorButtonStyle = (color) => ({
    width: '80px',
    height: '80px',
    backgroundColor: color,
    border: '3px solid #000',
    borderRadius: '10px',
    margin: '10px',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  });

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2>Choose a Color</h2>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          {colors.map(color => (
            <button
              key={color}
              style={colorButtonStyle(color)}
              onClick={() => onColorSelect(color)}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;