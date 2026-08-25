import React from 'react';

const InfoModal = ({ onClose }) => {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'var(--panel-bg)', padding: '28px', borderRadius: '12px',
        width: '560px', maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto',
        border: '1px solid var(--border-color)', boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
        color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '20px'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ℹ️ Railsort Editör Rehberi
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
          borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📦 Workspace (Çalışma Alanı) Bilgisi
          </div>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', color: '#cbd5e1' }}>
            Eğer elinizde önceden kaydedilmiş bir <strong>railsort-workspace-file.zip</strong> dosyası varsa, üst menüdeki <strong>📥 Import Workspace (.zip)</strong> butonu ile tüm seviyelerinizi anında içeri aktarabilirsiniz.
          </p>
          <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.4', color: '#94a3b8' }}>
            💡 <em>Çalışmalarınız otomatik olarak tarayıcınızda saklanır. Ancak tarayıcı geçmişi veya çerezleri temizlendiğinde kaybolmaması için düzenli aralıklarla <strong>📤 Export Workspace (.zip)</strong> yapmanız önerilir.</em>
          </p>
        </div>

        {/* Shortcuts Section */}
        <div>
          <h3 style={{ fontSize: '15px', marginBottom: '10px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ⌨️ Klavye Kısayolları
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px 12px', fontSize: '13px', backgroundColor: 'var(--bg-color)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <kbd style={kbdStyle}>Ctrl + Z</kbd>
            <span>Geri Al (Undo)</span>

            <kbd style={kbdStyle}>Ctrl + Y / ⇧ Z</kbd>
            <span>İleri Al (Redo)</span>

            <kbd style={kbdStyle}>R</kbd>
            <span>Seçili veya son aktif depoyu 90° döndür</span>

            <kbd style={kbdStyle}>H</kbd>
            <span>Seçili vagonun gizlilik durumunu aç / kapat (Hidden / ?)</span>

            <kbd style={kbdStyle}>Yön Tuşları</kbd>
            <span>Tüm haritayı ve rayları adım adım kaydır</span>

            <kbd style={kbdStyle}>I, J, K, L</kbd>
            <span>Son seçili depoyu veya ray noktasını mikro adımlarla taşı (Yukarı, Sol, Aşağı, Sağ)</span>
          </div>
        </div>

        {/* Features & Tips */}
        <div>
          <h3 style={{ fontSize: '15px', marginBottom: '10px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🛠️ Kullanım İpuçları
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li><strong>Ray Çizimi (Road):</strong> Grid üzerine tıklayarak sırasıyla ray noktalarını birleştirin.</li>
            <li><strong>Depo (Depot):</strong> Harita üzerinde uygun boşluğa tıklayarak 2x4 istasyon yerleştirin.</li>
            <li><strong>Vagonlar:</strong> Sağ panelden renk seçip depolardaki slotlara tıklayarak vagonları dizin.</li>
            <li><strong>Tümünü Taşı (Move All):</strong> Sol araç çubuğundan seçip haritada basılı tutarak tüm çizimi topluca kaydırın.</li>
            <li><strong>Half Grid:</strong> Yarım adım (0.5) hassasiyetinde ince yerleşim yapmanızı sağlar.</li>
            <li><strong>Unity Export:</strong> Unity formatında uyumlu <code>.asset</code> dosyalarını <code>unityleveldata.zip</code> olarak tek tıkla üretir.</li>
          </ul>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
          <button className="primary-btn" onClick={onClose} style={{ padding: '8px 24px' }}>
            Anladım
          </button>
        </div>

      </div>
    </div>
  );
};

const kbdStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #475569',
  borderRadius: '4px',
  padding: '2px 6px',
  fontSize: '11px',
  fontFamily: 'monospace',
  fontWeight: 600,
  color: '#38bdf8',
  display: 'inline-block',
  textAlign: 'center',
  alignSelf: 'center'
};

export default InfoModal;
