import React from 'react';

const ImportWorkspaceModal = ({ onClose, onConfirm }) => {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'var(--panel-bg)', padding: '28px', borderRadius: '12px',
        width: '560px', maxWidth: '90vw',
        border: '1px solid var(--border-color)', boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
        color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '20px'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📥 Workspace İçe Aktar (Import)
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-secondary)',
              fontSize: '20px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Workspace Warning Banner */}
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📦 Workspace (Çalışma Alanı) Bilgisi
          </div>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#cbd5e1' }}>
            Eğer elinizde önceden kaydedilmiş bir <strong>railsort-workspace-file.zip</strong> dosyası varsa, buradaki buton ile tüm seviyelerinizi anında içeri aktarabilirsiniz.
          </p>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#cbd5e1' }}>
            📥 <strong>Örnek Seviye Paketleri:</strong> Hazır <strong>30 bölümlük</strong> örnek seviye paketini <a href="https://github.com/karagozkk/rail-sort-editor/releases" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>GitHub Releases</a> sayfasından indirebilirsiniz.
          </p>
          <div style={{ marginTop: '4px', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px' }}>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', color: '#fca5a5' }}>
              ⚠️ <strong>DİKKAT:</strong> Yeni bir workspace içe aktardığınızda, mevcut tarayıcı belleğindeki tüm bölümleriniz silinir ve üzerine yazılır!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
          <button 
            onClick={onClose} 
            style={{ 
              padding: '8px 24px', backgroundColor: 'transparent', 
              color: 'var(--text-secondary)', border: '1px solid var(--border-color)', 
              borderRadius: '6px', cursor: 'pointer', fontWeight: 600 
            }}
          >
            İptal
          </button>
          <button 
            className="primary-btn" 
            onClick={onConfirm} 
            style={{ padding: '8px 24px' }}
          >
            Dosya Seç (.zip)
          </button>
        </div>

      </div>
    </div>
  );
};

export default ImportWorkspaceModal;
