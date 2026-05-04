const styles = {
  container: {
    backgroundColor: 'var(--color-bg-secondary)',
    minHeight: '100vh',
    padding: '20px',
    fontFamily: "var(--font-family)",
    color: 'var(--color-text-primary)'
  },
  header: {
    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
    color: '#fff',
    padding: '40px 20px',
    textAlign: 'center',
    borderRadius: '0 0 20px 20px',
    boxShadow: 'var(--shadow-lg)'
  },
  title: { fontSize: '2.8rem', margin: 0, fontWeight: 800, letterSpacing: '-0.5px' },
  subtitle: { marginTop: '8px', opacity: 0.95, fontSize: '1.1rem' },
  layout: { display: 'flex', gap: '24px', maxWidth: '1200px', margin: '24px auto', flexWrap: 'wrap' },
  card: { flex: 1, minWidth: '300px', borderRadius: '20px', padding: '30px', background: 'var(--color-bg-primary)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border-light)', transition: 'var(--transition)' },
  videoSection: { display: 'flex', flexDirection: 'column', gap: '16px' },
  videoContainer: { position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#000', border: '3px solid var(--color-accent)', boxShadow: 'var(--shadow-lg)' },
  video: { width: '100%', height: 'auto', display: 'block', aspectRatio: '16/9' },
  predictionOverlay: { position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.85)', color: '#fff', padding: '12px 28px', borderRadius: '9999px', fontWeight: '700', border: '2px solid var(--color-accent)', fontSize: '0.95rem' },
  btnRow: { display: 'flex', gap: '12px', marginTop: '16px' },
  btn: { flex: 1, padding: '12px 20px', borderRadius: '12px', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: '600', transition: 'var(--transition)', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
  btnConfirm: { flex: 1, padding: '12px 20px', borderRadius: '12px', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600', transition: 'var(--transition)', fontSize: '0.95rem', textTransform: 'uppercase' },
  historySidebar: { width: '220px', marginLeft: '12px' },
  historyItem: { padding: '10px 12px', borderRadius: '8px', background: 'var(--color-bg-tertiary)', marginBottom: '8px', fontSize: '0.9rem', borderLeft: '3px solid var(--color-accent)' },
  incomingCard: { flex: 1, minWidth: '300px', borderRadius: '20px', padding: '30px', background: 'var(--color-bg-primary)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border-light)' },
  sectionTitle: { fontSize: '1.3rem', margin: '0 0 16px 0', fontWeight: '600', color: 'var(--color-primary)' },
  incomingContent: { display: 'flex', gap: '16px', alignItems: 'center' },
  textBox: { flex: 1, padding: '20px', background: 'linear-gradient(135deg, var(--color-bg-tertiary), #f0f4f8)', borderRadius: '12px', borderLeft: '4px solid var(--color-accent)' },
  textData: { fontSize: '2rem', fontWeight: '800', color: 'var(--color-primary)', margin: 0, lineHeight: '1.4' },
  signSection: { width: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  gif: { maxWidth: '100%', borderRadius: '12px' },
  placeholder: { width: '160px', height: '120px', background: 'var(--color-bg-tertiary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontWeight: '500' },

  mainContent: { maxWidth: '1200px', margin: '24px auto', display: 'flex', flexDirection: 'column', gap: '24px' },
  statusIndicator: { display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(25, 135, 84, 0.1)', color: 'var(--color-success)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '600' },
  messageBox: { cursor: 'pointer', padding: '24px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--color-bg-tertiary), #f0f4f8)', borderLeft: '6px solid var(--color-accent)', transition: 'var(--transition)', minHeight: '120px', display: 'flex', alignItems: 'center' },
  textDisplay: { fontSize: '2.4rem', fontWeight: '800', color: 'var(--color-primary)', margin: 0, lineHeight: '1.4' },
  hint: { fontSize: '0.85rem', opacity: 0.8, fontWeight: '500', marginTop: '8px' },
  micButton: { width: '280px', height: '280px', borderRadius: '50%', border: '8px solid white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '32px auto', color: '#fff', cursor: 'pointer', boxShadow: '0 0 0 6px white, 0 0 0 12px rgba(0, 102, 204, 0.2)', transition: 'var(--transition)', fontSize: '1.1rem', fontWeight: '700' },
  transcriptContainer: { padding: '20px', background: 'var(--color-bg-tertiary)', borderRadius: '12px', marginTop: '16px', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '4px solid var(--color-accent)' },
  transcriptText: { margin: 0, fontSize: '1.2rem', fontWeight: '500', color: 'var(--color-text-primary)', textAlign: 'center' }
};

export default styles;
