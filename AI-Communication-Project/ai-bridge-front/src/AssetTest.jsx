import React, { useState } from 'react';

/**
 * AssetTest - Quick diagnostic component to test image loading
 * This component helps verify that Vite is serving static assets correctly
 */
function AssetTest() {
  const [testResults, setTestResults] = useState({});

  const testImages = [
    { name: 'hello_sign.gif', path: '/assets/signs/hello_sign.gif' },
    { name: 'ok_sign.gif', path: '/assets/signs/ok_sign.gif' },
    { name: 'help_sign.gif', path: '/assets/signs/help_sign.gif' },
    { name: 'love_sign.gif', path: '/assets/signs/love_sign.gif' },
    { name: 'no_sign.gif', path: '/assets/signs/no_sign.gif' },
    { name: 'pace_sgin.gif', path: '/assets/signs/pace_sgin.gif' },
    { name: 'angry_sgin.gif', path: '/assets/signs/angry_sgin.gif' }
  ];

  const handleTest = async (name, path) => {
    try {
      const response = await fetch(path);
      const success = response.ok;
      setTestResults(prev => ({
        ...prev,
        [name]: {
          status: success ? '✅ Loaded' : `❌ HTTP ${response.status}`,
          path: path
        }
      }));
      console.log(`🖼️ Asset test for ${name}: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [name]: {
          status: `❌ ${error.message}`,
          path: path
        }
      }));
      console.error(`🖼️ Asset test for ${name}: ❌ ${error.message}`);
    }
  };

  return (
    <div style={{
      padding: '20px',
      background: '#FAF7F0',
      borderRadius: '12px',
      border: '2px solid #3A5A40',
      marginBottom: '20px'
    }}>
      <h3 style={{ marginTop: 0, color: '#3A5A40' }}>🖼️ Asset Loading Test</h3>
      <button
        onClick={() => testImages.forEach(img => handleTest(img.name, img.path))}
        style={{
          padding: '10px 20px',
          background: '#3A5A40',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '16px'
        }}
      >
        Test All Assets
      </button>

      <div style={{ marginTop: '12px' }}>
        {Object.entries(testResults).length === 0 ? (
          <p style={{ opacity: 0.6 }}>Click "Test All Assets" to verify image loading</p>
        ) : (
          Object.entries(testResults).map(([name, result]) => (
            <div
              key={name}
              style={{
                padding: '8px',
                marginBottom: '8px',
                background: result.status.includes('✅') ? '#D8F3DC' : '#FEE2E2',
                borderRadius: '6px',
                borderLeft: result.status.includes('✅') ? '3px solid #40916C' : '3px solid #DC2626'
              }}
            >
              <span style={{ fontWeight: 600 }}>{name}:</span> {result.status}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '16px' }}>
        <h4 style={{ marginTop: 0, color: '#3A5A40' }}>Manual Image Test</h4>
        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Try rendering a single image:</p>
        <img
          src="/assets/signs/hello_sign.gif"
          alt="test"
          style={{
            width: '200px',
            height: '200px',
            objectFit: 'contain',
            border: '1px solid #3A5A40',
            borderRadius: '8px',
            background: '#fff'
          }}
          onLoad={() => console.log('✅ hello_sign.gif loaded successfully')}
          onError={() => console.error('❌ hello_sign.gif failed to load')}
        />
      </div>
    </div>
  );
}

export default AssetTest;
